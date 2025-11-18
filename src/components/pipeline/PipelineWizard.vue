<template>
  <v-card class="wizard-card" elevation="0">
    <v-stepper v-model="currentStep" alt-labels flat class="wizard-stepper">
      <v-stepper-header>
        <v-stepper-item
          :complete="currentStep > 1"
          :value="1"
          :title="$t('common.basicInfo')"
          :subtitle="$t('pipelines.nameAndDescription')"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :complete="currentStep > 2"
          :value="2"
          :title="$t('pipelines.sourceAndDestination')"
          :subtitle="$t('pipelines.selectConnectors')"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :complete="currentStep > 3"
          :value="3"
          :title="$t('pipelines.fieldMappings')"
          :subtitle="$t('pipeline.mapSourceToDestination')"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :complete="currentStep > 4"
          :value="4"
          :title="$t('pipelines.schedule')"
          :subtitle="$t('pipelines.configureSchedule')"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :value="5"
          :title="$t('common.reviewAndSave')"
          :subtitle="$t('common.reviewConfiguration')"
        />
      </v-stepper-header>

      <v-stepper-window class="stepper-window">
        <!-- Step 1: Basic Info -->
        <v-stepper-window-item :value="1">
          <div class="pa-6">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="pipeline.name"
                  :label="$t('pipelines.pipelineName')"
                  :placeholder="$t('pipelines.pipelineNamePlaceholder')"
                  variant="outlined"
                  :rules="[v => !!v || $t('validation.required', { field: $t('common.name') })]"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="pipeline.description"
                  :label="$t('common.description')"
                  :placeholder="$t('pipelines.descriptionPlaceholder')"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </div>
        </v-stepper-window-item>

        <!-- Step 2: Source & Destination -->
        <v-stepper-window-item :value="2">
          <div class="pa-6">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="blue" class="mr-2">mdi-database-export</v-icon>
                    <span class="text-h6">{{ $t('pipelines.source') }}</span>
                  </div>
                  <v-select
                    v-model="pipeline.sourceId"
                    :items="dataSources"
                    item-title="name"
                    item-value="id"
                    :label="$t('pipelines.selectSource')"
                    variant="outlined"
                    :rules="[v => !!v || $t('pipelines.sourceRequired')]"
                  >
                    <template #prepend-item>
                      <v-list-item
                        :title="$t('pipelines.createNewSource')"
                        prepend-icon="mdi-plus"
                        @click="$emit('create-datasource')"
                      />
                      <v-divider class="mt-2" />
                    </template>
                  </v-select>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="green" class="mr-2">mdi-database-import</v-icon>
                    <span class="text-h6">{{ $t('pipelines.destination') }}</span>
                  </div>
                  <v-select
                    v-model="pipeline.destinationId"
                    :items="dataSources"
                    item-title="name"
                    item-value="id"
                    :label="$t('pipelines.selectDestination')"
                    variant="outlined"
                    :rules="[v => !!v || $t('pipelines.destinationRequired')]"
                  >
                    <template #prepend-item>
                      <v-list-item
                        :title="$t('pipelines.createNewDestination')"
                        prepend-icon="mdi-plus"
                        @click="$emit('create-datasource')"
                      />
                      <v-divider class="mt-2" />
                    </template>
                  </v-select>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-stepper-window-item>

        <!-- Step 3: Field Mappings -->
        <v-stepper-window-item :value="3">
          <div class="pa-6 step-3-content">
            <FieldMappingEditor
              v-if="pipeline.sourceId && pipeline.destinationId"
              v-model="pipeline.fieldMappings"
              :source-id="getDataSourceId(pipeline.sourceId)"
              :destination-id="getDataSourceId(pipeline.destinationId)"
              :transformations="transformations"
              @validate="handleMappingValidation"
            />
            <v-alert v-else type="info" variant="tonal">
              {{ $t('pipelines.selectSourceDestinationFirst') }}
            </v-alert>
          </div>
        </v-stepper-window-item>

        <!-- Step 4: Schedule -->
        <v-stepper-window-item :value="4">
          <div class="pa-6">
            <v-switch
              v-model="pipeline.isScheduled"
              :label="$t('pipelines.enableScheduledExecution')"
              color="primary"
              class="mb-4"
              @update:model-value="initializeSchedule"
            />
            
            <v-expand-transition>
              <v-card v-if="pipeline.isScheduled" variant="outlined" class="pa-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="pipeline.schedule.frequency"
                      :label="$t('pipelines.frequency')"
                      :items="frequencyOptions"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col v-if="pipeline.schedule.frequency !== 'Custom'" cols="12" md="6">
                    <v-text-field
                      v-model="pipeline.schedule.time"
                      :label="$t('pipelines.time')"
                      type="time"
                      variant="outlined"
                      :hint="$t('pipelines.timeFormat24h')"
                      persistent-hint
                    />
                  </v-col>
                  <v-col v-if="pipeline.schedule.frequency === 'Weekly'" cols="12" md="6">
                    <v-select
                      v-model="pipeline.schedule.dayOfWeek"
                      :label="$t('pipelines.dayOfWeek')"
                      :items="dayOfWeekOptions"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col v-if="pipeline.schedule.frequency === 'Monthly'" cols="12" md="6">
                    <v-select
                      v-model="pipeline.schedule.dayOfMonth"
                      :label="$t('pipelines.dayOfMonth')"
                      :items="Array.from({length: 31}, (_, i) => i + 1)"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col v-if="pipeline.schedule.frequency === 'Custom'" cols="12">
                    <v-text-field
                      v-model="pipeline.schedule.cronExpression"
                      :label="$t('pipelines.cronExpression')"
                      variant="outlined"
                      :hint="$t('pipelines.cronExpressionHint')"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="pipeline.schedule.timezone"
                      :label="$t('pipelines.timezone')"
                      :items="timezones"
                      item-title="name"
                      item-value="value"
                      variant="outlined"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-expand-transition>
          </div>
        </v-stepper-window-item>

        <!-- Step 5: Review & Save -->
        <v-stepper-window-item :value="5">
          <div class="pa-6">
            <div class="text-h5 mb-4">{{ $t('pipelines.reviewPipelineConfiguration') }}</div>
            
            <!-- Basic Information -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-information</v-icon>
                {{ $t('executions.basicInformation') }}
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-label</v-icon>
                    </template>
                    <v-list-item-title>{{ $t('common.name') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ pipeline.name }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="pipeline.description">
                    <template #prepend>
                      <v-icon>mdi-text</v-icon>
                    </template>
                    <v-list-item-title>{{ $t('common.description') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ pipeline.description }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Data Sources -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-database-sync</v-icon>
                {{ $t('dashboard.dataSources') }}
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item>
                    <template #prepend>
                      <v-icon color="blue">mdi-database-export</v-icon>
                    </template>
                    <v-list-item-title>{{ $t('pipelines.source') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ getDataSourceName(pipeline.sourceId) }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon color="green">mdi-database-import</v-icon>
                    </template>
                    <v-list-item-title>{{ $t('pipelines.destination') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ getDataSourceName(pipeline.destinationId) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Field Mappings -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-arrow-left-right</v-icon>
                {{ $t('pipelines.fieldMappings') }} ({{ pipeline.fieldMappings?.length || 0 }})
              </v-card-title>
              <v-card-text>
                <v-table v-if="pipeline.fieldMappings && pipeline.fieldMappings.length > 0" density="compact">
                  <thead>
                    <tr>
                      <th>{{ $t('pipelines.sourceFieldsPlural') }}</th>
                      <th>{{ $t('transformations.title') }}</th>
                      <th>{{ $t('pipelines.destinationField') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="mapping in pipeline.fieldMappings" :key="mapping.id">
                      <td>
                        <v-chip
                          v-for="(field, idx) in mapping.sourceFields"
                          :key="idx"
                          size="x-small"
                          class="mr-1"
                          variant="tonal"
                        >
                          {{ field }}
                        </v-chip>
                        <span v-if="!mapping.sourceFields || mapping.sourceFields.length === 0" class="text-grey">-</span>
                      </td>
                      <td>
                        <div v-if="mapping.transformations && mapping.transformations.length > 0" class="d-flex align-center gap-1">
                          <v-chip
                            v-for="(trans, idx) in mapping.transformations"
                            :key="idx"
                            size="x-small"
                            variant="outlined"
                            :color="getTransformationColor(getTransformationType(trans.transformationId))"
                            class="mr-1"
                          >
                            <v-icon start size="x-small">{{ getTransformationIcon(getTransformationType(trans.transformationId)) }}</v-icon>
                            {{ idx + 1 }}. {{ getTransformationName(trans.transformationId) }}
                          </v-chip>
                        </div>
                        <span v-else class="text-grey">{{ $t('common.none') }}</span>
                      </td>
                      <td>{{ mapping.destinationField || '-' }}</td>
                    </tr>
                  </tbody>
                </v-table>
                <div v-else class="text-center py-4 text-grey">
                  {{ $t('pipelines.noFieldMappingsConfigured') }}
                </div>
              </v-card-text>
            </v-card>

            <!-- Schedule -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                {{ $t('pipelines.schedule') }}
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item>
                    <template #prepend>
                      <v-icon>{{ pipeline.isScheduled ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
                    </template>
                    <v-list-item-title>{{ $t('pipelines.scheduledExecution') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ pipeline.isScheduled ? $t('pipelines.enabled') : $t('pipelines.disabledManualOnly') }}</v-list-item-subtitle>
                  </v-list-item>
                  <template v-if="pipeline.isScheduled && pipeline.schedule">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-clock-outline</v-icon>
                      </template>
                      <v-list-item-title>{{ $t('pipelines.frequency') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ getFrequencyLabel(pipeline.schedule.frequency) }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="pipeline.schedule.frequency !== 'Custom' && pipeline.schedule.time">
                      <template #prepend>
                        <v-icon>mdi-clock</v-icon>
                      </template>
                      <v-list-item-title>{{ $t('pipelines.time') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ pipeline.schedule.time }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="pipeline.schedule.frequency === 'Weekly' && pipeline.schedule.dayOfWeek">
                      <template #prepend>
                        <v-icon>mdi-calendar-week</v-icon>
                      </template>
                      <v-list-item-title>{{ $t('pipelines.dayOfWeek') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ getDayOfWeekLabel(pipeline.schedule.dayOfWeek) }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="pipeline.schedule.frequency === 'Monthly' && pipeline.schedule.dayOfMonth">
                      <template #prepend>
                        <v-icon>mdi-calendar-month</v-icon>
                      </template>
                      <v-list-item-title>{{ $t('pipelines.dayOfMonth') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ pipeline.schedule.dayOfMonth }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="pipeline.schedule.frequency === 'Custom' && pipeline.schedule.cronExpression">
                      <template #prepend>
                        <v-icon>mdi-code-braces</v-icon>
                      </template>
                      <v-list-item-title>{{ $t('pipelines.cronExpression') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ pipeline.schedule.cronExpression }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="pipeline.schedule.timezone">
                      <template #prepend>
                        <v-icon>mdi-earth</v-icon>
                      </template>
                      <v-list-item-title>{{ $t('pipelines.timezone') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ getTimezoneName(pipeline.schedule.timezone) }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-list>
              </v-card-text>
            </v-card>
          </div>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        v-if="currentStep > 1"
        variant="outlined"
        prepend-icon="mdi-chevron-left"
        @click="currentStep--"
      >
        {{ $t('common.previous') }}
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="currentStep < 5"
        color="primary"
        variant="elevated"
        append-icon="mdi-chevron-right"
        :disabled="!canProceed"
        @click="currentStep++"
      >
        {{ $t('common.next') }}
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="elevated"
        prepend-icon="mdi-content-save"
        :loading="saving"
        :disabled="!canSave"
        @click="handleSave"
      >
        {{ $t('common.save') }}
        <v-tooltip activator="parent" location="top">{{ $t('pipelines.savePipeline') }}</v-tooltip>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslatedMetadata } from '@/composables/useTranslatedMetadata';
import FieldMappingEditor from './FieldMappingEditor.vue';

const { t } = useI18n();
const { scheduleFrequencies, daysOfWeek } = useTranslatedMetadata();

const props = defineProps({
  pipeline: {
    type: Object,
    required: true
  },
  dataSources: {
    type: Array,
    default: () => []
  },
  transformations: {
    type: Array,
    default: () => []
  },
  timezones: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['save', 'close', 'create-datasource', 'add-transformation', 'toggle-fullscreen']);

const currentStep = ref(1);
const saving = ref(false);
const mappingValidation = ref({ isValid: true, errors: [], unmappedRequiredFields: [] });

// Use translated metadata for schedule options
const frequencyOptions = computed(() => 
  scheduleFrequencies.value.map(freq => ({
    title: freq.label,
    value: freq.value
  }))
);

const dayOfWeekOptions = computed(() => 
  daysOfWeek.value.map(day => ({
    title: day.label,
    value: day.value
  }))
);

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return !!props.pipeline.name;
    case 2:
      return !!props.pipeline.sourceId && !!props.pipeline.destinationId;
    case 3:
      // Allow proceeding even without mappings - they can be added later
      return true;
    default:
      return true;
  }
});

const canSave = computed(() => {
  return props.pipeline.name &&
         props.pipeline.sourceId &&
         props.pipeline.destinationId;
  // Removed mapping validation requirement - allow saving pipelines without complete mappings
});

function handleMappingValidation(result) {
  mappingValidation.value = result;
}

function getDataSourceId(sourceIdOrObject) {
  return typeof sourceIdOrObject === 'string' ? sourceIdOrObject : sourceIdOrObject?.id;
}

function getDataSourceName(sourceIdOrObject) {
  const id = typeof sourceIdOrObject === 'string' ? sourceIdOrObject : sourceIdOrObject?.id;
  const dataSource = props.dataSources.find(ds => ds.id === id);
  return dataSource?.name || 'Unknown';
}

function getTransformationName(transformationId) {
  const transformation = props.transformations.find(t => t.id === transformationId);
  return transformation?.name || 'Unknown';
}

function getTransformationType(transformationId) {
  const transformation = props.transformations.find(t => t.id === transformationId);
  return transformation?.type || '';
}

function getTransformationColor(type) {
  const colors = {
    'Filter': 'blue',
    'Map': 'green',
    'Aggregation': 'orange',
    'Script': 'purple',
    'Join': 'teal',
    'Trim': 'cyan',
    'Case Convert': 'indigo',
    'Substring': 'pink',
    'Replace': 'amber',
    'Split': 'lime'
  };
  return colors[type] || 'grey';
}

function getTransformationIcon(type) {
  const icons = {
    'Filter': 'mdi-filter',
    'Map': 'mdi-map',
    'Aggregation': 'mdi-chart-bar',
    'Script': 'mdi-code-braces',
    'Join': 'mdi-link-variant',
    'Trim': 'mdi-content-cut',
    'Case Convert': 'mdi-format-letter-case',
    'Substring': 'mdi-format-text',
    'Replace': 'mdi-find-replace',
    'Split': 'mdi-call-split'
  };
  return icons[type] || 'mdi-cog';
}

function getTimezoneName(timezoneValue) {
  const timezone = props.timezones.find(tz => tz.value === timezoneValue);
  return timezone?.name || timezoneValue;
}

function getFrequencyLabel(frequency) {
  const frequencyMap = {
    'Daily': t('pipelines.daily'),
    'Weekly': t('pipelines.weekly'),
    'Monthly': t('pipelines.monthly'),
    'Custom': t('pipelines.custom')
  };
  return frequencyMap[frequency] || frequency;
}

function getDayOfWeekLabel(day) {
  const dayMap = {
    'Monday': t('pipelines.monday'),
    'Tuesday': t('pipelines.tuesday'),
    'Wednesday': t('pipelines.wednesday'),
    'Thursday': t('pipelines.thursday'),
    'Friday': t('pipelines.friday'),
    'Saturday': t('pipelines.saturday'),
    'Sunday': t('pipelines.sunday')
  };
  return dayMap[day] || day;
}

function initializeSchedule(enabled) {
  if (enabled && !props.pipeline.schedule) {
    props.pipeline.schedule = {
      frequency: 'Daily',
      time: '00:00',
      timezone: 'UTC'
    };
  }
}


async function handleSave() {
  saving.value = true;
  try {
    await emit('save', props.pipeline);
  } catch (error) {
    console.error('Failed to save pipeline:', error);
    // Error handling is done by parent component
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.wizard-card {
  display: flex;
  flex-direction: column;
}

.wizard-stepper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.wizard-stepper :deep(.v-stepper-header) {
  flex-shrink: 0;
  padding: 24px 16px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

/* Style stepper items */
.wizard-stepper :deep(.v-stepper-item) {
  padding: 12px 16px;
}

.wizard-stepper :deep(.v-stepper-item__avatar) {
  margin-bottom: 8px;
  width: 40px;
  height: 40px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-surface), 1);
}

.wizard-stepper :deep(.v-stepper-item--selected .v-stepper-item__avatar) {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 8px rgba(var(--v-theme-primary), 0.3);
  transform: scale(1.1);
  transition: all 0.3s ease;
}

.wizard-stepper :deep(.v-stepper-item--complete .v-stepper-item__avatar) {
  background: rgb(var(--v-theme-success));
  border-color: rgb(var(--v-theme-success));
}

.wizard-stepper :deep(.v-stepper-item__title) {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.wizard-stepper :deep(.v-stepper-item--selected .v-stepper-item__title) {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.wizard-stepper :deep(.v-stepper-item__subtitle) {
  font-size: 12px;
  opacity: 0.7;
}

/* Step arrow between items */
.step-arrow {
  color: rgba(var(--v-theme-primary), 0.5);
  font-size: 28px;
  margin: 0 16px;
  align-self: center;
  margin-top: 20px;
}

.stepper-window {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.stepper-window :deep(.v-stepper-window-item) {
  background: transparent !important;
}


</style>
