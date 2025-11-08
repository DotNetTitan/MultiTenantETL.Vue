---
title: Field Mapping Design
status: draft
created: 2025-01-08
---

# Field Mapping Design

## Overview

This design document outlines the technical implementation of field mapping functionality for ETL pipelines. Field mapping allows users to define how data flows from source fields to destination fields, with optional transformations applied at the field level.

## Architecture

### High-Level Component Structure

```
PipelinesView.vue
  └─ PipelineForm (dialog)
      ├─ Basic Info Section
      ├─ Source/Destination Selection
      ├─ FieldMappingEditor ← NEW COMPONENT
      │   ├─ SchemaViewer (source & destination)
      │   ├─ MappingList
      │   │   └─ MappingCard (repeatable)
      │   │       ├─ SourceFieldSelector
      │   │       ├─ TransformationSelector
      │   │       └─ DestinationFieldSelector
      │   └─ ValidationSummary
      ├─ Dataset Transformations Section (existing)
      └─ Schedule Section (existing)
```

### Data Flow

```
1. User selects Source → Fetch source schema
2. User selects Destination → Fetch destination schema
3. System generates auto-suggestions
4. User creates/modifies field mappings
5. System validates mappings in real-time
6. User saves pipeline with field mappings
7. Backend stores pipeline configuration
8. During execution: Apply mappings + transformations
```

## Components

### 1. FieldMappingEditor.vue (Main Component)

**Purpose:** Container for all field mapping functionality

**Props:**
```javascript
{
  sourceId: String,           // Data source ID
  destinationId: String,      // Data destination ID
  modelValue: Array,          // Field mappings array
  transformations: Array      // Available transformations
}
```

**Emits:**
```javascript
{
  'update:modelValue': Array, // Updated field mappings
  'validate': Object          // Validation result
}
```

**State:**
```javascript
{
  sourceSchema: Object,       // Source fields and types
  destinationSchema: Object,  // Destination fields and types
  mappings: Array,            // Current field mappings
  suggestions: Array,         // Auto-suggested mappings
  validationErrors: Array,    // Current validation errors
  loading: Boolean            // Schema loading state
}
```

**Key Methods:**
- `fetchSchemas()` - Load source and destination schemas
- `generateSuggestions()` - Create auto-mapping suggestions
- `addMapping()` - Add new field mapping
- `removeMapping(index)` - Remove field mapping
- `reorderMapping(from, to)` - Change mapping order
- `validateMappings()` - Validate all mappings
- `acceptAllSuggestions()` - Apply all auto-suggestions

### 2. MappingCard.vue (Individual Mapping)

**Purpose:** Single field mapping configuration

**Props:**
```javascript
{
  mapping: Object,            // Mapping configuration
  sourceFields: Array,        // Available source fields
  destinationFields: Array,   // Available destination fields
  transformations: Array,     // Compatible transformations
  index: Number,              // Position in list
  canMoveUp: Boolean,
  canMoveDown: Boolean
}
```

**Emits:**
```javascript
{
  'update:mapping': Object,   // Updated mapping
  'remove': void,             // Remove this mapping
  'move-up': void,            // Move up in order
  'move-down': void           // Move down in order
}
```

**Template Structure:**
```vue
<v-card>
  <v-card-title>
    Mapping {{ index + 1 }}
    <v-spacer />
    <v-btn icon @click="$emit('move-up')" :disabled="!canMoveUp">↑</v-btn>
    <v-btn icon @click="$emit('move-down')" :disabled="!canMoveDown">↓</v-btn>
    <v-btn icon @click="$emit('remove')">×</v-btn>
  </v-card-title>
  
  <v-card-text>
    <!-- Source Fields (multi-select) -->
    <v-select
      v-model="localMapping.sourceFields"
      :items="sourceFields"
      label="Source Field(s)"
      multiple
      chips
    />
    
    <!-- Transformation (optional) -->
    <v-select
      v-model="localMapping.transformationId"
      :items="compatibleTransformations"
      label="Transformation (Optional)"
      clearable
    />
    
    <!-- Transformation Config (if transformation selected) -->
    <div v-if="selectedTransformation">
      <TransformationConfigEditor
        :transformation="selectedTransformation"
        v-model="localMapping.transformationConfig"
      />
    </div>
    
    <!-- Destination Field -->
    <v-select
      v-model="localMapping.destinationField"
      :items="destinationFields"
      label="Destination Field"
    >
      <template v-slot:item="{ item }">
        {{ item.name }}
        <v-chip v-if="item.required" size="x-small" color="error">Required</v-chip>
        <v-chip v-else size="x-small">Optional</v-chip>
      </template>
    </v-select>
    
    <!-- Validation Errors -->
    <v-alert v-if="validationErrors.length" type="error" dense>
      <ul>
        <li v-for="error in validationErrors" :key="error">{{ error }}</li>
      </ul>
    </v-alert>
  </v-card-text>
</v-card>
```

### 3. SchemaViewer.vue (Schema Display)

**Purpose:** Display source and destination schemas side-by-side

**Props:**
```javascript
{
  sourceSchema: Object,
  destinationSchema: Object,
  mappings: Array             // To show which fields are mapped
}
```

**Template Structure:**
```vue
<v-row>
  <v-col cols="6">
    <v-card>
      <v-card-title>Source Fields</v-card-title>
      <v-list>
        <v-list-item v-for="field in sourceSchema.fields" :key="field.name">
          <v-list-item-title>
            {{ field.name }}
            <v-chip size="x-small">{{ field.type }}</v-chip>
            <v-icon v-if="isMapped(field.name, 'source')" color="success">
              mdi-check
            </v-icon>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-col>
  
  <v-col cols="6">
    <v-card>
      <v-card-title>Destination Fields</v-card-title>
      <v-list>
        <v-list-item v-for="field in destinationSchema.fields" :key="field.name">
          <v-list-item-title>
            {{ field.name }}
            <v-chip size="x-small">{{ field.type }}</v-chip>
            <v-chip v-if="field.required" size="x-small" color="error">Required</v-chip>
            <v-icon v-if="isMapped(field.name, 'destination')" color="success">
              mdi-check
            </v-icon>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-col>
</v-row>
```

### 4. ValidationSummary.vue (Validation Display)

**Purpose:** Show validation status and unmapped required fields

**Props:**
```javascript
{
  validationErrors: Array,
  unmappedRequiredFields: Array,
  isValid: Boolean
}
```

**Template Structure:**
```vue
<v-alert v-if="!isValid" type="warning" prominent>
  <v-alert-title>Validation Issues</v-alert-title>
  
  <div v-if="unmappedRequiredFields.length">
    <strong>Unmapped Required Fields:</strong>
    <v-chip-group>
      <v-chip v-for="field in unmappedRequiredFields" :key="field">
        {{ field }}
      </v-chip>
    </v-chip-group>
  </div>
  
  <div v-if="validationErrors.length" class="mt-2">
    <strong>Other Issues:</strong>
    <ul>
      <li v-for="error in validationErrors" :key="error">{{ error }}</li>
    </ul>
  </div>
</v-alert>

<v-alert v-else type="success">
  All required fields are mapped correctly!
</v-alert>
```

## Data Models

### Schema Structure

```javascript
{
  fields: [
    {
      name: "customer_id",
      type: "int",
      nullable: false,
      required: true,        // For destination fields
      description: "Unique customer identifier"
    },
    {
      name: "email",
      type: "varchar(255)",
      nullable: true,
      required: false,
      description: "Customer email address"
    }
  ]
}
```

### Field Mapping Structure

```javascript
{
  id: "uuid",                           // Unique mapping ID
  sourceFields: ["first_name", "last_name"], // Array for multi-field
  destinationField: "full_name",        // Single destination
  transformationId: "trans-uuid",       // Optional
  transformationConfig: {               // Optional, transformation params
    separator: " ",
    format: "FirstName LastName"
  },
  order: 1,                             // Execution order
  isValid: true,                        // Validation status
  validationErrors: []                  // Array of error messages
}
```

### Pipeline Structure (Updated)

```javascript
{
  id: "pipeline-uuid",
  name: "Customer Migration",
  sourceId: "source-uuid",
  destinationId: "dest-uuid",
  
  // NEW: Field mappings
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
      transformationId: "combine-trans-id",
      transformationConfig: { separator: " " },
      order: 2
    }
  ],
  
  // Existing: Dataset transformations
  transformations: [...],
  
  // Existing: Schedule
  isScheduled: true,
  schedule: {...}
}
```

## Services

### Schema Service (New)

**File:** `src/services/schemaService.js`

```javascript
/**
 * Fetch schema for a data source
 * @param {string} dataSourceId - Data source ID
 * @returns {Promise<Object>} Schema object
 */
export async function fetchSchema(dataSourceId) {
  // Calls existing detectSchema from dataSourceService
  const schema = await detectSchema(dataSourceId);
  
  // Transform to standardized format
  return {
    fields: schema.tables?.[0]?.columns || schema.columns || []
  };
}

/**
 * Generate auto-mapping suggestions
 * @param {Object} sourceSchema - Source schema
 * @param {Object} destinationSchema - Destination schema
 * @returns {Array} Suggested mappings
 */
export function generateMappingSuggestions(sourceSchema, destinationSchema) {
  const suggestions = [];
  
  destinationSchema.fields.forEach(destField => {
    // Exact match (case-insensitive)
    const exactMatch = sourceSchema.fields.find(
      sf => sf.name.toLowerCase() === destField.name.toLowerCase()
    );
    
    if (exactMatch) {
      suggestions.push({
        sourceFields: [exactMatch.name],
        destinationField: destField.name,
        confidence: 'high',
        reason: 'Exact name match'
      });
      return;
    }
    
    // Fuzzy match (similar names)
    const fuzzyMatch = sourceSchema.fields.find(sf => 
      similarity(sf.name, destField.name) > 0.7
    );
    
    if (fuzzyMatch) {
      suggestions.push({
        sourceFields: [fuzzyMatch.name],
        destinationField: destField.name,
        confidence: 'medium',
        reason: `Similar to ${fuzzyMatch.name}`
      });
    }
  });
  
  return suggestions;
}

/**
 * Validate field mappings
 * @param {Array} mappings - Field mappings
 * @param {Object} sourceSchema - Source schema
 * @param {Object} destinationSchema - Destination schema
 * @param {Array} transformations - Available transformations
 * @returns {Object} Validation result
 */
export function validateFieldMappings(mappings, sourceSchema, destinationSchema, transformations) {
  const errors = [];
  const warnings = [];
  
  // Check all required destination fields are mapped
  const mappedDestFields = mappings.map(m => m.destinationField);
  const requiredFields = destinationSchema.fields.filter(f => f.required);
  
  requiredFields.forEach(field => {
    if (!mappedDestFields.includes(field.name)) {
      errors.push(`Required field '${field.name}' is not mapped`);
    }
  });
  
  // Check for duplicate destination mappings
  const duplicates = mappedDestFields.filter((item, index) => 
    mappedDestFields.indexOf(item) !== index
  );
  
  duplicates.forEach(field => {
    errors.push(`Field '${field}' is mapped multiple times`);
  });
  
  // Validate each mapping
  mappings.forEach((mapping, index) => {
    // Check source fields exist
    mapping.sourceFields.forEach(sf => {
      if (!sourceSchema.fields.find(f => f.name === sf)) {
        errors.push(`Mapping ${index + 1}: Source field '${sf}' does not exist`);
      }
    });
    
    // Check destination field exists
    if (!destinationSchema.fields.find(f => f.name === mapping.destinationField)) {
      errors.push(`Mapping ${index + 1}: Destination field '${mapping.destinationField}' does not exist`);
    }
    
    // Validate transformation if present
    if (mapping.transformationId) {
      const trans = transformations.find(t => t.id === mapping.transformationId);
      if (!trans) {
        errors.push(`Mapping ${index + 1}: Transformation not found`);
      } else {
        // Check input count matches
        const expectedInputs = trans.config.inputCount || 1;
        if (mapping.sourceFields.length !== expectedInputs) {
          errors.push(
            `Mapping ${index + 1}: Transformation expects ${expectedInputs} input(s), ` +
            `got ${mapping.sourceFields.length}`
          );
        }
      }
    } else {
      // No transformation - check data type compatibility
      if (mapping.sourceFields.length > 1) {
        errors.push(`Mapping ${index + 1}: Multiple source fields require a transformation`);
      } else {
        const sourceField = sourceSchema.fields.find(f => f.name === mapping.sourceFields[0]);
        const destField = destinationSchema.fields.find(f => f.name === mapping.destinationField);
        
        if (sourceField && destField && !isTypeCompatible(sourceField.type, destField.type)) {
          warnings.push(
            `Mapping ${index + 1}: Type mismatch (${sourceField.type} → ${destField.type}). ` +
            `Consider adding a transformation.`
          );
        }
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Helper: Check type compatibility
function isTypeCompatible(sourceType, destType) {
  // Simplified type compatibility check
  const typeMap = {
    'int': ['int', 'bigint', 'decimal', 'varchar'],
    'varchar': ['varchar', 'text'],
    'datetime': ['datetime', 'timestamp', 'varchar'],
    'boolean': ['boolean', 'int', 'varchar']
  };
  
  const sourceBase = sourceType.split('(')[0].toLowerCase();
  const destBase = destType.split('(')[0].toLowerCase();
  
  return typeMap[sourceBase]?.includes(destBase) || sourceBase === destBase;
}

// Helper: String similarity (Levenshtein distance)
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
```

## Integration with Existing Code

### Update PipelinesView.vue

Add field mapping section to the pipeline form dialog:

```vue
<v-col cols="12">
  <v-divider class="my-4" />
  <h3 class="text-h6 mb-4">Field Mappings</h3>
  
  <FieldMappingEditor
    v-if="editedPipeline.sourceId && editedPipeline.destinationId"
    v-model="editedPipeline.fieldMappings"
    :source-id="editedPipeline.sourceId"
    :destination-id="editedPipeline.destinationId"
    :transformations="availableTransformations"
    @validate="handleMappingValidation"
  />
  
  <v-alert v-else type="info">
    Select source and destination to configure field mappings
  </v-alert>
</v-col>
```

### Update usePipelineForm.js

Add field mapping state and methods:

```javascript
const fieldMappings = ref([]);
const mappingValidation = ref({ isValid: true, errors: [] });

function handleMappingValidation(result) {
  mappingValidation.value = result;
}

// In return statement
return {
  // ... existing
  fieldMappings,
  mappingValidation,
  handleMappingValidation
};
```

### Update Pipeline Save Logic

Ensure field mappings are included when saving:

```javascript
async function handleSavePipeline() {
  // Validate form
  if (!form.value.validate()) return;
  
  // Validate field mappings
  if (!mappingValidation.value.isValid) {
    showNotification('Please fix field mapping errors', 'error');
    return;
  }
  
  const pipelineData = {
    ...editedPipeline.value,
    fieldMappings: fieldMappings.value
  };
  
  await savePipeline(pipelineData);
}
```

## Error Handling

### Schema Loading Errors
```javascript
try {
  sourceSchema.value = await fetchSchema(sourceId);
} catch (error) {
  showNotification('Failed to load source schema', 'error');
  // Show retry button or fallback UI
}
```

### Validation Errors
- Display inline in MappingCard
- Show summary in ValidationSummary
- Prevent save if validation fails
- Clear errors when user fixes issues

### Transformation Compatibility
- Filter transformation list based on:
  - Number of source fields
  - Source field types
  - Destination field type
- Show "No compatible transformations" message if none available

## Performance Considerations

1. **Schema Caching**
   - Cache schemas in memory
   - Invalidate on source/destination change
   - Show loading state during fetch

2. **Validation Debouncing**
   - Debounce validation by 500ms
   - Validate on blur, not on every keystroke
   - Show loading indicator during validation

3. **Large Field Lists**
   - Virtual scrolling for 100+ fields
   - Search/filter in field selectors
   - Lazy load transformation list

4. **Reactivity Optimization**
   - Use `shallowRef` for large schemas
   - Avoid deep watchers on mappings array
   - Batch validation updates

## Testing Strategy

### Unit Tests
- Schema service functions (suggestions, validation)
- Type compatibility checks
- String similarity algorithm

### Component Tests
- MappingCard renders correctly
- Field selection updates model
- Transformation selection filters correctly
- Validation errors display

### Integration Tests
- Complete mapping workflow
- Auto-suggestions work
- Validation prevents invalid saves
- Mappings persist correctly

### E2E Tests
- Create pipeline with field mappings
- Edit existing mappings
- Save and reload pipeline
- Execute pipeline with mappings

## Accessibility

- Proper ARIA labels on all form fields
- Keyboard navigation support
- Screen reader announcements for validation errors
- Focus management when adding/removing mappings
- High contrast mode support

## Migration Strategy

### Existing Pipelines
- Pipelines without field mappings continue to work
- Show migration prompt: "Add field mappings to improve data flow"
- Provide "Generate mappings" button for existing pipelines
- Gradual rollout - field mappings optional initially

### Database Schema
```sql
-- Add field_mappings column to pipelines table
ALTER TABLE pipelines 
ADD COLUMN field_mappings JSONB DEFAULT '[]';

-- Index for faster queries
CREATE INDEX idx_pipelines_field_mappings 
ON pipelines USING GIN (field_mappings);
```

## Future Enhancements

1. **Visual Mapper** - Drag-and-drop interface
2. **Mapping Templates** - Save and reuse common mappings
3. **Conditional Mappings** - If-then logic
4. **Calculated Fields** - Expression-based mappings
5. **Mapping Preview** - See sample data transformation
6. **Bulk Operations** - Import/export mappings
7. **Mapping History** - Track changes over time

---

## Summary

This design provides a comprehensive solution for field-level mapping in ETL pipelines. The dropdown-based approach balances simplicity with functionality, making it accessible to users while providing powerful mapping capabilities. The modular component structure allows for future enhancements without major refactoring.

**Key Design Decisions:**
- Dropdown-based UI (not drag-and-drop) for simplicity
- Field-level transformations (not dataset-level)
- Real-time validation with clear error messages
- Auto-suggestions to speed up mapping creation
- Modular components for maintainability
