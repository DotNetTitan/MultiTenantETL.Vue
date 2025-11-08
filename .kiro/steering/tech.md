# Technology Stack

## Frontend Framework

- **Vue 3** with Composition API (script setup syntax)
- **Vite** as build tool and dev server
- **Vuetify 3** for UI components and Material Design
- **Vue Router** for navigation with route guards
- **Pinia** for state management
- **Axios** for HTTP requests

## Development Tools

- **ESLint** for code linting with Vue plugin
- **SASS** for styling

## Common Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:5173

# Production
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint and auto-fix issues
```

## Build Configuration

- Base path: `/MultiTenantETL.Vue/` (configured for GitHub Pages deployment)
- Dev server port: 5173
- Path alias: `@` → `src/`

## Backend API

The frontend expects a REST API backend at `http://localhost:5000/api` (see api-specification.md for full API contract). The backend should be implemented in ASP.NET Core Web API.

## Theme System

- Supports light and dark themes
- Default theme: dark
- Theme colors defined in src/main.js
- CSS custom properties for consistent styling across components
