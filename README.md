# Multi-tenant ETL Platform

A modern, responsive web application for managing ETL (Extract, Transform, Load) pipelines across multiple tenants. Built with Vue 3, Vuetify, and Vite.

## Features

- 📊 **Real-time Dashboard**: Monitor pipeline status, data sources, and recent executions
- 🔄 **ETL Pipeline Management**: Create, configure, and monitor data pipelines
- 🔌 **Data Source Integration**: Support for multiple data source types (Databases, Files, APIs)
- 🔍 **Transformation Management**: Built-in transformation templates and custom scripting support
- 👥 **Multi-tenant Architecture**: Secure data isolation between different organizations
- 👤 **User Management**: Role-based access control with admin and user roles
- 🎨 **Modern UI**: Responsive design with dark/light theme support
- 📱 **Mobile-Friendly**: Works seamlessly across desktop and mobile devices

## Tech Stack

- **Frontend Framework**: Vue 3 with Composition API
- **UI Framework**: Vuetify 3
- **State Management**: Pinia
- **Router**: Vue Router
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Styling**: SASS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

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

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint and fix files

## Project Structure

```
src/
├── App.vue                # Root component
├── main.js               # Application entry point
├── components/           # Reusable components
│   ├── dialogs/         # Dialog components
│   ├── form/            # Form components
│   ├── notifications/   # Notification components
│   └── table/           # Table components
├── composables/         # Composable functions
├── router/              # Route configurations
├── stores/              # Pinia stores
│   ├── auth.js         # Authentication store
│   └── tenant.js       # Tenant management store
└── views/              # Page components
    ├── DashboardView.vue
    ├── PipelinesView.vue
    ├── DataSourcesView.vue
    └── ...
```

## Features in Detail

### Pipeline Management
- Create and configure data pipelines
- Schedule automated pipeline runs
- Monitor pipeline execution status
- View detailed execution logs
- Configure pipeline steps (Extract, Transform, Load)

### Data Sources
- Support for multiple data source types:
  - Databases (SQL Server, PostgreSQL, etc.)
  - File Systems (Local, SFTP)
  - APIs (REST, GraphQL)
- Connection testing and validation
- Secure credential management

### Transformations
- Built-in transformation templates
- Custom JavaScript/C# transformation scripts
- Data mapping and filtering
- Aggregation functions
- Field validation and formatting

### Multi-tenant Support
- Secure data isolation between tenants
- Tenant-specific configurations
- Easy tenant management for administrators

### User Management
- Role-based access control
- User activity monitoring
- Profile customization
- API key management

### Theme Support
- Light and dark mode
- Customizable color schemes
- Responsive design
- Mobile-friendly interface

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.