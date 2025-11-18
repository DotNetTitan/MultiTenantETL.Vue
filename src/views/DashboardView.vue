<template>
  <div>
    <h1 class="text-h4 mb-6">{{ $t('dashboard.title') }}</h1>
    
    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-hover v-slot="{ isHovering, props }">
          <v-card 
            v-bind="props" 
            class="mb-4" 
            :elevation="isHovering ? 5 : 2"
            :class="{'on-hover': isHovering}"
            @click="$router.push('/pipelines')"
          >
            <v-card-item>
              <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-pipe" size="x-large" class="mr-2" color="primary" />
                {{ $t('dashboard.totalPipelines') }}
              </v-card-title>
              <div class="text-h2 text-center my-3">
                {{ stats.totalPipelines }}
                <v-progress-circular v-if="loading" indeterminate size="24" width="2" class="ml-2" />
              </div>
            </v-card-item>
            <v-card-actions>
              <v-btn variant="tonal" block to="/pipelines">{{ $t('dashboard.viewPipelines') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-hover>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-hover v-slot="{ isHovering, props }">
          <v-card 
            v-bind="props" 
            class="mb-4" 
            :elevation="isHovering ? 5 : 2"
            :class="{'on-hover': isHovering}"
            @click="$router.push('/pipelines?status=active')"
          >
            <v-card-item>
              <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-play-circle" size="x-large" class="mr-2" color="success" />
                {{ $t('dashboard.activePipelines') }}
              </v-card-title>
              <div class="text-h2 text-center my-3">
                {{ stats.activePipelines }}
                <v-progress-circular v-if="loading" indeterminate size="24" width="2" class="ml-2" />
              </div>
            </v-card-item>
            <v-card-actions>
              <v-btn variant="tonal" color="success" block to="/pipelines?status=active">{{ $t('dashboard.viewActive') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-hover>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-hover v-slot="{ isHovering, props }">
          <v-card 
            v-bind="props" 
            class="mb-4" 
            :elevation="isHovering ? 5 : 2"
            :class="{'on-hover': isHovering}"
            @click="$router.push('/connectors')"
          >
            <v-card-item>
              <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-database" size="x-large" class="mr-2" color="info" />
                {{ $t('dashboard.connectors') }}
              </v-card-title>
              <div class="text-h2 text-center my-3">
                {{ stats.connectors }}
                <v-progress-circular v-if="loading" indeterminate size="24" width="2" class="ml-2" />
              </div>
            </v-card-item>
            <v-card-actions>
              <v-btn variant="tonal" color="info" block to="/connectors">{{ $t('dashboard.viewSources') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-hover>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-hover v-slot="{ isHovering, props }">
          <v-card 
            v-bind="props" 
            class="mb-4" 
            :elevation="isHovering ? 5 : 2"
            :class="{'on-hover': isHovering}"
            @click="$router.push('/executions')"
          >
            <v-card-item>
              <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-history" size="x-large" class="mr-2" color="purple" />
                {{ $t('dashboard.recentExecutions') }}
              </v-card-title>
              <div class="text-h2 text-center my-3">
                {{ stats.recentExecutions }}
                <v-progress-circular v-if="loading" indeterminate size="24" width="2" class="ml-2" />
              </div>
            </v-card-item>
            <v-card-actions>
              <v-btn variant="tonal" color="purple" block to="/executions">{{ $t('dashboard.viewExecutions') }}</v-btn>
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
            {{ $t('dashboard.recentPipelineExecutions') }}
            <v-spacer />
            <v-btn size="small" variant="outlined" to="/executions" prepend-icon="mdi-eye">
              {{ $t('dashboard.viewAll') }}
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-table hover>
              <thead>
                <tr>
                  <th>{{ $t('dashboard.pipeline') }}</th>
                  <th>{{ $t('dashboard.startTime') }}</th>
                  <th>{{ $t('dashboard.duration') }}</th>
                  <th>{{ $t('dashboard.status') }}</th>
                  <th>{{ $t('dashboard.rowsProcessed') }}</th>
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
                    {{ $t('dashboard.noRecentExecutions') }}
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
                        {{ $t(`executions.${execution.status.toLowerCase()}`) }}
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
            {{ $t('dashboard.pipelineStatus') }}
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div v-if="loading" class="text-center my-4">
              <v-progress-circular indeterminate size="32" width="3" />
            </div>
            <v-sheet v-else height="250" class="d-flex align-center justify-center">
              <!-- Chart placeholder - In a real app, this would be a chart component -->
              <div class="text-center w-100">
                <div class="text-subtitle-1 mb-4">{{ $t('dashboard.pipelineStatusDistribution') }}</div>
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
                        <div class="text-white">{{ $t(`executions.${status.name.toLowerCase()}`) }}</div>
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
import { onMounted } from 'vue';
import { useDashboard } from '@/composables/useDashboard';

const {
  loading,
  stats,
  recentExecutions,
  statusDistribution,
  getStatusColor,
  getStatusIcon,
  formatDate,
  formatDuration,
  loadDashboardData,
  setupTenantSubscription
} = useDashboard();

onMounted(() => {
  loadDashboardData();
  setupTenantSubscription();
});
</script>

<style scoped>
.on-hover {
  transition: all var(--app-transition-speed) ease-in-out;
  transform: var(--app-card-hover-transform);
}

.execution-row {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.execution-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* Make stat numbers lighter in light mode */
.v-theme--light .text-h2 {
  font-weight: 400 !important;
  color: rgba(0, 0, 0, 0.75) !important;
}

/* Soften card titles in light mode */
.v-theme--light :deep(.v-card-title) {
  color: rgba(0, 0, 0, 0.75) !important;
  font-weight: 500 !important;
}

/* Softer card shadows in light mode */
.v-theme--light :deep(.v-card) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06) !important;
}

.v-theme--light :deep(.v-card:hover) {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06) !important;
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

:deep(.v-table) {
  background-color: transparent !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

:deep(.status-card) {
  box-shadow: 0 4px 8px rgba(var(--v-theme-on-surface), 0.15);
}
</style>
