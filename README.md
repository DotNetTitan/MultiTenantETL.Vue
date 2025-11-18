# Multi-tenant ETL Platform

A modern, responsive web application for managing ETL (Extract, Transform, Load) pipelines across multiple tenants. Built with Vue 3 and Vite.

## Features

- 📊 **Real-time Dashboard**: Monitor pipeline status, connectors, and recent executions with interactive cards
- 🔄 **ETL Pipeline Management**: Create, configure, and monitor data pipelines with visual field mapping
- 🔌 **Connector Integration**: Support for multiple connector types (Databases, CSV, Excel, JSON, REST APIs)
- 🔍 **Transformation Management**: Built-in transformation templates (Filter, Map, Trim, Case Convert, Substring, Replace) and custom JavaScript/C# scripting
- 👥 **Multi-tenant Architecture**: Secure data isolation between different organizations with tenant switching
- 👤 **User Management**: Role-based access control with admin and user roles
- 🎨 **Modern UI**: Responsive design with dark/light theme support and Material Design components
- 📱 **Mobile-Friendly**: Works seamlessly across desktop and mobile devices
- 🔍 **Schema Management**: Auto-detection and manual schema definition with versioning
- 📈 **Execution Monitoring**: Detailed execution logs, timeline view, and progress tracking
- 🔐 **API Key Management**: Generate and manage API keys for programmatic access
- 🤖 **AI Assistant**: Context-aware chatbot powered by Google Gemini AI to help users navigate and use the platform
- 🌍 **Multi-language Support**: Full internationalization (i18n) with English, Spanish, French, German, Italian, and Portuguese translations
- 🎯 **Metadata Service**: Centralized configuration management for dropdowns and options with translation support

## Tech Stack

- **Frontend Framework**: Vue 3 with Composition API (script setup syntax)
- **UI Framework**: Vuetify 3 (Material Design)
- **State Management**: Pinia
- **Router**: Vue Router with route guards
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Styling**: SASS
- **Code Highlighting**: Prism.js
- **File Processing**: PapaParse (CSV), XLSX (Excel)

## Prerequisites

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MultiTenantETL.Vue
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Configuration

### API Backend

The frontend expects a REST API backend. Configure the API URL in `.env.production`:

```
VITE_API_URL=https://your-api-url.com
```

For development, the default API URL is `http://localhost:5000/api` (configured in `src/config/api.js`).

See `api-specification.md` for the complete API contract.

## Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production (outputs to dist/)
- `npm run preview` - Preview production build locally
- `npm run lint` - Lint and fix files with ESLint

## Project Structure

```
src/
├── App.vue                 # Root component with layouts and global notifications
├── main.js                 # Application entry point, Vuetify and Pinia setup
├── components/             # Reusable UI components
│   ├── dashboard/          # Dashboard-specific components
│   ├── connector/          # Connector components (wizard, form, schema editor)
│   ├── dialogs/            # Modal dialogs (confirmation, etc.)
│   ├── executions/         # Pipeline execution components
│   ├── form/               # Form input components
│   ├── layouts/            # Layout components (Authenticated, Guest)
│   ├── notifications/      # Notification components
│   ├── pipeline/           # Pipeline-specific components (wizard, field mapping)
│   ├── settings/           # Settings page components
│   ├── table/              # Table components (filters, etc.)
│   ├── tenants/            # Tenant management components
│   ├── transformation/     # Transformation components
│   ├── users/              # User management components
│   ├── AiChatbot.vue       # AI assistant chatbot
│   ├── LanguageSwitcher.vue # Language selection component
│   └── TenantSelector.vue  # Tenant switching component
├── composables/            # Reusable composition functions
│   ├── useDashboard.js
│   ├── useConnector.js
│   ├── useFormValidation.js
│   ├── useGlobalState.js
│   ├── useLocale.js
│   ├── useMetadata.js          # Raw metadata access
│   ├── usePipeline.js
│   ├── usePipelineForm.js
│   ├── useTransformation.js
│   └── useTranslatedMetadata.js # Auto-translating metadata
├── config/                 # Configuration files
│   └── api.js              # API base URL configuration
├── locales/                # Internationalization (i18n)
│   ├── en.json             # English translations
│   ├── es.json             # Spanish translations
│   ├── fr.json             # French translations
│   ├── index.js            # i18n configuration
│   └── README.md           # Translation guide
├── router/                 # Vue Router configuration
│   └── index.js            # Route definitions and navigation guards
├── services/               # API service layer
│   ├── api.js              # Axios instance and interceptors
│   ├── authService.js      # Authentication API calls
│   ├── dashboardService.js # Dashboard data API calls
│   ├── connectorService.js # Connector CRUD operations
│   ├── geminiService.js    # Google Gemini AI integration
│   ├── metadataService.js  # Centralized metadata/config service
│   ├── pipelineService.js  # Pipeline CRUD operations
│   ├── schemaService.js    # Schema management
│   ├── tenantService.js    # Tenant management API calls
│   ├── transformationService.js # Transformation operations
│   └── userService.js      # User management API calls
├── stores/                 # Pinia state stores
│   ├── auth.js             # Authentication state
│   └── tenant.js           # Tenant context state
├── styles/                 # Global styles
│   └── global.scss         # Global SCSS styles
└── views/                  # Page-level components (route targets)
    ├── DashboardView.vue
    ├── ConnectorFormView.vue
    ├── ConnectorsView.vue
    ├── ExecutionsView.vue
    ├── LoginView.vue
    ├── PipelineDetailsView.vue
    ├── PipelineFormView.vue
    ├── PipelinesView.vue
    ├── SettingsView.vue
    ├── TenantsView.vue
    ├── TransformationsView.vue
    └── UsersView.vue
```

## Architecture

### Component Organization
- **Views**: Page-level components mapped to routes
- **Components**: Organized by feature domain (dashboard, pipeline, connector, etc.)
- **Layouts**: AuthenticatedLayout (with sidebar) and GuestLayout (login page)

### State Management
- **Pinia stores** for global state (authentication, tenant context)
- **Composables** for reusable business logic and API interactions
- **Provide/inject** for global notification system
- **Metadata Service** for centralized configuration and dropdown options

### Service Layer
- All API calls go through service modules in `src/services/`
- Services use a centralized Axios instance with interceptors
- Consistent error handling and response formatting

### Routing
- Route guards enforce authentication and admin role requirements
- Lazy-loaded route components for better performance
- Meta fields: `requiresAuth`, `requiresAdmin`, `guest`

## Features in Detail

### Pipeline Management
- Create and configure data pipelines with visual field mapping
- Schedule automated pipeline runs
- Monitor pipeline execution status with real-time progress
- View detailed execution logs and timeline
- Configure pipeline steps (Extract, Transform, Load)
- Field mapping editor with validation
- Schema auto-detection and manual schema management
- Pipeline cloning and duplication

### Connectors
- Support for multiple connector types:
  - Databases (SQL Server, PostgreSQL, MySQL, etc.)
  - File Systems (CSV, Excel, JSON)
  - APIs (REST)
- Connection testing and validation
- Secure credential management
- Schema management (auto-detection and manual definition)
- Schema versioning and change tracking
- File preview and data validation
- Bidirectional support (sources and destinations)

### Transformations
- Built-in transformation templates (Filter, Map, Trim, Case Convert, Substring, Replace)
- Custom JavaScript/C# transformation scripts
- Data mapping and value transformations
- Field filtering with multiple operators
- Text manipulation (trim, case conversion, substring extraction, find & replace)
- Syntax highlighting for custom scripts

### Multi-tenant Support
- Secure data isolation between tenants
- Tenant-specific configurations
- Easy tenant management for administrators
- Tenant switching with context preservation
- Tenant identifier validation and uniqueness checking

### User Management
- Role-based access control (Admin and User roles)
- User activation/deactivation
- Profile customization (name, email, password)
- API key generation and management
- User filtering and search

### Theme Support
- Light and dark mode with smooth transitions
- Customizable color schemes (configurable in src/main.js)
- CSS custom properties for consistent styling
- Responsive design with Vuetify breakpoints
- Mobile-friendly interface with touch-optimized controls

### Internationalization (i18n)
- Full multi-language support with Vue I18n
- Currently supports: English, Spanish, French, German, Italian, Portuguese
- Language persistence in localStorage
- Automatic Vuetify component translation
- AI chatbot responds in user's selected language
- Easy to add new languages by creating translation files

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
