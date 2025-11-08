<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <span class="text-subtitle-1">Mapping {{ index + 1 }}</span>
      <v-spacer />
      <v-btn
        icon
        variant="text"
        size="small"
        :disabled="!canMoveUp"
        @click="$emit('move-up')"
      >
        <v-icon>mdi-arrow-up</v-icon>
      </v-btn>
      <v-btn
        icon
        variant="text"
        size="small"
        :disabled="!canMoveDown"
        @click="$emit('move-down')"
      >
        <v-icon>mdi-arrow-down</v-icon>
      </v-btn>
      <v-btn
        icon
        variant="text"
        size="small"
        color="error"
        @click="$emit('remove')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- Source Fields -->
        <v-col cols="12" md="5">
          <v-select
            v-model="localMapping.sourceFields"
            :items="sourceFieldItems"
            label="Source Field(s)"
            multiple
            chips
            closable-chips
          >
            <template v-slot:chip="{ item, props }">
              <v-chip v-bind="props" size="small">
                {{ item.title }}
              </v-chip>
            </template>
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:title>
                  {{ item.title }}
                </template>
                <template v-slot:subtitle>
                  <v-chip size="x-small" class="mt-1">{{ item.raw.type }}</v-chip>
                </template>
              </v-list-item>
            </template>
            <template v-slot:append-item>
              <v-divider class="mt-2" />
              <v-list-item>
                <v-list-item-subtitle class="text-caption">
                  Select multiple fields to combine them with a transformation
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <!-- Arrow -->
        <v-col cols="12" md="2" class="d-flex align-center justify-center">
          <v-icon size="large" color="primary">mdi-arrow-right</v-icon>
        </v-col>

        <!-- Destination Field -->
        <v-col cols="12" md="5">
          <v-select
            v-model="localMapping.destinationField"
            :items="destinationFieldItems"
            label="Destination Field"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:title>
                  {{ item.title }}
                  <v-chip
                    v-if="item.raw.required"
                    size="x-small"
                    color="error"
                    class="ml-2"
                  >
                    Required
                  </v-chip>
                </template>
                <template v-slot:subtitle>
                  <v-chip size="x-small" class="mt-1">{{ item.raw.type }}</v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <!-- Transformation -->
        <v-col cols="12">
          <v-select
            v-model="localMapping.transformationId"
            :items="compatibleTransformationItems"
            label="Transformation (Optional)"
            clearable
            :hint="transformationHint"
            persistent-hint
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-avatar :color="getTransformationColor(item.raw.type)" size="32">
                    <v-icon color="white" size="small">
                      {{ getTransformationIcon(item.raw.type) }}
                    </v-icon>
                  </v-avatar>
                </template>
                <template v-slot:title>
                  {{ item.title }}
                </template>
                <template v-slot:subtitle>
                  <v-chip size="x-small" class="mt-1" variant="tonal">{{ item.raw.type }}</v-chip>
                  <span class="ml-2 text-caption">{{ item.raw.description }}</span>
                </template>
              </v-list-item>
            </template>
            <template v-if="compatibleTransformationItems.length === 0" v-slot:no-data>
              <v-list-item>
                <v-list-item-title class="text-caption text-grey">
                  No compatible transformations available
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <!-- Transformation Config (if transformation selected) -->
        <v-col v-if="selectedTransformation && hasConfigOptions" cols="12">
          <v-card variant="tonal" color="info">
            <v-card-title class="text-subtitle-2">
              Transformation Configuration
            </v-card-title>
            <v-card-text>
              <!-- Simple config for now - can be expanded -->
              <v-text-field
                v-if="selectedTransformation.type === 'Map'"
                v-model="localMapping.transformationConfig.separator"
                label="Separator"
                hint="Character to use between combined fields"
                persistent-hint
                density="compact"
              />
              <p v-else class="text-caption text-grey">
                No additional configuration needed for this transformation
              </p>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Validation Errors -->
        <v-col v-if="validationErrors.length > 0" cols="12">
          <v-alert type="error" density="compact">
            <ul class="pl-4">
              <li v-for="(error, idx) in validationErrors" :key="idx">{{ error }}</li>
            </ul>
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getCompatibleTransformations } from '@/services/schemaService';

const props = defineProps({
  mapping: {
    type: Object,
    required: true
  },
  sourceFields: {
    type: Array,
    required: true
  },
  destinationFields: {
    type: Array,
    required: true
  },
  transformations: {
    type: Array,
    default: () => []
  },
  index: {
    type: Number,
    required: true
  },
  canMoveUp: {
    type: Boolean,
    default: false
  },
  canMoveDown: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:mapping', 'remove', 'move-up', 'move-down']);

// Use props.mapping directly with v-model binding
const localMapping = ref({ ...props.mapping });

// Watch local changes and emit
watch(localMapping, (newVal) => {
  emit('update:mapping', { ...newVal });
}, { deep: true });

// Computed properties
const sourceFieldItems = computed(() => {
  if (!props.sourceFields || !Array.isArray(props.sourceFields)) {
    return [];
  }
  return props.sourceFields.map(field => ({
    title: field.name,
    value: field.name,
    type: field.type,
    raw: field
  }));
});

const destinationFieldItems = computed(() => {
  if (!props.destinationFields || !Array.isArray(props.destinationFields)) {
    return [];
  }
  return props.destinationFields.map(field => ({
    title: field.name,
    value: field.name,
    type: field.type,
    required: field.required,
    raw: field
  }));
});

const compatibleTransformations = computed(() => {
  if (!localMapping.value.sourceFields || localMapping.value.sourceFields.length === 0) {
    return [];
  }
  
  if (!localMapping.value.destinationField) {
    return [];
  }
  
  const sourceFieldObjs = props.sourceFields.filter(f => 
    localMapping.value.sourceFields.includes(f.name)
  );
  
  const destFieldObj = props.destinationFields.find(f => 
    f.name === localMapping.value.destinationField
  );
  
  return getCompatibleTransformations(
    props.transformations,
    localMapping.value.sourceFields,
    destFieldObj,
    { fields: props.sourceFields },
    { fields: props.destinationFields }
  );
});

const compatibleTransformationItems = computed(() => {
  return compatibleTransformations.value.map(trans => ({
    title: trans.name,
    value: trans.id,
    type: trans.type,
    description: trans.description || '',
    raw: trans
  }));
});

const selectedTransformation = computed(() => {
  if (!localMapping.value.transformationId) return null;
  return props.transformations.find(t => t.id === localMapping.value.transformationId);
});

const hasConfigOptions = computed(() => {
  if (!selectedTransformation.value) return false;
  // For now, only Map transformations have config
  return selectedTransformation.value.type === 'Map';
});

const transformationHint = computed(() => {
  if (localMapping.value.sourceFields && localMapping.value.sourceFields.length > 1) {
    return 'Transformation required for multiple source fields';
  }
  return 'Optional: Apply transformation to modify data during mapping';
});

const validationErrors = computed(() => {
  const errors = [];
  
  const hasSourceFields = localMapping.value.sourceFields && localMapping.value.sourceFields.length > 0;
  const hasDestinationField = !!localMapping.value.destinationField;
  
  // Don't show ANY errors until BOTH fields have been filled at least once
  // This prevents premature validation messages while user is still filling the form
  if (!hasSourceFields || !hasDestinationField) {
    return []; // Still filling out the mapping
  }
  
  // Only show transformation error when both fields are filled
  if (localMapping.value.sourceFields.length > 1 && !localMapping.value.transformationId) {
    errors.push('Multiple source fields require a transformation');
  }
  
  return errors;
});

// Helper functions
function getTransformationColor(type) {
  const colors = {
    'Filter': 'blue',
    'Map': 'green',
    'Aggregation': 'orange',
    'Script': 'purple',
    'Join': 'teal'
  };
  return colors[type] || 'grey';
}

function getTransformationIcon(type) {
  const icons = {
    'Filter': 'mdi-filter',
    'Map': 'mdi-map',
    'Aggregation': 'mdi-chart-bar',
    'Script': 'mdi-code-braces',
    'Join': 'mdi-link-variant'
  };
  return icons[type] || 'mdi-cog';
}

// Initialize transformation config if needed
if (!localMapping.value.transformationConfig) {
  localMapping.value.transformationConfig = {};
}

// Ensure arrays are initialized
if (!localMapping.value.sourceFields) {
  localMapping.value.sourceFields = [];
}
if (!localMapping.value.destinationField) {
  localMapping.value.destinationField = '';
}
</script>

<style scoped>
.v-card-title {
  padding: 8px 16px;
}
</style>
