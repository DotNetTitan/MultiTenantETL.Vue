# Field Mapping Implementation Tasks

## Task List

- [ ] 1. Create schema service
- [x] 1.1 Create `src/services/schemaService.js`



  - Implement `fetchSchema()` function
  - Implement `generateMappingSuggestions()` function
  - Implement `validateFieldMappings()` function
  - Add helper functions for type compatibility and string similarity
  - _Requirements: US-1, US-4, US-5_

- [x] 2. Create core field mapping components

- [x] 2.1 Create `src/components/pipeline/FieldMappingEditor.vue`


  - Set up component structure with props and emits
  - Add state management (schemas, mappings, validation)
  - Implement `fetchSchemas()` method
  - Implement `generateSuggestions()` method
  - Implement `addMapping()` method
  - Implement `removeMapping()` method
  - Implement `validateMappings()` method
  - Add loading states and error handling
  - _Requirements: US-1, US-2, US-4, US-5_

- [x] 2.2 Create `src/components/pipeline/MappingCard.vue`


  - Set up component structure with props and emits
  - Add source field multi-select dropdown
  - Add transformation selector dropdown
  - Add transformation config editor (conditional)
  - Add destination field dropdown
  - Add reorder buttons (up/down)
  - Add remove button
  - Display validation errors inline
  - Filter transformations by compatibility
  - _Requirements: US-2, US-3, US-6_

- [x] 2.3 Create `src/components/pipeline/SchemaViewer.vue`


  - Display source fields in left column
  - Display destination fields in right column
  - Show field types and nullable status
  - Indicate required vs optional destination fields
  - Show checkmarks for mapped fields
  - Add search/filter functionality for large schemas
  - _Requirements: US-1_

- [x] 2.4 Create `src/components/pipeline/ValidationSummary.vue`


  - Display validation status (success/warning)
  - List unmapped required fields
  - List validation errors
  - Show overall validation state
  - _Requirements: US-5_

- [x] 3. Integrate with pipeline form

- [x] 3.1 Update `src/views/PipelinesView.vue`


  - Import FieldMappingEditor component
  - Add field mappings section to pipeline form dialog
  - Add conditional rendering (only show when source & destination selected)
  - Wire up v-model for field mappings
  - Add validation handler
  - Update save logic to include field mappings
  - Prevent save if validation fails
  - _Requirements: US-2, US-5_

- [x] 3.2 Update `src/composables/usePipelineForm.js`


  - Add `fieldMappings` state
  - Add `mappingValidation` state
  - Add `handleMappingValidation()` method
  - Export new state and methods
  - _Requirements: US-2, US-5_

- [x] 3.3 Update pipeline data model


  - Add `fieldMappings` array to pipeline object in `createEmptyPipeline()`
  - Ensure field mappings are included in save/load operations
  - _Requirements: US-2_

- [x] 4. Add transformation compatibility logic

- [x] 4.1 Update `src/components/pipeline/MappingCard.vue`

  - Implement `compatibleTransformations` computed property
  - Filter by input count (single vs multiple source fields)
  - Filter by input data types
  - Filter by output data type matching destination
  - Show "No compatible transformations" message when empty
  - _Requirements: US-3_

- [x] 5. Implement auto-suggestions

- [x] 5.1 Update `src/components/pipeline/FieldMappingEditor.vue`

  - Call `generateSuggestions()` after schemas load
  - Display suggestions with confidence indicators
  - Add "Accept All" button
  - Add individual accept/reject buttons per suggestion
  - Show suggestion reason (exact match, similar name, etc.)
  - _Requirements: US-4_

- [x] 6. Add reordering functionality

- [x] 6.1 Update `src/components/pipeline/FieldMappingEditor.vue`

  - Implement `reorderMapping(from, to)` method
  - Update mapping order values
  - _Requirements: US-6_

- [x] 6.2 Update `src/components/pipeline/MappingCard.vue`

  - Emit move-up and move-down events
  - Disable buttons appropriately (first/last items)
  - _Requirements: US-6_

- [x] 7. Add real-time validation

- [x] 7.1 Update `src/components/pipeline/FieldMappingEditor.vue`

  - Watch mappings array for changes
  - Debounce validation calls (500ms)
  - Update validation state
  - Emit validation events to parent
  - _Requirements: US-5_

- [x] 7.2 Update `src/components/pipeline/MappingCard.vue`

  - Display validation errors for this mapping
  - Highlight invalid fields
  - _Requirements: US-5_

- [x] 8. Handle edge cases

- [x] 8.1 Schema loading errors

  - Show error message if schema fetch fails
  - Provide retry button
  - Disable mapping editor until schemas load
  - _Requirements: US-1_

- [x] 8.2 Missing source/destination fields

  - Detect when mapped field no longer exists in schema
  - Show warning message
  - Mark mapping as invalid
  - Allow user to remap or remove
  - _Requirements: US-5_

- [x] 8.3 Deleted transformations

  - Detect when transformation no longer exists
  - Show warning message
  - Mark mapping as invalid
  - Allow user to select different transformation
  - _Requirements: US-3, US-5_

- [x] 9. Add styling and polish


- [x] 9.1 Style FieldMappingEditor

  - Add proper spacing and layout
  - Style suggestion cards
  - Add loading skeletons
  - Ensure responsive design
  - _Requirements: All_

- [x] 9.2 Style MappingCard

  - Add visual hierarchy
  - Style validation errors
  - Add hover states
  - Ensure accessibility (ARIA labels, keyboard nav)
  - _Requirements: All_

- [x] 9.3 Style SchemaViewer

  - Add visual distinction between source/destination
  - Style field type chips
  - Add icons for mapped/unmapped status
  - _Requirements: US-1_

- [ ] 10. Testing
- [ ]* 10.1 Unit tests for schemaService
  - Test `generateMappingSuggestions()` with various schemas
  - Test `validateFieldMappings()` with valid/invalid mappings
  - Test type compatibility checks
  - Test string similarity algorithm
  - _Requirements: US-4, US-5_

- [ ]* 10.2 Component tests
  - Test MappingCard renders correctly
  - Test field selection updates model
  - Test transformation filtering
  - Test validation error display
  - _Requirements: US-2, US-3, US-5_

- [ ]* 10.3 Integration tests
  - Test complete mapping workflow
  - Test auto-suggestions
  - Test validation prevents invalid saves
  - Test mappings persist correctly
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional testing tasks
- Each task references the requirements it implements
- Tasks should be completed in order (dependencies)
- Validation should be implemented early to catch issues
- Focus on core functionality first, polish later
