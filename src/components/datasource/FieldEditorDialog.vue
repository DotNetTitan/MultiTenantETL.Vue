<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex align-center">
        {{ field?.id && field.id.startsWith('field-') && field.name ? 'Edit Field' : 'Add Field' }}
        <v-spacer />
        <v-btn
          icon
          variant="text"
          @click="$emit('update:modelValue', false)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSave">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="localField.name"
                label="Field Name"
                placeholder="e.g., email, firstName, orderDate"
                variant="outlined"
                :rules="nameRules"
                required
                hint="Use letters, numbers, and underscores only"
                persistent-hint
              />
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="localField.type"
                :items="dataTypes"
                label="Data Type"
                variant="outlined"
                :rules="[v => !!v || 'Data type is required']"
                required
              >
                <template #item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon>{{ item.raw.icon }}</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <v-col cols="12" md="4">
              <v-checkbox
                v-model="localField.isPrimaryKey"
                label="Unique Identifier"
                hint="Uniquely identifies each record"
                persistent-hint
                color="primary"
                @update:model-value="handlePrimaryKeyChange"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-checkbox
                v-model="localField.required"
                label="Required Field"
                hint="Field must have a value"
                persistent-hint
                @update:model-value="handleRequiredChange"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-checkbox
                v-model="localField.nullable"
                label="Nullable"
                hint="Field can contain NULL values"
                persistent-hint
                @update:model-value="handleNullableChange"
              />
            </v-col>

            <!-- Validation Alert for Required/Nullable Conflict -->
            <v-col v-if="localField.required && localField.nullable" cols="12">
              <v-alert type="error" density="compact" variant="tonal">
                <v-icon start>mdi-alert-circle</v-icon>
                A field cannot be both Required and Nullable. Please choose one.
              </v-alert>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="localField.description"
                label="Description (Optional)"
                placeholder="Describe the purpose of this field..."
                variant="outlined"
                rows="3"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('update:modelValue', false)">
          Close
        </v-btn>
        <v-btn color="primary" @click="handleSave">
          Save Field
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  field: {
    type: Object,
    default: null
  },
  existingFieldNames: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

// Data types with icons
const dataTypes = [
  { value: 'varchar', title: 'String', icon: 'mdi-text' },
  { value: 'int', title: 'Integer', icon: 'mdi-numeric' },
  { value: 'bigint', title: 'Big Integer', icon: 'mdi-numeric' },
  { value: 'decimal', title: 'Decimal', icon: 'mdi-decimal' },
  { value: 'boolean', title: 'Boolean', icon: 'mdi-checkbox-marked' },
  { value: 'date', title: 'Date', icon: 'mdi-calendar' },
  { value: 'datetime', title: 'Date Time', icon: 'mdi-calendar-clock' },
  { value: 'timestamp', title: 'Timestamp', icon: 'mdi-clock' },
  { value: 'json', title: 'JSON', icon: 'mdi-code-json' },
  { value: 'text', title: 'Text (Long)', icon: 'mdi-text-long' }
];

// Local state
const formRef = ref(null);
const localField = ref({
  id: '',
  name: '',
  type: 'varchar',
  isPrimaryKey: false,
  required: false,
  nullable: true,
  description: '',
  order: 1
});

// Validation rules
const nameRules = [
  v => !!v || 'Field name is required',
  v => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v) || 'Field name must start with a letter or underscore and contain only letters, numbers, and underscores',
  v => !props.existingFieldNames.includes(v.toLowerCase()) || 'Field name already exists'
];

// Watch for field changes
watch(() => props.field, (newField) => {
  if (newField) {
    localField.value = { ...newField };
  } else {
    localField.value = {
      id: `field-${Date.now()}-${Math.random()}`,
      name: '',
      type: 'varchar',
      isPrimaryKey: false,
      required: false,
      nullable: true,
      description: '',
      order: 1
    };
  }
}, { immediate: true });

// Methods
function handlePrimaryKeyChange(value) {
  // If Unique Identifier is checked, automatically set Required and uncheck Nullable
  if (value) {
    localField.value.required = true;
    localField.value.nullable = false;
  }
}

function handleRequiredChange(value) {
  // If Required is checked, uncheck Nullable
  if (value) {
    localField.value.nullable = false;
  }
  // If Required is unchecked and field is Unique Identifier, uncheck it
  if (!value && localField.value.isPrimaryKey) {
    localField.value.isPrimaryKey = false;
  }
}

function handleNullableChange(value) {
  // If Nullable is checked, uncheck Required and Unique Identifier
  if (value) {
    localField.value.required = false;
    localField.value.isPrimaryKey = false;
  }
}

async function handleSave() {
  const { valid } = await formRef.value.validate();
  
  // Additional validation: Required and Nullable cannot both be true
  if (localField.value.required && localField.value.nullable) {
    return; // Don't save if both are checked
  }
  
  if (valid) {
    emit('save', { ...localField.value });
    emit('update:modelValue', false);
  }
}
</script>
