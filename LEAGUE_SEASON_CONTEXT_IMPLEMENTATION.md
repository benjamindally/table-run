# Implementation Plan: LeagueSeasonContext

## Overview
Create a global context to track the current league/season selection across all admin pages, with localStorage persistence.

---

## Step 1: Create the Context (15 min)

**File:** `src/contexts/LeagueSeasonContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STORAGE_KEY_LEAGUE = 'admin_currentLeagueId';
const STORAGE_KEY_SEASON = 'admin_currentSeasonId';

interface LeagueSeasonContextType {
  currentLeagueId: number | null;
  currentSeasonId: number | null;
  setCurrentLeague: (leagueId: number | null) => void;
  setCurrentSeason: (seasonId: number | null) => void;
  setLeagueAndSeason: (leagueId: number, seasonId: number) => void;
  clearSelection: () => void;
}

const LeagueSeasonContext = createContext<LeagueSeasonContextType | undefined>(undefined);

export const LeagueSeasonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLeagueId, setCurrentLeagueId] = useState<number | null>(null);
  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedLeagueId = localStorage.getItem(STORAGE_KEY_LEAGUE);
      const savedSeasonId = localStorage.getItem(STORAGE_KEY_SEASON);

      if (savedLeagueId) {
        setCurrentLeagueId(parseInt(savedLeagueId, 10));
      }
      if (savedSeasonId) {
        setCurrentSeasonId(parseInt(savedSeasonId, 10));
      }
    } catch (error) {
      console.error('Failed to load saved league/season:', error);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    if (!isInitialized) return;

    if (currentLeagueId !== null) {
      localStorage.setItem(STORAGE_KEY_LEAGUE, currentLeagueId.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_LEAGUE);
    }
  }, [currentLeagueId, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    if (currentSeasonId !== null) {
      localStorage.setItem(STORAGE_KEY_SEASON, currentSeasonId.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_SEASON);
    }
  }, [currentSeasonId, isInitialized]);

  const setCurrentLeague = (leagueId: number | null) => {
    setCurrentLeagueId(leagueId);
    // Clear season when league changes (may not be valid for new league)
    if (leagueId !== currentLeagueId) {
      setCurrentSeasonId(null);
    }
  };

  const setCurrentSeason = (seasonId: number | null) => {
    setCurrentSeasonId(seasonId);
  };

  const setLeagueAndSeason = (leagueId: number, seasonId: number) => {
    setCurrentLeagueId(leagueId);
    setCurrentSeasonId(seasonId);
  };

  const clearSelection = () => {
    setCurrentLeagueId(null);
    setCurrentSeasonId(null);
  };

  const value = {
    currentLeagueId,
    currentSeasonId,
    setCurrentLeague,
    setCurrentSeason,
    setLeagueAndSeason,
    clearSelection,
  };

  return (
    <LeagueSeasonContext.Provider value={value}>
      {children}
    </LeagueSeasonContext.Provider>
  );
};

// Custom hook to use the context
export const useLeagueSeason = () => {
  const context = useContext(LeagueSeasonContext);
  if (context === undefined) {
    throw new Error('useLeagueSeason must be used within a LeagueSeasonProvider');
  }
  return context;
};
```

---

## Step 2: Add Provider to App.tsx (5 min)

**File:** `src/App.tsx`

```typescript
import { LeagueSeasonProvider } from "./contexts/LeagueSeasonContext";

// Wrap the admin routes with the provider
<AuthProvider>
  <MatchScoringProvider>
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public routes... */}
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <LeagueSeasonProvider>  {/* Add this */}
                <AdminLayout />
              </LeagueSeasonProvider>
            </ProtectedRoute>
          }
        >
          {/* Admin routes... */}
        </Route>
      </Routes>
    </Router>
  </MatchScoringProvider>
</AuthProvider>
```

---

## Step 3: Update MatchesPage to Use Context (20 min)

**File:** `src/pages/admin/MatchesPage.tsx`

### Changes needed:

1. **Import the hook:**
```typescript
import { useLeagueSeason } from "../../contexts/LeagueSeasonContext";
```

2. **Replace local state with context:**
```typescript
// OLD - Remove these lines
const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);
const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

// NEW - Use context instead
const {
  currentLeagueId: selectedLeagueId,
  currentSeasonId: selectedSeasonId,
  setLeagueAndSeason,
} = useLeagueSeason();
```

3. **Update the selection handler:**
```typescript
// OLD
const handleLeagueSeasonSelect = (leagueId: number, seasonId: number) => {
  setSelectedLeagueId(leagueId);
  setSelectedSeasonId(seasonId);
};

// NEW
const handleLeagueSeasonSelect = (leagueId: number, seasonId: number) => {
  setLeagueAndSeason(leagueId, seasonId);
};
```

4. **Update auto-selection logic** (around lines 51-62):
```typescript
// Only auto-select if no saved selection exists
useEffect(() => {
  if (myLeagues.length > 0 && !selectedLeagueId) {
    // Just set the league, season will be set in next effect
    const firstLeagueId = myLeagues[0].id;
    const firstSeasonForLeague = allSeasons.find(
      s => s.league === firstLeagueId && s.is_active
    );

    if (firstSeasonForLeague) {
      setLeagueAndSeason(firstLeagueId, firstSeasonForLeague.id);
    }
  }
}, [myLeagues, allSeasons, selectedLeagueId, setLeagueAndSeason]);

// Remove the second useEffect that auto-selected seasons -
// we now do it all in one effect above
```

---

## Step 4: Test the Implementation (10 min)

1. **Clear localStorage** to test fresh state:
   - Open DevTools → Application → Local Storage → Clear

2. **Test scenarios:**
   - [ ] Select a league/season on Matches page
   - [ ] Refresh the page → should remember selection
   - [ ] Navigate away and back → should remember selection
   - [ ] Change selection → should persist new choice
   - [ ] Check DevTools Local Storage for the keys

3. **Verify localStorage keys:**
   - `admin_currentLeagueId`: should store the league ID
   - `admin_currentSeasonId`: should store the season ID

---

## Step 5: Future Enhancements (Optional)

### A. Add to other admin pages that need league/season context:

**Example - Dashboard page** could show stats for current league:
```typescript
import { useLeagueSeason } from "../../contexts/LeagueSeasonContext";

const DashboardPage = () => {
  const { currentLeagueId, currentSeasonId } = useLeagueSeason();

  // Use these IDs to filter/query data
  const { data: stats } = useSeasonStats(currentSeasonId);
  // ...
};
```

### B. Add validation helper:

Add to context to validate if saved IDs are still valid:
```typescript
// In LeagueSeasonProvider, add this function
const validateSelection = (leagues: League[], seasons: Season[]) => {
  if (currentLeagueId && !leagues.find(l => l.id === currentLeagueId)) {
    clearSelection(); // Saved league no longer accessible
  }
  if (currentSeasonId && !seasons.find(s => s.id === currentSeasonId)) {
    setCurrentSeasonId(null); // Saved season no longer valid
  }
};

// Add to the value object
return { ...value, validateSelection };
```

Then call from MatchesPage after data loads:
```typescript
useEffect(() => {
  if (myLeagues.length > 0 && allSeasons.length > 0) {
    validateSelection(myLeagues, allSeasons);
  }
}, [myLeagues, allSeasons, validateSelection]);
```

### C. Add selector component to AdminLayout header:

Put the league/season selector in the top nav so it's accessible from any admin page.

---

## Checklist

- [ ] Create `LeagueSeasonContext.tsx` in `src/contexts/`
- [ ] Add `LeagueSeasonProvider` to `App.tsx` wrapping admin routes
- [ ] Update `MatchesPage.tsx` to use context instead of local state
- [ ] Test persistence across page refreshes
- [ ] Test navigation between admin pages
- [ ] (Optional) Add validation logic
- [ ] (Optional) Add to other admin pages as needed
- [ ] (Optional) Consider adding selector to AdminLayout header

---

## Time Estimate
- **Core implementation**: 50 minutes
- **With optional enhancements**: 1.5-2 hours

## Files to Create/Modify
1. **Create:** `src/contexts/LeagueSeasonContext.tsx`
2. **Modify:** `src/App.tsx` (add provider)
3. **Modify:** `src/pages/admin/MatchesPage.tsx` (use context)
4. **Future:** Other admin pages as needed

---

## Why This Approach?

### Benefits:
- **Single source of truth** for current league/season across all admin pages
- **Automatic persistence** via localStorage
- **No duplicate state** - all pages share the same selection
- **Better UX** - user's context is maintained as they navigate
- **Doesn't slow down** - React Query still handles data caching
- **DRY code** - selection logic in one place

### Context vs Custom Hook:
- **Context** provides the shared state container
- **Custom hook** (`useLeagueSeason`) is the convenient API to access it
- You need both - the hook alone can't create shared state

This gives you a clean, centralized way to manage league/season selection that will make your admin area feel cohesive! 🎯
