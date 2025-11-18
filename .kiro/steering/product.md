# Product Overview

Multi-tenant ETL Platform - A modern web application for managing Extract, Transform, Load (ETL) pipelines across multiple tenants with secure data isolation.

## Core Features

- Real-time dashboard for monitoring pipeline status and executions
- ETL pipeline management with visual field mapping editor
- Multi-source connector integration (Databases, CSV, Excel, JSON, REST APIs)
- Transformation engine with 6 built-in templates (Filter, Map, Trim, Case Convert, Substring, Replace) and custom JavaScript/C# scripting
- Multi-tenant architecture with secure tenant isolation and tenant switching
- Role-based access control (Admin and User roles)
- Pipeline scheduling and automated execution
- Execution monitoring with detailed logs, timeline view, and progress tracking
- Schema management with auto-detection and manual definition
- API key generation and management
- AI-powered chatbot assistant (Google Gemini) for contextual help
- Full internationalization (i18n) support with English, Spanish, French, German, Italian, and Portuguese
- Centralized metadata service for configuration management

## User Roles

- **Admin**: Full access including tenant management, user management, and all pipeline operations
- **User**: Access to pipelines, data sources, transformations, and executions within their tenant

## Key Workflows

1. **Connector Setup**: Configure connections to databases, file systems, or APIs with schema auto-detection or manual definition
2. **Transformation Creation**: Define data transformations using built-in templates (Filter, Map, Trim, Case Convert, Substring, Replace) or custom JavaScript/C# scripts
3. **Pipeline Configuration**: Connect source → transformations → destination with visual field mapping and validation
4. **Execution & Monitoring**: Run pipelines manually or on schedule, monitor progress with real-time logs and timeline view

## Supported Connector Types

- **Databases**: SQL Server, PostgreSQL, MySQL
- **Files**: CSV, Excel (XLSX), JSON
- **APIs**: REST APIs with configurable endpoints

## Transformation Types

1. **Filter**: Filter rows based on field values with operators (equals, contains, greater than, etc.)
2. **Map**: Transform field values using key-value mappings
3. **Trim**: Remove leading/trailing whitespace from text fields
4. **Case Convert**: Convert text to uppercase, lowercase, title case, or camelCase
5. **Substring**: Extract portions of text from fields
6. **Replace**: Find and replace text or patterns (with regex support)
7. **Script**: Custom JavaScript or C# transformation logic
