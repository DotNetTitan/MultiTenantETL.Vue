<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">Pipeline Executions</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        prepend-icon="mdi-refresh" 
        @click="fetchExecutions"
        :loading="loading"
      >
        Refresh
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Search Executions"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchExecutions"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              label="Status"
              :items="statusOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchExecutions"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="timeRangeFilter"
              label="Time Range"
              :items="timeRangeOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchExecutions"
            />
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="executions"
          :loading="loading"
          :items-per-page="10"
          class="mt-2"
        >
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              text-color="white"
              size="small"
            >
              {{ item.status }}
            </v-chip>
          </template>
          <template v-slot:item.startTime="{ item }">
            {{ formatDate(item.startTime) }}
          </template>
          <template v-slot:item.endTime="{ item }">
            {{ item.endTime ? formatDate(item.endTime) : '-' }}
          </template>
          <template v-slot:item.duration="{ item }">
            {{ formatDuration(item.duration) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              @click="viewExecutionDetails(item)"
              title="View details"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              v-if="item.status === 'Running'"
              icon
              variant="text"
              size="small"
              color="error"
              @click="cancelExecution(item)"
              title="Cancel execution"
            >
              <v-icon>mdi-stop</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Execution Details Dialog -->
    <v-dialog
      v-model="showDetailsDialog"
      max-width="950px"
    >
      <v-card v-if="selectedExecution">
        <!-- Header with status banner - UPDATED COLORS -->
        <v-banner
          :color="getStatusColor(selectedExecution.status)"
          class="execution-header pa-4 pb-6"
          elevation="1"
        >
          <template v-slot:prepend>
            <v-avatar
              class="mr-3 status-avatar"
              size="42"
            >
              <v-icon :icon="getStatusIcon(selectedExecution.status)" color="white" size="28"></v-icon>
            </v-avatar>
          </template>
          
          <div>
            <h2 class="text-h5 font-weight-bold text-white mb-1">{{ selectedExecution.pipelineName }}</h2>
            <div class="d-flex align-center">
              <span class="text-white text-subtitle-2">Execution ID: {{ selectedExecution.id }}</span>
              <v-chip
                size="small"
                class="ml-4"
                :color="getStatusChipColor(selectedExecution.status)"
                text-color="white"
              >
                {{ selectedExecution.status }}
              </v-chip>
            </div>
          </div>
          
          <template v-slot:actions>
            <v-btn
              v-if="selectedExecution.status === 'Running'"
              :color="getStatusColor(selectedExecution.status)"
              variant="tonal"
              @click="cancelExecution(selectedExecution)"
              class="cancel-btn"
            >
              <v-icon start>mdi-stop</v-icon>
              Cancel Execution
            </v-btn>
          </template>
        </v-banner>

        <!-- Content with tabs - KEEP AS IS -->
        <v-tabs v-model="activeTab" :bg-color="theme.global.current.value.dark ? 'grey-darken-3' : 'grey-lighten-4'" class="execution-tabs">
          <v-tab value="overview" class="px-6">Overview</v-tab>
          <v-tab value="logs" class="px-6">Logs</v-tab>
          <v-tab value="timeline" class="px-6">Timeline</v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <!-- Overview Tab - KEEP AS IS -->
          <v-window-item value="overview">
            <v-card-text>
              <v-row>
                <v-col cols="12" lg="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-subtitle-1 bg-grey-lighten-4">
                      <v-icon start>mdi-information-outline</v-icon>
                      Basic Information
                    </v-card-title>
                    <v-card-text>
                      <v-list density="compact" lines="two">
                        <v-list-item>
                          <template v-slot:prepend>
                            <v-icon class="mr-2">mdi-pipeline</v-icon>
                          </template>
                          <v-list-item-title>Pipeline</v-list-item-title>
                          <v-list-item-subtitle>{{ selectedExecution.pipelineName }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-divider></v-divider>
                        
                        <v-list-item>
                          <template v-slot:prepend>
                            <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                          </template>
                          <v-list-item-title>Start Time</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(selectedExecution.startTime, true) }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-divider></v-divider>
                        
                        <v-list-item>
                          <template v-slot:prepend>
                            <v-icon class="mr-2">mdi-calendar-check</v-icon>
                          </template>
                          <v-list-item-title>End Time</v-list-item-title>
                          <v-list-item-subtitle>{{ selectedExecution.endTime ? formatDate(selectedExecution.endTime, true) : 'Running' }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-divider></v-divider>
                        
                        <v-list-item>
                          <template v-slot:prepend>
                            <v-icon class="mr-2">mdi-timer-outline</v-icon>
                          </template>
                          <v-list-item-title>Duration</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDuration(selectedExecution.duration) }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" lg="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-subtitle-1 bg-grey-lighten-4">
                      <v-icon start>mdi-chart-bar</v-icon>
                      Performance Metrics
                    </v-card-title>
                    <v-card-text>
                      <div class="my-3">
                        <div class="d-flex justify-space-between mb-1">
                          <span class="text-body-2 font-weight-medium">Progress</span>
                          <span class="text-body-2">{{ Math.round(selectedExecution.progressPercent || 0) }}%</span>
                        </div>
                        <v-progress-linear
                          :model-value="selectedExecution.status === 'Running' ? (selectedExecution.progressPercent || 0) : 100"
                          :color="getStatusColor(selectedExecution.status)"
                          height="10"
                          rounded
                          :striped="selectedExecution.status === 'Running'"
                        ></v-progress-linear>
                      </div>
                      
                      <v-divider class="my-4"></v-divider>
                      
                      <div class="d-flex align-center mb-2">
                        <v-icon class="mr-2">mdi-database</v-icon>
                        <span class="text-subtitle-2 font-weight-bold">Rows Processed</span>
                      </div>
                      <div class="text-h4 ml-8">
                        {{ selectedExecution.rowsProcessed?.toLocaleString() || '0' }}
                      </div>
                      
                      <v-divider class="my-4"></v-divider>
                      
                      <div class="d-flex align-center justify-space-between mt-3">
                        <v-chip
                          size="small"
                          :color="getStatusColor(selectedExecution.status)"
                          text-color="white"
                        >
                          {{ selectedExecution.status }}
                        </v-chip>
                        
                        <span class="text-caption">
                          ID: {{ selectedExecution.id }}
                        </span>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-window-item>
          
          <!-- Logs Tab -->
          <v-window-item value="logs">
            <v-card-text>
              <div class="d-flex align-center mb-3">
                <v-icon class="mr-2">mdi-text-box-outline</v-icon>
                <div class="text-subtitle-1 font-weight-bold">Execution Logs</div>
                <v-spacer></v-spacer>
                <v-btn
                  density="compact"
                  variant="text"
                  size="small"
                  prepend-icon="mdi-content-copy"
                  @click="copyLogs"
                >
                  Copy
                </v-btn>
              </div>
              
              <v-card
                variant="outlined"
                class="logs-container custom-scrollbar"
              >
                <pre class="logs-content">{{ selectedExecution.logs || 'No logs available' }}</pre>
              </v-card>
            </v-card-text>
          </v-window-item>
          
          <!-- Timeline Tab - IMPROVED WITH SCROLLING -->
          <v-window-item value="timeline">
            <v-card-text>
              <div class="d-flex align-center mb-3">
                <v-icon class="mr-2">mdi-timeline</v-icon>
                <div class="text-subtitle-1 font-weight-bold">Execution Timeline</div>
              </div>
              
              <div v-if="!getExecutionSteps().length" class="text-center pa-4">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-timeline-clock</v-icon>
                <div class="text-body-1 text-grey">No timeline events available</div>
              </div>
              
              <!-- Added scrollable container -->
              <div v-else class="timeline-scrollable-container custom-scrollbar">
                <v-timeline side="end" line-color="grey-lighten-1" class="timeline-container">
                  <v-timeline-item
                    v-for="(step, index) in getExecutionSteps()"
                    :key="index"
                    :dot-color="step.color"
                    :size="step.important ? 'x-small' : 'x-small'"
                    :icon="step.important ? step.icon : undefined"
                    :icon-color="step.important ? 'white' : undefined"
                    class="app-timeline-item"
                  >
                    <template v-slot:opposite>
                      <div class="text-caption text-grey timeline-time">{{ formatTimelineTime(step.time) }}</div>
                    </template>
                    
                    <v-card variant="outlined" :color="step.color + '-lighten-5'" class="app-timeline-card" density="compact">
                      <v-card-title class="text-subtitle-2 pb-1 pt-2 px-3 d-flex align-center">
                        <v-icon :color="step.color" size="small" class="mr-2">
                          {{ step.icon }}
                        </v-icon>
                        <span class="timeline-title">{{ step.title }}</span>
                      </v-card-title>
                      <v-card-text v-if="step.description" class="pt-0 pb-2 px-3">
                        <p class="text-body-2 timeline-description">{{ step.description }}</p>
                      </v-card-text>
                    </v-card>
                  </v-timeline-item>
                </v-timeline>
              </div>
            </v-card-text>
          </v-window-item>
        </v-window>

        <v-divider></v-divider>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDetailsDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Cancel Confirmation Dialog -->
    <v-dialog
      v-model="showCancelDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="text-h5">
          Cancel Execution
        </v-card-title>
        <v-card-text>
          Are you sure you want to cancel this pipeline execution? This will stop all ongoing processing.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showCancelDialog = false"
          >
            No
          </v-btn>
          <v-btn
            color="error"
            @click="confirmCancelExecution"
            :loading="cancelling"
          >
            Yes, Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { useTenantStore } from '@/stores/tenant';
import { useTheme } from 'vuetify';

const tenantStore = useTenantStore();
const theme = useTheme();

// Data table
const headers = [
  { title: 'Pipeline', key: 'pipelineName' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Start Time', key: 'startTime', width: '150px' },
  { title: 'End Time', key: 'endTime', width: '150px' },
  { title: 'Duration', key: 'duration', width: '100px' },
  { title: 'Rows Processed', key: 'rowsProcessed', width: '120px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px', align: 'end' }
];

// Filters and sorting
const search = ref('');
const statusFilter = ref('All');
const timeRangeFilter = ref('24h');
const statusOptions = ref([
  { title: 'All Statuses', value: 'All' },
  { title: 'Running', value: 'Running' },
  { title: 'Completed', value: 'Completed' },
  { title: 'Failed', value: 'Failed' },
  { title: 'Cancelled', value: 'Cancelled' }
]);
const timeRangeOptions = ref([
  { title: 'Last 24 Hours', value: '24h' },
  { title: 'Last 7 Days', value: '7d' },
  { title: 'Last 30 Days', value: '30d' },
  { title: 'All Time', value: 'all' }
]);

// Execution data
const executions = ref([]);
const loading = ref(false);
const cancelling = ref(false);

// Dialog controls
const showDetailsDialog = ref(false);
const showCancelDialog = ref(false);
const selectedExecution = ref(null);
const executionToCancel = ref(null);

// Polling
const pollingInterval = ref(null);

// Add to existing variables
const activeTab = ref('overview');

// Add these new functions
function getStatusIcon(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'mdi-check-circle';
    case 'running':
      return 'mdi-circle-slice-8';
    case 'failed':
      return 'mdi-alert-circle';
    case 'cancelled':
      return 'mdi-stop-circle';
    default:
      return 'mdi-help-circle';
  }
}

function copyLogs() {
  if (selectedExecution.value?.logs) {
    navigator.clipboard.writeText(selectedExecution.value.logs)
      .then(() => {
        // Could add a toaster notification here
        console.log('Logs copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy logs: ', err);
      });
  }
}

// Status color helper that returns a more appropriate chip color based on status
function getStatusChipColor(status) {
  // Use slightly different colors for better contrast on the banner
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'green-darken-1';
    case 'running':
      return 'blue-darken-1';
    case 'failed':
      return 'red-darken-1';
    case 'cancelled':
      return 'amber-darken-1';
    default:
      return 'grey-darken-1';
  }
}

// Format time for timeline display
function formatTimelineTime(timeString) {
  try {
    // Extract time portion from "[2025-03-14 22:15:01]" format
    const matches = timeString.match(/\d{2}:\d{2}:\d{2}/);
    return matches ? matches[0] : timeString;
  } catch (e) {
    return timeString;
  }
}

// Improve the getExecutionSteps function for better timeline display
function getExecutionSteps() {
  if (!selectedExecution.value || !selectedExecution.value.logs) return [];
  
  // Parse logs to extract timeline events
  const logs = selectedExecution.value.logs || '';
  const lines = logs.split('\n');
  
  const steps = [];
  
  // Parse each log line to create timeline events
  lines.forEach(line => {
    if (!line.trim()) return;
    
    // Extract timestamp and message
    const match = line.match(/\[(.*?)\]\s*(.*)/);
    if (match) {
      const time = match[1];
      const message = match[2];
      
      // Determine step type and icon
      let color = 'primary';
      let icon = 'mdi-information';
      let important = false;
      
      if (message.toLowerCase().includes('starting')) {
        color = 'blue';
        icon = 'mdi-play-circle';
        important = true;
      } else if (message.toLowerCase().includes('extracted')) {
        color = 'cyan';
        icon = 'mdi-database-export';
      } else if (message.toLowerCase().includes('transformation')) {
        color = 'purple';
        icon = 'mdi-autorenew';
      } else if (message.toLowerCase().includes('loading')) {
        color = 'indigo';
        icon = 'mdi-database-import';
      } else if (message.toLowerCase().includes('successfully')) {
        color = 'success';
        icon = 'mdi-check-circle';
        important = true;
      } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('fail')) {
        color = 'error';
        icon = 'mdi-alert-circle';
        important = true;
      } else if (message.toLowerCase().includes('cancelled')) {
        color = 'warning';
        icon = 'mdi-stop-circle';
        important = true;
      } else if (message.toLowerCase().includes('processing batch')) {
        color = 'teal';
        icon = 'mdi-buffer';
      }
      
      // Create a title from the message
      let title = message;
      let description = '';
      
      // If the message has a colon, split into title and description
      if (message.includes(':')) {
        const parts = message.split(':');
        title = parts[0].trim();
        description = parts.slice(1).join(':').trim();
      }
      
      steps.push({
        time,
        title,
        description,
        color,
        icon,
        important
      });
    }
  });
  
  return steps;
}

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
  if (!milliseconds) {
    return '-';
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

function getTimeRangeFilter() {
  const now = new Date();
  
  switch (timeRangeFilter.value) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
}

async function fetchExecutions() {
  try {
    loading.value = true;
    
    // In a real app, this would be an actual API call
    // const response = await axios.get('/api/pipeline-executions', {
    //   params: {
    //     search: search.value,
    //     status: statusFilter.value !== 'All' ? statusFilter.value : null,
    //     from: getTimeRangeFilter()?.toISOString()
    //   }
    // });
    
    // For now, using simulated data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Filter by time range
    const timeFilter = getTimeRangeFilter();
    
    // Mock data
    const mockExecutions = [
      {
        id: '1',
        pipelineId: '1',
        pipelineName: 'Sales Data ETL',
        status: 'Completed',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(),
        duration: 360000, // 6 minutes
        rowsProcessed: 12345,
        logs: '[2025-03-14 22:15:01] Starting extraction from source: SQL Server - Sales\n[2025-03-14 22:15:03] Extracted 12345 rows from source\n[2025-03-14 22:15:05] Applying 3 transformations\n[2025-03-14 22:15:06] Applying transformation: Filter Inactive Customers\n[2025-03-14 22:15:07] Applying transformation: Map Customer Segments\n[2025-03-14 22:15:08] Applying transformation: Format Phone Numbers\n[2025-03-14 22:15:09] Loading data to destination: Data Warehouse\n[2025-03-14 22:15:11] Successfully loaded 12345 rows to destination',
        progressPercent: 100
      },
      {
        id: '2',
        pipelineId: '2',
        pipelineName: 'Customer Import',
        status: 'Failed',
        startTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 11.9 * 60 * 60 * 1000).toISOString(),
        duration: 180000, // 3 minutes
        rowsProcessed: 0,
        logs: '[2025-03-14 12:30:01] Starting extraction from source: SFTP - Customer Files\n[2025-03-14 12:30:05] Error: Failed to connect to SFTP server. Connection refused.\n[2025-03-14 12:30:05] Execution failed: Failed to connect to SFTP server',
        progressPercent: 0
      },
      {
        id: '3',
        pipelineId: '3',
        pipelineName: 'Product Sync',
        status: 'Running',
        startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        endTime: null,
        duration: Date.now() - new Date(Date.now() - 5 * 60 * 1000).getTime(),
        rowsProcessed: 3200,
        logs: '[2025-03-14 23:45:01] Starting extraction from source: ERP API\n[2025-03-14 23:45:03] Extracted 5000 rows from source\n[2025-03-14 23:45:08] Applying transformations\n[2025-03-14 23:45:10] Loading data to destination: E-commerce Platform\n[2025-03-14 23:45:16] Processing batch...',
        progressPercent: 60
      },
      {
        id: '4',
        pipelineId: '4',
        pipelineName: 'Analytics Export',
        status: 'Cancelled',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 23.9 * 60 * 60 * 1000).toISOString(),
        duration: 240000, // 4 minutes
        rowsProcessed: 1500,
        logs: '[2025-03-13 23:50:01] Starting extraction from source: Analytics DB\n[2025-03-13 23:50:04] Extracted 5000 rows from source\n[2025-03-13 23:50:06] Applying 1 transformation\n[2025-03-13 23:50:08] Applying transformation: Aggregate Daily Metrics\n[2025-03-13 23:50:12] Execution was cancelled',
        progressPercent: 30
      },
      {
        id: '5',
        pipelineId: '1',
        pipelineName: 'Sales Data ETL',
        status: 'Completed',
        startTime: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 25.9 * 60 * 60 * 1000).toISOString(),
        duration: 300000, // 5 minutes
        rowsProcessed: 10200,
        logs: '[2025-03-13 00:15:01] Starting extraction from source: SQL Server - Sales\n[2025-03-13 00:15:03] Extracted 10200 rows from source\n[2025-03-13 00:15:05] Applying 3 transformations\n[2025-03-13 00:15:06] Applying transformation: Filter Inactive Customers\n[2025-03-13 00:15:07] Applying transformation: Map Customer Segments\n[2025-03-13 00:15:08] Applying transformation: Format Phone Numbers\n[2025-03-13 00:15:09] Loading data to destination: Data Warehouse\n[2025-03-13 00:15:11] Successfully loaded 10200 rows to destination',
        progressPercent: 100
      }
    ];
    
    // Apply filters
    let filteredExecutions = [...mockExecutions];
    
    if (timeFilter) {
      filteredExecutions = filteredExecutions.filter(e => new Date(e.startTime) >= timeFilter);
    }
    
    if (statusFilter.value !== 'All') {
      filteredExecutions = filteredExecutions.filter(e => e.status === statusFilter.value);
    }
    
    if (search.value) {
      const searchLower = search.value.toLowerCase();
      filteredExecutions = filteredExecutions.filter(e => 
        e.pipelineName.toLowerCase().includes(searchLower) || 
        e.id.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by start time (newest first)
    filteredExecutions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    executions.value = filteredExecutions;
    
    // Update duration for running executions
    executions.value.forEach(execution => {
      if (execution.status === 'Running') {
        execution.duration = Date.now() - new Date(execution.startTime).getTime();
      }
    });
    
    // If we have an open execution detail, update it
    if (selectedExecution.value) {
      const updatedExecution = executions.value.find(e => e.id === selectedExecution.value.id);
      if (updatedExecution) {
        selectedExecution.value = { ...updatedExecution };
      }
    }
  } catch (error) {
    console.error('Error fetching executions:', error);
  } finally {
    loading.value = false;
  }
}

function viewExecutionDetails(execution) {
  selectedExecution.value = { ...execution };
  showDetailsDialog.value = true;
}

function cancelExecution(execution) {
  executionToCancel.value = execution;
  showCancelDialog.value = true;
}

async function confirmCancelExecution() {
  try {
    cancelling.value = true;
    
    // In a real app, this would be an actual API call
    // await axios.post(`/api/pipeline-executions/${executionToCancel.value.id}/cancel`);
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the status in the local array
    const execution = executions.value.find(e => e.id === executionToCancel.value.id);
    if (execution) {
      execution.status = 'Cancelled';
      execution.endTime = new Date().toISOString();
      
      // If this execution is currently shown in details dialog, update it
      if (selectedExecution.value && selectedExecution.value.id === execution.id) {
        selectedExecution.value = { ...execution };
      }
    }
    
    showCancelDialog.value = false;
    executionToCancel.value = null;
  } catch (error) {
    console.error('Error cancelling execution:', error);
  } finally {
    cancelling.value = false;
  }
}

onMounted(() => {
  fetchExecutions();
  
  // Set up polling for real-time updates (every 5 seconds)
  pollingInterval.value = setInterval(() => {
    if (!showDetailsDialog.value && !showCancelDialog.value) {
      fetchExecutions();
    }
  }, 5000);
  
  // Refetch if tenant changes
  tenantStore.$subscribe(() => {
    if (tenantStore.currentTenantId) {
      fetchExecutions();
    }
  });
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
  max-height: 450px;
  overflow-y: auto;
  border-radius: 8px;
}

.logs {
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  font-size: 13px;
}

.log-text {
  color: #e0e0e0;
}

/* Update the execution-header styles */
.execution-header {
  position: relative;
  overflow: hidden;
  z-index: 2;
  margin-bottom: -8px;
  border-radius: var(--app-border-radius) var(--app-border-radius) 0 0;
}

/* Remove the custom gradient overlay */
.execution-header::before {
  content: none;
}

/* Ensure text is visible in both themes */
:deep(.execution-header) {
  background: rgb(var(--v-theme-primary));
}

:deep(.execution-header .v-banner__text),
:deep(.execution-header .text-subtitle-2),
:deep(.execution-header .text-h5) {
  color: rgb(var(--v-theme-on-primary)) !important;
}

/* Update status avatar styles for better contrast */
.status-avatar {
  background-color: rgba(var(--v-theme-on-primary), 0.1);
  backdrop-filter: blur(5px);
  border: 2px solid rgba(var(--v-theme-on-primary), 0.2);
  position: relative;
  z-index: 3;
}

/* Update cancel button styles to match theme */
.cancel-btn {
  background-color: rgba(var(--v-theme-on-primary), 0.1) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  backdrop-filter: blur(5px);
  position: relative;
  z-index: 3;
}

.cancel-btn:hover {
  background-color: rgba(var(--v-theme-on-primary), 0.2) !important;
}

/* New styles */
.status-avatar {
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  border: 2px solid rgba(255, 255, 255, 0.6);
  position: relative; /* Ensure proper stacking context */
  z-index: 3; /* Place above other banner elements */
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.15);
  color: white !important;
  backdrop-filter: blur(5px);
  position: relative; /* Ensure proper stacking context */
  z-index: 3; /* Place above other banner elements */
}

/* Added tab styling fixes */
.execution-tabs {
  position: relative;
  z-index: 1; /* Place below the banner */
  margin-top: 0;
}

/* Fix for tabs text getting cut off */
:deep(.v-tab) {
  min-height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
}

:deep(.v-tabs-bar) {
  height: auto !important;
  min-height: 48px;
}

:deep(.v-tab__content) {
  line-height: normal;
  white-space: nowrap;
}

/* Ensure the tabs container has enough height */
:deep(.v-tabs) {
  min-height: 48px;
}

/* Adjust height of the tabs content to prevent text clipping */
:deep(.v-tab .v-tab__slider) {
  margin-bottom: 0;
}

/* Timeline specific styles */
.timeline-container {
  padding: 12px 0;
}

.timeline-item {
  margin-bottom: 0 !important;
}

:deep(.v-timeline-item__body) {
  margin-bottom: 16px !important;
  max-width: 85%; /* Limit width of timeline items */
}

:deep(.v-timeline-item__dot) {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

:deep(.v-timeline-item__dot--filled .v-timeline-item__inner-dot) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.v-timeline-divider__line) {
  border-left-width: 2px !important;
}

.timeline-title {
  word-break: break-word; /* Prevent long titles from overflowing */
  line-height: 1.4;
}

.timeline-description {
  margin-bottom: 0;
  word-break: break-word;
}

.timeline-time {
  font-family: monospace;
  font-size: 11px;
  margin-right: 12px;
  white-space: nowrap;
}

/* Ensure timeline divider line extends properly */
:deep(.v-timeline-divider) {
  min-height: 100%;
}

/* Fix alignment of timeline dots to cards */
:deep(.v-timeline-item__opposite) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* Improve positioning of timeline events */
:deep(.v-timeline) {
  align-items: flex-start;
}

/* Added scrollable container styles */
.timeline-scrollable-container {
  max-height: 400px;
  overflow-y: auto;
  border-radius: var(--app-border-radius);
}

/* Theme-specific styling */
:deep(.v-theme--dark .v-timeline-divider__line) {
  border-left-color: rgba(255, 255, 255, 0.12) !important;
}

:deep(.v-theme--light .v-timeline-divider__line) {
  border-left-color: rgba(0, 0, 0, 0.12) !important;
}

/* Updated logs styling for better light/dark mode support */
.logs-container {
  max-height: 450px;
  overflow-y: auto;
  border-radius: var(--app-border-radius);
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  font-size: 13px;
  padding: 0;
  border: 1px solid;
}

.logs-content {
  padding: 16px;
  margin: 0;
  line-height: 1.5;
}

:deep(.v-theme--dark .logs-container) {
  background-color: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.12);
}

:deep(.v-theme--dark .logs-content) {
  color: #e0e0e0;
}

:deep(.v-theme--light .logs-container) {
  background-color: #f5f5f5;
  border-color: rgba(0, 0, 0, 0.12);
}

:deep(.v-theme--light .logs-content) {
  color: #333333;
}

/* Ensure timeline items have better contrast in light mode */
:deep(.v-theme--light .app-timeline-card) {
  background-color: #f9f9f9 !important;
  border-color: rgba(0, 0, 0, 0.08) !important;
}

:deep(.v-theme--light .timeline-title) {
  color: rgba(0, 0, 0, 0.87);
}

:deep(.v-theme--light .timeline-description) {
  color: rgba(0, 0, 0, 0.6);
}

:deep(.v-theme--dark .app-timeline-card) {
  border-color: rgba(255, 255, 255, 0.08) !important;
}

/* Make execution dialog consistent between themes */
:deep(.v-dialog > .v-card) {
  border-radius: var(--app-border-radius);
  overflow: hidden;
}

:deep(.v-banner) {
  position: relative;
}

:deep(.v-banner::before) {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(0,0,0,0.2), rgba(0,0,0,0));
  pointer-events: none;
}

/* Fix tab colors for light mode */
:deep(.v-theme--light .v-tabs) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

:deep(.v-theme--dark .v-tabs) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

:deep(.v-tab) {
  opacity: 0.7;
}

:deep(.v-tab--selected) {
  opacity: 1;
}

:deep(.v-theme--light .v-tab--selected) {
  color: var(--v-theme-primary);
}

:deep(.v-window-item) {
  padding-top: 16px;
}
</style>
