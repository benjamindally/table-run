# API Layer Documentation

This directory contains the API client for communicating with the Django backend.

## Configuration

Set the API base URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Usage Examples

### Import the API services

```typescript
import { playersApi, teamsApi, matchesApi, seasonsApi, captainRequestsApi } from '@/api';
```

### Basic API Calls

```typescript
// Get current user's profile
const currentUser = await playersApi.getCurrentUser(authToken);

// Get current user's teams
const myTeams = await playersApi.getCurrentTeams(authToken);

// Get all teams
const allTeams = await teamsApi.getAll(authToken);

// Get a specific team
const team = await teamsApi.getById(teamId, authToken);

// Get team roster
const roster = await teamsApi.getRoster(teamId, authToken);

// Submit match score
await matchesApi.submitScore(matchId, { home_score: 5, away_score: 3 }, authToken);
```

### In a React Component

```typescript
import { useEffect, useState } from 'react';
import { playersApi, Team } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

function MyTeamsPage() {
  const { token } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true);
        const data = await playersApi.getCurrentTeams(token);
        setTeams(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchTeams();
    }
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>My Teams</h1>
      {teams.map(team => (
        <div key={team.id}>{team.name}</div>
      ))}
    </div>
  );
}
```

## Available API Services

### `playersApi`
- `getAll(token?)` - Get all players (paginated)
- `getById(id, token?)` - Get player by ID
- `getCurrentUser(token?)` - Get current user's profile
- `getCurrentTeams(token?)` - Get current user's teams
- `getCurrentUserCaptainRequests(token?)` - Get current user's captain requests
- `getPlayerTeams(playerId, token?)` - Get teams for specific player
- `create(data, token?)` - Create player profile
- `update(id, data, token?)` - Update player profile

### `teamsApi`
- `getAll(token?)` - Get all teams (paginated)
- `getById(id, token?)` - Get team by ID
- `create(data, token?)` - Create new team
- `update(id, data, token?)` - Update team
- `getRoster(teamId, token?)` - Get team roster
- `addMember(teamId, playerId, token?)` - Add member to team
- `transferCaptain(teamId, newCaptainId, token?)` - Transfer captaincy
- `removeCoCaptain(teamId, coCaptainId, token?)` - Remove co-captain
- `getCaptainRequests(teamId, token?)` - Get pending captain requests

### `matchesApi`
- `getAll(token?)` - Get all matches (paginated)
- `getById(id, token?)` - Get match by ID
- `create(data, token?)` - Create new match
- `update(id, data, token?)` - Update match
- `submitScore(matchId, scores, token?)` - Submit match score

### `seasonsApi`
- `getAll(token?)` - Get all seasons (paginated)
- `getById(id, token?)` - Get season by ID
- `create(data, token?)` - Create new season
- `update(id, data, token?)` - Update season
- `getTeams(seasonId, token?)` - Get teams in season
- `getMatches(seasonId, token?)` - Get matches in season

### `captainRequestsApi`
- `getAll(token?)` - Get all captain requests (paginated)
- `getById(id, token?)` - Get captain request by ID
- `create(data, token?)` - Create new captain request
- `approve(requestId, token?)` - Approve request (captain only)
- `deny(requestId, token?)` - Deny request (captain only)

## Error Handling

All API calls throw errors on failure. Use try/catch blocks:

```typescript
try {
  const team = await teamsApi.getById(teamId, token);
} catch (error) {
  console.error('Failed to fetch team:', error);
  // Handle error (show toast, etc.)
}
```
