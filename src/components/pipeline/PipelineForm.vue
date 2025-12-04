<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-2 gap-4">
      <FormInput
        v-model="form.name"
        label="Name"
        :error="errors.name"
        required
      />
      
      <FormInput
        v-model="form.description"
        label="Description"
        type="textarea"
        :error="errors.description"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <FormInput
        v-model="form.sourceId"
        label="Source"
        type="select"
        :options="availableConnectors"
        :error="errors.sourceId"
        required
      />

      <FormInput
        v-model="form.destinationId"
        label="Destination"
        type="select"
        :options="availableConnectors"
        :error="errors.destinationId"
        required
      />
    </div>

    <!-- Transformations -->
    <div class="border rounded-lg p-4">
      <h3 class="text-lg font-medium mb-4">Transformations</h3>
      <div class="space-y-4">
        <TransformationList
          v-model="form.transformations"
          :input-schema="sourceSchema"
          @update:schema="handleSchemaUpdate"
        />
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="showTransformationSelector = true"
        >
          Add Transformation
        </v-btn>
      </div>
    </div>

    <!-- Error Handling -->
    <div class="border rounded-lg p-4">
      <h3 class="text-lg font-medium mb-4">Error Handling</h3>
      <div class="grid grid-cols-2 gap-4">
        <FormInput
          v-model="form.errorStrategy"
          label="Pipeline Error Strategy"
          type="select"
          :options="Object.keys(errorStrategies)"
          :error="errors.errorStrategy"
          required
        />

        <div v-if="form.errorStrategy === 'RETRY'" class="space-y-4">
          <FormInput
            v-model="form.errorConfig.maxRetries"
            label="Max Retries"
            type="number"
            :min="1"
            :error="errors.maxRetries"
          />
          
          <FormInput
            v-model="form.errorConfig.retryDelay"
            label="Retry Delay (seconds)"
            type="number"
            :min="1"
            :error="errors.retryDelay"
          />
        </div>
      </div>
    </div>

    <!-- Schedule Info (read-only, managed separately) -->
    <div class="border rounded-lg p-4">
      <v-row align="center">
        <v-col>
          <h3 class="text-lg font-medium">{{ $t('pipelines.schedule') }}</h3>
        </v-col>
        <v-col cols="auto">
          <v-btn
            v-if="form.id"
            color="primary"
            variant="tonal"
            size="small"
            :to="{ name: 'schedules' }"
            prepend-icon="mdi-calendar-clock"
          >
            {{ $t('pipelines.manageAllSchedules') }}
          </v-btn>
        </v-col>
      </v-row>
      <div class="text-body-2 text-grey mt-2">
        {{ form.id ? $t('pipelines.scheduleAfterSaveShort').replace('Save the pipeline first to configure', 'Use the Schedules page to configure') : $t('pipelines.scheduleAfterSaveShort') }}
      </div>
    </div>

    <!-- Dependencies -->
    <div class="border rounded-lg p-4">
      <h3 class="text-lg font-medium mb-4">Dependencies</h3>
      <div class="space-y-4">
        <FormInput
          v-model="form.dependencies"
          label="Pipeline Dependencies"
          type="multiselect"
          :options="availableDependencies"
          :error="errors.dependencies"
        />
        <div class="text-sm text-gray-600">
          Selected pipelines must complete successfully before this pipeline starts
        </div>
      </div>
    </div>

    <!-- Logging -->
    <div class="border rounded-lg p-4">
      <h3 class="text-lg font-medium mb-4">Logging</h3>
      <div class="grid grid-cols-2 gap-4">
        <FormInput
          v-model="form.logging.level"
          label="Log Level"
          type="select"
          :options="logLevels"
          :error="errors.logLevel"
          required
        />

        <FormInput
          v-model="form.logging.retention"
          label="Log Retention (days)"
          type="number"
          :min="1"
          :error="errors.logRetention"
          required
        />
      </div>
    </div>

    <div class="flex justify-between">
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="!isFormValid || validating"
        @click="handleValidatePipeline"
      >
        {{ validating ? 'Validating...' : 'Validate Pipeline' }}
      </button>

      <div class="space-x-2">
        <button
          type="button"
          class="btn btn-outline"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid || saving"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Transformation Selector Dialog -->
    <TransformationSelector
      v-model="showTransformationSelector"
      :exclude-ids="form.transformations.map(t => t.id)"
      @select="handleSelectTransformation"
      @create-new="handleCreateNewTransformation"
      @close="showTransformationSelector = false"
    />

    <!-- Create New Transformation Dialog -->
    <TransformationDialog
      v-if="showAddTransformation"
      :input-schema="currentSchema"
      @save="handleAddTransformation"
      @close="showAddTransformation = false"
    />
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { usePipeline } from '@/composables/usePipeline';
import FormInput from '@/components/form/FormInput.vue';
import TransformationList from './TransformationList.vue';
import TransformationDialog from './TransformationDialog.vue';
import TransformationSelector from './TransformationSelector.vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  connectors: {
    type: Array,
    default: () => []
  },
  availablePipelines: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['save', 'cancel', 'notify']);

const { validatePipeline, errorStrategies } = usePipeline();

const logLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

const form = ref({
  name: '',
  description: '',
  sourceId: '',
  destinationId: '',
  transformations: [],
  errorStrategy: 'STOP',
  errorConfig: {
    maxRetries: 3,
    retryDelay: 60
  },
  dependencies: [],
  logging: {
    level: 'INFO',
    retention: 30
  },
  ...props.initialData
});

const errors = ref({});
const validating = ref(false);
const saving = ref(false);
const showTransformationSelector = ref(false);
const showAddTransformation = ref(false);
const sourceSchema = ref(null);
const currentSchema = ref(null);

// Clear errors when form changes
watch(() => form.value, () => {
  clearErrors();
}, { deep: true });

function clearErrors() {
  errors.value = {};
}

const validateForm = () => {
  const newErrors = {};
  
  // Validate required fields
  if (!form.value.name?.trim()) {
    newErrors.name = 'Pipeline name is required';
  }
  
  if (!form.value.sourceId) {
    newErrors.sourceId = 'Source is required';
  }
  
  if (!form.value.destinationId) {
    newErrors.destinationId = 'Destination is required';
  }

  // Validate error handling config
  if (form.value.errorStrategy === 'RETRY') {
    if (!form.value.errorConfig?.maxRetries || form.value.errorConfig.maxRetries < 1) {
      newErrors.maxRetries = 'Max retries must be at least 1';
    }
    if (!form.value.errorConfig?.retryDelay || form.value.errorConfig.retryDelay < 1) {
      newErrors.retryDelay = 'Retry delay must be at least 1 second';
    }
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const availableConnectors = computed(() => 
  props.connectors.map(c => ({
    value: c.id,
    label: c.name
  }))
);

const availableDependencies = computed(() => 
  props.availablePipelines
    .filter(p => p.id !== props.initialData?.id)
    .map(p => ({
      value: p.id,
      label: p.name
    }))
);

const isFormValid = computed(() => {
  const baseFields = ['name', 'sourceId', 'destinationId', 'errorStrategy'];
  return baseFields.every(field => form.value[field]);
});

watch(() => form.value.sourceId, async (newSourceId) => {
  if (newSourceId) {
    // In real implementation, fetch schema from backend
    sourceSchema.value = getMockSchema(newSourceId);
    currentSchema.value = sourceSchema.value;
  } else {
    sourceSchema.value = null;
    currentSchema.value = null;
  }
});

const handleSchemaUpdate = (schema) => {
  currentSchema.value = schema;
};

const handleSelectTransformation = (transformation) => {
  // Add the selected existing transformation to the pipeline
  form.value.transformations.push({
    ...transformation,
    executionOrder: form.value.transformations.length + 1
  });
  
  // Schema will be updated by TransformationList component
};

const handleCreateNewTransformation = () => {
  showTransformationSelector.value = false;
  showAddTransformation.value = true;
};

const handleAddTransformation = (transformation) => {
  form.value.transformations.push(transformation);
  showAddTransformation.value = false;
  
  // Schema will be updated by TransformationList component
};

const handleValidatePipeline = async () => {
  if (!isFormValid.value) return;
  
  validating.value = true;
  errors.value = {};

  try {
    const result = await validatePipeline(form.value);
    if (result.isValid) {
      emit('notify', {
        type: 'success',
        message: 'Pipeline validation successful!'
      });
    } else {
      errors.value = result.errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {});
      emit('notify', {
        type: 'error',
        message: 'Validation failed. Please check the errors.'
      });
    }
  } catch (err) {
    errors.value.validation = err.message;
  } finally {
    validating.value = false;
  }
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  saving.value = true;
  errors.value = {};

  try {
    // Validate entire pipeline before saving
    const pipelineValidation = await validatePipeline(form.value);
    if (!pipelineValidation.isValid) {
      errors.value = pipelineValidation.errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {});
      emit('notify', {
        type: 'error',
        message: 'Pipeline validation failed. Please review the errors.'
      });
      return;
    }

    emit('save', form.value);
  } catch (err) {
    errors.value.submit = err.message;
    emit('notify', {
      type: 'error',
      message: 'Failed to save pipeline: ' + err.message
    });
  } finally {
    saving.value = false;
  }
};

// Mock function for demo
const getMockSchema = (sourceId) => {
  return {
    columns: [
      { name: 'id', type: 'int', nullable: false },
      { name: 'name', type: 'varchar', nullable: false },
      { name: 'email', type: 'varchar', nullable: false },
      { name: 'created_at', type: 'datetime', nullable: false }
    ]
  };
};
</script>