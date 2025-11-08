<template>
  <v-card>
    <v-toolbar color="primary" dark flat>
      <v-btn icon @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-toolbar-title>
        {{ pipeline.id ? 'Edit Pipeline' : 'Create New Pipeline' }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn variant="text" @click="handleSave" :loading="saving" :disabled="!canSave">
        Save Pipeline
      </v-btn>
    </v-toolbar>

    <v-stepper v-model="currentStep" alt-labels flat>
      <v-stepper-header>
        <v-stepper-item
          :complete="currentStep > 1"
          :value="1"
          title="Basic Info"
          subtitle="Name and description"
        />
        <v-divider />
        <v-stepper-item
          :complete="currentStep > 2"
          :value="2"
          title="Source & Destination"
          subtitle="Select data sources"
        />
        <v-divider />
        <v-stepper-item
          :complete="currentStep > 3"
          :value="3"
          title="Field Mappings"
          subtitle="Map source to destination"
        />
        <v-divider />
        <v-stepper-item
          :value="4"
          title="Schedule"
          subtitle="Configure schedule"
        />
      </v-stepper-header>

      <v-stepper-window class="stepper-content">
        <!-- Step 1: Basic Info -->
        <v-stepper-window-item :value="1">
          <div class="pa-6">
            <div class="text-h5 mb-4">Pipeline Information</div>
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="pipeline.name"
                  label="Pipeline Name"
                  placeholder="e.g., Customer Data Migration"
                  variant="outlined"
                  :rules="[v => !!v || 'Name is required']"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="pipeline.description"
                  label="Description"
                  placeholder="Describe what this pipeline does..."
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
            <div class="text-h5 mb-4">Data Sources</div>
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="blue" class="mr-2">mdi-database-export</v-icon>
                    <span class="text-h6">Source</span>
                  </div>
                  <v-select
                    v-model="pipeline.sourceId"
                    :items="dataSources"
                    item-title="name"
                    item-value="id"
                    label="Select Source"
                    variant="outlined"
                    :rules="[v => !!v || 'Source is required']"
                    return-object
                  >
                    <template v-slot:prepend-item>
                      <v-list-item
                        title="Create New Source..."
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
                    <span class="text-h6">Destination</span>
                  </div>
                  <v-select
                    v-model="pipeline.destinationId"
                    :items="dataSources"
                    item-title="name"
                    item-value="id"
                    label="Select Destination"
                    variant="outlined"
                    :rules="[v => !!v || 'Destination is required']"
                    return-object
                  >
                    <template v-slot:prepend-item>
                      <v-list-item
                        title="Create New Destination..."
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
            <div class="text-h5 mb-4">Field Mappings</div>
            <FieldMappingEditor
              v-if="pipeline.sourceId && pipeline.destinationId"
              v-model="pipeline.fieldMappings"
              :source-id="getDataSourceId(pipeline.sourceId)"
              :destination-id="getDataSourceId(pipeline.destinationId)"
              :transformations="transformations"
              @validate="handleMappingValidation"
            />
            <v-alert v-else type="info" variant="tonal">
              Please select source and destination in the previous step
            </v-alert>
          </div>
        </v-stepper-window-item>

        <!-- Step 4: Schedule -->
        <v-stepper-window-item :value="4">
          <div class="pa-6">
            <div class="text-h5 mb-4">Schedule Configuration</div>
            
            <v-switch
              v-model="pipeline.isScheduled"
              label="Enable scheduled execution"
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
                      label="Frequency"
                      :items="['Daily', 'Weekly', 'Monthly', 'Custom']"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="pipeline.schedule.time"
                      label="Time"
                      type="time"
                      variant="outlined"
                      hint="24-hour format"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="12" md="6" v-if="pipeline.schedule.frequency === 'Weekly'">
                    <v-select
                      v-model="pipeline.schedule.dayOfWeek"
                      label="Day of Week"
                      :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6" v-if="pipeline.schedule.frequency === 'Monthly'">
                    <v-select
                      v-model="pipeline.schedule.dayOfMonth"
                      label="Day of Month"
                      :items="Array.from({length: 31}, (_, i) => i + 1)"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" v-if="pipeline.schedule.frequency === 'Custom'">
                    <v-text-field
                      v-model="pipeline.schedule.cronExpression"
                      label="Cron Expression"
                      variant="outlined"
                      hint="e.g. 0 0 * * * (runs at midnight every day)"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="pipeline.schedule.timezone"
                      label="Timezone"
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
      </v-stepper-window>

    </v-stepper>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        v-if="currentStep > 1"
        variant="outlined"
        @click="currentStep--"
      >
        <v-icon start>mdi-chevron-left</v-icon>
        Previous
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="currentStep < 4"
        color="primary"
        @click="currentStep++"
        :disabled="!canProceed"
      >
        Next
        <v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
      <v-btn
        v-else
        color="primary"
        @click="handleSave"
        :loading="saving"
        :disabled="!canSave"
      >
        <v-icon start>mdi-check</v-icon>
        Save Pipeline
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import FieldMappingEditor from './FieldMappingEditor.vue';

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

const emit = defineEmits(['save', 'close', 'create-datasource', 'add-transformation']);

const currentStep = ref(1);
const saving = ref(false);
const mappingValidation = ref({ isValid: true, errors: [], unmappedRequiredFields: [] });

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
.stepper-content {
  min-height: 400px;
  max-height: 70vh;
  overflow-y: auto;
  background: transparent !important;
}

.stepper-content :deep(.v-stepper-window-item) {
  background: transparent !important;
}

.step-3-content {
  height: 100%;
  overflow-y: auto;
  max-height: calc(70vh - 200px);
}

@media (max-width: 960px) {
  .stepper-content {
    max-height: 60vh;
  }
  
  .step-3-content {
    max-height: calc(60vh - 200px);
  }
}

@media (max-width: 600px) {
  .stepper-content {
    max-height: 50vh;
  }
  
  .step-3-content {
    max-height: calc(50vh - 200px);
  }
}
</style>
