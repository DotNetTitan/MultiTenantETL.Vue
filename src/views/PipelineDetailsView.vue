<template>
  <div>
    <div class="d-flex align-center mb-4">
      <v-btn
        icon
        variant="text"
        class="mr-2"
        to="/pipelines"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <h1 class="text-h4 mr-4">{{ pipeline?.name || $t('pipelines.detailsTitle') }}</h1>
      <v-chip
        v-if="pipeline?.status"
        :color="getStatusColor(pipeline.status)"
        text-color="white"
        class="ml-2"
      >
        {{ pipeline.status }}
      </v-chip>
      <v-spacer />
      <v-tooltip
        :disabled="!authStore.isGuest"
        location="bottom"
      >
        <template #activator="{ props }">
          <span v-bind="props">
            <v-btn
              color="primary"
              prepend-icon="mdi-play"
              :loading="running"
              :disabled="pipeline?.status === 'Running' || authStore.isGuest"
              :style="authStore.isGuest ? 'pointer-events: auto' : ''"
              class="mr-2"
              @click="runPipeline"
            >
              {{ $t('pipelines.runPipelineTitle') }}
            </v-btn>
          </span>
        </template>
        {{ $t('common.guestReadOnly') }}
      </v-tooltip>
      <v-tooltip
        :disabled="!authStore.isGuest"
        location="bottom"
      >
        <template #activator="{ props }">
          <span v-bind="props">
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-pencil"
              class="mr-2"
              :disabled="authStore.isGuest"
              :style="authStore.isGuest ? 'pointer-events: auto' : ''"
              @click="editPipeline"
            >
              {{ $t('common.edit') }}
            </v-btn>
          </span>
        </template>
        {{ $t('common.guestReadOnly') }}
      </v-tooltip>
    </div>

    <v-card v-if="loading" class="mb-4">
      <v-card-text class="text-center pa-5">
        <v-progress-circular indeterminate color="primary" />
      </v-card-text>
    </v-card>

    <template v-else-if="pipeline">
      <v-row>
        <!-- Pipeline Information -->
        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-title>{{ $t('pipelines.information') }}</v-card-title>
            <v-card-text>
              <div class="d-flex mb-4">
                <div class="info-label">{{ $t('common.name') }}:</div>
                <div>{{ pipeline.name }}</div>
              </div>
              <div class="d-flex mb-4">
                <div class="info-label">{{ $t('common.description') }}:</div>
                <div>{{ pipeline.description || $t('pipelines.noDescription') }}</div>
              </div>
              <div class="d-flex mb-4">
                <div class="info-label">{{ $t('common.created') }}:</div>
                <div>{{ formatDate(pipeline.createdAt) }}</div>
              </div>
              <div class="d-flex mb-4">
                <div class="info-label">{{ $t('pipelines.lastRun') }}:</div>
                <div>{{ pipeline.lastRun ? formatDate(pipeline.lastRun) : $t('pipelines.never') }}</div>
              </div>
              <div class="d-flex mb-4">
                <div class="info-label">{{ $t('pipelines.schedule') }}:</div>
                <div>{{ pipeline.schedule || $t('pipelines.manualExecutionOnly') }}</div>
              </div>
              <div v-if="pipeline.notificationEmails && pipeline.notificationEmails.length > 0" class="d-flex mb-4">
                <div class="info-label">{{ $t('settings.notifications') }}:</div>
                <div>
                  <v-chip
                    v-for="(email, idx) in pipeline.notificationEmails"
                    :key="idx"
                    size="small"
                    class="mr-1 mb-1"
                    variant="tonal"
                  >
                    <v-icon start size="small">mdi-email</v-icon>
                    {{ email }}
                  </v-chip>
                </div>
              </div>
              <div v-if="pipeline.notificationEmails && pipeline.notificationEmails.length > 0" class="d-flex mb-4">
                <div class="info-label">{{ $t('settings.emailNotifications') }}:</div>
                <div>
                  <v-chip
                    :color="pipeline.emailNotificationsEnabled ? 'success' : 'grey'"
                    size="small"
                    variant="tonal"
                  >
                    <v-icon start size="small">
                      {{ pipeline.emailNotificationsEnabled ? 'mdi-bell-check' : 'mdi-bell-off' }}
                    </v-icon>
                    {{ pipeline.emailNotificationsEnabled ? $t('schedules.enabled') : $t('schedules.disabled') }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title>{{ $t('pipelines.dataSources') }}</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="(source, index) in pipeline.connectors"
                  :key="index"
                  :title="source.name"
                  :subtitle="source.direction === 'source' ? $t('pipelines.source') : $t('pipelines.destination')"
                  :ripple="false"
                >
                  <template #prepend>
                    <v-icon
                      :icon="getConnectorIcon(source.type)"
                      :color="source.direction === 'source' ? 'blue' : 'green'"
                    />
                  </template>
                  <template #append>
                    <v-chip
                      :color="source.isConnected ? 'success' : 'error'"
                      size="x-small"
                      class="ml-2"
                    >
                      {{ source.isConnected ? $t('common.success') : $t('common.error') }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Pipeline Execution Info -->
        <v-col cols="12" md="8">
          <v-card class="mb-4">
            <v-card-title>{{ $t('pipelines.workflow') }}</v-card-title>
            <v-card-text>
              <v-timeline density="compact" align="start">
                <v-timeline-item
                  v-for="(step, index) in pipeline.steps"
                  :key="index"
                  :dot-color="getStepColor(step.type)"
                  :icon="getStepIcon(step.type)"
                >
                  <div class="d-flex align-center">
                    <div class="font-weight-bold">{{ step.name }}</div>
                    <v-chip
                      size="x-small"
                      class="ml-2"
                      :color="getStepTypeColor(step.type)"
                      text-color="white"
                    >
                      {{ step.type }}
                    </v-chip>
                  </div>
                  <div class="text-caption">{{ step.description }}</div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title class="d-flex align-center">
              <span>{{ $t('dashboard.recentExecutions') }}</span>
              <v-spacer />
              <v-btn
                variant="tonal"
                size="small"
                color="primary"
                to="/executions"
                prepend-icon="mdi-history"
                append-icon="mdi-chevron-right"
              >
                {{ $t('dashboard.viewAll') }}
              </v-btn>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-data-table
                :headers="executionHeaders"
                :items="recentExecutions"
                :items-per-page="10"
              >
                <template #item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    text-color="white"
                    size="x-small"
                  >
                    {{ item.status }}
                  </v-chip>
                </template>
                <template #item.startTime="{ item }">
                  {{ formatDate(item.startTime) }}
                </template>
                <template #item.durationMs="{ item }">
                  {{ formatDuration(item.durationMs) }}
                </template>
                <template #item.rowsProcessed="{ item }">
                  {{ item.rowsProcessed?.toLocaleString() || 'N/A' }}
                </template>
                <template #no-data>
                  {{ $t('dashboard.noRecentExecutions') }}
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-card v-else>
      <v-card-text class="text-center pa-5">
        {{ $t('pipelines.notFound') }}
      </v-card-text>
    </v-card>

    <!-- Execution Details Dialog -->
    <v-dialog
      v-model="showExecutionDialog"
      max-width="900px"
    >
      <v-card v-if="selectedExecution">
        <v-card-title class="d-flex align-center">
          <span>{{ $t('executions.executionDetails') }}</span>
          <v-chip
            :color="getStatusColor(selectedExecution.status)"
            text-color="white"
            size="small"
            class="ml-4"
          >
            {{ selectedExecution.status }}
          </v-chip>
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="showExecutionDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-subtitle-1 font-weight-bold mb-2">{{ $t('executions.executionId') }}</div>
              <p>{{ selectedExecution.id }}</p>

              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">{{ $t('dashboard.startTime') }}</div>
              <p>{{ formatDate(selectedExecution.startTime, true) }}</p>

              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">{{ $t('executions.endTime') }}</div>
              <p>{{ selectedExecution.endTime ? formatDate(selectedExecution.endTime, true) : $t('dashboard.running') }}</p>

              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">{{ $t('dashboard.duration') }}</div>
              <p>{{ formatDuration(selectedExecution.durationMs) }}</p>

              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">{{ $t('dashboard.rowsProcessed') }}</div>
              <p>{{ selectedExecution.rowsProcessed?.toLocaleString() || 'N/A' }}</p>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-subtitle-1 font-weight-bold mb-2">{{ $t('executions.progress') }}</div>
              <v-progress-linear
                v-if="selectedExecution.status === 'Running'"
                :model-value="selectedExecution.progressPercent || 0"
                color="primary"
                height="20"
                rounded
                striped
              >
                <template #default>
                  {{ Math.round(selectedExecution.progressPercent || 0) }}%
                </template>
              </v-progress-linear>
              <v-progress-linear
                v-else
                :model-value="100"
                :color="getStatusColor(selectedExecution.status)"
                height="20"
                rounded
              >
                <template #default>
                  {{ selectedExecution.status }}
                </template>
              </v-progress-linear>

              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">{{ $t('executions.executionLogs') }}</div>
              <v-card
                variant="outlined"
                class="app-log-container custom-scrollbar"
              >
                <pre class="app-log-text">{{ selectedExecution.logs || $t('executions.noLogsAvailable') }}</pre>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="showExecutionDialog = false"
          >
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Run Pipeline Confirmation Dialog -->
    <v-dialog
      v-model="showRunDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>{{ $t('pipelines.runPipelineTitle') }}</v-card-title>
        <v-card-text>
          <p>{{ $t('pipelines.runPipelineConfirm') }}</p>

          <v-form ref="runForm" @submit.prevent="confirmRunPipeline">
            <v-checkbox
              v-model="runOptions.saveResults"
              :label="$t('pipelines.saveResults')"
              hide-details
              class="mb-3"
            />

            <v-checkbox
              v-model="runOptions.notifyOnCompletion"
              :label="$t('pipelines.notifyComplete')"
              hide-details
              class="mb-3"
            />

            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>{{ $t('pipelines.advancedOptions') }}</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="runOptions.maxRows"
                    :label="$t('pipelines.maxRows')"
                    type="number"
                    :hint="$t('pipelines.maxRowsHint')"
                    persistent-hint
                    class="mb-3"
                  />

                  <v-checkbox
                    v-model="runOptions.debugMode"
                    :label="$t('pipelines.debugMode')"
                    :hint="$t('pipelines.debugModeHint')"
                    persistent-hint
                    hide-details
                    class="mb-3"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showRunDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="running"
            @click="confirmRunPipeline"
          >
            {{ $t('pipelines.runNow') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchPipelineById, executePipeline, getExecutions } from '@/services/pipelineService';
import { fetchConnectorById } from '@/services/connectorService';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

// Pipeline data
const pipeline = ref(null);
const loading = ref(false);
const recentExecutions = ref([]);

// Headers for recent executions data table
const executionHeaders = computed(() => [
  { title: t('executions.executionId'), key: 'id', sortable: false },
  { title: t('common.status'), key: 'status', sortable: true },
  { title: t('dashboard.startTime'), key: 'startTime', sortable: true },
  { title: t('dashboard.duration'), key: 'durationMs', sortable: true },
  { title: t('dashboard.rowsProcessed'), key: 'rowsProcessed', sortable: true },
]);

// Dialog controls
const showExecutionDialog = ref(false);
const showRunDialog = ref(false);
const selectedExecution = ref(null);
const running = ref(false);

// Run options
const runOptions = ref({
  saveResults: true,
  notifyOnCompletion: false,
  maxRows: 0,
  debugMode: false
});

// Polling
const pollingInterval = ref(null);

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'running':
      return 'info';
    case 'failed':
      return 'error';
    case 'cancelled':
      return 'warning';
    case 'active':
      return 'success';
    case 'inactive':
      return 'error';
    default:
      return 'grey';
  }
}

function getStepColor(type) {
  switch (type?.toLowerCase()) {
    case 'extract':
      return 'blue';
    case 'transform':
      return 'green';
    case 'load':
      return 'purple';
    default:
      return 'grey';
  }
}

function getStepTypeColor(type) {
  switch (type?.toLowerCase()) {
    case 'extract':
      return 'blue';
    case 'transform':
      return 'green';
    case 'load':
      return 'purple';
    default:
      return 'grey';
  }
}

function getStepIcon(type) {
  switch (type?.toLowerCase()) {
    case 'extract':
      return 'mdi-database-export';
    case 'transform':
      return 'mdi-cog-transfer';
    case 'load':
      return 'mdi-database-import';
    default:
      return 'mdi-cog';
  }
}

function getConnectorIcon(type) {
  switch (type?.toLowerCase()) {
    case 'sql':
      return 'mdi-database';
    case 'rest api':
      return 'mdi-api';
    case 'file':
      return 'mdi-file';
    case 'sftp':
      return 'mdi-server';
    default:
      return 'mdi-database';
  }
}

function formatDate(dateString, includeSeconds = false) {
  if (!dateString) return '-';
  const date = new Date(dateString);

  if (includeSeconds) {
    return date.toLocaleString();
  } else {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

function formatDuration(milliseconds) {
  if (milliseconds == null || milliseconds === false) {
    return '-';
  }

  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

async function fetchPipelineDetails() {
  try {
    loading.value = true;

    // Fetch pipeline from service
    const pipelineData = await fetchPipelineById(route.params.id);

    // Build pipeline steps (async operation)
    const steps = await buildPipelineSteps(pipelineData);

    // Fetch executions first to get lastRun if not available from pipeline data
    await fetchRecentExecutions();

    // Determine lastRun: use pipeline's lastRunAt, or fallback to most recent execution
    let lastRun = pipelineData.lastRunAt;
    if (!lastRun && recentExecutions.value.length > 0) {
      // Get the most recent execution's start time
      lastRun = recentExecutions.value[0].startTime;
    }

    // Transform the data to match the view's expected format
    pipeline.value = {
      id: pipelineData.id,
      name: pipelineData.name,
      description: pipelineData.description,
      status: pipelineData.status,
      createdAt: pipelineData.createdAt,
      lastRun: lastRun,
      schedule: formatSchedule(pipelineData.schedule, pipelineData.isScheduled),
      connectors: [
        {
          id: pipelineData.sourceConnectorId,
          name: pipelineData.sourceConnectorName,
          type: 'Source',
          direction: 'source',
          isConnected: true
        },
        {
          id: pipelineData.destinationConnectorId,
          name: pipelineData.destinationConnectorName,
          type: 'Destination',
          direction: 'destination',
          isConnected: true
        }
      ],
      steps: steps
    };
  } catch (error) {
    console.error('Error fetching pipeline details:', error);
  } finally {
    loading.value = false;
  }
}

function formatSchedule(schedule, isScheduled) {
  // If pipeline is not scheduled, return Manual
  if (!isScheduled || !schedule) return 'Manual';

  // Use cronDescription if available (provided by backend)
  if (schedule.cronDescription) {
    return schedule.cronDescription;
  }

  // Fallback to cron expression if description not available
  if (schedule.cronExpression) {
    return `Cron: ${schedule.cronExpression}`;
  }

  // Legacy support for older frequency-based model if still present
  const freq = schedule.frequency;
  const time = schedule.time || '00:00';

  if (freq === 'Daily') {
    return `Daily at ${time}`;
  } else if (freq === 'Weekly') {
    const day = schedule.dayOfWeek || 'Monday';
    return `Weekly on ${day} at ${time}`;
  } else if (freq === 'Monthly') {
    const dayOfMonth = schedule.dayOfMonth || 1;
    return `Monthly on day ${dayOfMonth} at ${time}`;
  } else if (freq === 'Custom') {
    return `Custom: ${schedule.cronExpression}`;
  }

  return 'Manual';
}

async function buildPipelineSteps(pipelineData) {
  const steps = [];
  let stepId = 1;

  // Extract step from source
  steps.push({
    id: `step-${stepId++}`,
    name: `Extract from ${pipelineData.sourceConnectorName || 'Source'}`,
    type: 'Extract',
    description: `Pull data from ${pipelineData.sourceConnectorName || 'undefined'}`
  });

  // Transform steps based on field mappings
  if (pipelineData.fieldMappings && Array.isArray(pipelineData.fieldMappings) && pipelineData.fieldMappings.length > 0) {
    // Group transformations by type
    const transformationsByType = new Map();

    for (const mapping of pipelineData.fieldMappings) {
      if (mapping.transformations && Array.isArray(mapping.transformations) && mapping.transformations.length > 0) {
        for (const trans of mapping.transformations) {
          // Transformations are now embedded directly in field mappings
          // They have properties: id, type, order, config, isEnabled
          if (!trans.isEnabled) continue;

          const transType = trans.type || 'Unknown';
          const key = transType;

          if (!transformationsByType.has(key)) {
            transformationsByType.set(key, {
              type: transType,
              name: transType, // Use type as name since transformations are inline
              fields: []
            });
          }

          transformationsByType.get(key).fields.push(mapping.destinationField);
        }
      }
    }

    // Create steps for each transformation type
    for (const [type, info] of transformationsByType) {
      steps.push({
        id: `step-${stepId++}`,
        name: `${info.name} Transformation`,
        type: 'Transform',
        description: `Apply ${type} to ${info.fields.length} field(s): ${info.fields.slice(0, 3).join(', ')}${info.fields.length > 3 ? '...' : ''}`
      });
    }
  }

  // If no transformations, show a placeholder
  if (steps.length === 1) {
    steps.push({
      id: `step-${stepId++}`,
      name: 'No Transformations',
      type: 'Transform',
      description: 'Data will be loaded without transformations'
    });
  }

  // Load step to destination
  steps.push({
    id: `step-${stepId++}`,
    name: `Load to ${pipelineData.destinationConnectorName || 'Destination'}`,
    type: 'Load',
    description: `Load processed data to ${pipelineData.destinationConnectorName || 'undefined'}`
  });

  return steps;
}

async function fetchRecentExecutions() {
  try {
    // Fetch executions from service
    const executions = await getExecutions({ pipelineId: route.params.id });

    // Sort executions by startTime descending (most recent first)
    const sortedExecutions = [...executions].sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // Transform execution data to match view format
    recentExecutions.value = sortedExecutions.map(exec => {
      // Use API-provided durationMs (has decimal precision e.g. 234.047ms)
      // Only fall back to timestamp math for still-running executions
      const durationMs = exec.durationMs != null
        ? exec.durationMs
        : (exec.endTime
            ? new Date(exec.endTime).getTime() - new Date(exec.startTime).getTime()
            : Date.now() - new Date(exec.startTime).getTime());

      // Format logs from array to string
      let logsText = '';
      if (exec.logs && exec.logs.length > 0) {
        logsText = exec.logs.map(log =>
          `[${new Date(log.timestamp).toLocaleString()}] ${log.level}: ${log.message}`
        ).join('\n');
      } else {
        // Fallback if no logs
        logsText = `[${new Date(exec.startTime).toLocaleString()}] Pipeline execution ${exec.status.toLowerCase()}`;
      }

      return {
        id: exec.id,
        pipelineId: exec.pipelineId,
        status: exec.status,
        startTime: exec.startTime,
        endTime: exec.endTime,
        durationMs: durationMs,
        rowsProcessed: exec.recordsProcessed || 0,
        logs: logsText,
        progressPercent: exec.status === 'Completed' ? 100 : (exec.status === 'Running' ? 50 : 0)
      };
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
  }
}

function viewExecutionDetails(execution) {
  selectedExecution.value = { ...execution };
  showExecutionDialog.value = true;
}

function editPipeline() {
  router.push(`/pipelines/${pipeline.value.id}/edit`);
}

function runPipeline() {
  showRunDialog.value = true;
}

async function confirmRunPipeline() {
  try {
    running.value = true;

    // In a real app, this would be an actual API call
    // await axios.post(`/api/pipelines/${pipeline.value.id}/execute`, runOptions.value);

    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add a new execution to the recent executions
    const newExecution = {
      id: Math.random().toString(36).substring(2, 15),
      pipelineId: pipeline.value.id,
      status: 'Running',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      rowsProcessed: 0,
      logs: `[${new Date().toLocaleString()}] Starting pipeline execution...\n[${new Date().toLocaleString()}] Extracting data from sources...`,
      progressPercent: 5
    };

    recentExecutions.value.unshift(newExecution);

    // Update the pipeline's last run time
    pipeline.value.lastRun = new Date().toISOString();

    showRunDialog.value = false;

    // Show a success message
    alert('Pipeline execution started successfully!');
  } catch (error) {
    console.error('Error running pipeline:', error);
  } finally {
    running.value = false;
  }
}

onMounted(() => {
  fetchPipelineDetails();

  // Set up polling for real-time updates (every 10 seconds)
  pollingInterval.value = setInterval(() => {
    if (recentExecutions.value.length > 0 && recentExecutions.value[0].status === 'Running') {
      fetchRecentExecutions();
    }
  }, 10000);
});

onBeforeUnmount(() => {
  // Clear polling interval
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }
});
</script>

<style scoped>
.log-container {
  max-height: 250px;
  overflow-y: auto;
  border-radius: var(--app-border-radius);
}

.logs {
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 12px;
}

.info-label {
  width: 120px;
  min-width: 120px;
  font-weight: bold;
  font-size: 1rem;
  margin-right: 8px;
}

/* Theme-specific styling */
:deep(.v-timeline-divider__line) {
  border-left-width: 2px !important;
}

.v-theme--dark :deep(.v-timeline-divider__line) {
  border-left-color: rgba(255, 255, 255, 0.12) !important;
}

.v-theme--light :deep(.v-timeline-divider__line) {
  border-left-color: rgba(0, 0, 0, 0.12) !important;
}

:deep(.v-timeline-item__dot--filled .v-timeline-item__inner-dot) {
  box-shadow: 0 2px 4px rgba(var(--v-theme-on-surface), 0.1);
}

:deep(.v-card) {
  border-radius: var(--app-border-radius);
  transition: all var(--app-transition-speed) ease-in-out;
}

:deep(.v-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
}
</style>
