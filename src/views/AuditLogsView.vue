<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">{{ $t('auditLogs.title') }}</h1>
    </div>

    <v-card>
      <v-card-text>
        <v-row class="mb-2">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.action"
              :label="$t('auditLogs.filterByAction')"
              prepend-inner-icon="mdi-filter"
              clearable
              density="compact"
              @update:model-value="fetchLogs"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.resourceType"
              :items="resourceTypes"
              :label="$t('auditLogs.filterByResource')"
              prepend-inner-icon="mdi-shape"
              clearable
              density="compact"
              @update:model-value="fetchLogs"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.severity"
              :items="severityOptions"
              :label="$t('auditLogs.filterBySeverity')"
              prepend-inner-icon="mdi-alert"
              clearable
              density="compact"
              @update:model-value="fetchLogs"
            />
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="logs"
          :loading="loading"
          :items-per-page="10"
          class="mt-2"
        >
          <template #item.action="{ item }">
            <div class="d-flex align-center">
              <v-icon :icon="auditService.getActionIcon(item.action)" size="small" class="mr-2" />
              <span>{{ item.action }}</span>
            </div>
          </template>
          <template #item.userEmail="{ item }">
            {{ item.userEmail || '-' }}
          </template>
          <template #item.severity="{ item }">
            <v-chip
              :color="auditService.getSeverityColor(item.severity)"
              size="small"
            >
              {{ item.severity }}
            </v-chip>
          </template>
          <template #item.success="{ item }">
            <v-icon
              :icon="item.success ? 'mdi-check-circle' : 'mdi-alert-circle'"
              :color="item.success ? 'success' : 'error'"
              size="small"
            />
          </template>
          <template #item.createdAt="{ item }">
            {{ auditService.formatDate(item.createdAt) }}
          </template>
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              @click="viewDetails(item)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="900">
      <v-card v-if="selectedLog">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="mr-2" color="primary">mdi-file-document-outline</v-icon>
          <span class="text-h5">{{ $t('auditLogs.details') }}</span>
          <v-spacer />
          <v-btn icon variant="text" color="primary" @click="showDetailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <!-- Action Summary -->
          <div class="mb-4 pa-3 rounded" style="background-color: rgba(var(--v-theme-on-surface), 0.05)">
            <div class="d-flex align-center">
              <v-icon
                :icon="selectedLog.success ? 'mdi-check-circle' : 'mdi-alert-circle'"
                :color="selectedLog.success ? 'success' : 'error'"
                class="mr-2"
              />
              <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-medium">{{ selectedLog.action }}</div>
                <div class="text-caption text-medium-emphasis">{{ selectedLog.description }}</div>
              </div>
              <v-chip size="small" variant="outlined">
                {{ selectedLog.severity }}
              </v-chip>
            </div>
          </div>

          <!-- Main Details -->
          <v-row>
            <!-- User Information -->
            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="primary" class="mr-2">mdi-account</v-icon>
                  <span class="text-subtitle-2 font-weight-medium">User Information</span>
                </div>
                <div class="pl-7">
                  <div class="mb-2">
                    <div class="text-caption text-medium-emphasis">Email</div>
                    <div class="text-body-2">{{ selectedLog.userEmail || 'System' }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis">IP Address</div>
                    <div class="text-body-2">{{ selectedLog.ipAddress || '-' }}</div>
                  </div>
                </div>
              </div>
            </v-col>

            <!-- Resource Information -->
            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="primary" class="mr-2">mdi-cube-outline</v-icon>
                  <span class="text-subtitle-2 font-weight-medium">Resource Information</span>
                </div>
                <div class="pl-7">
                  <div class="mb-2">
                    <div class="text-caption text-medium-emphasis">Type</div>
                    <div class="text-body-2">{{ selectedLog.resourceType }}</div>
                  </div>
                  <div v-if="selectedLog.resourceId">
                    <div class="text-caption text-medium-emphasis">Resource ID</div>
                    <div class="text-body-2 font-mono text-caption">{{ selectedLog.resourceId }}</div>
                  </div>
                </div>
              </div>
            </v-col>

            <!-- Tenant Information -->
            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="primary" class="mr-2">mdi-domain</v-icon>
                  <span class="text-subtitle-2 font-weight-medium">Tenant</span>
                </div>
                <div class="pl-7">
                  <div class="text-caption text-medium-emphasis">Organization</div>
                  <div class="text-body-2">{{ selectedLog.tenantName || 'System Level' }}</div>
                </div>
              </div>
            </v-col>

            <!-- Timestamp -->
            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="primary" class="mr-2">mdi-clock-outline</v-icon>
                  <span class="text-subtitle-2 font-weight-medium">Timestamp</span>
                </div>
                <div class="pl-7">
                  <div class="text-caption text-medium-emphasis">Occurred At</div>
                  <div class="text-body-2">{{ auditService.formatDate(selectedLog.createdAt) }}</div>
                </div>
              </div>
            </v-col>

            <!-- Metadata -->
            <v-col v-if="selectedLog.metadata" cols="12">
              <v-divider class="mb-3" />
              <div class="mb-3">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="primary" class="mr-2">mdi-code-json</v-icon>
                  <span class="text-subtitle-2 font-weight-medium">{{ $t('auditLogs.metadata') }}</span>
                </div>
                <pre class="text-body-2 pa-3 rounded overflow-auto" style="max-height: 200px; background-color: rgba(var(--v-theme-on-surface), 0.05)">{{ selectedLog.metadata }}</pre>
              </div>
            </v-col>

            <!-- Error Message -->
            <v-col v-if="selectedLog.errorMessage" cols="12">
              <v-divider class="mb-3" />
              <div class="d-flex align-start pa-3 rounded" style="background-color: rgba(var(--v-theme-error), 0.1)">
                <v-icon color="error" size="small" class="mr-2 mt-1">mdi-alert-circle</v-icon>
                <div>
                  <div class="text-subtitle-2 font-weight-medium mb-1">{{ $t('auditLogs.error') }}</div>
                  <div class="text-body-2">{{ selectedLog.errorMessage }}</div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />
        
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="showDetailsDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { auditService } from '@/services/auditService'

const { t } = useI18n()
const authStore = useAuthStore()

const loading = ref(false)
const logs = ref([])

const filters = ref({
  action: null,
  resourceType: null,
  severity: null
})

const showDetailsDialog = ref(false)
const selectedLog = ref(null)

const headers = computed(() => [
  { title: t('auditLogs.action'), key: 'action', width: '200px' },
  { title: t('auditLogs.user'), key: 'userEmail', width: '200px' },
  { title: t('auditLogs.resource'), key: 'resourceType', width: '120px' },
  { title: t('auditLogs.severity'), key: 'severity', width: '100px' },
  { title: t('auditLogs.status'), key: 'success', width: '80px' },
  { title: t('auditLogs.timestamp'), key: 'createdAt', width: '180px' },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '80px', align: 'end' }
])

const resourceTypes = [
  'User',
  'Tenant',
  'Authentication',
  'Pipeline',
  'Connector',
  'Transformation'
]

const severityOptions = ['Info', 'Warning', 'Error']

async function fetchLogs() {
  try {
    loading.value = true
    const response = await auditService.getAuditLogs({
      action: filters.value.action,
      resourceType: filters.value.resourceType,
      severity: filters.value.severity,
      page: 1,
      pageSize: 1000 // Fetch all logs for client-side pagination
    })
    
    logs.value = response.logs
  } catch (error) {
    console.error('Error fetching audit logs:', error)
  } finally {
    loading.value = false
  }
}

function viewDetails(log) {
  selectedLog.value = log
  showDetailsDialog.value = true
}

onMounted(() => {
  fetchLogs()
})
</script>
