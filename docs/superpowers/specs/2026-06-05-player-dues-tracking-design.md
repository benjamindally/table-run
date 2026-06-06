# Player Dues Tracking — Design

**Date:** 2026-06-05
**Status:** Approved design (planning only — implementation not yet committed)

## Problem

League operators need a way to track whether each player has paid their league
dues. Dues are collected **per season** (a player may pay for Spring but not
Fall), so the status must be scoped to a player's participation in a specific
season, not a global flag on the player.

## Scope & Roles

Who can see and change dues status:

| Role (relative to a season) | Can view | Can edit |
| --- | --- | --- |
| League operator (of the season's league) | All players in the season | Yes |
| Captain of team(s) in the season | Players on their team(s) only | No |
| Player participating in the season | Their own status only | No |
| Anyone else | Nothing (403 / hidden) | No |

Editing (toggling paid/unpaid) is **operator-only**. Captains and players have
read-only visibility.

## Data Model

Dues live on `PlayerSeasonStats` (`packages`/backend `rack/league/models.py`),
which is the existing `player + season + team` join. Two new fields:

```python
dues_paid = models.BooleanField(
    default=False,
    help_text="Whether the player has paid their league dues for this season",
)
dues_paid_at = models.DateTimeField(
    null=True, blank=True,
    help_text="When dues were marked paid (cleared when unmarked)",
)
```

- `dues_paid_at` is set to `timezone.now()` when toggled on, and set back to
  `null` when toggled off. This gives operators a record of *when* without extra
  UI.
- Requires a Django migration (next number after `0021_backfill_scoring_config`).

### Known limitation (accepted)

A player only has a `PlayerSeasonStats` row once they have stats for the season
(created via CSV import or recorded games). A player rostered on a team but with
no stats row yet will not appear in the dues list. This is consistent with the
existing "Player Analytics" section, which is driven by the same rows. If
operators need to mark dues before any stats exist, a follow-up could create
"empty" stats rows at roster time — out of scope here.

## API (Django REST, `rack/league/views.py`)

Dues data is **NOT** added to the existing `GET /seasons/{id}/players/` endpoint,
because that endpoint is `AllowAny` and returns everyone's stats publicly. Dues
are sensitive, so they get dedicated, auth-scoped endpoints.

### Read — `GET /seasons/{id}/dues/`

- Auth required.
- Resolves the requester's role for this season and returns only the rows they
  may see:
  - **operator** — `LeagueOperator(league=season.league, player=me)` → all
    players in the season.
  - **captain** — teams where `TeamCaptain(player=me)` AND the team has a
    `SeasonParticipation` in this season → players whose `PlayerSeasonStats.team`
    is in those teams.
  - **player** — own `PlayerSeasonStats(player=me, season=season)` → just their
    own row(s).
  - none of the above → `403` (or empty payload; implementation picks one and is
    consistent).

Response shape:

```json
{
  "season_id": 12,
  "scope": "operator",          // "operator" | "captain" | "player"
  "can_edit": true,              // true only for operator
  "summary": { "paid": 12, "total": 20 },
  "players": [
    {
      "stats_id": 88,
      "player_id": 5,
      "player_name": "Alice Smith",
      "team_id": 3,
      "team_name": "Sharks",
      "dues_paid": true,
      "dues_paid_at": "2026-06-01T14:03:00Z"
    }
  ]
}
```

`summary` reflects the scoped set (e.g. a captain sees the count for their own
team).

### Write — `PATCH /seasons/{id}/players/{stats_id}/dues/`

- Body: `{ "dues_paid": true }`.
- Permission: `IsLeagueOperatorForObject` (operators only). The action calls
  `self.get_object()` on the `Season` to trigger the object-level operator check,
  then loads the `PlayerSeasonStats` by `stats_id` scoped to that season.
- Sets `dues_paid` and updates `dues_paid_at` (`now()` on, `null` off).
- Returns the updated row `{ stats_id, dues_paid, dues_paid_at }`.

### Player's own badge — extend `GET /me/`

To power a lightweight "Dues: Paid/Unpaid" badge on season tiles (dashboard,
season selectors, etc.) without an extra fetch, add a field to each season in the
`/me/` payload (`me` view + `MeSeasonSerializer`):

- `my_dues_paid: boolean | null`
  - `true` / `false` — player has stats row(s) for the season; `true` only if all
    their rows for that season are paid.
  - `null` — no stats row yet (status unknown).

## Shared Package (`packages/shared/src`)

- `types/index.ts`:
  - New `SeasonDuesResponse` and `SeasonDuesEntry` types matching the read
    payload above.
  - Add `my_dues_paid: boolean | null` to `MeSeason`.
- `api/seasons.ts`:
  - `getDues(seasonId, token)` → `GET /seasons/{id}/dues/`.
  - `updateDues(seasonId, statsId, duesPaid, token)` → `PATCH
    /seasons/{id}/players/{statsId}/dues/`.

Both web and mobile consume these shared types/api, so backend + shared changes
serve both clients.

## Web (`packages/web/src`)

- **Hooks** (`hooks/useSeasons.ts`):
  - `useSeasonDues(seasonId)` — query wrapping `seasonsApi.getDues`.
  - `useUpdateDues()` — mutation wrapping `seasonsApi.updateDues`, with optimistic
    update and invalidation of the season-dues query for snappy toggling.
- **`SeasonDues` component** (`components/seasons/SeasonDues.tsx`), rendered on
  `pages/admin/SeasonDetailsPage.tsx`:
  - Players grouped by team.
  - Header summary "X of Y paid".
  - When `can_edit` (operator): a paid/unpaid toggle per row.
  - When not `can_edit` (captain/player): read-only Paid/Unpaid badge.
  - Hidden entirely if the payload is empty / `403`.
- **Player badge**: small "Dues: Paid/Unpaid" badge driven by `MeSeason.my_dues_paid`
  on the season tiles already rendered via `LeagueSeasonContext`. Rendered only
  when `my_dues_paid` is non-null.

## Mobile (`packages/mobile/src`)

- Mirror the dues section in `screens/SeasonDetailsScreen.tsx`, reusing the same
  shared API (`getDues` / `updateDues`) and the role-scoped `can_edit` flag for
  toggle vs. read-only rendering.
- Mirror the player badge wherever mobile renders `MeSeason` tiles.

## Out of Scope

- Tracking dues *amounts* or payment methods (this is a boolean paid/unpaid only).
- Creating stats rows for rostered-but-unplayed players so they appear in the
  dues list (noted as a possible follow-up).
- Notifications / reminders for unpaid dues.

## Testing Notes

- Backend: unit tests for role resolution in `GET /seasons/{id}/dues/` (operator
  sees all, captain sees own team, player sees self, outsider blocked) and for the
  operator-only `PATCH` (non-operator rejected; `dues_paid_at` set/cleared).
- Frontend: component test for `SeasonDues` rendering toggles vs. read-only badges
  based on `can_edit`, and the summary count.
