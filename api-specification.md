# Multi-Tenant ETL API Specification

This document outlines the REST API endpoints required for the Multi-Tenant ETL Platform.

## Base URL

```
http://localhost:5000/api
```

## Authentication

### Endpoints

#### POST /auth/login

Authenticates a user and returns a JWT token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "isAdmin": "boolean"
  },
  "token": "string"
}
```

#### POST /auth/logout

Logs out the current user.

**Request:** No request body required

**Response:**
```json
{
  "success": true
}
```

## Tenants

### Endpoints

#### GET /tenants

Gets all tenants with optional filtering.

**Query Parameters:**
- `search`: string - Search term for filtering tenants
- `status`: string - Filter by status ("active", "inactive", "all")
- `sort`: string - Sort field and direction (e.g., "name_asc", "createdAt_desc")

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "identifier": "string",
    "description": "string",
    "contactName": "string",
    "contactEmail": "string",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
]
```

#### GET /tenants/{id}

Gets a tenant by ID.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "identifier": "string",
  "description": "string",
  "contactName": "string",
  "contactEmail": "string",
  "isActive": "boolean",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### POST /tenants

Creates a new tenant.

**Request:**
```json
{
  "name": "string",
  "identifier": "string",
  "description": "string",
  "contactName": "string",
  "contactEmail": "string",
  "isActive": "boolean"
}
```

**Response:** The created tenant object

#### PUT /tenants/{id}

Updates an existing tenant.

**Request:**
```json
{
  "name": "string",
  "identifier": "string",
  "description": "string",
  "contactName": "string",
  "contactEmail": "string",
  "isActive": "boolean"
}
```

**Response:** The updated tenant object

#### DELETE /tenants/{id}

Deletes a tenant.

**Response:**
```json
{
  "success": true
}
```

#### PUT /tenants/{id}/toggle-status

Toggles the active status of a tenant.

**Response:** The updated tenant object

## Users

### Endpoints

#### GET /users

Gets all users with optional filtering.

**Query Parameters:**
- `search`: string - Search term for filtering users
- `status`: string - Filter by status ("Active", "Inactive", "All")
- `sort`: string - Sort field and direction (e.g., "name_asc", "email_desc")

**Response:**
```json
[
  {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "isActive": "boolean",
    "createdAt": "string (ISO date)"
  }
]
```

#### GET /users/{id}

Gets a user by ID.

**Response:**
```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "isActive": "boolean",
  "createdAt": "string (ISO date)"
}
```

#### POST /users

Creates a new user.

**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "role": "string",
  "isActive": "boolean",
  "password": "string"
}
```

**Response:** The created user object (without password)

#### PUT /users/{id}

Updates an existing user.

**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "role": "string",
  "isActive": "boolean"
}
```

**Response:** The updated user object

#### DELETE /users/{id}

Deletes a user.

**Response:**
```json
{
  "success": true
}
```

#### PUT /users/{id}/toggle-status

Toggles the active status of a user.

**Response:** The updated user object

## Data Sources

### Endpoints

#### GET /data-sources

Gets all data sources with optional filtering.

**Query Parameters:**
- `search`: string - Search term for filtering data sources
- `type`: string - Filter by type ("Database", "File", "API", "All")
- `sort`: string - Sort field and direction (e.g., "name_asc", "created_desc")

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "type": "string",
    "provider": "string",
    "direction": "string (source|destination|both)",
    "config": {
      "server": "string (Database)",
      "port": "string (Database)",
      "database": "string (Database)",
      "username": "string",
      "password": "string",
      "useCustomConnectionString": "boolean (Database)",
      "connectionString": "string (Database)",
      "url": "string (API)",
      "authType": "string (API)",
      "token": "string (API)",
      "headers": "string (API)",
      "endpoints": [
        {
          "id": "string",
          "method": "string",
          "path": "string",
          "responseDataPath": "string",
          "requestDataPath": "string"
        }
      ],
      "format": "string (File: CSV|JSON|XML|Excel)",
      "path": "string (File)",
      "delimiter": "string (File)",
      "hasHeader": "boolean (File)",
      "writeConfig": {
        "tableName": "string (Database)",
        "operation": "string (Database: INSERT|UPDATE|UPSERT|BULK_INSERT)",
        "primaryKeys": ["string"] (Database),
        "batchSize": "number",
        "requestFormat": "string (API: JSON|XML|Form Data)",
        "wrapInArray": "boolean (API)",
        "rootKey": "string (API/File)",
        "includeHeaders": "boolean (File CSV)",
        "columnOrder": ["string"] (File CSV),
        "sheetName": "string (File Excel)",
        "startCell": "string (File Excel)",
        "structure": "string (File JSON: array|object|nested)",
        "writeMode": "string (File: overwrite|append)"
      }
    },
    "schema": {
      "fields": [
        {
          "name": "string",
          "type": "string",
          "required": "boolean",
          "nullable": "boolean",
          "description": "string",
          "isPrimaryKey": "boolean"
        }
      ],
      "version": "number",
      "isManual": "boolean",
      "lastModified": "string (ISO date)"
    },
    "isSource": "boolean (deprecated, use direction)",
    "isDestination": "boolean (deprecated, use direction)",
    "requiresCredentials": "boolean",
    "createdAt": "string (ISO date)"
  }
]
```

**Note:** The `config` object structure varies by type. The `writeConfig` property is only required when `direction` is "destination" or "both".

#### GET /data-sources/{id}

Gets a data source by ID.

**Response:** Single data source object

#### POST /data-sources

Creates a new data source.

**Request:** Data source object without ID and createdAt

**Response:** The created data source object

#### PUT /data-sources/{id}

Updates an existing data source.

**Request:** Data source object fields to update

**Response:** The updated data source object

#### DELETE /data-sources/{id}

Deletes a data source.

**Response:**
```json
{
  "success": true
}
```

#### POST /data-sources/test-connection

Tests connection to a data source.

**Request:** Data source object

**Response:**
```json
{
  "success": "boolean",
  "message": "string",
  "schema": "object (optional)" 
}
```

#### GET /data-sources/{id}/schema

Gets the schema for a data source.

**Response:**
```json
{
  "tables": [
    {
      "name": "string",
      "columns": [
        {
          "name": "string",
          "type": "string",
          "nullable": "boolean"
        }
      ]
    }
  ],
  "views": [
    "string"
  ],
  "procedures": [
    "string"
  ]
}
```

## Transformations

### Endpoints

#### GET /transformations

Gets all transformations with optional filtering.

**Query Parameters:**
- `search`: string - Search term for filtering transformations
- `type`: string - Filter by type ("Filter", "Map", "Aggregation", "Script", "All")
- `sort`: string - Sort field and direction (e.g., "name_asc", "created_desc")

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "type": "string",
    "description": "string",
    "createdAt": "string (ISO date)",
    "config": "object (varies based on transformation type)"
  }
]
```

#### GET /transformations/{id}

Gets a transformation by ID.

**Response:** Single transformation object

#### POST /transformations

Creates a new transformation.

**Request:**
```json
{
  "name": "string",
  "type": "string",
  "description": "string",
  "config": "object (varies based on transformation type)"
}
```

**Response:** The created transformation object

#### PUT /transformations/{id}

Updates an existing transformation.

**Request:** Transformation object fields to update

**Response:** The updated transformation object

#### DELETE /transformations/{id}

Deletes a transformation.

**Response:**
```json
{
  "success": true
}
```

#### POST /transformations/validate

Validates a transformation configuration against an input schema.

**Request:**
```json
{
  "transformation": "transformation object",
  "inputSchema": "schema object"
}
```

**Response:**
```json
{
  "isValid": "boolean",
  "errors": ["string"],
  "outputSchema": "schema object"
}
```

#### POST /transformations/clone/{id}

Clones an existing transformation.

**Response:** The cloned transformation object with new ID

## Pipelines

### Endpoints

#### GET /pipelines

Gets all pipelines with optional filtering.

**Query Parameters:**
- `search`: string - Search term for filtering pipelines
- `status`: string - Filter by status ("Idle", "Running", "Failed", "All")
- `sort`: string - Sort field and direction (e.g., "name_asc", "lastRun_desc")

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "sourceName": "string",
    "destinationName": "string",
    "status": "string",
    "sourceId": "string",
    "destinationId": "string",
    "transformationIds": ["string"],
    "transformations": ["transformation object"],
    "isScheduled": "boolean",
    "schedule": {
      "frequency": "string",
      "time": "string",
      "cronExpression": "string",
      "timezone": "string"
    },
    "createdAt": "string (ISO date)",
    "lastRunAt": "string (ISO date)"
  }
]
```

#### GET /pipelines/{id}

Gets a pipeline by ID.

**Response:** Single pipeline object

#### POST /pipelines

Creates a new pipeline.

**Request:** Pipeline object without ID and dates

**Response:** The created pipeline object

#### PUT /pipelines/{id}

Updates an existing pipeline.

**Request:** Pipeline object fields to update

**Response:** The updated pipeline object

#### DELETE /pipelines/{id}

Deletes a pipeline.

**Response:**
```json
{
  "success": true
}
```

#### POST /pipelines/{id}/execute

Executes a pipeline.

**Response:**
```json
{
  "executionId": "string",
  "status": "string",
  "startTime": "string (ISO date)"
}
```

#### POST /pipelines/validate

Validates a pipeline configuration.

**Request:** Pipeline object

**Response:**
```json
{
  "isValid": "boolean",
  "errors": ["string"]
}
```

## Pipeline Executions

### Endpoints

#### GET /executions

Gets all pipeline executions with optional filtering.

**Query Parameters:**
- `pipelineId`: string - Filter by pipeline ID
- `status`: string - Filter by execution status
- `startDate`: string - Filter by minimum start date
- `endDate`: string - Filter by maximum start date

**Response:**
```json
[
  {
    "id": "string",
    "pipelineId": "string",
    "pipelineName": "string",
    "status": "string",
    "startTime": "string (ISO date)",
    "endTime": "string (ISO date)",
    "duration": "number",
    "recordsProcessed": "number",
    "errors": ["string"],
    "progressPercent": "number"
  }
]
```

#### GET /executions/{id}

Gets an execution by ID.

**Response:**
```json
{
  "id": "string",
  "pipelineId": "string",
  "pipelineName": "string",
  "status": "string",
  "startTime": "string (ISO date)",
  "endTime": "string (ISO date)",
  "duration": "number",
  "recordsProcessed": "number",
  "errors": ["string"],
  "progressPercent": "number",
  "logs": "string"
}
```

## Dashboard

### Endpoints

#### GET /dashboard

Gets dashboard statistics and data.

**Response:**
```json
{
  "stats": {
    "totalPipelines": "number",
    "activePipelines": "number",
    "dataSources": "number",
    "recentExecutions": "number"
  },
  "statusDistribution": [
    {
      "name": "string",
      "count": "number"
    }
  ],
  "recentExecutions": [
    {
      "id": "string",
      "pipelineName": "string",
      "startTime": "string (ISO date)",
      "duration": "number",
      "status": "string",
      "rowsProcessed": "number"
    }
  ]
}
```

## Settings

### Endpoints

#### GET /settings

Gets user settings.

**Response:**
```json
{
  "profile": {
    "name": "string",
    "email": "string",
    "avatar": "string",
    "bio": "string"
  },
  "preferences": {
    "darkMode": "boolean",
    "highContrast": "boolean",
    "defaultDashboardView": "string",
    "dashboardRefreshInterval": "number",
    "defaultItemsPerPage": "number",
    "dateFormat": "string"
  },
  "notificationSettings": {
    "emailEnabled": "boolean",
    "emailAddress": "string",
    "webhookEnabled": "boolean",
    "webhookUrl": "string",
    "events": {
      "pipelineSuccess": "boolean",
      "pipelineFailure": "boolean",
      "dataSourceDown": "boolean",
      "quotaExceeded": "boolean",
      "systemUpdates": "boolean"
    }
  },
  "apiKeys": [
    {
      "id": "string",
      "name": "string",
      "key": "string",
      "createdAt": "string (ISO date)",
      "lastUsed": "string (ISO date)"
    }
  ]
}
```

#### PUT /settings/profile

Updates user profile settings.

**Request:** Profile object  
**Response:** Updated profile object

#### PUT /settings/preferences

Updates user preferences.

**Request:** Preferences object  
**Response:** Updated preferences object

#### PUT /settings/notifications

Updates notification settings.

**Request:** NotificationSettings object  
**Response:** Updated notification settings object

#### POST /settings/api-keys

Creates a new API key.

**Request:**
```json
{
  "name": "string"
}
```

**Response:** Created API key object

#### DELETE /settings/api-keys/{id}

Deletes an API key.

**Response:**
```json
{
  "success": true
}
```

## Write Configuration for Destinations

When a data source is configured as a destination (or both source and destination), it requires write configuration to specify how data should be physically written. This configuration is stored in the `config.writeConfig` property.

### Database Write Configuration

Required when `type` is "Database" and `direction` is "destination" or "both":

```json
{
  "tableName": "Orders",
  "operation": "UPSERT",
  "primaryKeys": ["OrderId"],
  "batchSize": 1000
}
```

**Fields:**
- `tableName` (required): Target table name
- `operation` (required): INSERT, UPDATE, UPSERT, or BULK_INSERT
- `primaryKeys` (required for UPDATE/UPSERT): Array of field names used to match existing records
- `batchSize` (optional): Number of records per batch (default: 1000)

### API Write Configuration

Required when `type` is "API" and `direction` is "destination" or "both":

```json
{
  "requestFormat": "JSON",
  "wrapInArray": false,
  "rootKey": "product",
  "batchSize": 100
}
```

**Fields:**
- `requestFormat` (required): JSON, XML, or Form Data
- `wrapInArray` (optional): Send data as array even for single records
- `rootKey` (optional): Wrap payload under this key
- `batchSize` (optional): Records per API request (default: 100)

### File Write Configuration

Required when `type` is "File" and `direction` is "destination" or "both":

**CSV:**
```json
{
  "writeMode": "overwrite",
  "includeHeaders": true,
  "columnOrder": ["customer_id", "first_name", "last_name", "email"]
}
```

**Excel:**
```json
{
  "writeMode": "overwrite",
  "sheetName": "Orders",
  "startCell": "A1"
}
```

**JSON:**
```json
{
  "writeMode": "overwrite",
  "structure": "array",
  "rootKey": "data"
}
```

**Common Fields:**
- `writeMode` (required): "overwrite" or "append"

**CSV-Specific:**
- `includeHeaders`: Write column names as first row
- `columnOrder`: Array of field names defining column order

**Excel-Specific:**
- `sheetName` (required): Name of the Excel sheet
- `startCell`: Cell where data starts (e.g., "A1")

**JSON-Specific:**
- `structure` (required): "array", "object", or "nested"
- `rootKey`: Top-level key for nested structure

See `docs/write-configuration.md` for detailed documentation.

## Implementation Notes

This API specification is designed to replace all the mock data in your Vue application with real backend API calls. The endpoints follow the same structure you're currently using in your mock implementations:

1. **Authentication**: Handles login/logout and token management
2. **Tenants**: Multi-tenant management with filtering, sorting, and status toggling
3. **Users**: User management with roles and status controls
4. **Data Sources**: Different types (Database, File, API) with testing connections, schema retrieval, and write configuration
5. **Transformations**: Various transformation types with configuration validation
6. **Pipelines**: Complete pipeline definitions with transformation chains and field mappings
7. **Executions**: Monitor and retrieve pipeline execution details
8. **Dashboard**: Aggregate statistics for the dashboard view
9. **Settings**: User preferences and configuration

To implement the backend, use:
- ASP.NET Core Web API
- PostgreSQL for database

When implementing, make sure to:
1. Secure all endpoints with proper authentication and tenant isolation
2. Include input validation on all requests, especially for write configuration
3. Implement proper error handling with descriptive messages
4. Document the API using OpenAPI/Swagger
5. Include pagination for collection endpoints that may return large datasets
6. Validate write configuration based on data source type and direction
7. Use write configuration during the Load phase of ETL pipeline execution