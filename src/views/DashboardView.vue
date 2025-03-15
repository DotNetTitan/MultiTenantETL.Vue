<template>
  <div>
    <h1 class="text-h4 mb-6">Dashboard</h1>
    
    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-hover v-slot="{ isHovering, props }">
          <v-card 
            v-bind="props" 
            class="mb-4" 
            elevation="2" 
            :elevation="isHovering ? 5 : 2"
            :class="{'on-hover': isHovering}"
            @click="$router.push('/pipelines')"
          >
            <v-card-item>
              <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-pipe" size="x-large" class="mr-2" color="primary" />
                Total Pipelines
              </v-card-title>
              <div class="text-h2 text-center my-3">
                {{ stats.totalPipelines }}
                <v-progress-circular v-if="loading" indeterminate size="24" width="2" class="ml-2" />
              </div>
            </v-card-item>
            <v-card-actions>
              <v-btn variant="tonal" block to="/pipelines">View Pipelines</v-btn>
            </v-card-actions>
          </v-card>
        </v-hover>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-hover v-slot="{ isHovering, props }">
          <v-card 
            v-bind="props" 
            class="mb-4" 
            elevation="2" 
            :elevation="isHovering ? 5 : 2"
            :class="{'on-hover': isHovering}"
            @click="$router.push('/pipelines?status=active')"
          >
            <v-card-item>
              <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-play-circle" size="x-large" class="mr-2" color="success" />
                Active Pipelines
              </v-card-title>
              <div class="text-h2 text-center my-3">
                {{ stats.activePipelines }}
                <v-progress-circular v-if="loading" indeterminate size="24" width="2" class="ml-2" />
              </div>
            </v-card-item>
            <v-card-actions>
              <v-btn variant="tonal" color="success" block to="/pipelines?status=active">View Active</v-btn>
            </v-card-actions>
          </v-card>
        </v-hover>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-hover v-slot="{ isHovering, props }">
          <v-card 
            v-bind="props" 
            class="mb-4" 
            elevation="2" 
            :elevation="isHovering ? 5 : 2"
            :class="{'on-hover': isHovering}"
            @click="$router.push('/data-sources')"
          >
            <v-card-item>
              <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-database" size="x-large" class="mr-2" color="info" />
                Data Sources
              </v-card-title>
              <div class="text-h2 text-center my-3">
                {{ stats.dataSources }}
                <v-progress-circular v-if="loading" indeterminate size="24" width="2" class="ml-2" />
              </div>
            </v-card-item>
            <v-card-actions>
              <v-btn variant="tonal" color="info" block to="/data-sources">View Sources</v-btn>
            </v-card-actions>
          </v-card>
        </v-hover>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-hover v-slot="{ isHovering, props }">
          <v-card 
            v-bind="props" 
            class="mb-4" 
            elevation="2" 
            :elevation="isHovering ? 5 : 2"
            :class="{'on-hover': isHovering}"
            @click="$router.push('/executions')"
          >
            <v-card-item>
              <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-history" size="x-large" class="mr-2" color="purple" />
                Recent Executions
              </v-card-title>
              <div class="text-h2 text-center my-3">
                {{ stats.recentExecutions }}
                <v-progress-circular v-if="loading" indeterminate size="24" width="2" class="ml-2" />
              </div>
            </v-card-item>
            <v-card-actions>
              <v-btn variant="tonal" color="purple" block to="/executions">View Executions</v-btn>
            </v-card-actions>
          </v-card>
        </v-hover>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12" lg="8">
        <v-card elevation="2" class="fill-height">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-history" class="mr-2" />
            Recent Pipeline Executions
            <v-spacer />
            <v-btn size="small" variant="outlined" to="/executions" prepend-icon="mdi-eye">
              View All
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-table hover>
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Start Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Rows Processed</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="text-center">
                    <v-progress-circular indeterminate size="24" width="2" class="my-4" />
                  </td>
                </tr>
                <tr v-else-if="recentExecutions.length === 0">
                  <td colspan="5" class="text-center py-4">
                    No recent executions found
                  </td>
                </tr>
                <template v-else>
                  <tr v-for="execution in recentExecutions" :key="execution.id" class="execution-row">
                    <td>
                      <div class="d-flex align-center">
                        <v-icon :icon="getStatusIcon(execution.status)" class="mr-2" size="small" :color="getStatusColor(execution.status)" />
                        {{ execution.pipelineName }}
                      </div>
                    </td>
                    <td>{{ formatDate(execution.startTime) }}</td>
                    <td>{{ formatDuration(execution.duration) }}</td>
                    <td>
                      <v-chip
                        size="small"
                        :color="getStatusColor(execution.status)"
                        text-color="white"
                        :prepend-icon="getStatusIcon(execution.status)"
                      >
                        {{ execution.status }}
                      </v-chip>
                    </td>
                    <td>{{ execution.rowsProcessed?.toLocaleString() || '-' }}</td>
                  </tr>
                </template>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" lg="4">
        <v-card elevation="2" class="fill-height">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-chart-pie" class="mr-2" />
            Pipeline Status
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div v-if="loading" class="text-center my-4">
              <v-progress-circular indeterminate size="32" width="3" />
            </div>
            <v-sheet v-else height="250" class="d-flex align-center justify-center">
              <!-- Chart placeholder - In a real app, this would be a chart component -->
              <div class="text-center w-100">
                <div class="text-subtitle-1 mb-4">Pipeline Status Distribution</div>
                <v-row>
                  <v-col v-for="(status, index) in statusDistribution" :key="index">
                    <v-hover v-slot="{ isHovering, props }">
                      <v-sheet 
                        v-bind="props"
                        rounded 
                        class="pa-4 status-card" 
                        :color="getStatusColor(status.name)"
                        :class="{'on-hover': isHovering}"
                      >
                        <div class="text-white">{{ status.name }}</div>
                        <div class="text-h4 text-white mt-2">{{ status.count }}</div>
                      </v-sheet>
                    </v-hover>
                  </v-col>
                </v-row>
              </div>
            </v-sheet>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTenantStore } from '@/stores/tenant';

const tenantStore = useTenantStore();
const loading = ref(true);
const recentExecutions = ref([]);
const stats = ref({
  totalPipelines: 0,
  activePipelines: 0,
  dataSources: 0,
  recentExecutions: 0
});
const statusDistribution = ref([
  { name: 'Completed', count: 0 },
  { name: 'Running', count: 0 },
  { name: 'Failed', count: 0 }
]);

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

async function fetchDashboardData() {
  try {
    loading.value = true;
    
    // In a real app, these would be actual API calls
    // For now, using simulated data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    stats.value = {
      totalPipelines: 12,
      activePipelines: 3,
      dataSources: 8,
      recentExecutions: 27
    };
    
    statusDistribution.value = [
      { name: 'Completed', count: 18 },
      { name: 'Running', count: 3 },
      { name: 'Failed', count: 6 }
    ];
    
    recentExecutions.value = [
      {
        id: '1',
        pipelineName: 'Sales Data ETL',
        startTime: new Date(Date.now() - 30 * 60000).toISOString(),
        duration: 245000,
        status: 'Completed',
        rowsProcessed: 12345
      },
      {
        id: '2',
        pipelineName: 'Customer Import',
        startTime: new Date(Date.now() - 120 * 60000).toISOString(),
        duration: 183000,
        status: 'Completed',
        rowsProcessed: 5280
      },
      {
        id: '3',
        pipelineName: 'Product Sync',
        startTime: new Date(Date.now() - 10 * 60000).toISOString(),
        duration: 450000,
        status: 'Running',
        rowsProcessed: 3200
      },
      {
        id: '4',
        pipelineName: 'Analytics Export',
        startTime: new Date(Date.now() - 180 * 60000).toISOString(),
        duration: 360000,
        status: 'Failed',
        rowsProcessed: 0
      }
    ];
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchDashboardData();
  
  // Refetch if tenant changes
  tenantStore.$subscribe(() => {
    if (tenantStore.currentTenantId) {
      fetchDashboardData();
    }
  });
});
</script>

<style scoped>
.on-hover {
  transition: all var(--app-transition-speed) ease-in-out;
  transform: var(--app-card-hover-transform);
}

.execution-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.status-card {
  transition: all var(--app-transition-speed) ease;
  text-align: center;
  border-radius: var(--app-border-radius);
}

.status-card.on-hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(var(--v-theme-on-surface), 0.15);
}

/* Theme-specific styling */
:deep(.v-card) {
  border-radius: var(--app-border-radius);
  overflow: hidden;
}

:deep(.v-theme--dark .v-table) {
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.87) !important;
}

:deep(.v-theme--dark .status-card) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

:deep(.v-theme--light .status-card) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
