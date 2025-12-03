# Connector Frontend Implementation

## Overview

This document explains the connector types available in the MultiTenantETL Vue frontend, with a focus on the **Local** file connector option.

## Connector Types

The system supports three main connector types:

1. **Database** - Connect to SQL Server, PostgreSQL, MySQL, Oracle, SQLite
2. **API** - Connect to REST, GraphQL, or SOAP web services
3. **File** - Connect to file-based data sources (various storage providers)

## File Connector Providers

File connectors support multiple storage providers:

| Provider | Description | Use Case |
|----------|-------------|----------|
| **Local** | Server-side file system | Files stored on the backend server |
| **FTP** | FTP server | Legacy file transfer protocol |
| **SFTP** | Secure FTP server | Secure file transfer |
| **S3** | Amazon S3 | AWS cloud storage |
| **AzureBlob** | Azure Blob Storage | Azure cloud storage |

## Local File Connector

### What It Does

The **Local** file connector allows ETL pipelines to read from and write to files stored on the **backend server's file system**. This is NOT for uploading files from a user's browser.

### Use Cases

- **Source**: Read CSV, JSON, Excel, or XML files from a server directory for ETL processing
- **Destination**: Write pipeline output to files on the server's file system

### Configuration

When creating a Local file connector:

```json
{
  "type": "File",
  "provider": "Local",
  "direction": "source|destination|both",
  "config": {
    "format": "CSV|JSON|Excel|XML|Parquet",
    "path": "/data/files/customers.csv",
    "delimiter": ",",        // CSV only
    "hasHeader": true        // CSV only
  }
}
```

### Functionality Status

| Feature | Frontend Status | Backend Required |
|---------|-----------------|------------------|
| UI Configuration | ✅ Functional | - |
| Path Input | ✅ Functional | - |
| Format Selection | ✅ Functional | - |
| Connection Testing | ⚠️ Calls API | Yes, backend must validate path access |
| Schema Detection | ⚠️ Calls API | Yes, backend reads file to detect schema |
| ETL Execution | ⚠️ Calls API | Yes, backend performs file I/O |

### Common Misconceptions

1. **"Local means my computer"** - No, "Local" refers to the backend server's file system, not the user's browser.

2. **"I can upload files through Local connector"** - No, file uploads are handled separately through the schema generator UI which parses files client-side for schema detection only.

3. **"It should work without backend"** - No, the frontend only provides configuration UI. Actual file operations require the ASP.NET Core backend.

### Frontend UI Location

The Local file connector configuration can be found in:
- `src/components/connector/ConnectorWizard.vue` (lines 489-500)

```vue
<!-- Local Storage -->
<template v-if="connector.provider === 'Local'">
  <v-col cols="12">
    <v-text-field
      v-model="connector.config.path"
      :label="t('connectors.filePath')"
      :placeholder="t('connectors.filePathPlaceholder')"
      variant="outlined"
      :rules="[v => !!v || t('validation.required', { field: t('connectors.filePath') })]"
      required
    />
  </v-col>
</template>
```

### Example Configurations

**Source: Read CSV from server**
```json
{
  "name": "Local CSV Files",
  "type": "File",
  "provider": "Local",
  "direction": "source",
  "config": {
    "format": "CSV",
    "path": "/data/imports/customers.csv",
    "delimiter": ",",
    "hasHeader": true
  }
}
```

**Destination: Write JSON to server**
```json
{
  "name": "Local JSON Export",
  "type": "File",
  "provider": "Local",
  "direction": "destination",
  "config": {
    "format": "JSON",
    "path": "/data/exports/",
    "writeConfig": {
      "filenamePattern": "export_{date}.json",
      "structure": "array"
    }
  }
}
```

## File Upload for Schema Detection

To upload a file from your browser to detect its schema:

1. In the Connector Wizard, go to Step 3 (Schema Definition)
2. Use the "Upload Sample File" feature
3. This uses `FileUploadSchemaGenerator.vue` which:
   - Reads the file in the browser using FileReader API
   - Uses PapaParse for CSV files
   - Uses XLSX library for Excel files
   - Parses JSON directly
4. The detected schema is used for connector configuration
5. The actual file is NOT uploaded to the server through this process

## Related Files

- `src/components/connector/ConnectorWizard.vue` - Main connector configuration wizard
- `src/components/connector/FileUploadSchemaGenerator.vue` - Client-side file parsing for schema detection
- `src/services/connectorService.js` - API calls to backend
- `src/mocks/connectors.js` - Mock data examples
- `docs/api/connectors-api.md` - Backend API documentation
