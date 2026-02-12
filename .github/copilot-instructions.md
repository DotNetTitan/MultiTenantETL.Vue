# GitHub Copilot Repository Instructions

Use these instructions when suggesting or generating code for this repository.

## Project context
- This is a **Vue 3 + Vite** frontend for a multi-tenant ETL platform.
- UI components use **Vuetify 3** and follow the existing app patterns.
- State is managed with **Pinia** stores.
- Routing is implemented with **Vue Router**.
- Tests use **Vitest** and `@vue/test-utils`.

## Code generation guidelines
- Prefer **Vue 3 Composition API** patterns and align with existing files.
- Keep components focused and reusable; extract shared logic to composables/utils when appropriate.
- Use the `@/` import alias for files under `src`.
- Follow existing naming conventions and file organization in `src/components`, `src/composables`, `src/services`, and `src/stores`.
- Avoid introducing new libraries unless explicitly requested.
- Keep changes minimal and scoped to the task.

## Styling and UI
- Use existing Vuetify components and project styling conventions.
- Preserve responsive behavior and accessibility (labels, keyboard navigation, semantic structure).
- Do not break dark/light theme support.

## API and data handling
- Reuse existing service layers (Axios-based) for backend calls.
- Respect authentication flow (OAuth 2.0 + PKCE) and token handling patterns already implemented.
- Avoid hardcoding API URLs, secrets, or environment-specific values.

## Testing and validation
- Add or update Vitest tests when behavior changes.
- Prefer targeted test runs first (services/composables/components/stores), then broader runs when needed.
- Ensure generated code is lint-friendly and consistent with ESLint rules.

## Documentation and maintainability
- Include concise comments only where intent is not obvious.
- Update relevant docs when introducing new behavior, scripts, or conventions.
- When multiple valid approaches exist, prefer the simplest option consistent with the current architecture.
