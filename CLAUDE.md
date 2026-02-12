# Multi-Tenant ETL Platform - Frontend

## Project Overview

This is a Vue 3 Single Page Application (SPA) for managing ETL (Extract, Transform, Load) pipelines across multiple tenants with complete data isolation. Built with enterprise-grade security, scalability, and user experience in mind.

**Repository**: https://github.com/DotNetTitan/MultiTenantETL.Vue
**License**: GNU General Public License v3.0
**Version**: 0.1.0

### Key Features
- Real-time dashboard with pipeline monitoring
- Multi-source connectors (Databases, Files, APIs)
- Visual field mapping editor with transformation chains
- OAuth 2.0 Authorization Code Flow with PKCE
- Multi-tenant architecture with secure isolation
- Role-based access control (SuperAdmin, Admin, User)
- AI-powered chatbot assistant (Google Gemini)
- Full internationalization (6 languages)
- Comprehensive test coverage (464+ tests)

## Technology Stack

### Core Framework
- **Vue 3.4.21** - Composition API with `<script setup>` syntax ONLY
- **Vite 5.1.5** - Build tool and dev server (port 5173)
- **Vuetify 3.5.7** - Material Design UI framework
- **Pinia 2.1.7** - State management (NOT Vuex)
- **Vue Router 4.3.0** - Routing with navigation guards
- **Vue I18n 9.14.5** - Internationalization (en, es, fr, de, it, pt)

### HTTP & Security
- **Axios 1.6.7** - HTTP client with interceptors
- **OAuth 2.0 with PKCE** - Authorization Code Flow (RFC 7636)
- **JWT Tokens** - Access (15 min), Refresh (7 days), ID tokens
- **jwt-decode 4.0.0** - Token parsing and validation

### File Processing & AI
- **PapaParse 5.4.1** - CSV parsing
- **XLSX 0.18.5** - Excel file processing
- **marked 17.0.0** - Markdown parsing
- **Prism.js 1.30.0** - Code syntax highlighting (JS/C#)
- **@google/generative-ai 0.24.1** - Gemini AI chatbot

### Testing & Quality
- **Vitest 4.0.16** - Unit testing (NOT Jest)
- **@vue/test-utils 2.4.6** - Component testing
- **MSW 2.12.4** - API mocking
- **ESLint 8.57.0** - Code linting with Vue plugin
- **Coverage Threshold**: 80% (branches, functions, lines, statements)

## Project Structure

```
src/
├── App.vue                      # Root component (layouts, notifications, error boundary)
├── main.js                      # Entry point (Vuetify, Pinia, i18n setup)
├── components/                  # 45+ reusable Vue components
│   ├── dashboard/               # Dashboard-specific components
│   ├── connector/               # Connector wizard, schema editor
│   ├── pipeline/                # Pipeline wizard, field mapper, transformations
│   ├── dialogs/                 # Modal dialogs
│   ├── layouts/                 # AuthenticatedLayout, GuestLayout
│   └── ...                      # Form, table, notification components
├── composables/                 # 13 composition functions
│   ├── useConnector.js          # Connector business logic
│   ├── usePipeline.js           # Pipeline operations
│   ├── useTranslatedMetadata.js # Auto-translating metadata
│   └── ...                      # Form validation, global state
├── services/                    # 13 API service modules
│   ├── api.js                   # Axios instance + interceptors
│   ├── authService.js           # OAuth 2.0 PKCE flow
│   ├── metadataService.js       # Centralized configuration
│   └── ...                      # CRUD services for entities
├── stores/                      # Pinia stores
│   ├── auth.js                  # Authentication state
│   └── tenant.js                # Tenant context
├── views/                       # 15 page-level components (route targets)
├── router/                      # Route definitions + guards
├── locales/                     # i18n translation files
├── config/                      # API and constants configuration
├── utils/                       # JWT helpers, PKCE utilities
├── mocks/                       # Mock data (development/testing)
├── test/                        # Test setup and utilities
└── styles/                      # Global SCSS styles
```

## Architecture Patterns

### Component Development

**REQUIRED: Vue 3 Composition API with `<script setup>`**

Always use this pattern:

```vue
<template>
  <!-- Template code -->
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '@/composables/useGlobalState'

// Composables
const { t } = useI18n()
const { showNotification } = useGlobalState()

// Props (use defineProps)
const props = defineProps({
  modelValue: String,
  required: Boolean
})

// Emits (use defineEmits)
const emit = defineEmits(['update:modelValue'])

// Reactive state
const loading = ref(false)
const data = ref([])

// Computed properties
const isValid = computed(() => props.modelValue?.length > 0)

// Methods
const fetchData = async () => {
  loading.value = true
  try {
    // API call
  } catch (error) {
    showNotification(error.message, 'error')
  } finally {
    loading.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* Component styles */
</style>
```

**Component Naming**:
- PascalCase for all component files (e.g., `PipelineWizard.vue`)
- Multi-word component names (enforced by ESLint)
- Descriptive names indicating purpose

**Component Organization**:
- **Views**: Page-level components (route targets, in `src/views/`)
- **Layouts**: Shared wrappers (`AuthenticatedLayout.vue`, `GuestLayout.vue`)
- **Components**: Feature-specific, organized by domain in `src/components/`

### State Management Strategy

**1. Pinia Stores** (Global State):
- `auth.js` - Authentication state, user info, tokens
- `tenant.js` - Tenant context, tenant switching

**2. Composables** (Business Logic):
- Reusable composition functions in `src/composables/`
- API interactions encapsulated
- Form state management
- Validation logic

**3. Provide/Inject** (Cross-component):
- Global notification system
- Loading state management
- Error handling

**4. Metadata Service** (Configuration):
- Centralized dropdown options
- Backend-driven configuration
- Automatic translation based on locale

### Service Layer Pattern

**Location**: `src/services/`

All API calls MUST go through service modules:

```javascript
import api from './api'
import { API_ENDPOINTS } from '@/config/api'

export const pipelineService = {
  async getAll(filters = {}) {
    const response = await api.get(API_ENDPOINTS.pipelines.base, { params: filters })
    return response.data
  },

  async getById(id) {
    const response = await api.get(API_ENDPOINTS.pipelines.byId(id))
    return response.data
  },

  async create(pipeline) {
    const response = await api.post(API_ENDPOINTS.pipelines.base, pipeline)
    return response.data
  },

  async update(id, pipeline) {
    const response = await api.put(API_ENDPOINTS.pipelines.byId(id), pipeline)
    return response.data
  },

  async delete(id) {
    await api.delete(API_ENDPOINTS.pipelines.byId(id))
  }
}
```

**Service Conventions**:
- Export object with methods (NOT classes)
- Use shared Axios instance from `src/services/api.js`
- Throw errors (let interceptor handle them)
- Return `response.data` only (unwrap data)
- No UI logic (notifications, routing) in services

### Routing Strategy

**Route Guards** (`src/router/index.js`):
- `requiresAuth: true` - Protected routes (authenticated users only)
- `requiresAdmin: true` - Admin routes (SuperAdmin/Admin roles)
- `requiresSuperAdmin: true` - SuperAdmin-only routes
- `guest: true` - Public routes (login, register)
- `public: true` - Accessible to all

**Lazy Loading**:
- ALL route components are lazy-loaded
- Code splitting at route level
- Faster initial page load

**Example Route**:
```javascript
{
  path: '/pipelines',
  name: 'Pipelines',
  component: () => import('@/views/PipelinesView.vue'),
  meta: { requiresAuth: true }
}
```

### Error Handling

**Global Error Boundary** (`App.vue`):
- Catches Vue component errors (`onErrorCaptured`)
- Catches global JS errors (`window.onerror`)
- Catches unhandled promise rejections
- Router error handling
- Error count threshold (3 errors → error boundary)
- Auto-reset (every 30 seconds)

**Axios Interceptors** (`src/services/api.js`):
- Request: Add auth token, tenant header
- Response: Handle 401 (token refresh), retry 5xx, format errors

**User-friendly Errors**:
- ProblemDetails format from backend
- Toast notifications for errors
- Timeout handling with retry logic

## Coding Conventions

### Vue 3 Best Practices

1. **ALWAYS use Composition API with `<script setup>`**
   - DO NOT use Options API
   - DO NOT use `export default { ... }`

2. **Define props and emits properly**:
   ```javascript
   const props = defineProps({
     modelValue: String,
     required: { type: Boolean, default: false }
   })

   const emit = defineEmits(['update:modelValue', 'submit'])
   ```

3. **Use composables for shared logic**:
   - Prefix with `use` (e.g., `usePipeline`)
   - Return reactive state, computed, and methods
   - One composable per file

4. **Prefer `computed()` over methods for derived state**:
   ```javascript
   // Good
   const fullName = computed(() => `${firstName.value} ${lastName.value}`)

   // Avoid
   const getFullName = () => `${firstName.value} ${lastName.value}`
   ```

5. **Use `watch()` or `watchEffect()` for side effects**:
   ```javascript
   watch(() => props.userId, (newId) => {
     fetchUserData(newId)
   })
   ```

### Internationalization (i18n)

**ALWAYS internationalize user-facing text**:

```vue
<template>
  <!-- Use $t() in templates -->
  <v-btn>{{ $t('common.save') }}</v-btn>
  <v-alert>{{ $t('errors.validation.required') }}</v-alert>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Use t() in script
const message = t('dashboard.statistics.totalPipelines')
showNotification(t('notifications.success.saved'), 'success')
</script>
```

**Translation Keys Structure** (`src/locales/en.json`):
```json
{
  "common": { "save": "Save", "cancel": "Cancel" },
  "dashboard": { "title": "Dashboard" },
  "pipelines": { "list": "Pipelines", "create": "Create Pipeline" },
  "errors": { "validation": { "required": "Field is required" } }
}
```

**Supported Languages**: en, es, fr, de, it, pt

### Styling Approach

1. **Use Vuetify components** for UI (Material Design)
2. **Scoped styles** in components:
   ```vue
   <style scoped>
   .custom-class {
     color: primary;
   }
   </style>
   ```
3. **Global styles** in `src/styles/global.scss`
4. **CSS custom properties** for theming
5. **Theme-aware classes**: `.v-theme--dark`, `.v-theme--light`

### Security Best Practices

**OAuth 2.0 PKCE Implementation**:
- PKCE utilities in `src/utils/pkce.js`
- Code verifier: 32-byte cryptographically random string
- Code challenge: SHA-256 hash (Base64URL encoded)
- State parameter for CSRF protection
- Single-use authorization codes

**JWT Token Management** (`src/utils/jwtHelper.js`):
- Access tokens: 15 minutes (localStorage)
- Refresh tokens: 7 days (localStorage)
- Automatic token refresh via interceptors
- Token validation and expiry checking

**Content Security Policy** (`index.html`):
- Restricts script sources
- Prevents XSS attacks
- Allows necessary CDN resources

**NEVER**:
- Store sensitive data in code or Git
- Skip authentication checks
- Trust user input without validation
- Expose API keys in client-side code

## Backend Integration

### API Configuration

**Backend URL** (`src/config/api.js`):
- Development: `https://localhost:7288` (from `.env.development`)
- Production: Set `VITE_API_BASE_URL` in `.env.production`
- Timeout: 30 seconds
- CORS: Backend must allow `http://localhost:5173`

**API Endpoints** (`src/config/api.js`):
```javascript
export const API_ENDPOINTS = {
  // OAuth 2.0 (no /api prefix)
  oauth: {
    token: '/connect/token',
    revoke: '/connect/revoke',
    authorize: '/connect/authorize'
  },

  // REST API (with /api prefix)
  pipelines: {
    base: '/api/pipelines',
    byId: (id) => `/api/pipelines/${id}`,
    execute: (id) => `/api/pipelines/${id}/execute`
  },

  // ... other endpoints
}
```

### Authentication Flow

1. User clicks login → Redirects to `/login`
2. User submits credentials
3. Frontend generates PKCE code verifier and challenge
4. Browser redirects to backend `/connect/authorize` with challenge
5. Backend validates credentials, issues authorization code
6. Callback page `/auth/callback` exchanges code for tokens using verifier
7. Tokens stored in localStorage, user redirected to dashboard

**Key Files**:
- `src/utils/pkce.js` - PKCE utilities
- `src/services/authService.js` - OAuth implementation
- `src/stores/auth.js` - Token management
- `src/views/AuthCallbackView.vue` - Token exchange handler

### Metadata Service

**Centralized Configuration** (`src/services/metadataService.js`):
- Backend-driven dropdown options
- Automatic translation based on locale
- Cached in localStorage (15-minute TTL)
- Provides: roles, connector types, transformation types, file formats, auth types, etc.

**Usage**:
```javascript
import { useTranslatedMetadata } from '@/composables/useTranslatedMetadata'

const {
  connectorTypes,
  transformationTypes,
  loading,
  error
} = useTranslatedMetadata()

// Automatically translated to user's language
```

## Testing Strategy

### Test Framework: Vitest

**Separate Configurations**:
1. `vitest.config.components.js` - Component tests (18 tests)
2. `vitest.config.composables.js` - Composable tests (331 tests)
3. `vitest.config.services.js` - Service tests (115 tests)
4. `vitest.config.stores.js` - Store tests
5. `vitest.config.js` - Utility tests

**Total Tests**: 464+ tests across 22 test files

### Running Tests

```bash
npm run test              # Watch mode
npm run test:run          # Run once
npm run test:all          # All test suites
npm run test:coverage     # With coverage (80% threshold)
npm run test:composables  # Composable tests only
npm run test:services     # Service tests only
npm run test:components   # Component tests only
npm run test:stores       # Store tests only
```

### Test Structure

**Component Tests**:
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(MyComponent, {
      props: { /* props */ },
      global: {
        plugins: [/* i18n, router */],
        mocks: { /* $t, etc. */ }
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('handles user interaction', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('submit')
  })
})
```

**Service Tests**:
```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { server } from '@/test/setup-services'
import { http, HttpResponse } from 'msw'
import { pipelineService } from '@/services/pipelineService'

describe('pipelineService', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('fetches all pipelines', async () => {
    const pipelines = await pipelineService.getAll()
    expect(Array.isArray(pipelines)).toBe(true)
  })

  it('handles errors', async () => {
    server.use(
      http.get('*/api/pipelines', () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 })
      })
    )

    await expect(pipelineService.getAll()).rejects.toThrow()
  })
})
```

**Mock Data** (`src/mocks/`):
- 18 mock connectors
- 5 mock pipelines
- 3 mock tenants
- 5 mock users
- Consistent IDs across related entities

### Coverage Requirements

**Coverage Threshold**: 80% for all metrics
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Common Workflows

### 1. Adding a New Feature

1. **Create feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Add components/composables/services**:
   - Components: `src/components/[domain]/FeatureName.vue`
   - Composables: `src/composables/useFeature.js`
   - Services: `src/services/featureService.js`

3. **Add translations**:
   - Update all language files in `src/locales/`
   - Use descriptive keys: `features.featureName.action`

4. **Add routes** (if needed):
   - Update `src/router/index.js`
   - Add route guards (`requiresAuth`, `requiresAdmin`)
   - Lazy-load components

5. **Write tests**:
   - Component tests in `src/components/__tests__/`
   - Composable tests in `src/composables/__tests__/`
   - Service tests in `src/services/__tests__/`
   - Aim for >80% coverage

6. **Run quality checks**:
   ```bash
   npm run lint           # Fix linting issues
   npm run test:all       # Run all tests
   npm run test:coverage  # Check coverage
   ```

### 2. Fixing a Bug

1. **Reproduce the bug** in tests first
2. **Write a failing test** that captures the bug
3. **Fix the bug** in the source code
4. **Verify the test passes**
5. **Check for regressions** (`npm run test:all`)

### 3. Adding API Integration

1. **Add endpoint** in `src/config/api.js`:
   ```javascript
   export const API_ENDPOINTS = {
     newFeature: {
       base: '/api/new-feature',
       byId: (id) => `/api/new-feature/${id}`
     }
   }
   ```

2. **Create service** in `src/services/newFeatureService.js`:
   ```javascript
   import api from './api'
   import { API_ENDPOINTS } from '@/config/api'

   export const newFeatureService = {
     async getAll() {
       const response = await api.get(API_ENDPOINTS.newFeature.base)
       return response.data
     }
   }
   ```

3. **Create composable** in `src/composables/useNewFeature.js`:
   ```javascript
   import { ref } from 'vue'
   import { newFeatureService } from '@/services/newFeatureService'

   export function useNewFeature() {
     const items = ref([])
     const loading = ref(false)
     const error = ref(null)

     const loadItems = async () => {
       loading.value = true
       try {
         items.value = await newFeatureService.getAll()
       } catch (err) {
         error.value = err.message
       } finally {
         loading.value = false
       }
     }

     return { items, loading, error, loadItems }
   }
   ```

4. **Add MSW handlers** in `src/test/handlers/`:
   ```javascript
   http.get('*/api/new-feature', () => {
     return HttpResponse.json([/* mock data */])
   })
   ```

5. **Write tests** for service and composable

### 4. Adding a New Language

1. **Copy existing translation file**:
   ```bash
   cp src/locales/en.json src/locales/ja.json
   ```

2. **Translate all keys** in `ja.json`

3. **Update i18n config** in `src/locales/index.js`:
   ```javascript
   import ja from './ja.json'

   const messages = {
     en, es, fr, de, it, pt,
     ja  // Add new language
   }
   ```

4. **Update language list** in `src/components/LanguageSwitcher.vue`:
   ```javascript
   { value: 'ja', title: '日本語', flag: '🇯🇵' }
   ```

5. **Update backend** `src/config/constants.js` to include new language

## Important Constraints

### Transformation Scripts
- **Supported Languages**: JavaScript, C# ONLY
- NO Python, Ruby, or other languages

### Database Connectors
- **Supported Databases**: SQL Server, PostgreSQL, MySQL, Oracle
- NO MongoDB, Cassandra, or NoSQL databases

### File Formats
- **Supported Formats**: CSV, Excel (.xlsx), JSON
- NO XML, Parquet, Avro

### API Connectors
- **HTTP Methods**: GET, POST, PUT ONLY
- NO DELETE, PATCH (backend limitation)

### Transformation Types
- **Exactly 7 Types**: Filter, Map, Trim, Case Convert, Substring, Replace, Script
- NO plugin system or custom transformation types

## File References

When discussing code, always reference files with line numbers:

```
src/services/authService.js:42 - OAuth token exchange
src/components/pipeline/FieldMapper.vue:156 - Field mapping logic
src/composables/usePipeline.js:89 - Pipeline validation
```

## Environment Variables

**Development** (`.env.development`):
```env
VITE_API_BASE_URL=https://localhost:7288
```

**Production** (`.env.production`):
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

**NEVER commit**:
- `.env` (local overrides)
- `.env.production` (contains secrets)

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)

# Production
npm run build            # Build for production (outputs to dist/)
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint and auto-fix

# Testing
npm run test             # Watch mode
npm run test:run         # Run once
npm run test:all         # All test suites
npm run test:coverage    # With coverage report
npm run test:composables # Composable tests only
npm run test:services    # Service tests only
npm run test:components  # Component tests only
npm run test:ui          # Vitest UI mode
```

## CI/CD Pipeline

**GitHub Actions** (`.github/workflows/main.yml`):
1. Runs on every push
2. Executes complete test suite
3. Generates coverage reports
4. Builds the application
5. Deploys to GitHub Pages (main branch only)

## Documentation

**Comprehensive documentation in `docs/` folder**:
- `docs/guides/` - OAuth PKCE, configuration, troubleshooting
- `docs/api/` - Complete API specification
- `docs/backend/` - Backend development guides
- `docs/features/` - Feature-specific documentation
- `docs/connectors/` - Connector integration guides

## AI Assistant (Maeve)

**Google Gemini Integration** (`src/services/geminiService.js`):
- Model: `gemini-2.5-flash` (stable, fast)
- Context-aware (knows current page)
- Multi-language responses
- Retry logic with exponential backoff
- Handles quota limits gracefully

**Features**:
- ETL pipeline guidance
- Connector configuration help
- Transformation syntax assistance
- Troubleshooting support

## Review Checklist

Before submitting code, verify:

- [ ] All user-facing text is internationalized (uses `$t()` or `t()`)
- [ ] Components use Composition API with `<script setup>`
- [ ] Props and emits are properly defined with `defineProps()` and `defineEmits()`
- [ ] API calls go through service layer (NOT direct axios calls)
- [ ] Error handling with try/catch and user notifications
- [ ] Tests written with >80% coverage
- [ ] ESLint passes (`npm run lint`)
- [ ] All tests pass (`npm run test:all`)
- [ ] No console.log statements (will warn in production)
- [ ] No hardcoded strings (use i18n)
- [ ] Route guards applied if authentication required
- [ ] PKCE flow for any OAuth 2.0 changes
- [ ] Documentation updated if API or architecture changes

## Contact & Support

**Issues**: GitHub Issues for bug reports and feature requests
**Security**: See `SECURITY.md` for reporting vulnerabilities
**Documentation**: See `docs/` folder for detailed guides

---

## Quick Reference

**Path Alias**: `@` → `src/`

**Key Directories**:
- `src/components/` - Reusable UI components
- `src/views/` - Page-level components (route targets)
- `src/composables/` - Composition functions
- `src/services/` - API service layer
- `src/stores/` - Pinia stores
- `src/locales/` - Translation files
- `src/test/` - Test utilities

**Key Files**:
- `src/App.vue` - Root component with error boundary
- `src/main.js` - Application entry point
- `src/router/index.js` - Route definitions
- `src/services/api.js` - Axios instance with interceptors
- `src/config/api.js` - API endpoints
- `src/config/constants.js` - Backend-driven constants

**Backend URL**: `https://localhost:7288` (development)
**Frontend URL**: `http://localhost:5173` (development)

**Default Credentials** (development):
- SuperAdmin: superadmin@example.com / Admin@123
- Admin: admin@example.com / Admin@123
- User: user@example.com / User@123
