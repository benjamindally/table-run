# Frontend Context - Table Run

Last Updated: 2025-12-18

## Project Overview
React + TypeScript frontend for Table Run, an 8-ball pool league management application. Built with Vite, Tailwind CSS, and React Query.

## Tech Stack
- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 5.4+
- **Styling**: Tailwind CSS 3.4+
- **Routing**: React Router DOM 6.22+
- **State Management**: React Query (@tanstack/react-query) for server state
- **Auth**: Context API (AuthContext)
- **Icons**: Lucide React
- **Notifications**: React Toastify

## Project Structure

```
src/
├── api/                    # API client functions
│   ├── client.ts          # Base API client with fetch wrapper
│   ├── teams.ts           # Team endpoints
│   ├── players.ts         # Player endpoints
│   ├── seasons.ts         # Season endpoints
│   └── types.ts           # Shared API types
├── hooks/                  # React Query hooks
│   ├── useTeams.ts        # Team queries & mutations
│   ├── usePlayers.ts      # Player queries & mutations
│   └── useSeasons.ts      # Season queries
├── contexts/               # React Context providers
│   └── AuthContext.tsx    # Authentication state
├── components/
│   ├── auth/              # Auth components
│   │   └── ProtectedRoute.tsx
│   └── navigation/        # Headers, footers, sidebars
├── layouts/
│   ├── MainLayout.tsx     # Public layout (header + footer)
│   └── AdminLayout.tsx    # Admin layout (sidebar + header)
├── pages/
│   ├── admin/             # Admin pages (protected)
│   │   ├── TeamDetailsPage.tsx
│   │   ├── PlayerDetailsPage.tsx
│   │   └── ...
│   └── [public pages]     # Home, Login, etc.
└── App.tsx                # Root component with routing
```

## Key Files & Components

### API Layer (src/api/)

#### **teams.ts** - Team API methods
```typescript
teamsApi.getAll()                           // GET /teams/
teamsApi.getById(id)                        // GET /teams/{id}/
teamsApi.create(data)                       // POST /teams/
teamsApi.update(id, data)                   // PATCH /teams/{id}/
teamsApi.getRoster(teamId)                  // GET /teams/{id}/roster/
teamsApi.addMember(teamId, playerId)        // POST /teams/{id}/add_member/
teamsApi.addCaptain(teamId, playerId)       // POST /teams/{id}/add_captain/
teamsApi.removeCaptain(teamId, playerId)    // POST /teams/{id}/remove_captain/
teamsApi.getSeasons(teamId)                 // GET /teams/{id}/seasons/
teamsApi.getSeasonStats(teamId, seasonId)   // GET /teams/{id}/season_stats/
```

#### **players.ts** - Player API methods
```typescript
playersApi.getAll()                         // GET /players/
playersApi.getById(id)                      // GET /players/{id}/
playersApi.getPlayerTeams(playerId)         // GET /players/{id}/teams/
playersApi.getSeasonStats(playerId)         // GET /players/{id}/season-stats/
playersApi.update(id, data)                 // PATCH /players/{id}/
playersApi.updateSeasonStats(id, statsId, data)  // PATCH /players/{id}/update-season-stats/{statsId}/
playersApi.updateWeekStats(id, statsId, week, data)  // PATCH /players/{id}/update-week-stats/{statsId}/{week}/
```

**Season Stats Update Payload:**
```typescript
{
  total_wins?: number,
  total_losses?: number,
  table_runs?: number,
  eight_ball_breaks?: number
}
```

**Week Stats Update Payload:**
```typescript
{
  wins?: number,
  losses?: number
}
```

### React Query Hooks (src/hooks/)

#### **useTeams.ts** - Team operations
```typescript
// Query Keys (for cache management)
teamsKeys.list()                 // ['teams', 'list']
teamsKeys.detail(id)             // ['teams', 'detail', id]
teamsKeys.roster(id)             // ['teams', 'detail', id, 'roster']
teamsKeys.seasons(id)            // ['teams', 'detail', id, 'seasons']

// Hooks
useTeams()                       // Get all teams
useTeam(teamId)                  // Get single team
useTeamRoster(teamId)            // Get team roster
useTeamSeasons(teamId)           // Get team season participations
```

#### **usePlayers.ts** - Player operations
```typescript
// Query Keys
playerKeys.list()                      // ['players', 'list']
playerKeys.detail(id)                  // ['players', 'detail', id]
playerKeys.teams(id)                   // ['players', 'detail', id, 'teams']
playerKeys.seasonStats(id)             // ['players', 'detail', id, 'season-stats']

// Hooks
usePlayers()                           // Get all players
usePlayer(playerId)                    // Get single player
usePlayerTeams(playerId)               // Get player's teams
usePlayerSeasonStats(playerId)         // Get player's season stats
useUpdatePlayer()                      // Update player (phone, skill_level)
useUpdatePlayerSeasonStats()           // Update season totals
useUpdatePlayerWeekStats()             // Update weekly stats
```

### Admin Pages (src/pages/admin/)

#### **TeamDetailsPage.tsx**
**Location**: Lines 1-373
**Purpose**: View and manage team details, roster, captains, season history

**Key Features:**
- Edit team info (name, establishment, active status)
- Manage captains modal with checkbox interface
- View roster with player details
- View season participation history

**State Management:**
```typescript
const [isEditing, setIsEditing] = useState(false)
const [showCaptainModal, setShowCaptainModal] = useState(false)
```

**Mutations:**
```typescript
updateMutation           // Update team basic info
addCaptainMutation      // Add captain
removeCaptainMutation   // Remove captain
```

**Captain Toggle Logic** (lines 89-106):
- Shows confirmation dialog when removing captain
- Invalidates team detail and roster queries after mutation

#### **PlayerDetailsPage.tsx**
**Location**: Lines 1-630
**Purpose**: View and edit player details, career stats, season history

**Key Features:**
- Career statistics overview (wins, losses, win %, table runs, 8-ball breaks)
- Season-by-season breakdown with expandable weekly stats
- Edit season stats (wins, losses, table runs, 8-ball breaks)
- Edit weekly stats (wins, losses)
- Edit player info (phone, skill_level)

**State Management:**
```typescript
const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set())
const [editingSeasonStat, setEditingSeasonStat] = useState<PlayerSeasonStatDetail | null>(null)
const [editingWeekStat, setEditingWeekStat] = useState<...>(null)
const [isEditingPlayer, setIsEditingPlayer] = useState(false)
```

**Mutations:**
```typescript
updateSeasonStatsMutation   // Manual override of season totals
updateWeekStatsMutation     // Update weekly stats (auto-recalculates season)
updatePlayerMutation        // Update player phone/skill_level
```

**Modal Patterns:**
- Season stats modal: 2-column grid for wins/losses, then table runs/8-ball breaks
- Week stats modal: Simple vertical layout for wins/losses
- Note displayed: "Updating wins/losses here will override calculated totals from weekly stats"

### Authentication (src/contexts/AuthContext.tsx)

**Context Provider:**
```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  getAuthToken: () => string | null
}
```

**Demo Credentials** (hardcoded):
- Email: `admin@example.com`
- Password: `admin123`
- Role: `admin`

**Protected Routes**: Wrapped in `<ProtectedRoute>` component that redirects to `/login` if not authenticated.

### Routing (src/App.tsx)

**Public Routes** (MainLayout):
- `/` - Homepage
- `/register` - Team registration
- `/match-score` - Match score submission
- `/login` - Login page

**Admin Routes** (AdminLayout + ProtectedRoute):
- `/admin/dashboard` - Dashboard
- `/admin/teams` - Teams list
- `/admin/teams/:id` - Team details
- `/admin/players/:id` - Player details
- `/admin/matches` - Matches
- `/admin/leagues` - Leagues list
- `/admin/leagues/:id` - League details
- `/admin/seasons` - Seasons list
- `/admin/seasons/:id` - Season details

## Styling Conventions

### Tailwind Classes
- **Primary Color**: `orange-500`, `orange-600`, `primary-*`
- **Admin Background**: `bg-gray-100` with white cards
- **Buttons**: `btn btn-primary btn-sm` (custom classes defined in CSS)
- **Cards**: `bg-white rounded-lg shadow-sm p-6`
- **Modals**: Fixed overlay with centered white card

### Common Patterns
```typescript
// Card header with action button
<div className="flex items-center justify-between mb-4">
  <h2 className="text-xl font-semibold text-dark">Title</h2>
  <button className="btn btn-primary btn-sm">Action</button>
</div>

// Modal structure
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
    {/* Header */}
    {/* Content */}
    {/* Footer with buttons */}
  </div>
</div>

// Table with hover
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">...</thead>
  <tbody className="bg-white divide-y divide-gray-200">
    <tr className="hover:bg-gray-50">...</tr>
  </tbody>
</table>
```

## Recent Changes

### 2025-12-18 - Player User Details Editing
**Modified Files:**
- `src/pages/admin/PlayerDetailsPage.tsx`: Enabled editing of user details (first_name, last_name, email)
- `src/api/players.ts`: Updated player update method to use PlayerUpdateData type
- `src/api/types.ts`: Added PlayerUpdateData interface (lines 206-212)
- `src/hooks/usePlayers.ts`: Updated useUpdatePlayer mutation type

**Changes:**
1. Edit Player modal now allows editing first_name, last_name, and email (previously disabled)
2. Removed "User details cannot be edited from player profile" message
3. Added email field to the edit modal (between last name and phone)
4. Created PlayerUpdateData type with optional fields: first_name, last_name, email, phone, skill_level
5. Backend now handles nested user updates through PlayerSerializer

**Code Snippet - PlayerUpdateData Type:**
```typescript
// src/api/types.ts:206-212
export interface PlayerUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  skill_level?: number | null;
}
```

**Code Snippet - handleSavePlayer:**
```typescript
// PlayerDetailsPage.tsx:148-165
const handleSavePlayer = async () => {
  try {
    await updatePlayerMutation.mutateAsync({
      playerId,
      data: {
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail,
        phone: editPhone,
        skill_level: editSkillLevel,
      },
    });
    toast.success("Player updated successfully!");
    setIsEditingPlayer(false);
  } catch (error: any) {
    toast.error(error.message || "Failed to update player");
  }
};
```

### 2025-12-18 - Player Stats Editing
**Modified Files:**
- `src/pages/admin/PlayerDetailsPage.tsx`: Added wins/losses editing to season stats modal
- `src/api/players.ts`: Updated `updateSeasonStats` to accept total_wins and total_losses
- `src/hooks/usePlayers.ts`: Updated mutation type signature

**Changes:**
1. Season stats modal now shows wins/losses in top 2-column grid
2. Table runs and 8-ball breaks in second 2-column grid
3. Blue info box warns about overriding calculated totals
4. Backend accepts all four fields: total_wins, total_losses, table_runs, eight_ball_breaks

### 2025-12-18 - Captain Management UI
**Modified Files:**
- `src/pages/admin/TeamDetailsPage.tsx`: Added captain management modal
- `src/api/teams.ts`: Renamed `removeCoCaptain` → `removeCaptain`
- `src/hooks/useTeams.ts`: Added query key for roster

**Changes:**
1. "Manage Captains" button in Team Leadership section
2. Modal shows all roster members with checkbox to promote/demote
3. Confirmation dialog when removing captain
4. Uses `addCaptain` and `removeCaptain` mutations
5. Removed legacy co-captain concept (all captains equal)

### 2025-12-18 - Career Stats Styling
**Modified Files:**
- `src/pages/admin/PlayerDetailsPage.tsx`: Removed gradient from Career Statistics

**Changes:**
1. Changed from `bg-gradient-to-br from-primary-50 to-secondary-50` to `bg-white`
2. Now consistent with other section styling (white background with shadow)

## Data Flow Patterns

### Query Invalidation
When data changes, invalidate related queries:
```typescript
// After adding captain
queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) })
queryClient.invalidateQueries({ queryKey: teamsKeys.roster(teamId) })

// After updating player stats
queryClient.invalidateQueries({ queryKey: playerKeys.seasonStats(playerId) })
```

### Error Handling
```typescript
try {
  await mutation.mutateAsync(data)
  toast.success('Success message!')
} catch (error: any) {
  toast.error(error.message || 'Failed to perform action')
}
```

### Loading States
```typescript
if (isLoading) {
  return <div>Loading...</div>
}

// Or disable buttons during mutation
<button disabled={mutation.isPending}>
  {mutation.isPending ? 'Saving...' : 'Save'}
</button>
```

## Common Issues & Solutions

### Issue: Query not updating after mutation
**Solution**: Ensure you're invalidating the correct query keys after mutations.

### Issue: TypeScript errors with API types
**Solution**: Check that interfaces in `src/api/types.ts` match backend response structure.

### Issue: Modal not closing
**Solution**: Ensure state is set to false/null after successful mutation.

## Integration with Backend

### API Base URL
Configured in `src/api/client.ts` - defaults to `/api` prefix

### Response Patterns
- **Team Detail**: Includes `captains_detail` array with full captain info
- **Player Stats**: Includes `career_totals` object + `seasons` array with nested `weeks`
- **Season Participations**: Includes `season_detail` and `team_detail` nested objects

### Authentication
- Token stored in localStorage (demo only)
- Passed as parameter to API methods: `token?: string`
- Retrieved via `getAuthToken()` from AuthContext

## TODO / Known Issues
- [ ] Demo auth should be replaced with real backend authentication
- [ ] localStorage persistence should use secure storage
- [ ] Error boundaries needed for better error handling
- [ ] Loading skeletons would improve UX
- [ ] Toast notifications should be more contextual (different colors for error/success/info)
