# Match State Decoupling — Design Spec

**Date:** 2026-06-11
**Status:** Approved (pending spec review)
**Repos:** `rack` (Django backend), `league-genius` (web + mobile clients)
**Target:** Working in production by week of 2026-06-15

---

## Problem

Live matches get permanently wedged in a state where they cannot be started,
cannot have lineups resubmitted, and cannot be rescheduled or deleted. Operators
have had to SSH into the production database to manually unblock individual
matches (e.g. match 363).

### Root cause

Match **state transitions are tied to ephemeral websocket presence**, which is
exactly the thing that is unreliable on mobile (users background the app and
drop connections constantly over a multi-hour match).

The only code path that moves a match `scheduled → in_progress` is
`maybe_transition_to_in_progress`, called **only** inside the websocket
`connect()` handler, and it fires only if **both captains are connected to the
live room at the same instant** (`rack/league/consumers.py:129`, `:692`):

```python
# consumers.py — connect()
await self.maybe_transition_to_in_progress()

# maybe_transition_to_in_progress()
if captains['home'] and captains['away']:      # both connected RIGHT NOW
    if match.status == 'scheduled':
        match.status = 'in_progress'
```

Meanwhile `submit_lineup` accepts submissions while the match is still
`scheduled` (`rack/league/views.py:4239`) and never changes status. So the
real-world failure sequence is:

1. Away captain opens the match, submits their lineup, then backgrounds / drops.
2. Home captain opens it later (never simultaneously connected with away),
   submits their lineup. Status is **still `scheduled`**.
3. Home taps Start → backend rejects: *"Match must be in progress to start.
   Current status: scheduled"* (`views.py:4454`).
4. Client shows **"Failed to start match. Please try again."**
   (`packages/mobile/src/hooks/useMatchDetails.ts:455-469`).
5. Neither lineup can be resubmitted — both `*_lineup_submitted` flags are
   `True` (`views.py:4267`, `:4272`). Deadlock.

The match cannot be deleted/rescheduled either, because `destroy` only allows
`scheduled` matches with no recorded progress (`views.py:3799`).

### Why it appeared intermittent

When both captains *do* happen to be connected simultaneously (e.g. testing with
two browser tabs side by side), the transition fires and everything works. Local
testing rarely reproduces the staggered-connection timing that real captains hit.

---

## Principle

**The database is the source of truth, mutated only by explicit HTTP actions.
The websocket is a real-time presentation layer — it broadcasts and re-syncs,
but never decides match state.**

This is what makes backgrounding and dropped connections safe: nothing about
state correctness depends on who is currently connected.

Note: mid-match **scoring** is already DB-gated (`check_match_live` checks
`match_started` + `status`, not presence — `consumers.py:687`), so it is already
safe across drops. The only state transition still coupled to presence is
`scheduled → in_progress`. This spec removes that coupling.

---

## Scope

Full stack: backend (`rack`) + clients (`league-genius` web and mobile).

### Decisions locked during design

- **Go-live trigger:** first lineup submission (away). No separate "Go Live" button.
- **Lineup edits:** a captain may re-submit their own lineup any time before the
  match is started.
- **Wedged-match migration:** *promote* affected matches to `in_progress`
  (preserving submitted lineups) rather than resetting them to blank `scheduled`.

---

## Backend changes (`rack`)

### 1. `submit_lineup` drives the go-live transition
`rack/league/views.py` (`submit_lineup`, ~`:4198`)

When the away (first) lineup is submitted and the match is `scheduled`, set
`status = 'in_progress'` as part of the same save. This is the new, reliable
"match is live" signal, persisted by an explicit user action.

### 2. Per-side upsert instead of delete-all
`rack/league/views.py` (`submit_lineup`, `:4324-4343`)

Today the away path does `match.games.all().delete()` then bulk-creates. With
captain self-edit (below), an away re-submit *after* the home lineup is in would
wipe the home assignments. Change the away path to **upsert the away player per
game** (create games on first submit if absent; otherwise update
`away_player_id` only), preserving `home_player_id`. This mirrors how the home
path already updates per game. Re-edits never clobber the other team.

### 3. Captain self-edit before start
`rack/league/views.py` (`submit_lineup`, `:4267`, `:4272`)

Replace the hard `400 "already submitted"` blocks with an overwrite path,
permitted while `match.match_started == False`. Once the match has started,
lineups lock and re-submission is rejected (preserve current post-start
behavior). The away-first ordering rule is unchanged.

### 4. `start_match` safety net
`rack/league/views.py` (`start_match`, `:4454`)

Accept `status in ['scheduled', 'in_progress']` and promote to `in_progress`
before starting. The both-lineups-submitted requirement is unchanged. This is
belt-and-suspenders: a home captain tapping Start with both lineups in is
definitive proof the match is live, regardless of how status got there.

### 5. Demote websocket presence to UI-only
`rack/league/consumers.py` (`maybe_transition_to_in_progress`, `:692`; call
site `:129`)

Remove the status mutation. Keep the `captain_presence_broadcast` so the UI can
still show "opponent is here", but presence no longer touches match state. The
method can be deleted and its `connect()` call removed, or reduced to a no-op /
pure presence broadcast.

### 6. Complete the `reset_lineup` endpoint
`rack/league/views.py` (`reset_lineup`, `:4589`)

Currently resets the flags + `match_started` + `started_at` but **leaves the
`Game` rows behind** (`:4627`). Make it a complete reset: delete the match's
games and set `status = 'scheduled'` in addition to clearing the flags. This is
the operator-facing recovery path.

### 7. Data migration — heal wedged matches
New migration in `rack/league/migrations/`

Find matches with an inconsistent state — `status = 'scheduled'` but
`away_lineup_submitted` or `home_lineup_submitted` is `True` — and **promote them
to `in_progress`**, preserving their submitted lineups and games so captains can
simply press Start. Idempotent; safe to run once.

### 8. Backend tests
`rack/league/tests.py` (and/or `test_match_deletion.py` sibling)

- Away lineup submission promotes `scheduled → in_progress`.
- Home lineup submission does not regress status.
- Captain can re-submit own lineup before start; re-submit does not clobber the
  other team's assignments.
- Lineup submission is rejected after `match_started`.
- `start_match` succeeds from `scheduled` (safety net) and from `in_progress`.
- `reset_lineup` deletes games and returns status to `scheduled`.
- Presence (websocket connect) no longer mutates status.

---

## Frontend changes (`league-genius`)

### 1. Trust server state
`packages/mobile/src/hooks/useMatchDetails.ts` (and the web equivalent in
`packages/web/src/contexts/MatchScoringContext.tsx`)

`submit_lineup` and `start_match` already return the updated match. Use the
returned `status` / `lineup_state` as authoritative rather than only optimistic
`setLineupState`. On websocket reconnect / app foreground
(`useMatchWebSocket.ts:158-176`), re-fetch the match so local state cannot drift
from the database after a drop.

### 2. Captain self-edit affordance
`packages/mobile/src/components/match/MatchActionBar.tsx`,
`packages/mobile/src/hooks/useMatchDetails.ts` (`canEditAwayLineup` /
`canEditHomeLineup`, `:95-100`)

Add an "Edit my lineup" control shown when the captain's own lineup is submitted
but the match has not started. Re-opens the lineup editor and resubmits via the
now-overwrite-capable endpoint. Loosen the phase gates so a captain can edit
their own side in the `awaiting_home_lineup` / `ready_to_start` states.

### 3. Operator reset button
Mobile `MatchActionBar.tsx` / match detail; web operator match views
(`packages/web/src/pages/admin/OperatorMatchPage.tsx`,
`packages/web/src/components/matches/`)

Surface the now-complete `reset_lineup` action (operator only) behind a confirm
dialog, so a wedged match is a one-tap operator fix and never requires a DB
shell.

### 4. Mirror in web
Apply the equivalent state-trust and self-edit/reset changes in the web client
where the same live-match flow exists.

---

## Edge cases covered

| Scenario | Outcome |
|----------|---------|
| Away submits, backgrounds, home opens hours later, submits, starts | Works — status went `in_progress` on away submit and persisted |
| Either captain drops mid-match | Already safe — scoring is DB-gated; reconnect re-syncs |
| Bad lineup ("one player off") | Captain self-edits before start; no deadlock possible |
| Matches already wedged in prod (e.g. 363) | Healed by data migration |

---

## Out of scope (footnote)

Production runs `InMemoryChannelLayer` on a single `daphne` process
(`rack/rack/settings.py:195`, `Procfile`). This is fine today. **If** the
Elastic Beanstalk environment ever autoscales beyond one instance, websocket
**broadcasts** will break across instances (in-memory channel layer is not
cross-process) and would require `channels_redis` + a Redis host. Not required
for this fix; recorded so it is not a future surprise.

---

## Rollout

1. Backend: implement 1–8, run migration, deploy to `lg-production`.
2. Verify match 363 (and any siblings) are promoted to `in_progress` and can be
   started.
3. Frontend: ship web + mobile client changes against the improved API.
4. Manual verification with staggered connections (the original repro): away
   submits and fully disconnects before home connects, then home submits and
   starts — must succeed.
