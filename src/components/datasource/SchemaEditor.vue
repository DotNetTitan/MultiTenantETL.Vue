<template>
  <div class="schema-editor">
    <div class="d-flex align-center mb-4">
      <div class="flex-grow-1">
        <h3 class="text-h6">Schema Definition</h3>
        <p class="text-caption text-grey">Define the structure of your data</p>
      </div>
      <v-btn
        variant="text"
        prepend-icon="mdi-download"
        size="small"
        @click="exportSchema"
      >
        Export
      </v-btn>
      <v-btn
        variant="text"
        prepend-icon="mdi-upload"
        size="small"
        @click="showImportDialog = true"
      >
        Import
      </v-btn>
    </div>

    <!-- File Upload Schema Generator -->
    <FileUploadSchemaGenerator
      v-if="localFields.length === 0"
      @schema-generated="handleSchemaGenerated"
    />

    <v-divider v-if="localFields.length === 0" class="my-4">
      <span class="text-caption text-grey px-2">OR</span>
    </v-divider>

    <!-- Field List -->
    <v-card variant="outlined" class="mb-4">
      <v-table v-if="localFields.length > 0">
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Type</th>
            <th>Unique ID</th>
            <th>Required</th>
            <th>Nullable</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(field, index) in localFields" :key="field.id">
            <td>
              <div class="d-flex align-center">
                <v-icon v-if="field.isPrimaryKey" color="primary" size="small" class="mr-2">mdi-key</v-icon>
                <div>
                  <strong>{{ field.name }}</strong>
                  <div v-if="field.description" class="text-caption text-grey">
                    {{ field.description }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <v-chip size="small" variant="tonal">
                {{ getTypeLabel(field.type) }}
              </v-chip>
            </td>
            <td>
              <v-icon v-if="field.isPrimaryKey" color="primary" size="small">
                mdi-check-circle
              </v-icon>
              <v-icon v-else color="grey" size="small">
                mdi-circle-outline
              </v-icon>
            </td>
            <td>
              <v-icon v-if="field.required" color="error" size="small">
                mdi-check-circle
              </v-icon>
              <v-icon v-else color="grey" size="small">
                mdi-circle-outline
              </v-icon>
            </td>
            <td>
              <v-icon v-if="field.nullable" color="success" size="small">
                mdi-check-circle
              </v-icon>
              <v-icon v-else color="grey" size="small">
                mdi-circle-outline
              </v-icon>
            </td>
            <td class="text-right">
              <v-btn
                icon
                variant="text"
                size="small"
                :disabled="index === 0"
                @click="moveFieldUp(index)"
              >
                <v-icon>mdi-arrow-up</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                :disabled="index === localFields.length - 1"
                @click="moveFieldDown(index)"
              >
                <v-icon>mdi-arrow-down</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                @click="editField(index)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                @click="removeField(index)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>

      <div v-else class="text-center py-8">
        <v-icon size="64" color="grey-lighten-2">mdi-table-off</v-icon>
        <p class="mt-2 text-grey">No fields defined yet</p>
        <p class="text-caption text-grey">Add fields manually or upload a sample file</p>
      </div>
    </v-card>

    <!-- Add Field Button -->
    <v-btn
      block
      variant="tonal"
      prepend-icon="mdi-plus"
      @click="addField"
    >
      Add Field
    </v-btn>

    <!-- Summary -->
    <div v-if="localFields.length > 0" class="mt-4 text-caption text-grey">
      Summary: {{ localFields.length }} field{{ localFields.length !== 1 ? 's' : '' }} defined
      ({{ requiredFieldsCount }} required)
    </div>

    <!-- Validation Errors (only show meaningful errors, not "no fields" on initial load) -->
    <div v-if="shouldShowValidationErrors" class="mt-4">
      <!-- Unique Identifier Validation -->
      <v-card v-if="uniqueIdentifierErrors.length > 0" variant="outlined" color="error" class="mb-3">
        <v-card-text class="py-3">
          <div class="d-flex align-center">
            <v-icon color="error" class="mr-3">mdi-key-alert</v-icon>
            <div class="flex-grow-1">
              <div class="text-subtitle-2 mb-1">Unique Identifier Required</div>
              <div class="text-caption">
                {{ uniqueIdentifierErrors[0] }}
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Other Validation Errors -->
      <v-card v-if="otherValidationErrors.length > 0" variant="outlined" class="mb-3">
        <v-card-text class="py-3">
          <div class="d-flex align-start">
            <v-icon color="error" class="mr-3 mt-1">mdi-alert</v-icon>
            <div class="flex-grow-1">
              <div class="text-subtitle-2 mb-2">Schema Issues</div>
              <div v-for="(error, idx) in otherValidationErrors" :key="idx" class="text-caption mb-1">
                • {{ error }}
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Field Editor Dialog -->
    <FieldEditorDialog
      v-model="showFieldDialog"
      :field="editingField"
      :existing-field-names="existingFieldNames"
      @save="saveField"
    />

    <!-- Import Dialog -->
    <v-dialog v-model="showImportDialog" max-width="500">
      <v-card>
        <v-card-title>Import Schema</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="importJson"
            label="Paste JSON Schema"
            rows="10"
            variant="outlined"
            placeholder='{"fields": [{"name": "id", "type": "int", ...}]}'
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showImportDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="importSchema">Import</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { validateSchema } from '@/services/schemaService';
import FieldEditorDialog from './FieldEditorDialog.vue';
import FileUploadSchemaGenerator from './FileUploadSchemaGenerator.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'validate']);

// State
const localFields = ref([...props.modelValue]);
const showFieldDialog = ref(false);
const showImportDialog = ref(false);
const editingField = ref(null);
const editingIndex = ref(-1);
const importJson = ref('');

// Data types mapping
const DATA_TYPES = [
  { value: 'varchar', label: 'String' },
  { value: 'int', label: 'Integer' },
  { value: 'bigint', label: 'Big Integer' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date Time' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text (Long)' }
];

// Computed
const requiredFieldsCount = computed(() => {
  return localFields.value.filter(f => f.required).length;
});

const existingFieldNames = computed(() => {
  return localFields.value
    .filter((_, idx) => idx !== editingIndex.value)
    .map(f => f.name.toLowerCase());
});

const validationErrors = computed(() => {
  const result = validateSchema(localFields.value);
  return result.errors;
});

// Separate unique identifier errors from other errors
const uniqueIdentifierErrors = computed(() => {
  return validationErrors.value.filter(error => 
    error.includes('unique identifier') || 
    error.includes('Unique identifier')
  );
});

const otherValidationErrors = computed(() => {
  return validationErrors.value.filter(error => 
    !error.includes('unique identifier') && 
    !error.includes('Unique identifier')
  );
});

// Only show validation errors if there are fields with actual errors
// Don't show "at least one field must be defined" on initial empty state
const shouldShowValidationErrors = computed(() => {
  if (validationErrors.value.length === 0) return false;
  
  // If there are no fields, don't show the "at least one field" error
  if (localFields.value.length === 0) return false;
  
  // If there are fields, show any validation errors
  return true;
});

// Watch for changes and emit
watch(localFields, () => {
  emit('update:modelValue', localFields.value);
  const validation = validateSchema(localFields.value);
  emit('validate', validation);
}, { deep: true });

// Methods
function getTypeLabel(type) {
  const dataType = DATA_TYPES.find(dt => dt.value === type);
  return dataType ? dataType.label : type;
}

function addField() {
  editingField.value = {
    id: `field-${Date.now()}-${Math.random()}`,
    name: '',
    type: 'varchar',
    isPrimaryKey: false,
    required: false,
    nullable: true,
    description: '',
    order: localFields.value.length + 1
  };
  editingIndex.value = -1;
  showFieldDialog.value = true;
}

function editField(index) {
  editingField.value = { ...localFields.value[index] };
  editingIndex.value = index;
  showFieldDialog.value = true;
}

function saveField(field) {
  // If this field is marked as unique identifier, unmark all other fields
  if (field.isPrimaryKey) {
    localFields.value.forEach((f, idx) => {
      if (idx !== editingIndex.value) {
        f.isPrimaryKey = false;
      }
    });
  }
  
  if (editingIndex.value >= 0) {
    // Update existing field
    localFields.value[editingIndex.value] = field;
  } else {
    // Add new field
    localFields.value.push(field);
  }
  showFieldDialog.value = false;
}

function removeField(index) {
  localFields.value.splice(index, 1);
  // Update order
  localFields.value.forEach((f, i) => {
    f.order = i + 1;
  });
}

function moveFieldUp(index) {
  if (index > 0) {
    const temp = localFields.value[index];
    localFields.value[index] = localFields.value[index - 1];
    localFields.value[index - 1] = temp;
    // Update order
    localFields.value.forEach((f, i) => {
      f.order = i + 1;
    });
  }
}

function moveFieldDown(index) {
  if (index < localFields.value.length - 1) {
    const temp = localFields.value[index];
    localFields.value[index] = localFields.value[index + 1];
    localFields.value[index + 1] = temp;
    // Update order
    localFields.value.forEach((f, i) => {
      f.order = i + 1;
    });
  }
}

function exportSchema() {
  const schema = {
    fields: localFields.value.map(f => ({
      name: f.name,
      type: f.type,
      required: f.required,
      nullable: f.nullable,
      description: f.description
    }))
  };
  
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'schema.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importSchema() {
  try {
    const schema = JSON.parse(importJson.value);
    
    if (!schema.fields || !Array.isArray(schema.fields)) {
      throw new Error('Invalid schema format: missing fields array');
    }
    
    // Validate and import fields
    const importedFields = schema.fields.map((f, index) => {
      // Fix Required/Nullable conflict: if both are true, prioritize Required
      let required = f.required || false;
      let nullable = f.nullable !== false;
      
      if (required && nullable) {
        // If both are true, make it Required and not Nullable
        nullable = false;
      }
      
      return {
        id: `field-${Date.now()}-${index}`,
        name: f.name || '',
        type: f.type || 'varchar',
        required,
        nullable,
        description: f.description || '',
        order: index + 1
      };
    });
    
    localFields.value = importedFields;
    showImportDialog.value = false;
    importJson.value = '';
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  }
}

function handleSchemaGenerated(fields) {
  localFields.value = fields;
}
</script>

<style scoped>
.schema-editor {
  width: 100%;
}
</style>
