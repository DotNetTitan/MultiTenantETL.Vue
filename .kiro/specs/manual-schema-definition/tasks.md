# Implementation Plan

- [x] 1. Update data models and services
  - Update DataSource model to include schema field
  - Modify dataSourceService to handle schema CRUD operations
  - Update schemaService to prioritize manual schemas over auto-detection
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.1, 10.5_

- [x] 2. Create SchemaEditor component
  - [x] 2.1 Create base SchemaEditor component structure
    - Implement component with props and events
    - Add schema field list display
    - Implement add field button
    - _Requirements: 1.2, 3.1, 3.2_

  - [x] 2.2 Implement data type selection
    - Create data type dropdown with icons
    - Add all supported data types
    - _Requirements: 4.1, 4.2_

  - [x] 2.3 Add field reordering functionality
    - Implement move up/down buttons
    - Update field order property
    - _Requirements: 3.5_

  - [x] 2.4 Implement schema validation
    - Validate unique field names
    - Validate required fields
    - Validate field name characters
    - Display validation errors
    - _Requirements: 2.6, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3. Create FieldEditorDialog component
  - Implement dialog for adding/editing fields
  - Add form inputs for all field properties
  - Implement save and cancel actions
  - Add field description input
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.3_

- [x] 4. Implement schema import/export
  - [x] 4.1 Integrate import/export into SchemaEditor
    - Add export to JSON functionality
    - Add import from JSON functionality
    - _Requirements: 8.1, 8.2_

  - [x] 4.2 Implement import validation
    - Validate JSON structure
    - Display import errors
    - Preserve field properties on import
    - _Requirements: 8.3, 8.4, 8.5_

- [x] 5. Integrate SchemaEditor into data source forms
  - [x] 5.1 Update DataSourcesView to include schema editor
    - Add SchemaEditor to create data source dialog
    - Add SchemaEditor to edit data source dialog
    - _Requirements: 1.1, 5.1_

  - [x] 5.2 Implement schema save functionality
    - Save schema with data source
    - Validate schema before saving
    - _Requirements: 1.4, 1.5, 5.3_

  - [ ] 5.3 Add schema change warnings
    - Detect if data source is used in pipelines
    - Display warning when editing schema
    - Show affected pipelines
    - _Requirements: 5.4, 5.5_

- [x] 6. Update pipeline field mapping to use manual schemas
  - [x] 6.1 Modify FieldMappingEditor to fetch stored schemas
    - Update fetchSchema calls to use stored schemas
    - Implement fallback to auto-detection
    - Display notification when using auto-detection
    - _Requirements: 6.2, 6.3, 6.4, 10.1, 10.2_

  - [ ] 6.2 Add schema conversion feature
    - Add "Convert to Manual Schema" button in FieldMappingEditor
    - Pre-populate fields from auto-detection
    - Save converted schema to data source
    - _Requirements: 10.3, 10.4_

- [x] 7. Add schema validation service methods
  - Implement validateSchema function
  - Implement checkDuplicateFields function
  - Implement validateFieldName function
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Implement schema generation from file upload
  - [x] 8.1 Create FileUploadSchemaGenerator component
    - Add file upload dropzone
    - Support CSV, JSON, and Excel formats
    - Display upload progress
    - _Requirements: 11.1, 11.2_

  - [x] 8.2 Implement CSV file analysis
    - Parse CSV headers as field names
    - Analyze sample rows for type inference
    - Detect nullable fields
    - Generate field definitions
    - _Requirements: 11.3, 11.4, 11.5_

  - [x] 8.3 Implement JSON file analysis
    - Parse JSON structure
    - Extract keys as field names
    - Infer types from values
    - Handle nested objects
    - Generate field definitions
    - _Requirements: 11.3, 11.4, 11.5_

  - [x] 8.4 Implement Excel file analysis
    - Read Excel file (first sheet)
    - Use first row as headers
    - Analyze data rows for types
    - Generate field definitions
    - _Requirements: 11.3, 11.4, 11.5_

  - [x] 8.5 Add type inference logic
    - Implement pattern matching for data types
    - Handle multiple data types in same column
    - Default to varchar for ambiguous types
    - _Requirements: 11.5_

  - [x] 8.6 Implement generated schema review
    - Display generated fields in SchemaEditor
    - Allow user to modify generated fields
    - _Requirements: 11.6_

  - [x] 8.7 Add file upload error handling
    - Handle unsupported file formats
    - Handle file size limits
    - Handle parsing errors
    - Display clear error messages
    - _Requirements: 11.7, 11.8_

  - [x] 8.8 Integrate file upload into data source forms
    - Add file upload option to schema definition
    - Show "Upload File" or "Manual Entry" options
    - Update UI to accommodate both methods
    - _Requirements: 11.1_

- [x] 9. Add schema change warnings for pipelines



  - [x] 9.1 Create utility to find pipelines using a data source

    - Query pipelines that reference the data source
    - Return list of affected pipeline names and IDs
    - _Requirements: 5.4_


  - [x] 9.2 Display warning dialog when editing schema

    - Show warning if data source is used in pipelines
    - List affected pipelines
    - Allow user to proceed or cancel
    - _Requirements: 5.5_

- [x] 10. Add schema conversion feature in pipeline editor



  - [x] 10.1 Add "Convert to Manual Schema" button

    - Display button when auto-detected schema is used
    - Show in FieldMappingEditor component
    - _Requirements: 10.3_


  - [x] 10.2 Implement conversion logic

    - Fetch current auto-detected schema
    - Create manual schema with same fields
    - Save to data source
    - Refresh FieldMappingEditor
    - _Requirements: 10.4_

- [x] 11. Add visual schema preview component



  - Create SchemaPreview component
  - Display field count and statistics
  - Highlight required fields visually
  - Show field types with icons
  - Integrate into DataSourcesView
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
