<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
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
        :options="availableDataSources"
        :error="errors.sourceId"
        required
      />

      <FormInput
        v-model="form.destinationId"
        label="Destination"
        type="select"
        :options="availableDataSources"
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
        <button
          type="button"
          class="btn btn-secondary"
          @click="showAddTransformation = true"
        >
          Add Transformation
        </button>
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

    <!-- Scheduling -->
    <div class="border rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium">Schedule</h3>
        <label class="inline-flex items-center">
          <input
            type="checkbox"
            v-model="form.isScheduled"
            class="form-checkbox"
          />
          <span class="ml-2">Enable Scheduling</span>
        </label>
      </div>

      <div v-if="form.isScheduled" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            v-model="form.schedule.frequency"
            label="Frequency"
            type="select"
            :options="scheduleFrequencies"
            :error="errors.frequency"
            required
          />

          <FormInput
            v-if="form.schedule.frequency !== 'Custom'"
            v-model="form.schedule.time"
            label="Time"
            type="time"
            :error="errors.time"
            required
          />
        </div>

        <div v-if="form.schedule.frequency === 'Custom'">
          <FormInput
            v-model="form.schedule.cronExpression"
            label="Cron Expression"
            :error="errors.cronExpression"
            required
            placeholder="* * * * *"
          />
          <div class="text-sm text-gray-600 mt-1">
            Format: Minute Hour Day Month DayOfWeek
          </div>
        </div>

        <FormInput
          v-model="form.schedule.timezone"
          label="Timezone"
          type="select"
          :options="timezones"
          :error="errors.timezone"
          required
        />
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
        @click="handleValidatePipeline"
        :disabled="!isFormValid || validating"
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

    <!-- Add Transformation Dialog -->
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

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  dataSources: {
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

const scheduleFrequencies = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Custom'];
const logLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
const timezones = Intl.supportedValuesOf('timeZone');

const form = ref({
  name: '',
  description: '',
  sourceId: '',
  destinationId: '',
  transformations: [],
  isScheduled: false,
  schedule: {
    frequency: 'Daily',
    time: '00:00',
    cronExpression: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  },
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
const showAddTransformation = ref(false);
const sourceSchema = ref(null);
const currentSchema = ref(null);

const availableDataSources = computed(() => 
  props.dataSources.map(ds => ({
    value: ds.id,
    label: ds.name
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
  
  if (!baseFields.every(field => form.value[field])) return false;

  if (form.value.isScheduled) {
    if (!form.value.schedule.frequency) return false;
    if (form.value.schedule.frequency === 'Custom') {
      if (!form.value.schedule.cronExpression) return false;
    } else {
      if (!form.value.schedule.time) return false;
    }
    if (!form.value.schedule.timezone) return false;
  }

  return true;
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

const handleAddTransformation = (transformation) => {
  form.value.transformations.push(transformation);
  showAddTransformation.value = false;
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

const handleSubmit = () => {
  if (!isFormValid.value) return;
  
  saving.value = true;
  errors.value = {};

  try {
    emit('save', form.value);
  } catch (err) {
    errors.value.submit = err.message;
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