# Match State Decoupling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make match state transitions driven by explicit, persisted HTTP actions instead of ephemeral websocket presence, so live matches can no longer wedge when captains background the app or drop connection.

**Architecture:** The away lineup submission (the first concrete action) promotes a match `scheduled → in_progress` server-side; `start_match` gains a safety-net promotion; lineups become re-editable until the match starts (via per-side upsert so re-edits don't clobber the other team); websocket presence is demoted to a UI-only signal; the operator `reset_lineup` becomes a complete reset; and a data migration heals already-wedged matches. Clients trust server-returned state and surface self-edit + operator-reset affordances.

**Tech Stack:** Django + Django REST Framework + Channels (backend `rack`); React Native + React + TypeScript + pnpm workspaces (frontend `league-genius`).

**Spec:** `docs/superpowers/specs/2026-06-11-match-state-decoupling-design.md`

**Repos & cwd:**
- Backend tasks run in `/Users/benjamindally/Projects/rack` (Django). Test command: `python manage.py test league.test_match_lifecycle -v 2` (activate the venv: `source venv/bin/activate`).
- Frontend tasks run in `/Users/benjamindally/Projects/league-genius` (pnpm). No JS test runner is configured; frontend tasks verify with `pnpm lint` + TypeScript typecheck + manual steps.

**Suggested branches:** `fix/match-state-decoupling` in each repo.

---

## File Structure

**Backend (`rack`):**
- Modify `league/views.py` — `submit_lineup` (promote + upsert + self-edit), `start_match` (safety net), `reset_lineup` (complete reset).
- Modify `league/consumers.py` — remove presence-driven state mutation.
- Create `league/migrations/0022_heal_wedged_matches.py` — data migration.
- Create `league/test_match_lifecycle.py` — automated tests for all transitions.

**Frontend (`league-genius`):**
- Modify `packages/shared/src/api/matches.ts` — add `resetLineup`.
- Modify `packages/mobile/src/hooks/useMatchDetails.ts` — trust server state, self-edit gating, reset handler.
- Modify `packages/mobile/src/components/match/MatchActionBar.tsx` — self-edit + operator reset buttons.
- Modify the web live-match flow (`packages/web/src/contexts/MatchScoringContext.tsx` and operator match views) to mirror trust-server-state + reset.

---

# PHASE 1 — Backend (`rack`)

> Phase 1 alone fixes the production bug. Ship and deploy it before Phase 2.

## Task 1: Test scaffolding + away submission promotes to in_progress

**Files:**
- Create: `league/test_match_lifecycle.py`
- Modify: `league/views.py` (`submit_lineup`, ~lines 4403-4411)

- [ ] **Step 1: Write the failing test (includes the shared `setUp` used by all Phase 1 tests)**

Create `league/test_match_lifecycle.py`:

```python
"""
Tests for the match lifecycle state machine:
- away lineup submission promotes scheduled -> in_progress
- home submission preserves away assignments
- captains may re-edit their own lineup until the match starts
- lineups lock after the match starts
- start_match safety-net promotion from scheduled
- reset_lineup performs a complete reset
"""
from datetime import date

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    Player, League, LeagueOperator, ScoringConfig, Season,
    Team, TeamCaptain, Match, Game,
)


class MatchLifecycleTestCase(APITestCase):
    def setUp(self):
        self.league = League.objects.create(name="Lifecycle League")
        # 4 games per match (4 sets x 1 game) keeps payloads small.
        ScoringConfig.objects.create(
            league=self.league, sets_per_match=4, games_per_set=1
        )

        # Operator
        self.operator_user = User.objects.create_user(username="op", password="x")
        self.operator_player = Player.objects.create(user=self.operator_user)
        LeagueOperator.objects.create(league=self.league, player=self.operator_player)

        self.season = Season.objects.create(
            league=self.league, name="S1", start_date=date(2026, 1, 1)
        )

        self.home = Team.objects.create(name="Home", establishment="Bar A")
        self.away = Team.objects.create(name="Away", establishment="Bar B")

        # Captains
        self.home_cap_user = User.objects.create_user(username="homecap", password="x")
        self.home_cap_player = Player.objects.create(user=self.home_cap_user)
        TeamCaptain.objects.create(team=self.home, player=self.home_cap_player)

        self.away_cap_user = User.objects.create_user(username="awaycap", password="x")
        self.away_cap_player = Player.objects.create(user=self.away_cap_user)
        TeamCaptain.objects.create(team=self.away, player=self.away_cap_player)

        # Roster players to assign to games (Player.user is nullable)
        self.home_players = [Player.objects.create() for _ in range(4)]
        self.away_players = [Player.objects.create() for _ in range(4)]

        self.match = Match.objects.create(
            season=self.season, home_team=self.home, away_team=self.away,
            date=date(2026, 1, 8), status="scheduled",
        )

    def _lineup_payload(self, players):
        return {
            "games": [
                {"game_number": i + 1, "player_id": players[i].id}
                for i in range(4)
            ]
        }

    def test_away_lineup_submission_promotes_to_in_progress(self):
        self.client.force_authenticate(self.away_cap_user)
        resp = self.client.post(
            f"/api/matches/{self.match.id}/submit-lineup/",
            self._lineup_payload(self.away_players),
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.match.refresh_from_db()
        self.assertEqual(self.match.status, "in_progress")
        self.assertTrue(self.match.away_lineup_submitted)
        self.assertEqual(self.match.games.count(), 4)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `source venv/bin/activate && python manage.py test league.test_match_lifecycle.MatchLifecycleTestCase.test_away_lineup_submission_promotes_to_in_progress -v 2`
Expected: FAIL — `self.match.status` is `'scheduled'`, not `'in_progress'` (submit_lineup does not yet promote).

- [ ] **Step 3: Implement the promotion in `submit_lineup`**

In `league/views.py`, find the "Mark lineup as submitted" block (~line 4403) and replace:

```python
        # Mark lineup as submitted
        if team_side == 'away':
            match.away_lineup_submitted = True
            broadcast_type = 'away_lineup_submitted_broadcast'
        else:
            match.home_lineup_submitted = True
            broadcast_type = 'home_lineup_submitted_broadcast'

        match.save()
```

with:

```python
        # Mark lineup as submitted. The away (first) submission is the explicit,
        # persisted signal that the match is live — promote scheduled -> in_progress
        # here rather than relying on websocket presence.
        if team_side == 'away':
            match.away_lineup_submitted = True
            if match.status == 'scheduled':
                match.status = 'in_progress'
            broadcast_type = 'away_lineup_submitted_broadcast'
        else:
            match.home_lineup_submitted = True
            broadcast_type = 'home_lineup_submitted_broadcast'

        match.save()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python manage.py test league.test_match_lifecycle.MatchLifecycleTestCase.test_away_lineup_submission_promotes_to_in_progress -v 2`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add league/test_match_lifecycle.py league/views.py
git commit -m "feat: promote match to in_progress on away lineup submission"
```

---

## Task 2: Per-side upsert (re-edit doesn't clobber the other team)

**Files:**
- Modify: `league/views.py` (`submit_lineup`, away path ~lines 4324-4343, and the self-edit guards ~lines 4259-4276)
- Test: `league/test_match_lifecycle.py`

- [ ] **Step 1: Write the failing tests**

Add to `MatchLifecycleTestCase`:

```python
    def test_home_submission_preserves_away_assignments(self):
        self.client.force_authenticate(self.away_cap_user)
        self.client.post(
            f"/api/matches/{self.match.id}/submit-lineup/",
            self._lineup_payload(self.away_players), format="json",
        )
        self.client.force_authenticate(self.home_cap_user)
        resp = self.client.post(
            f"/api/matches/{self.match.id}/submit-lineup/",
            self._lineup_payload(self.home_players), format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.match.refresh_from_db()
        self.assertTrue(self.match.home_lineup_submitted)
        for game in self.match.games.all():
            self.assertIsNotNone(game.away_player_id)
            self.assertIsNotNone(game.home_player_id)

    def test_away_can_resubmit_after_home_without_clobbering_home(self):
        self.client.force_authenticate(self.away_cap_user)
        self.client.post(
            f"/api/matches/{self.match.id}/submit-lineup/",
            self._lineup_payload(self.away_players), format="json",
        )
        self.client.force_authenticate(self.home_cap_user)
        self.client.post(
            f"/api/matches/{self.match.id}/submit-lineup/",
            self._lineup_payload(self.home_players), format="json",
        )
        # Away re-submits a corrected (reversed) lineup
        corrected = list(reversed(self.away_players))
        self.client.force_authenticate(self.away_cap_user)
        resp = self.client.post(
            f"/api/matches/{self.match.id}/submit-lineup/",
            self._lineup_payload(corrected), format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.match.refresh_from_db()
        # Home assignments survive the away re-submit
        for game in self.match.games.all():
            self.assertIsNotNone(game.home_player_id)
        # Away game 1 now holds the corrected player
        g1 = self.match.games.get(game_number=1)
        self.assertEqual(g1.away_player_id, corrected[0].id)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python manage.py test league.test_match_lifecycle.MatchLifecycleTestCase.test_away_can_resubmit_after_home_without_clobbering_home -v 2`
Expected: FAIL — the away re-submit currently returns 400 ("Away lineup has already been submitted"), or (after Task 3) deletes all games and wipes home assignments.

- [ ] **Step 3a: Replace the "already submitted" guards with a match-started lock**

In `league/views.py`, find (~line 4259):

```python
        # Enforce away-first rule
        if team_side == 'home' and not match.away_lineup_submitted:
            return Response(
                {'error': 'Away team must submit their lineup first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already submitted
        if team_side == 'away' and match.away_lineup_submitted:
            return Response(
                {'error': 'Away lineup has already been submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if team_side == 'home' and match.home_lineup_submitted:
            return Response(
                {'error': 'Home lineup has already been submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
```

Replace with:

```python
        # Enforce away-first rule
        if team_side == 'home' and not match.away_lineup_submitted:
            return Response(
                {'error': 'Away team must submit their lineup first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lineups may be (re)submitted/corrected freely until the match starts;
        # once it has started they lock.
        if match.match_started:
            return Response(
                {'error': 'Cannot change lineup after the match has started'},
                status=status.HTTP_400_BAD_REQUEST
            )
```

- [ ] **Step 3b: Replace the away delete-all-then-create with a per-side upsert**

In `league/views.py`, find (~line 4324) inside the `if team_side == 'away':` branch:

```python
            # Delete any existing games (in case of retry/reset)
            match.games.all().delete()

            # Create games with away player assignments
            games_to_create = []
            for game_assignment in games_data:
                game_number = game_assignment.get('game_number')
                player_id = game_assignment.get('player_id')

                # Calculate set_number from game_number
                set_number = ((game_number - 1) // games_per_set) + 1

                games_to_create.append(Game(
                    match=match,
                    game_number=game_number,
                    set_number=set_number,
                    away_player_id=player_id
                ))

            Game.objects.bulk_create(games_to_create)
```

Replace with:

```python
            # Upsert away assignments per game, preserving any existing home
            # assignments. A captain may correct/re-submit their lineup before
            # the match starts, possibly after the home lineup is already in.
            existing_games = {g.game_number: g for g in match.games.all()}
            for game_assignment in games_data:
                game_number = game_assignment.get('game_number')
                player_id = game_assignment.get('player_id')
                set_number = ((game_number - 1) // games_per_set) + 1

                game = existing_games.get(game_number)
                if game is not None:
                    game.away_player_id = player_id
                    game.set_number = set_number
                    game.save(update_fields=['away_player_id', 'set_number', 'updated_at'])
                else:
                    Game.objects.create(
                        match=match,
                        game_number=game_number,
                        set_number=set_number,
                        away_player_id=player_id,
                    )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python manage.py test league.test_match_lifecycle -v 2`
Expected: PASS (all tests so far)

- [ ] **Step 5: Commit**

```bash
git add league/test_match_lifecycle.py league/views.py
git commit -m "feat: allow captain lineup self-edit before start via per-side upsert"
```

---

## Task 3: Lineups lock after the match starts

**Files:**
- Test: `league/test_match_lifecycle.py` (implementation already added in Task 2, Step 3a)

- [ ] **Step 1: Write the test**

Add to `MatchLifecycleTestCase`:

```python
    def test_lineup_cannot_be_changed_after_match_started(self):
        self.match.away_lineup_submitted = True
        self.match.home_lineup_submitted = True
        self.match.match_started = True
        self.match.status = "in_progress"
        self.match.save()
        self.client.force_authenticate(self.away_cap_user)
        resp = self.client.post(
            f"/api/matches/{self.match.id}/submit-lineup/",
            self._lineup_payload(self.away_players), format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
```

- [ ] **Step 2: Run test to verify it passes**

Run: `python manage.py test league.test_match_lifecycle.MatchLifecycleTestCase.test_lineup_cannot_be_changed_after_match_started -v 2`
Expected: PASS (the `match.match_started` guard from Task 2 covers this)

- [ ] **Step 3: Commit**

```bash
git add league/test_match_lifecycle.py
git commit -m "test: lineups lock after match start"
```

---

## Task 4: `start_match` safety-net promotion

**Files:**
- Modify: `league/views.py` (`start_match`, ~lines 4453-4458)
- Test: `league/test_match_lifecycle.py`

- [ ] **Step 1: Write the failing test**

Add to `MatchLifecycleTestCase`:

```python
    def test_start_match_promotes_from_scheduled(self):
        # Simulate a wedged match: both lineups in but status still scheduled.
        self.match.away_lineup_submitted = True
        self.match.home_lineup_submitted = True
        self.match.status = "scheduled"
        self.match.save()
        self.client.force_authenticate(self.home_cap_user)
        resp = self.client.post(f"/api/matches/{self.match.id}/start-match/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.match.refresh_from_db()
        self.assertEqual(self.match.status, "in_progress")
        self.assertTrue(self.match.match_started)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python manage.py test league.test_match_lifecycle.MatchLifecycleTestCase.test_start_match_promotes_from_scheduled -v 2`
Expected: FAIL — 400 "Match must be in progress to start. Current status: scheduled".

- [ ] **Step 3: Implement the safety net**

In `league/views.py`, find (~line 4453) in `start_match`:

```python
        # Verify match status
        if match.status != 'in_progress':
            return Response(
                {'error': f'Match must be in progress to start. Current status: {match.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
```

Replace with:

```python
        # Accept a scheduled or already-in_progress match and promote it. Both
        # lineups being submitted (checked below) plus the home captain tapping
        # Start is sufficient proof the match is live; this is a safety net so a
        # missed scheduled->in_progress transition can never wedge the match.
        if match.status not in ['scheduled', 'in_progress']:
            return Response(
                {'error': f'Match cannot be started from status: {match.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if match.status == 'scheduled':
            match.status = 'in_progress'
```

(The existing `match.save()` after `match.match_started = True` persists the status change.)

- [ ] **Step 4: Run test to verify it passes**

Run: `python manage.py test league.test_match_lifecycle.MatchLifecycleTestCase.test_start_match_promotes_from_scheduled -v 2`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add league/test_match_lifecycle.py league/views.py
git commit -m "feat: start_match promotes a scheduled match (safety net)"
```

---

## Task 5: Demote websocket presence to UI-only

**Files:**
- Modify: `league/consumers.py` (call site ~line 128-129; method ~lines 691-707)

- [ ] **Step 1: Remove the presence-driven state mutation call**

In `league/consumers.py`, find (~line 128) in `connect`:

```python
        # Auto-transition to in_progress if both captains are now present
        await self.maybe_transition_to_in_progress()
```

Replace with:

```python
        # NOTE: match state transitions are intentionally NOT driven by websocket
        # presence — it is unreliable when captains background the app or drop
        # connection. The scheduled->in_progress transition is driven by the away
        # lineup submission over HTTP (see views.submit_lineup). Presence is
        # broadcast above for UI indicators only.
```

- [ ] **Step 2: Delete the now-unused method**

In `league/consumers.py`, delete the entire `maybe_transition_to_in_progress` method (~lines 691-707):

```python
    @database_sync_to_async
    def maybe_transition_to_in_progress(self):
        """
        Transition match to in_progress if both captains are present
        and match is still in 'scheduled' status.
        """
        from league.models import Match

        captains = self._get_captains_present()
        if captains['home'] and captains['away']:
            try:
                match = Match.objects.get(id=self.match_id)
                if match.status == 'scheduled':
                    match.status = 'in_progress'
                    match.save(update_fields=['status', 'updated_at'])
            except Match.DoesNotExist:
                pass
```

- [ ] **Step 3: Verify nothing else references the method and tests still pass**

Run: `grep -rn "maybe_transition_to_in_progress" league/`
Expected: no matches.

Run: `python manage.py test league.test_match_lifecycle -v 2`
Expected: PASS (all tests).

- [ ] **Step 4: Commit**

```bash
git add league/consumers.py
git commit -m "refactor: presence no longer mutates match state (UI-only)"
```

---

## Task 6: Complete the `reset_lineup` endpoint

**Files:**
- Modify: `league/views.py` (`reset_lineup`, ~lines 4619-4629)
- Test: `league/test_match_lifecycle.py`

- [ ] **Step 1: Write the failing test**

Add to `MatchLifecycleTestCase`:

```python
    def test_reset_lineup_both_clears_games_and_resets_status(self):
        self.match.away_lineup_submitted = True
        self.match.home_lineup_submitted = True
        self.match.status = "in_progress"
        self.match.save()
        for i in range(4):
            Game.objects.create(
                match=self.match, game_number=i + 1, set_number=i + 1,
                away_player_id=self.away_players[i].id,
                home_player_id=self.home_players[i].id,
            )
        self.client.force_authenticate(self.operator_user)
        resp = self.client.post(
            f"/api/matches/{self.match.id}/reset-lineup/",
            {"team_side": "both"}, format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.match.refresh_from_db()
        self.assertFalse(self.match.away_lineup_submitted)
        self.assertFalse(self.match.home_lineup_submitted)
        self.assertEqual(self.match.games.count(), 0)
        self.assertEqual(self.match.status, "scheduled")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python manage.py test league.test_match_lifecycle.MatchLifecycleTestCase.test_reset_lineup_both_clears_games_and_resets_status -v 2`
Expected: FAIL — games still exist (4 != 0) and status stays "in_progress".

- [ ] **Step 3: Implement the complete reset**

In `league/views.py`, find (~line 4619) in `reset_lineup`:

```python
        if team_side in ['away', 'both']:
            match.away_lineup_submitted = False
        if team_side in ['home', 'both']:
            match.home_lineup_submitted = False

        match.match_started = False
        match.started_at = None
        match.save()
```

Replace with:

```python
        if team_side in ['away', 'both']:
            match.away_lineup_submitted = False
            match.games.all().update(away_player_id=None)
        if team_side in ['home', 'both']:
            match.home_lineup_submitted = False
            match.games.all().update(home_player_id=None)

        match.match_started = False
        match.started_at = None

        # When fully reset, drop the games and return the match to a clean
        # scheduled state so it can be re-run (or rescheduled/deleted) cleanly.
        if not match.away_lineup_submitted and not match.home_lineup_submitted:
            match.games.all().delete()
            if match.status in ['in_progress', 'awaiting_confirmation']:
                match.status = 'scheduled'

        match.save()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python manage.py test league.test_match_lifecycle -v 2`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add league/test_match_lifecycle.py league/views.py
git commit -m "feat: reset_lineup performs a complete reset (clears games + status)"
```

---

## Task 7: Data migration to heal already-wedged matches

**Files:**
- Create: `league/migrations/0022_heal_wedged_matches.py`

- [ ] **Step 1: Generate an empty migration**

Run: `source venv/bin/activate && python manage.py makemigrations league --empty --name heal_wedged_matches`
Expected: creates `league/migrations/0022_heal_wedged_matches.py` with dependency on `0021_backfill_scoring_config`.

- [ ] **Step 2: Fill in the data migration**

Replace the generated file contents with:

```python
from django.db import migrations, models


def heal_wedged_matches(apps, schema_editor):
    """
    Heal matches stuck in the old presence-coupled state: status 'scheduled'
    but a lineup already submitted. Promote them to 'in_progress' so captains
    can simply press Start. Their submitted lineups and games are preserved.
    """
    Match = apps.get_model('league', 'Match')
    Match.objects.filter(status='scheduled').filter(
        models.Q(away_lineup_submitted=True) | models.Q(home_lineup_submitted=True)
    ).update(status='in_progress')


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('league', '0021_backfill_scoring_config'),
    ]

    operations = [
        migrations.RunPython(heal_wedged_matches, noop_reverse),
    ]
```

- [ ] **Step 3: Verify the migration runs against a local DB**

Run: `python manage.py migrate league`
Expected: applies `0022_heal_wedged_matches` with no error.

- [ ] **Step 4: Commit**

```bash
git add league/migrations/0022_heal_wedged_matches.py
git commit -m "fix: data migration to heal presence-wedged matches"
```

---

## Task 8: Full Phase 1 verification + deploy

**Files:** none (verification + deploy)

- [ ] **Step 1: Run the full backend test suite**

Run: `python manage.py test league -v 2`
Expected: all tests pass, including the existing `test_match_deletion` and the new `test_match_lifecycle`.

- [ ] **Step 2: Deploy to production**

Run: `eb deploy lg-production`
Expected: deploy succeeds and runs migrations (the EB container command applies `migrate` on deploy).

- [ ] **Step 3: Confirm wedged match 363 (and siblings) are healed**

SSH in and check (read-only):

```bash
# from the EB instance, in /var/app/current with venv active and RDS env loaded
python manage.py shell -c "
from league.models import Match
from django.db.models import Q
wedged = Match.objects.filter(status='scheduled').filter(Q(away_lineup_submitted=True)|Q(home_lineup_submitted=True))
print('remaining wedged (should be 0):', wedged.count())
m = Match.objects.get(id=363)
print(363, m.status, '| away_lu:', m.away_lineup_submitted, 'home_lu:', m.home_lineup_submitted, 'started:', m.match_started)
"
```
Expected: `remaining wedged (should be 0): 0` and match 363 status `in_progress`.

- [ ] **Step 4: Manual staggered-connection smoke test (the original repro)**

On two devices/accounts: away captain opens a fresh scheduled match, submits lineup, **fully closes the app**. Then home captain opens it, submits lineup, taps Start.
Expected: the match starts (no "Failed to start match"). This is the bug, fixed.

---

# PHASE 2 — Frontend (`league-genius`)

> Run in `/Users/benjamindally/Projects/league-genius`. No JS test runner is configured; verify with lint + typecheck + manual steps.

## Task 9: Add `resetLineup` to the shared API client

**Files:**
- Modify: `packages/shared/src/api/matches.ts`

- [ ] **Step 1: Add the API method**

In `packages/shared/src/api/matches.ts`, inside the `matchesApi` object (after `getLineup`), add:

```ts
  /**
   * Reset lineup state (league operators only).
   * team_side 'both' performs a complete reset: clears games and returns the
   * match to 'scheduled'.
   */
  resetLineup: (
    matchId: number,
    teamSide: 'home' | 'away' | 'both',
    token?: string
  ) =>
    api.post<{ message: string; match: Match }>(
      `/matches/${matchId}/reset-lineup/`,
      { team_side: teamSide },
      token
    ),
```

- [ ] **Step 2: Typecheck the shared package**

Run: `pnpm --filter @league-genius/shared exec tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/api/matches.ts
git commit -m "feat(api): add resetLineup client method"
```

---

## Task 10: Mobile — trust server state after submit/start

**Files:**
- Modify: `packages/mobile/src/hooks/useMatchDetails.ts` (`handleSubmitLineup` ~lines 471-488, `handleStartMatch` ~lines 455-469)

- [ ] **Step 1: Make `handleSubmitLineup` adopt server-returned state**

In `packages/mobile/src/hooks/useMatchDetails.ts`, replace the body of `handleSubmitLineup`'s `try` block:

```ts
      await matchesApi.submitLineup(matchId, { games, team_side: team }, accessToken);
      sendWebSocket({ type: "lineup_submitted", team_side: team });
      setLineupState(team === "away" ? "awaiting_home_lineup" : "ready_to_start");
```

with:

```ts
      await matchesApi.submitLineup(matchId, { games, team_side: team }, accessToken);
      sendWebSocket({ type: "lineup_submitted", team_side: team });
      // Trust the server's persisted state rather than guessing locally.
      const updated = await matchesApi.getById(matchId, accessToken);
      setMatch(updated);
      if (updated.lineup_state) {
        setLineupState(updated.lineup_state as LineupState);
      }
```

- [ ] **Step 2: Make `handleStartMatch` adopt server-returned state**

Replace the `try` block of `handleStartMatch`:

```ts
      await matchesApi.startMatch(matchId, accessToken);
      setLineupState("match_live");
      sendWebSocket({ type: "match_start" });
      await loadLineupData();
```

with:

```ts
      await matchesApi.startMatch(matchId, accessToken);
      const updated = await matchesApi.getById(matchId, accessToken);
      setMatch(updated);
      setLineupState((updated.lineup_state as LineupState) || "match_live");
      sendWebSocket({ type: "match_start" });
      await loadLineupData();
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @league-genius/mobile exec tsc --noEmit && pnpm lint`
Expected: no type or lint errors.

- [ ] **Step 4: Commit**

```bash
git add packages/mobile/src/hooks/useMatchDetails.ts
git commit -m "feat(mobile): trust server-returned match state after submit/start"
```

> Note: on websocket reconnect the server already pushes a `match_state` message containing `lineup_state` (consumers `connect` → `match_state`), which `handleWebSocketMessage` applies — so reconnect re-sync is already handled and needs no change here.

---

## Task 11: Mobile — captain self-edit + operator reset affordances

**Files:**
- Modify: `packages/mobile/src/hooks/useMatchDetails.ts` (`canEditAwayLineup`/`canEditHomeLineup` ~lines 95-100; add `handleResetLineup`)
- Modify: `packages/mobile/src/components/match/MatchActionBar.tsx`
- Modify: `packages/mobile/src/screens/MatchDetailsScreen.tsx` (pass new props)

- [ ] **Step 1: Allow a captain to edit their own lineup until the match starts**

In `packages/mobile/src/hooks/useMatchDetails.ts`, replace:

```ts
  const canEditAwayLineup =
    (isAwayLineupPhase || isLeagueOperator) &&
    (captainRole === "away" || isLeagueOperator);
  const canEditHomeLineup =
    (isHomeLineupPhase || isLeagueOperator) &&
    (captainRole === "home" || isLeagueOperator);
```

with:

```ts
  // A captain may edit their own lineup any time before the match starts
  // (not just during their initial phase). Operators may always edit.
  const matchNotStarted = !isMatchLive && !isMatchCompleted;
  const awayLineupIn =
    lineupState !== "awaiting_away_lineup" && lineupState !== "not_started";
  const canEditAwayLineup =
    (isAwayLineupPhase || isLeagueOperator || (captainRole === "away" && matchNotStarted)) &&
    (captainRole === "away" || isLeagueOperator);
  const canEditHomeLineup =
    (isHomeLineupPhase || isLeagueOperator || (captainRole === "home" && matchNotStarted)) &&
    (captainRole === "home" || isLeagueOperator);
```

- [ ] **Step 1b: Keep the submit button visible during self-edit**

Still in `useMatchDetails.ts`, find the `showAwaySubmit` / `showHomeSubmit` definitions (~lines 692-695):

```ts
  const showAwaySubmit =
    isAwayLineupPhase && (captainRole === "away" || isLeagueOperator);
  const showHomeSubmit =
    isHomeLineupPhase && (captainRole === "home" || isLeagueOperator);
```

Replace with (so a captain who already submitted still sees a submit/update button until the match starts; home still requires away-first):

```ts
  const showAwaySubmit =
    canEditAwayLineup && matchNotStarted && (captainRole === "away" || isLeagueOperator);
  const showHomeSubmit =
    canEditHomeLineup && awayLineupIn && matchNotStarted &&
    (captainRole === "home" || isLeagueOperator);
```

- [ ] **Step 2: Add a reset handler**

In the same file, add alongside the other match-flow handlers (e.g. after `handleStartMatch`):

```ts
  const handleResetLineup = async () => {
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      const res = await matchesApi.resetLineup(matchId, "both", accessToken);
      setMatch(res.match);
      setLineupState((res.match.lineup_state as LineupState) || "awaiting_away_lineup");
      await loadData();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to reset lineup.");
    } finally {
      setIsSubmitting(false);
    }
  };
```

Then add `handleResetLineup` to the hook's returned object (in the "Match flow" group).

- [ ] **Step 3: Surface the operator reset button in `MatchActionBar`**

Captain self-edit now needs **no new button**: Steps 1/1b keep the player pickers editable and the "Submit … Lineup" button visible (acting as an update) until the match starts. Optionally relabel that button to "Update Lineup" when the side's lineup is already submitted — cosmetic, skip if time-constrained.

Only the operator reset is a genuinely new control. In `packages/mobile/src/components/match/MatchActionBar.tsx`, add two props to `MatchActionBarProps`:

```ts
  isMatchCompleted: boolean;
  onResetLineup: () => Promise<void>;
```

Add them to the destructured params, then render — after the existing submit buttons (before the scorecard block):

```tsx
      {/* Operator: full reset of a stuck match */}
      {isLeagueOperator && !isMatchCompleted && (
        <TouchableOpacity
          onPress={onResetLineup}
          disabled={isSubmitting}
          className="flex-row items-center justify-center gap-2 py-2.5 border bg-white border-red-300"
        >
          <RotateCcw size={15} color="#DC2626" />
          <Text className="text-sm font-medium text-red-600">Reset Match Lineups (Operator)</Text>
        </TouchableOpacity>
      )}
```

(`RotateCcw` is already imported in this file.)

- [ ] **Step 4: Pass the new props from `MatchDetailsScreen`**

In `packages/mobile/src/screens/MatchDetailsScreen.tsx`, where `<MatchActionBar .../>` is rendered, add:

```tsx
            isMatchCompleted={isMatchCompleted}
            onResetLineup={handleResetLineup}
```

and destructure `handleResetLineup` and `isMatchCompleted` from `useMatchDetails` (both are already returned by the hook — `isMatchCompleted` exists; `handleResetLineup` was added in Step 2).

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm --filter @league-genius/mobile exec tsc --noEmit && pnpm lint`
Expected: no type or lint errors.

- [ ] **Step 6: Manual verification**

- As a captain who has already submitted, before the match starts: confirm the player pickers are still editable and a Submit/Update Lineup button is shown; change a player and re-submit successfully; confirm the other team's assignments are untouched.
- As an operator on a live/stuck match: tap "Reset Match Lineups", confirm the match returns to the away-lineup phase and games are cleared.

- [ ] **Step 7: Commit**

```bash
git add packages/mobile/src/hooks/useMatchDetails.ts packages/mobile/src/components/match/MatchActionBar.tsx packages/mobile/src/screens/MatchDetailsScreen.tsx
git commit -m "feat(mobile): captain lineup self-edit + operator reset"
```

---

## Task 12: Web — mirror trust-server-state + operator reset

**Files:**
- Modify: `packages/web/src/contexts/MatchScoringContext.tsx` (submit/start handlers)
- Modify: `packages/web/src/pages/admin/OperatorMatchPage.tsx` (or the relevant operator match component) to add a reset button

- [ ] **Step 1: Locate the web submit/start handlers**

Run: `grep -n "submitLineup\|startMatch\|setLineupState\|lineup_state" packages/web/src/contexts/MatchScoringContext.tsx`
Expected: identifies the handlers analogous to the mobile hook.

- [ ] **Step 2: Adopt server-returned state after submit/start**

After each `await matchesApi.submitLineup(...)` and `await matchesApi.startMatch(...)` in the web handlers, re-fetch and adopt server state:

```ts
const updated = await matchesApi.getById(matchId, token);
setMatch(updated);
if (updated.lineup_state) setLineupState(updated.lineup_state as LineupState);
```

(Match the existing variable/setter names in this file — use the local `setMatch`/`setLineupState` equivalents.)

- [ ] **Step 3: Add an operator reset button**

In the operator match view, add a button that calls:

```ts
await matchesApi.resetLineup(matchId, 'both', token);
// then refetch the match and update local state
```

behind a confirm dialog (use the existing confirm pattern in that component).

- [ ] **Step 4: Typecheck + lint + build**

Run: `pnpm --filter @league-genius/web build && pnpm lint`
Expected: build succeeds, no lint errors.

- [ ] **Step 5: Manual verification**

In the web app as an operator: load a stuck match, click Reset, confirm it returns to the away-lineup phase.

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/contexts/MatchScoringContext.tsx packages/web/src/pages/admin/OperatorMatchPage.tsx
git commit -m "feat(web): trust server match state + operator reset"
```

---

## Final verification

- [ ] Backend: `python manage.py test league -v 2` all green; production deployed; match 363 healed.
- [ ] Mobile: typecheck + lint clean; staggered-connection smoke test passes (away submits & closes app → home submits → Start works).
- [ ] Web: build clean; operator reset works.
- [ ] Update `.claude/context.md` (league-genius) and `rack/CLAUDE.md` if they track match lifecycle behavior.
