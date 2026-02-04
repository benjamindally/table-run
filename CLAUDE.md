# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**League Genius** is a league management application built with React, TypeScript, and Vite. Originally designed for 8-ball pool leagues, it's expanding to support multiple league types. It provides functionality for team registration, match score submission, league standings tracking, and an admin dashboard for league management.

**IMPORTANT**: The app is called "League Genius", NOT "Table Run". The folder may still be named "Table Run" but all package names use `@league-genius/*`.

## Monorepo Structure

This is a pnpm monorepo with the following structure:

```
league-genius/
├── package.json               # Workspace root
├── pnpm-workspace.yaml
├── packages/
│   └── web/                   # React web app (@league-genius/web)
│       ├── src/
│       └── ...
│   └── shared/ (planned)      # Shared code (@league-genius/shared)
│   └── mobile/ (planned)      # React Native app (@league-genius/mobile)
```

## Tech Stack

- **Frontend Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 5.4+
- **Styling**: Tailwind CSS 3.4+
- **Routing**: React Router DOM 6.22+
- **Icons**: Lucide React
- **Notifications**: React Toastify
- **Linting**: ESLint 9.9+ with TypeScript ESLint
- **Package Manager**: pnpm (workspaces)

## Development Commands

```bash
# From root - Start development server
pnpm dev

# From root - Build for production
pnpm build

# From root - Run linter
pnpm lint

# Preview production build
pnpm preview

# Run linter
npm run lint
```

## Architecture

### Two-Layout System

The application uses a dual-layout architecture:

1. **MainLayout** (`src/layouts/MainLayout.tsx`)

   - Public-facing layout with Header and Footer
   - Used for homepage, team registration, match score submission, and login pages
   - Routes: `/`, `/register`, `/match-score`, `/login`

2. **AdminLayout** (`src/layouts/AdminLayout.tsx`)
   - Protected admin area with AdminSidebar and AdminHeader
   - Gray background with sidebar navigation
   - Routes: `/admin/dashboard`, `/admin/teams`, `/admin/matches`

### Authentication System

- **AuthContext** (`src/contexts/AuthContext.tsx`): Global authentication state using React Context
- **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`): HOC for protecting admin routes
- Demo credentials: `admin@example.com` / `admin123` (hardcoded for demo)
- User data persisted in localStorage (demo implementation only)
- User roles: `'user'` or `'admin'`

### Routing Structure

The app uses nested routing with React Router v6:

- Public routes render within `MainLayout`
- Admin routes wrapped in `ProtectedRoute` and render within `AdminLayout`
- Admin index route (`/admin`) redirects to `/admin/dashboard`

### Component Organization

```
src/
├── components/
│   ├── auth/           # Authentication components (ProtectedRoute)
│   └── navigation/     # Navigation components (Header, Footer, AdminSidebar, AdminHeader)
├── contexts/           # React Context providers (AuthContext)
├── layouts/            # Layout wrappers (MainLayout, AdminLayout)
└── pages/              # Page components
    ├── admin/          # Admin-only pages (Dashboard, Teams, Matches)
    └── [public pages]  # Public pages (Home, Login, etc.)
```

## Styling Conventions

- **Primary Brand Color**: Orange (`orange-500`, `orange-600`, etc.)
- **Admin UI**: Gray backgrounds (`bg-gray-100`) with white cards
- **Component Styling**: Utility-first Tailwind classes inline in JSX
- **Responsive Design**: Mobile-first with `md:` and `lg:` breakpoints
- **Animations**: Custom fade-in and slide-in animations via CSS classes
- **Shadows**: Subtle shadows (`shadow-sm`, `shadow-md`) for card elevation

## State Management

- **Authentication**: Context API via `AuthContext`
- **Component State**: React `useState` hooks for local state
- **No global state library**: Simple app uses Context API only
- **Data persistence**: localStorage for demo auth (would be replaced with API in production)

## Demo Data

All league data (teams, matches, players, statistics) is currently hardcoded within components for demonstration purposes. In a production implementation, this would be replaced with API calls to a backend service.

## Key Development Patterns

1. **Functional Components**: All components use React functional components with hooks
2. **TypeScript Interfaces**: Define interfaces for props and data structures at component level
3. **Route Protection**: Admin routes must check authentication via `ProtectedRoute` wrapper
4. **Context Usage**: Access auth state via `useAuth()` hook
5. **Icon Usage**: Import individual icons from `lucide-react` for tree-shaking

## Context Management Workflow

Before starting any significant work:

1. **Read `.claude/context.md` first** - This file contains up-to-date documentation of the current codebase state, including recent changes, key implementations, and line number references.

2. **Update `.claude/context.md` after making changes**:
   - Add significant changes to the "Recent Changes" section with today's date
   - Update relevant sections if you modify core functionality
   - Include line numbers and code snippets for new implementations
   - Add any new API endpoints, hooks, or components to their respective sections

3. **When to update**:
   - After implementing new features
   - When modifying existing functionality
   - After fixing bugs that change behavior
   - When adding new files or components

This workflow reduces context-gathering time in future sessions and maintains accurate living documentation.

## Testing

No test framework is currently configured. When adding tests, consider:

- Using Vitest (Vite's test runner) for unit tests
- React Testing Library for component tests
- Placing test files alongside components as `*.test.tsx`
