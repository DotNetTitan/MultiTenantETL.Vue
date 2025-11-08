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

        <!-- Transformations Chain -->
        <v-col cols="12">
          <div class="d-flex align-center mb-2">
            <span class="text-subtitle-2">Transformations (Optional)</span>
            <v-spacer />
            <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-plus"
              @click="addTransformation"
            >
              Add Transformation
            </v-btn>
          </div>
          
          <div v-if="!localMapping.transformations || localMapping.transformations.length === 0" class="text-caption text-grey pa-3 text-center">
            No transformations applied. Click "Add Transformation" to modify data during mapping.
          </div>
          
          <div v-else class="transformations-chain">
            <v-card
              v-for="(trans, tIndex) in localMapping.transformations"
              :key="tIndex"
              variant="outlined"
              class="mb-2"
            >
              <v-card-text class="py-2">
                <v-row dense align="center">
                  <v-col cols="1" class="text-center">
                    <v-chip size="small" color="primary">{{ tIndex + 1 }}</v-chip>
                  </v-col>
                  <v-col cols="9">
                    <v-select
                      v-model="trans.transformationId"
                      :items="compatibleTransformationItems"
                      label="Select Transformation"
                      density="compact"
                      hide-details
                    >
                      <template v-slot:item="{ item, props }">
                        <v-list-item v-bind="props">
                          <template v-slot:prepend>
                            <v-avatar :color="getTransformationColor(item.raw.type)" size="28">
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
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="2" class="text-right">
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      :disabled="tIndex === 0"
                      @click="moveTransformationUp(tIndex)"
                    >
                      <v-icon size="small">mdi-arrow-up</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      :disabled="tIndex === localMapping.transformations.length - 1"
                      @click="moveTransformationDown(tIndex)"
                    >
                      <v-icon size="small">mdi-arrow-down</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      color="error"
                      @click="removeTransformation(tIndex)"
                    >
                      <v-icon size="small">mdi-close</v-icon>
                    </v-btn>
                  </v-col>
                  
                  <!-- Transformation Config -->
                  <v-col v-if="getTransformationById(trans.transformationId) && needsConfig(trans.transformationId)" cols="12">
                    <v-text-field
                      v-if="getTransformationById(trans.transformationId).type === 'Map'"
                      v-model="trans.config.separator"
                      label="Separator"
                      hint="Character to use between combined fields"
                      persistent-hint
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
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

const validationErrors = computed(() => {
  const errors = [];
  
  const hasSourceFields = localMapping.value.sourceFields && localMapping.value.sourceFields.length > 0;
  const hasDestinationField = !!localMapping.value.destinationField;
  
  // Don't show ANY errors until BOTH fields have been filled at least once
  if (!hasSourceFields || !hasDestinationField) {
    return [];
  }
  
  // Check if multiple source fields require at least one transformation
  if (localMapping.value.sourceFields.length > 1 && 
      (!localMapping.value.transformations || localMapping.value.transformations.length === 0)) {
    errors.push('Multiple source fields require at least one transformation');
  }
  
  return errors;
});

// Transformation chain methods
function addTransformation() {
  if (!localMapping.value.transformations) {
    localMapping.value.transformations = [];
  }
  localMapping.value.transformations.push({
    transformationId: null,
    config: {},
    order: localMapping.value.transformations.length + 1
  });
}

function removeTransformation(index) {
  localMapping.value.transformations.splice(index, 1);
  // Update order
  localMapping.value.transformations.forEach((t, i) => {
    t.order = i + 1;
  });
}

function moveTransformationUp(index) {
  if (index > 0) {
    const temp = localMapping.value.transformations[index];
    localMapping.value.transformations[index] = localMapping.value.transformations[index - 1];
    localMapping.value.transformations[index - 1] = temp;
    // Update order
    localMapping.value.transformations.forEach((t, i) => {
      t.order = i + 1;
    });
  }
}

function moveTransformationDown(index) {
  if (index < localMapping.value.transformations.length - 1) {
    const temp = localMapping.value.transformations[index];
    localMapping.value.transformations[index] = localMapping.value.transformations[index + 1];
    localMapping.value.transformations[index + 1] = temp;
    // Update order
    localMapping.value.transformations.forEach((t, i) => {
      t.order = i + 1;
    });
  }
}

function getTransformationById(id) {
  if (!id) return null;
  return props.transformations.find(t => t.id === id);
}

function needsConfig(transformationId) {
  const trans = getTransformationById(transformationId);
  if (!trans) return false;
  return trans.type === 'Map';
}

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

// Ensure arrays are initialized
if (!localMapping.value.sourceFields) {
  localMapping.value.sourceFields = [];
}
if (!localMapping.value.destinationField) {
  localMapping.value.destinationField = '';
}
if (!localMapping.value.transformations) {
  localMapping.value.transformations = [];
}
</script>

<style scoped>
.v-card-title {
  padding: 8px 16px;
}

.transformations-chain {
  border: 1px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 4px;
  padding: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}
</style>
