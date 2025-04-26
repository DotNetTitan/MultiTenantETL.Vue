<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-1">Pipeline</div>
          <div class="d-flex align-center">
            <v-icon icon="mdi-pipe" class="mr-2" color="primary" />
            {{ execution.pipelineName }}
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-1">Status</div>
          <v-chip
            :color="getStatusColor(execution.status)"
            text-color="white"
            :prepend-icon="getStatusIcon(execution.status)"
          >
            {{ execution.status }}
          </v-chip>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-1">Start Time</div>
          <div class="d-flex align-center">
            <v-icon icon="mdi-clock" class="mr-2" />
            {{ formatDate(execution.startTime) }}
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-1">Duration</div>
          <div class="d-flex align-center">
            <v-icon icon="mdi-timer" class="mr-2" />
            {{ formatDuration(execution.duration) }}
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-1">Rows Processed</div>
          <div class="d-flex align-center">
            <v-icon icon="mdi-database" class="mr-2" />
            {{ execution.rowsProcessed?.toLocaleString() || '-' }}
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-1">Error Rate</div>
          <div class="d-flex align-center">
            <v-icon icon="mdi-alert" class="mr-2" :color="getErrorRateColor(execution.errorRate)" />
            {{ formatErrorRate(execution.errorRate) }}
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <div v-if="execution.log" class="mt-4">
        <div class="text-subtitle-2 mb-2">Execution Log</div>
        <v-card class="bg-grey-darken-4">
          <v-card-text>
            <pre class="execution-log">{{ execution.log }}</pre>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  execution: {
    type: Object,
    required: true
  }
});

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
    default:
      return 'grey';
  }
}

function getStatusIcon(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'mdi-check-circle';
    case 'running':
      return 'mdi-progress-clock';
    case 'failed':
      return 'mdi-alert-circle';
    case 'cancelled':
      return 'mdi-cancel';
    default:
      return 'mdi-information';
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

function formatDuration(milliseconds) {
  if (!milliseconds) return '-';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function getErrorRateColor(rate) {
  if (!rate) return 'success';
  if (rate < 0.01) return 'success';
  if (rate < 0.05) return 'warning';
  return 'error';
}

function formatErrorRate(rate) {
  if (!rate) return '0%';
  return `${(rate * 100).toFixed(2)}%`;
}
</script>

<style scoped>
.execution-log {
  font-family: monospace;
  white-space: pre-wrap;
  color: #e0e0e0;
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>