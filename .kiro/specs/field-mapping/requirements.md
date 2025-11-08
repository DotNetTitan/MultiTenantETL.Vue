---
title: Field Mapping for ETL Pipelines
status: draft
created: 2025-01-08
---

# Field Mapping Requirements

## Overview

Field mapping is the bridge between source and destination in an ETL pipeline. It defines how data flows from source fields to destination fields, with optional transformations applied at the field level.

## User Stories

### US-1: View Source and Destination Schemas
**As a** pipeline creator  
**I want to** see the fields available in my source and destination  
**So that** I can understand what data I'm working with

**Acceptance Criteria:**
- When I select a source, the system displays all available fields with their data types
- When I select a destination, the system displays all required and optional fields
- Fields show: name, data type, nullable/required status
- System indicates which destination fields are required vs optional

### US-2: Create Field Mappings
**As a** pipeline creator  
**I want to** map source fields to destination fields  
**So that** data flows correctly from source to destination

**Acceptance Criteria:**
- I can map a single source field to a destination field (1:1)
- I can map multiple source fields to a single destination field (N:1)
- I can leave optional destination fields unmapped
- System prevents me from saving if required destination fields are unmapped
- System shows validation errors for unmapped required fields

### US-3: Apply Transformations to Field Mappings
**As a** pipeline creator  
**I want to** apply transformations to field mappings  
**So that** I can format, combine, or convert data during the mapping

**Acceptance Criteria:**
- I can select a transformation for any field mapping
- System shows only compatible transformations based on:
  - Number of input fields (1 or multiple)
  - Input data types
  - Output data type matching destination
- I can see a preview of what the transformation does
- I can remove a transformation from a mapping

### US-4: Auto-Suggest Mappings
**As a** pipeline creator  
**I want to** get automatic mapping suggestions  
**So that** I can save time on obvious mappings

**Acceptance Criteria:**
- System auto-suggests mappings for fields with matching names (case-insensitive)
- System auto-suggests mappings for fields with similar names (fuzzy match)
- I can accept all suggestions with one click
- I can accept/reject individual suggestions
- Auto-suggestions are clearly marked as "suggested" vs "confirmed"

### US-5: Validate Field Mappings
**As a** pipeline creator  
**I want to** validate my field mappings before saving  
**So that** I catch errors early

**Acceptance Criteria:**
- System validates:
  - All required destination fields are mapped
  - Data types are compatible (or transformation handles conversion)
  - No duplicate mappings to same destination field
  - Transformations have correct number of inputs
- Validation errors are shown inline with clear messages
- I cannot save pipeline with validation errors

### US-6: Reorder Field Mappings
**As a** pipeline creator  
**I want to** reorder my field mappings  
**So that** I can organize them logically

**Acceptance Criteria:**
- I can drag-and-drop to reorder mappings
- Order is preserved when I save and reload
- Order affects execution sequence (top to bottom)

## Data Model

### Field Mapping Structure

```javascript
{
  id: "mapping-uuid",
  sourceFields: ["first_name", "last_name"], // Array for multi-field mappings
  destinationField: "full_name",
  transformationId: "transformation-uuid", // Optional
  transformationConfig: { // Optional, for transformation parameters
    separator: " ",
    format: "FirstName LastName"
  },
  order: 1, // Execution order
  isValid: true,
  validationErrors: []
}
```

### Pipeline with Field Mappings

```javascript
{
  id: "pipeline-uuid",
  name: "Customer to User Migration",
  sourceId: "customer-db-id",
  destinationId: "user-db-id",
  
  // Field-level mappings
  fieldMappings: [
    {
      id: "map-1",
      sourceFields: ["customer_id"],
      destinationField: "id",
      transformationId: null,
      order: 1
    },
    {
      id: "map-2",
      sourceFields: ["first_name", "last_name"],
      destinationField: "full_name",
      transformationId: "combine-names-id",
      transformationConfig: { separator: " " },
      order: 2
    },
    {
      id: "map-3",
      sourceFields: ["email_address"],
      destinationField: "email",
      transformationId: null,
      order: 3
    }
  ],
  
  // Dataset-level transformations (existing)
  transformations: [
    {
      id: "filter-1",
      type: "Filter",
      config: { column: "is_active", operator: "equals", value: true }
    }
  ]
}
```

## UI Design Approach

### Recommended: Dropdown-Based Mapper with Visual Indicators

**Why this approach:**
- Works well on all screen sizes
- Easier to implement than drag-and-drop
- Clear and unambiguous
- Accessible
- Familiar pattern for users

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Field Mappings                                    [+ Add]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Mapping 1                                    [↑][↓][×]│   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ Source Field(s):                                      │   │
│ │ [customer_id ▼]                          [+ Add Field]│   │
│ │                                                       │   │
│ │ Transformation (Optional):                            │   │
│ │ [None ▼]                                              │   │
│ │                                                       │   │
│ │ Destination Field:                                    │   │
│ │ [id ▼] *Required                                      │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Mapping 2                                    [↑][↓][×]│   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ Source Field(s):                                      │   │
│ │ [first_name ▼] [last_name ▼]             [+ Add Field]│   │
│ │                                                       │   │
│ │ Transformation (Optional):                            │   │
│ │ [Combine Names ▼]                                     │   │
│ │   Separator: [ ▼]                                     │   │
│ │                                                       │   │
│ │ Destination Field:                                    │   │
│ │ [full_name ▼] *Required                               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ Unmapped Required Fields: email, phone                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Each mapping is a card
- Reorder with up/down arrows
- Remove with X button
- Multi-select for source fields (for N:1 mappings)
- Transformation dropdown shows only compatible transformations
- Visual indicator for required destination fields
- Warning banner for unmapped required fields

## Workflow Integration

### Where Field Mapping Fits in Pipeline Creation

```
Step 1: Basic Info
  ├─ Pipeline Name
  └─ Description

Step 2: Source & Destination
  ├─ Select Source
  └─ Select Destination
      ↓
  [System fetches schemas]

Step 3: Field Mappings ← NEW
  ├─ Auto-suggest mappings
  ├─ User confirms/modifies
  ├─ Add transformations
  └─ Validate all required fields mapped

Step 4: Dataset Transformations (existing)
  ├─ Add filters
  ├─ Add aggregations
  └─ Reorder transformations

Step 5: Schedule (existing)
  └─ Configure schedule

Step 6: Review & Save
```

## Technical Considerations

### Schema Detection
- When source/destination is selected, fetch schema from data source
- Cache schemas to avoid repeated API calls
- Handle schema changes (show warning if schema changed since last edit)

### Transformation Compatibility
- Filter transformations by:
  - Input count (single vs multiple fields)
  - Input data types
  - Output data type
- Show transformation description/preview

### Validation Rules
1. All required destination fields must be mapped
2. No duplicate mappings to same destination field
3. Data type compatibility (with or without transformation)
4. Transformation input count matches source fields count
5. Transformation input types match source field types

### Performance
- Lazy load transformation list
- Debounce validation checks
- Cache schema data
- Optimize for 50+ field mappings

## Edge Cases

1. **Source field doesn't exist anymore**
   - Show warning, mark mapping as invalid
   - Allow user to remap or remove

2. **Destination field added after mapping created**
   - Show in "unmapped required fields" list
   - Suggest auto-mapping if similar name exists

3. **Transformation deleted**
   - Show warning, mark mapping as invalid
   - Allow user to select different transformation or remove

4. **Data type mismatch**
   - Show error with suggestion for compatible transformation
   - Prevent saving until resolved

5. **Circular dependencies**
   - Not applicable for field-level mappings (no field depends on another)

## Success Metrics

- User can create complete field mapping in < 2 minutes
- 90% of mappings use auto-suggestions
- Zero pipelines saved with invalid mappings
- Field mapping errors caught before execution

## Out of Scope (Future Enhancements)

- Drag-and-drop visual mapper
- Field mapping templates
- Bulk import/export mappings
- Conditional mappings (if-then logic)
- Calculated fields (expressions)
- Field mapping history/versioning

---

## Next Steps

1. Review and approve requirements
2. Create design mockups
3. Break down into implementation tasks
4. Implement field mapping component
5. Integrate with pipeline form
6. Add validation
7. Test with real data sources
