# Project Structure

## Directory Organization

```
src/
├── App.vue                 # Root component with layouts and global notifications
├── main.js                 # Application entry point, Vuetify and Pinia setup
├── components/             # Reusable UI components
│   ├── dashboard/          # Dashboard-specific components
│   ├── datasource/         # Data source components
│   ├── dialogs/            # Modal dialogs
│   ├── executions/         # Pipeline execution components
│   ├── form/               # Form input components
│   ├── layouts/            # Layout components (Authenticated, Guest)
│   ├── notifications/      # Notification components
│   ├── pipeline/           # Pipeline-specific components
│   ├── settings/           # Settings page components
│   ├── table/              # Table components
│   ├── tenants/            # Tenant management components
│   ├── transformation/     # Transformation components
│   └── users/              # User management components
├── composables/            # Reusable composition functions
│   ├── useDashboard.js
│   ├── useDataSource.js
│   ├── useFormValidation.js
│   ├── usePipeline.js
│   ├── usePipelineForm.js
│   └── useTransformation.js
├── config/                 # Configuration files
│   └── api.js              # API base URL configuration
├── router/                 # Vue Router configuration
│   └── index.js            # Route definitions and navigation guards
├── services/               # API service layer
│   ├── api.js              # Axios instance and interceptors
│   ├── authService.js      # Authentication API calls
│   ├── dashboardService.js # Dashboard data API calls
│   ├── pipelineService.js  # Pipeline CRUD operations
│   ├── tenantService.js    # Tenant management API calls
│   ├── transformationService.js
│   └── userService.js      # User management API calls
├── stores/                 # Pinia state stores
│   ├── auth.js             # Authentication state
│   └── tenant.js           # Tenant context state
└── views/                  # Page-level components (route targets)
    ├── DashboardView.vue
    ├── DataSourcesView.vue
    ├── ExecutionsView.vue
    ├── LoginView.vue
    ├── PipelineDetailsView.vue
    ├── PipelinesView.vue
    ├── SettingsView.vue
    ├── TenantsView.vue
    ├── TransformationsView.vue
    └── UsersView.vue
```

## Architectural Patterns

### Component Organization
- **Views**: Page-level components mapped to routes
- **Components**: Organized by feature domain (dashboard, pipeline, etc.)
- **Layouts**: AuthenticatedLayout (with sidebar) and GuestLayout (login page)

### State Management
- **Pinia stores** for global state (auth, tenant context)
- **Composables** for reusable business logic and API interactions
- **Provide/inject** for global notification system

### Service Layer
- All API calls go through service modules in `src/services/`
- Services use the centralized Axios instance from `src/services/api.js`
- API base URL configured in `src/config/api.js`

### Routing
- Route guards enforce authentication and admin role requirements
- Lazy-loaded route components for better performance
- Meta fields: `requiresAuth`, `requiresAdmin`, `guest`

### Styling Approach
- Vuetify components for consistent Material Design
- Global CSS custom properties for theme consistency
- SASS for advanced styling when needed
- Theme-aware classes (`.v-theme--dark`, `.v-theme--light`)
