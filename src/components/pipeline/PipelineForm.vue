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

    <!-- Scheduling -->
    <div class="border rounded-lg p-4">
      <v-row align="center" class="mb-4">
        <v-col>
          <h3 class="text-lg font-medium">Schedule</h3>
        </v-col>
        <v-col cols="auto">
          <v-switch
            v-model="form.isScheduled"
            label="Schedule this pipeline"
            color="primary"
            hide-details
          ></v-switch>
        </v-col>
      </v-row>

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
import { useTranslatedMetadata } from '@/composables/useTranslatedMetadata';
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
const { scheduleFrequencies: metadataFrequencies } = useTranslatedMetadata();

const scheduleFrequencies = computed(() => 
  metadataFrequencies.value.map(freq => freq.value)
);
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

  // Validate schedule if enabled
  if (form.value.isScheduled) {
    if (!form.value.schedule.frequency) {
      newErrors.frequency = 'Schedule frequency is required';
    }
    if (form.value.schedule.frequency === 'Custom') {
      if (!form.value.schedule.cronExpression) {
        newErrors.cronExpression = 'Cron expression is required';
      }
      // Add basic cron expression validation here if needed
    } else {
      if (!form.value.schedule.time) {
        newErrors.scheduleTime = 'Schedule time is required';
      }
    }
    if (!form.value.schedule.timezone) {
      newErrors.timezone = 'Timezone is required';
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

const validateSchedule = (schedule) => {
  const errors = [];
  
  if (!schedule.frequency) {
    errors.push('Schedule frequency is required');
    return errors;
  }

  switch (schedule.frequency) {
    case 'Custom':
      if (!schedule.cronExpression?.trim()) {
        errors.push('Cron expression is required');
      } else if (!isValidCronExpression(schedule.cronExpression)) {
        errors.push('Invalid cron expression format');
      }
      break;

    case 'Hourly':
      if (!schedule.minute || schedule.minute < 0 || schedule.minute > 59) {
        errors.push('Minute must be between 0 and 59');
      }
      break;

    case 'Daily':
    case 'Weekly':
    case 'Monthly':
      if (!schedule.time) {
        errors.push('Time is required');
      } else if (!isValidTimeFormat(schedule.time)) {
        errors.push('Invalid time format');
      }
      
      if (schedule.frequency === 'Weekly' && !schedule.dayOfWeek) {
        errors.push('Day of week is required');
      }
      
      if (schedule.frequency === 'Monthly' && !schedule.dayOfMonth) {
        errors.push('Day of month is required');
      }
      break;
  }

  if (!schedule.timezone) {
    errors.push('Timezone is required');
  } else if (!Intl.supportedValuesOf('timeZone').includes(schedule.timezone)) {
    errors.push('Invalid timezone');
  }

  return errors;
};

const isValidCronExpression = (cron) => {
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|(\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))) (\*|([0-9]|1[0-9]|2[0-3])|(\*\/([0-9]|1[0-9]|2[0-3]))) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|(\*\/([1-9]|1[0-9]|2[0-9]|3[0-1]))) (\*|([1-9]|1[0-2])|(\*\/([1-9]|1[0-2]))) (\*|([0-6])|(\*\/([0-6])))$/;
  return cronRegex.test(cron.trim());
};

const isValidTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time.trim());
};

const getNextExecutions = (schedule, count = 5) => {
  if (!schedule.frequency) return [];

  const now = new Date();
  const executions = [];
  let date = new Date(now);

  try {
    switch (schedule.frequency) {
      case 'Hourly':
        for (let i = 0; i < count; i++) {
          date = new Date(date);
          date.setMinutes(schedule.minute || 0);
          date.setSeconds(0);
          date.setMilliseconds(0);
          if (date <= now) {
            date.setHours(date.getHours() + 1);
          }
          executions.push(new Date(date));
          date.setHours(date.getHours() + 1);
        }
        break;

      case 'Daily':
        const [hours, minutes] = schedule.time.split(':');
        for (let i = 0; i < count; i++) {
          date = new Date(date);
          date.setHours(parseInt(hours));
          date.setMinutes(parseInt(minutes));
          date.setSeconds(0);
          date.setMilliseconds(0);
          if (date <= now) {
            date.setDate(date.getDate() + 1);
          }
          executions.push(new Date(date));
          date.setDate(date.getDate() + 1);
        }
        break;

      case 'Weekly':
        const targetDay = parseInt(schedule.dayOfWeek);
        const [weeklyHours, weeklyMinutes] = schedule.time.split(':');
        for (let i = 0; i < count; i++) {
          date = new Date(date);
          date.setHours(parseInt(weeklyHours));
          date.setMinutes(parseInt(weeklyMinutes));
          date.setSeconds(0);
          date.setMilliseconds(0);
          
          // Adjust to next occurrence of target day
          while (date.getDay() !== targetDay || date <= now) {
            date.setDate(date.getDate() + 1);
          }
          executions.push(new Date(date));
          date.setDate(date.getDate() + 7);
        }
        break;

      case 'Monthly':
        const monthlyTargetDay = parseInt(schedule.dayOfMonth);
        const [monthlyHours, monthlyMinutes] = schedule.time.split(':');
        for (let i = 0; i < count; i++) {
          date = new Date(date);
          date.setDate(monthlyTargetDay);
          date.setHours(parseInt(monthlyHours));
          date.setMinutes(parseInt(monthlyMinutes));
          date.setSeconds(0);
          date.setMilliseconds(0);
          
          if (date <= now || date.getDate() !== monthlyTargetDay) { // Check if we overflowed to next month
            date.setDate(1); // Reset to first day
            date.setMonth(date.getMonth() + 1); // Go to next month
            date.setDate(monthlyTargetDay); // Try setting target day again
          }
          executions.push(new Date(date));
          date.setMonth(date.getMonth() + 1);
        }
        break;

      case 'Custom':
        // For custom cron expressions, we'd use a cron parser library
        // This is a placeholder for demonstration
        executions.push(new Date(now.getTime() + 3600000)); // +1 hour
        executions.push(new Date(now.getTime() + 7200000)); // +2 hours
        executions.push(new Date(now.getTime() + 10800000)); // +3 hours
        executions.push(new Date(now.getTime() + 14400000)); // +4 hours
        executions.push(new Date(now.getTime() + 18000000)); // +5 hours
        break;
    }
  } catch (err) {
    console.error('Error calculating next executions:', err);
    return [];
  }

  // Convert all dates to the selected timezone
  return executions.map(date => {
    try {
      return new Date(date.toLocaleString('en-US', { timeZone: schedule.timezone }));
    } catch {
      return date;
    }
  });
};

const nextExecutions = computed(() => {
  if (!form.value.isScheduled) return [];
  return getNextExecutions(form.value.schedule);
});

watch(() => [form.value.isScheduled, form.value.schedule], () => {
  if (form.value.isScheduled) {
    const scheduleErrors = validateSchedule(form.value.schedule);
    if (scheduleErrors.length > 0) {
      errors.value.schedule = scheduleErrors;
    } else {
      delete errors.value.schedule;
    }
  } else {
    delete errors.value.schedule;
  }
}, { deep: true });
</script>