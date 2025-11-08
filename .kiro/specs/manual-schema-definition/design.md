# Design Document

## Overview

The Manual Schema Definition feature allows users to explicitly define data schemas for their data sources and destinations. This replaces the current auto-detection approach with a user-controlled schema management system, providing better accuracy and control for ETL pipeline field mappings.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Source Management                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Data Source     │         │  Schema          │          │
│  │  Form            │────────▶│  Editor          │          │
│  │                  │         │  Component       │          │
│  └──────────────────┘         └──────────────────┘          │
│                                        │                      │
│                                        ▼                      │
│                               ┌──────────────────┐          │
│                               │  Schema          │          │
│                               │  Storage         │          │
│                               └──────────────────┘          │
│                                        │                      │
└────────────────────────────────────────┼──────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Pipeline Creation                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Field Mapping   │────────▶│  Stored Schema   │          │
│  │  Editor          │         │  Retrieval       │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Schema Definition**: User defines schema during data source creation
2. **Schema Storage**: Schema is saved with data source configuration
3. **Schema Retrieval**: Pipeline wizard fetches stored schema for field mapping
4. **Fallback**: If no schema exists, system falls back to auto-detection

## Components and Interfaces

### 1. SchemaEditor Component

**Purpose**: Provides UI for defining and editing data schemas

**Props**:
- `modelValue`: Array of field definitions
- `readonly`: B
oolean (default: false)

**Events**:
- `update:modelValue`: Emitted when schema changes
- `validate`: Emitted with validation results

**Structure**:
```vue
<SchemaEditor
  v-model="dataSource.schema"
  @validate="handleSchemaValidation"
/>
```

### 2. FieldDefinitionRow Component

**Purpose**: Represents a single field in the schema editor

**Props**:
- `field`: Field definition object
- `index`: Field position
- `canMoveUp`: Boolean
- `canMoveDown`: Boolean

**Events**:
- `update:field`: Emitted when field properties change
- `remove`: Emitted when field is deleted
- `move-up`: Emitted to move field up
- `move-down`: Emitted to move field down

### 3. SchemaImportExport Component

**Purpose**: Handles schema import/export functionality

**Props**:
- `schema`: Current schema definition

**Events**:
- `import`: Emitted with imported schema
- `export`: Triggers schema export

## Data Models

### Field Definition Model

```javascript
{
  id: string,              // Unique identifier
  name: string,            // Field name (e.g., "email")
  type: string,            // Data type (e.g., "varchar", "int")
  required: boolean,       // Whether field is required
  nullable: boolean,       // Whether field can be null
  description: string,     // Optional field description
  order: number           // Display order
}
```

### Data Source Model (Updated)

```javascript
{
  id: string,
  name: string,
  type: string,            // 'Database', 'File', 'API'
  connectionString: string,
  schema: {                // NEW: Manual schema definition
    fields: [FieldDefinition],
    version: number,       // Schema version for tracking changes
    isManual: boolean,     // True if manually defined
    lastModified: string   // ISO timestamp
  },
  // ... other existing properties
}
```

### Supported Data Types

```javascript
const DATA_TYPES = [
  { value: 'varchar', label: 'String', icon: 'mdi-text' },
  { value: 'int', label: 'Integer', icon: 'mdi-numeric' },
  { value: 'bigint', label: 'Big Integer', icon: 'mdi-numeric' },
  { value: 'decimal', label: 'Decimal', icon: 'mdi-decimal' },
  { value: 'boolean', label: 'Boolean', icon: 'mdi-checkbox-marked' },
  { value: 'date', label: 'Date', icon: 'mdi-calendar' },
  { value: 'datetime', label: 'Date Time', icon: 'mdi-calendar-clock' },
  { value: 'timestamp', label: 'Timestamp', icon: 'mdi-clock' },
  { value: 'json', label: 'JSON', icon: 'mdi-code-json' },
  { value: 'text', label: 'Text (Long)', icon: 'mdi-text-long' }
];
```

## Error Handling

### Validation Errors

1. **Duplicate Field Names**: "Field name '{name}' already exists"
2. **Empty Field Name**: "Field name is required"
3. **Invalid Characters**: "Field name contains invalid characters"
4. **No Fields Defined**: "At least one field must be defined"
5. **Import Validation**: "Invalid schema format: {specific error}"

### User Notifications

- **Schema Saved**: Success notification when schema is saved
- **Schema Modified**: Warning when editing schema used in pipelines
- **Auto-Detection Fallback**: Info notification when using auto-detection
- **Import Success**: Success notification after importing schema

## Testing Strategy

### Unit Tests

1. **SchemaEditor Component**
   - Field addition/removal
   - Field property updates
   - Validation logic
   - Reordering functionality

2. **Schema Validation**
   - Duplicate name detection
   - Required field validation
   - Character validation
   - Empty schema detection

3. **Import/Export**
   - JSON serialization
   - JSON deserialization
   - Format validation
   - Error handling

### Integration Tests

1. **Data Source Creation Flow**
   - Create data source with schema
   - Save and retrieve schema
   - Edit existing schema

2. **Pipeline Creation Flow**
   - Fetch stored schema
   - Use schema for field mapping
   - Fallback to auto-detection

3. **Schema Migration**
   - Convert auto-detected to manual
   - Update existing data sources
   - Maintain backward compatibility

## UI/UX Design

### Schema Editor Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Schema Definition                          [Import] [Export]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Field Name    │ Type      │ Required │ Nullable │ Actions││
│  ├─────────────────────────────────────────────────────────┤│
│  │ id            │ Integer   │ □        │ □        │ ↑↓ ✕  ││
│  │ email         │ String    │ ☑        │ □        │ ↑↓ ✕  ││
│  │ firstName     │ String    │ ☑        │ ☑        │ ↑↓ ✕  ││
│  │ createdAt     │ DateTime  │ □        │ □        │ ↑↓ ✕  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [+ Add Field]                                                │
│                                                               │
│  Summary: 4 fields defined (2 required)                      │
└─────────────────────────────────────────────────────────────┘
```

### Field Editor Dialog

```
┌─────────────────────────────────────────────────────────────┐
│  Add/Edit Field                                          [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Field Name *                                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ email                                                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Data Type *                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ String                                              ▼   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ☑ Required Field                                            │
│  ☑ Nullable                                                  │
│                                                               │
│  Description (Optional)                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ User's email address                                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│                                    [Cancel]  [Save Field]    │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

1. **Schema Caching**: Cache schemas in memory to avoid repeated API calls
2. **Lazy Loading**: Load schema editor only when needed
3. **Debounced Validation**: Debounce validation during field editing
4. **Optimistic Updates**: Update UI immediately, sync with backend asynchronously

## Security Considerations

1. **Input Sanitization**: Sanitize field names and descriptions
2. **Schema Validation**: Validate schema structure on backend
3. **Access Control**: Ensure users can only modify their own data sources
4. **Audit Logging**: Log schema changes for compliance

## Migration Strategy

### Phase 1: Add Schema Support
- Add schema field to data source model
- Implement schema editor component
- Update data source creation/edit forms

### Phase 2: Update Pipeline Creation
- Modify schema fetching to use stored schemas
- Implement fallback to auto-detection
- Add migration UI for existing data sources

### Phase 3: Deprecate Auto-Detection
- Encourage users to define manual schemas
- Show warnings for auto-detected schemas
- Provide bulk migration tools

## API Changes

### New Endpoints

```javascript
// Get schema for a data source
GET /api/datasources/{id}/schema
Response: { fields: [FieldDefinition], isManual: boolean }

// Update schema for a data source
PUT /api/datasources/{id}/schema
Body: { fields: [FieldDefinition] }
Response: { success: boolean, schema: Schema }

// Validate schema
POST /api/datasources/schema/validate
Body: { fields: [FieldDefinition] }
Response: { isValid: boolean, errors: [string] }
```

### Updated Endpoints

```javascript
// Create/Update data source (now includes schema)
POST /api/datasources
PUT /api/datasources/{id}
Body: {
  name: string,
  type: string,
  connectionString: string,
  schema: { fields: [FieldDefinition] }  // NEW
}
```

## Dependencies

- **Vuetify 3**: UI components for schema editor
- **Vue 3**: Reactive framework
- **Existing Services**: dataSourceService, schemaService (to be updated)

## Future Enhancements

1. **Schema Templates**: Pre-defined schemas for common data structures
2. **Schema Versioning**: Track schema changes over time
3. **Schema Comparison**: Compare schemas between data sources
4. **Auto-Complete**: Suggest field names based on common patterns
5. **Bulk Import**: Import schemas from CSV or database introspection
6. **Schema Validation Rules**: Custom validation rules per field
7. **Computed Fields**: Define calculated fields in schema


## Schema Generation from File Upload

### File Upload Component

**Purpose**: Allows users to upload sample files to generate schemas automatically

**Implementation**: Client-side processing using JavaScript libraries
- All file parsing and analysis happens in the browser
- No file data is sent to the server
- Only the final generated schema is saved to backend

**Supported Formats**:
- CSV (.csv)
- JSON (.json)
- Excel (.xlsx, .xls)

**Required Libraries**:
- `papaparse` - CSV parsing
- `xlsx` (SheetJS) - Excel file reading
- Native `JSON.parse()` - JSON parsing

### File Analysis Logic (Client-Side)

```javascript
// Client-side file reading
function handleFileUpload(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const data = e.target.result;
    
    if (file.name.endsWith('.csv')) {
      const parsed = Papa.parse(data, { header: true });
      return analyzeCSV(parsed.data);
    } else if (file.name.endsWith('.json')) {
      const parsed = JSON.parse(data);
      return analyzeJSON(parsed);
    } else if (file.name.endsWith('.xlsx')) {
      const workbook = XLSX.read(data, { type: 'binary' });
      return analyzeExcel(workbook);
    }
  };
  
  reader.readAsText(file); // or readAsBinaryString for Excel
}

// CSV Analysis
function analyzeCSV(parsedData) {
  // 1. Headers already extracted by papaparse
  // 2. Analyze first 100 rows for type inference
  // 3. Detect nullable fields
  // 4. Return field definitions
}

// JSON Analysis
function analyzeJSON(file) {
  // 1. Parse JSON structure
  // 2. Extract keys as field names
  // 3. Infer types from values
  // 4. Handle nested objects (flatten or JSON type)
  // 5. Return field definitions
}

// Excel Analysis
function analyzeExcel(file) {
  // 1. Read first sheet
  // 2. Use first row as headers
  // 3. Analyze data rows for types
  // 4. Return field definitions
}
```

### Type Inference Rules

```javascript
const TYPE_INFERENCE = {
  // Check patterns in order
  patterns: [
    { regex: /^\d+$/, type: 'int' },
    { regex: /^\d+\.\d+$/, type: 'decimal' },
    { regex: /^(true|false)$/i, type: 'boolean' },
    { regex: /^\d{4}-\d{2}-\d{2}$/, type: 'date' },
    { regex: /^\d{4}-\d{2}-\d{2}T/, type: 'datetime' },
    { regex: /^{.*}$/, type: 'json' },
    { default: true, type: 'varchar' }
  ]
};
```

### UI Flow for File Upload

```
┌─────────────────────────────────────────────────────────────┐
│  Schema Definition                                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  📁 Upload Sample File to Generate Schema                ││
│  │                                                           ││
│  │  [Choose File] or drag and drop                          ││
│  │                                                           ││
│  │  Supported: CSV, JSON, Excel                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  OR                                                           │
│                                                               │
│  [+ Add Fields Manually]                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### File Upload Constraints

- **Max File Size**: 10MB
- **Analysis Limit**: First 1000 rows for type inference
- **Timeout**: 30 seconds for file processing
