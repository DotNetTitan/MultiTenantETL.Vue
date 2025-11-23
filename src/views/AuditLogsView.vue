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
          :items-per-page="pageSize"
          hide-default-footer
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

        <div class="d-flex justify-center mt-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="fetchLogs"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="800">
      <v-card v-if="selectedLog">
        <v-card-title class="d-flex align-center">
          {{ $t('auditLogs.details') }}
          <v-spacer />
          <v-btn icon variant="text" @click="showDetailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">{{ $t('auditLogs.action') }}</div>
              <div class="text-body-1 mb-3">{{ selectedLog.action }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">{{ $t('auditLogs.resourceType') }}</div>
              <div class="text-body-1 mb-3">{{ selectedLog.resourceType }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">{{ $t('auditLogs.user') }}</div>
              <div class="text-body-1 mb-3">{{ selectedLog.userEmail || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">{{ $t('auditLogs.tenant') }}</div>
              <div class="text-body-1 mb-3">{{ selectedLog.tenantName || '-' }}</div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-grey">{{ $t('auditLogs.description') }}</div>
              <div class="text-body-1 mb-3">{{ selectedLog.description }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">{{ $t('auditLogs.ipAddress') }}</div>
              <div class="text-body-1 mb-3">{{ selectedLog.ipAddress || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">{{ $t('auditLogs.timestamp') }}</div>
              <div class="text-body-1 mb-3">{{ auditService.formatDate(selectedLog.createdAt) }}</div>
            </v-col>
            <v-col v-if="selectedLog.metadata" cols="12">
              <div class="text-caption text-grey">{{ $t('auditLogs.metadata') }}</div>
              <pre class="text-body-2 pa-2 bg-grey-lighten-4 rounded">{{ selectedLog.metadata }}</pre>
            </v-col>
            <v-col v-if="selectedLog.errorMessage" cols="12">
              <div class="text-caption text-grey">{{ $t('auditLogs.error') }}</div>
              <div class="text-body-1 text-error">{{ selectedLog.errorMessage }}</div>
            </v-col>
          </v-row>
        </v-card-text>
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
const currentPage = ref(1)
const pageSize = ref(50)
const totalCount = ref(0)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

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
      page: currentPage.value,
      pageSize: pageSize.value
    })
    
    logs.value = response.logs
    totalCount.value = response.totalCount
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
