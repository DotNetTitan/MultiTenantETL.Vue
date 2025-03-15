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
      <h1 class="text-h4 mr-4">{{ pipeline?.name || 'Pipeline Details' }}</h1>
      <v-chip
        v-if="pipeline?.status"
        :color="getStatusColor(pipeline.status)"
        text-color="white"
        class="ml-2"
      >
        {{ pipeline.status }}
      </v-chip>
      <v-spacer />
      <v-btn 
        color="primary" 
        prepend-icon="mdi-play" 
        @click="runPipeline"
        :loading="running"
        :disabled="pipeline?.status === 'Running'"
        class="mr-2"
      >
        Run
      </v-btn>
      <v-btn 
        color="primary" 
        variant="outlined"
        prepend-icon="mdi-pencil" 
        @click="editPipeline"
        class="mr-2"
      >
        Edit
      </v-btn>
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
            <v-card-title>Pipeline Information</v-card-title>
            <v-card-text>
              <div class="d-flex mb-4">
                <div class="info-label">Name:</div>
                <div>{{ pipeline.name }}</div>
              </div>
              <div class="d-flex mb-4">
                <div class="info-label">Description:</div>
                <div>{{ pipeline.description || 'No description provided' }}</div>
              </div>
              <div class="d-flex mb-4">
                <div class="info-label">Created:</div>
                <div>{{ formatDate(pipeline.createdAt) }}</div>
              </div>
              <div class="d-flex mb-4">
                <div class="info-label">Last Run:</div>
                <div>{{ pipeline.lastRun ? formatDate(pipeline.lastRun) : 'Never' }}</div>
              </div>
              <div class="d-flex mb-4">
                <div class="info-label">Schedule:</div>
                <div>{{ pipeline.schedule || 'Manual execution only' }}</div>
              </div>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title>Data Sources</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="(source, index) in pipeline.dataSources"
                  :key="index"
                  :title="source.name"
                  :subtitle="source.type"
                  :prepend-icon="getDataSourceIcon(source.type)"
                  :ripple="false"
                >
                  <template v-slot:append>
                    <v-chip
                      :color="source.isConnected ? 'success' : 'error'"
                      size="x-small"
                      class="ml-2"
                    >
                      {{ source.isConnected ? 'Connected' : 'Error' }}
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
            <v-card-title>Pipeline Workflow</v-card-title>
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
              <span>Recent Executions</span>
              <v-spacer />
              <v-btn
                variant="text"
                size="small"
                to="/executions"
              >
                View All
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Execution ID</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>Duration</th>
                    <th>Rows Processed</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="execution in recentExecutions" :key="execution.id">
                    <td>{{ execution.id }}</td>
                    <td>
                      <v-chip
                        :color="getStatusColor(execution.status)"
                        text-color="white"
                        size="x-small"
                      >
                        {{ execution.status }}
                      </v-chip>
                    </td>
                    <td>{{ formatDate(execution.startTime) }}</td>
                    <td>{{ formatDuration(execution.duration) }}</td>
                    <td>{{ execution.rowsProcessed?.toLocaleString() || 'N/A' }}</td>
                    <td>
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        @click="viewExecutionDetails(execution)"
                        title="View details"
                      >
                        <v-icon>mdi-eye</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                  <tr v-if="recentExecutions.length === 0">
                    <td colspan="6" class="text-center">No executions yet</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-card v-else>
      <v-card-text class="text-center pa-5">
        Pipeline not found
      </v-card-text>
    </v-card>

    <!-- Execution Details Dialog -->
    <v-dialog
      v-model="showExecutionDialog"
      max-width="900px"
    >
      <v-card v-if="selectedExecution">
        <v-card-title class="d-flex align-center">
          <span>Execution Details</span>
          <v-chip
            :color="getStatusColor(selectedExecution.status)"
            text-color="white"
            size="small"
            class="ml-4"
          >
            {{ selectedExecution.status }}
          </v-chip>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-subtitle-1 font-weight-bold mb-2">Execution ID</div>
              <p>{{ selectedExecution.id }}</p>
              
              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">Start Time</div>
              <p>{{ formatDate(selectedExecution.startTime, true) }}</p>
              
              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">End Time</div>
              <p>{{ selectedExecution.endTime ? formatDate(selectedExecution.endTime, true) : 'Running' }}</p>
              
              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">Duration</div>
              <p>{{ formatDuration(selectedExecution.duration) }}</p>
              
              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">Rows Processed</div>
              <p>{{ selectedExecution.rowsProcessed?.toLocaleString() || 'N/A' }}</p>
            </v-col>
            
            <v-col cols="12" md="6">
              <div class="text-subtitle-1 font-weight-bold mb-2">Progress</div>
              <v-progress-linear
                v-if="selectedExecution.status === 'Running'"
                :modelValue="selectedExecution.progressPercent || 0"
                color="primary"
                height="20"
                rounded
                striped
              >
                <template v-slot:default>
                  {{ Math.round(selectedExecution.progressPercent || 0) }}%
                </template>
              </v-progress-linear>
              <v-progress-linear
                v-else
                :modelValue="100"
                :color="getStatusColor(selectedExecution.status)"
                height="20"
                rounded
              >
                <template v-slot:default>
                  {{ selectedExecution.status }}
                </template>
              </v-progress-linear>
              
              <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">Execution Logs</div>
              <v-card
                variant="outlined"
                class="log-container"
              >
                <v-card-text class="logs pa-2">
                  <pre>{{ selectedExecution.logs || 'No logs available' }}</pre>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showExecutionDialog = false"
          >
            Close
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
        <v-card-title>Run Pipeline</v-card-title>
        <v-card-text>
          <p>Are you sure you want to run this pipeline?</p>
          
          <v-form ref="runForm" @submit.prevent="confirmRunPipeline">
            <v-checkbox
              v-model="runOptions.saveResults"
              label="Save results to destination"
              hide-details
              class="mb-3"
            />
            
            <v-checkbox
              v-model="runOptions.notifyOnCompletion"
              label="Notify me when complete"
              hide-details
              class="mb-3"
            />
            
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>Advanced Options</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="runOptions.maxRows"
                    label="Max Rows (0 for unlimited)"
                    type="number"
                    hint="Limit the number of rows to process"
                    persistent-hint
                    class="mb-3"
                  />
                  
                  <v-checkbox
                    v-model="runOptions.debugMode"
                    label="Debug Mode"
                    hint="Enable detailed logging for debugging"
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
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="confirmRunPipeline"
            :loading="running"
          >
            Run Now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// Pipeline data
const pipeline = ref(null);
const loading = ref(false);
const recentExecutions = ref([]);

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

function getDataSourceIcon(type) {
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

async function fetchPipelineDetails() {
  try {
    loading.value = true;
    
    // In a real app, this would be an actual API call
    // const response = await axios.get(`/api/pipelines/${route.params.id}`);
    
    // For now, using simulated data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock pipeline data
    pipeline.value = {
      id: route.params.id,
      name: 'Sales Data ETL',
      description: 'Extract sales data from CRM, transform, and load to data warehouse',
      status: 'Active',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      schedule: 'Daily at 02:00 AM',
      dataSources: [
        {
          id: '1',
          name: 'CRM Database',
          type: 'SQL',
          isConnected: true
        },
        {
          id: '2',
          name: 'Product Catalog API',
          type: 'REST API',
          isConnected: true
        }
      ],
      steps: [
        {
          id: '1',
          name: 'Extract Sales Data',
          type: 'Extract',
          description: 'Pull sales transactions from CRM database'
        },
        {
          id: '2',
          name: 'Extract Product Data',
          type: 'Extract',
          description: 'Pull product details from Product API'
        },
        {
          id: '3',
          name: 'Join Sales and Products',
          type: 'Transform',
          description: 'Join sales transactions with product details'
        },
        {
          id: '4',
          name: 'Filter Invalid Transactions',
          type: 'Transform',
          description: 'Remove transactions with invalid product IDs or amounts'
        },
        {
          id: '5',
          name: 'Aggregate by Region',
          type: 'Transform',
          description: 'Calculate sales totals by region and product category'
        },
        {
          id: '6',
          name: 'Load to Data Warehouse',
          type: 'Load',
          description: 'Load processed data to the sales analytics table in data warehouse'
        }
      ]
    };
    
    await fetchRecentExecutions();
  } catch (error) {
    console.error('Error fetching pipeline details:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchRecentExecutions() {
  try {
    // In a real app, this would be an actual API call
    // const response = await axios.get(`/api/pipelines/${route.params.id}/executions`, {
    //   params: { limit: 5 }
    // });
    
    // For now, using simulated data
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock execution data
    recentExecutions.value = [
      {
        id: '1',
        pipelineId: route.params.id,
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
        pipelineId: route.params.id,
        status: 'Failed',
        startTime: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 25.9 * 60 * 60 * 1000).toISOString(),
        duration: 180000, // 3 minutes
        rowsProcessed: 0,
        logs: '[2025-03-13 00:30:01] Starting extraction from source: SQL Server - Sales\n[2025-03-13 00:30:05] Error: Failed to connect to SQL Server. Connection timeout.\n[2025-03-13 00:30:05] Execution failed: Failed to connect to SQL Server',
        progressPercent: 0
      },
      {
        id: '3',
        pipelineId: route.params.id,
        status: 'Completed',
        startTime: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 49.9 * 60 * 60 * 1000).toISOString(),
        duration: 420000, // 7 minutes
        rowsProcessed: 11532,
        logs: '[2025-03-12 00:15:01] Starting extraction from source: SQL Server - Sales\n[2025-03-12 00:15:03] Extracted 11532 rows from source\n[2025-03-12 00:15:05] Applying 3 transformations\n[2025-03-12 00:15:06] Applying transformation: Filter Inactive Customers\n[2025-03-12 00:15:07] Applying transformation: Map Customer Segments\n[2025-03-12 00:15:08] Applying transformation: Format Phone Numbers\n[2025-03-12 00:15:09] Loading data to destination: Data Warehouse\n[2025-03-12 00:15:11] Successfully loaded 11532 rows to destination',
        progressPercent: 100
      }
    ];
  } catch (error) {
    console.error('Error fetching executions:', error);
  }
}

function viewExecutionDetails(execution) {
  selectedExecution.value = { ...execution };
  showExecutionDialog.value = true;
}

function editPipeline() {
  // In a real app, navigate to the pipeline edit page
  // router.push(`/pipelines/${pipeline.value.id}/edit`);
  
  alert('Pipeline edit functionality would be implemented here');
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
</style>
