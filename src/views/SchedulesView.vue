<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">{{ $t('schedules.title') }}</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        @click="openCreateDialog"
      >
        <v-icon v-if="$vuetify.display.smAndUp" class="mr-2">mdi-plus</v-icon>
        <span v-if="$vuetify.display.xs">{{ $t('common.create') }}</span>
        <span v-else>{{ $t('schedules.createSchedule') }}</span>
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              :label="$t('schedules.searchSchedules')"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              clearable
              class="mb-4"
              @update:model-value="debouncedFetch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :label="$t('schedules.filterByStatus')"
              :items="statusOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchSchedulesList"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="sortBy"
              :label="$t('schedules.sortBy')"
              :items="sortOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchSchedulesList"
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn
              icon
              variant="text"
              :loading="loading"
              @click="fetchSchedulesList"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-col>
        </v-row>

        <!-- Empty State -->
        <div v-if="!loading && schedules.length === 0" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-calendar-clock</v-icon>
          <h3 class="text-h6 mt-4 text-grey">{{ $t('schedules.noSchedules') }}</h3>
          <p class="text-grey mt-2">{{ $t('schedules.noSchedulesDescription') }}</p>
          <v-btn color="primary" class="mt-4" @click="openCreateDialog">
            <v-icon class="mr-2">mdi-plus</v-icon>
            {{ $t('schedules.createSchedule') }}
          </v-btn>
        </div>

        <!-- Schedules Table -->
        <v-data-table
          v-else
          :headers="headers"
          :items="schedules"
          :loading="loading"
          :items-per-page="pagination.pageSize"
          class="mt-2"
        >
          <template #item.pipelineName="{ item }">
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-pipe</v-icon>
              {{ item.pipelineName || 'Unknown Pipeline' }}
            </div>
          </template>

          <template #item.cronExpression="{ item }">
            <div>
              <code class="text-caption">{{ item.cronExpression }}</code>
              <div v-if="item.cronDescription" class="text-caption text-grey">
                {{ item.cronDescription }}
              </div>
            </div>
          </template>

          <template #item.timezone="{ item }">
            <v-chip size="small" variant="outlined">
              {{ item.timezone }}
            </v-chip>
          </template>

          <template #item.isActive="{ item }">
            <v-switch
              :model-value="item.isActive"
              color="success"
              hide-details
              density="compact"
              :loading="togglingId === item.id"
              @update:model-value="toggleActive(item)"
            />
          </template>

          <template #item.nextRunAt="{ item }">
            <div v-if="item.nextRunAt && item.isActive">
              <div>{{ formatDate(item.nextRunAt) }}</div>
              <div class="text-caption text-grey">
                {{ formatRelativeTime(item.nextRunAt) }}
              </div>
            </div>
            <span v-else class="text-grey">-</span>
          </template>

          <template #item.lastRunAt="{ item }">
            <div v-if="item.lastRunAt">
              <div>{{ formatDate(item.lastRunAt) }}</div>
              <v-chip
                v-if="item.lastRunStatus"
                :color="getStatusColor(item.lastRunStatus)"
                size="x-small"
                class="mt-1"
              >
                {{ item.lastRunStatus }}
              </v-chip>
            </div>
            <span v-else class="text-grey">{{ $t('pipelines.never') }}</span>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex flex-nowrap">
              <v-btn
                icon
                variant="text"
                size="small"
                :title="$t('schedules.trigger')"
                :loading="triggeringId === item.id"
                @click="triggerScheduleNow(item)"
              >
                <v-icon>mdi-play</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                :title="$t('schedules.editSchedule')"
                @click="editSchedule(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                :title="$t('schedules.deleteSchedule')"
                @click="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="d-flex justify-center mt-4">
          <v-pagination
            v-model="pagination.page"
            :length="pagination.totalPages"
            :total-visible="5"
            @update:model-value="fetchSchedulesList"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Schedule Dialog -->
    <v-dialog
      v-model="showDialog"
      max-width="700px"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          {{ editingSchedule?.id ? $t('schedules.editSchedule') : $t('schedules.createSchedule') }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="closeDialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveScheduleData">
            <v-row>
              <!-- Pipeline Selection (only for new schedules) -->
              <v-col v-if="!editingSchedule?.id" cols="12">
                <v-autocomplete
                  v-model="editingSchedule.pipelineId"
                  :label="$t('schedules.selectPipeline')"
                  :items="pipelines"
                  item-title="name"
                  item-value="id"
                  :rules="[v => !!v || $t('schedules.validation.pipelineRequired')]"
                  :loading="loadingPipelines"
                  prepend-inner-icon="mdi-pipe"
                />
              </v-col>

              <!-- Pipeline Name (read-only for existing schedules) -->
              <v-col v-else cols="12">
                <v-text-field
                  :model-value="editingSchedule.pipelineName"
                  :label="$t('schedules.pipeline')"
                  readonly
                  prepend-inner-icon="mdi-pipe"
                />
              </v-col>

              <!-- Cron Expression with Presets -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingSchedule.cronExpression"
                  :label="$t('schedules.cronExpression')"
                  :hint="$t('schedules.cronExpressionHint')"
                  :rules="cronRules"
                  :error-messages="cronValidation.isValid === false ? [cronValidation.errorMessage] : []"
                  persistent-hint
                  @update:model-value="debouncedValidateCron"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedPreset"
                  :label="$t('schedules.presets.title')"
                  :items="cronPresets"
                  item-title="text"
                  item-value="value"
                  clearable
                  @update:model-value="applyPreset"
                />
              </v-col>

              <!-- Cron Validation Feedback -->
              <v-col v-if="cronValidation.isValid && cronValidation.description" cols="12">
                <v-alert type="success" variant="tonal" density="compact">
                  <div class="font-weight-medium">{{ cronValidation.description }}</div>
                  <div v-if="cronValidation.nextExecutions?.length" class="mt-2">
                    <div class="text-caption text-grey-darken-1">{{ $t('schedules.nextExecutions') }}:</div>
                    <ul class="text-caption ml-4">
                      <li v-for="(exec, idx) in cronValidation.nextExecutions.slice(0, 3)" :key="idx">
                        {{ formatDate(exec) }}
                      </li>
                    </ul>
                  </div>
                </v-alert>
              </v-col>

              <v-col v-if="cronValidation.isValid === false && cronValidation.errorMessage" cols="12">
                <v-alert type="error" variant="tonal" density="compact">
                  {{ cronValidation.errorMessage }}
                </v-alert>
              </v-col>

              <!-- Timezone -->
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="editingSchedule.timezone"
                  :label="$t('schedules.timezone')"
                  :items="commonTimezones"
                  item-title="title"
                  item-value="value"
                  :rules="[v => !!v || $t('schedules.validation.timezoneRequired')]"
                  @update:model-value="debouncedValidateCron"
                />
              </v-col>

              <!-- Active Status -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingSchedule.isActive"
                  :label="editingSchedule.isActive ? $t('schedules.enabled') : $t('schedules.disabled')"
                  color="success"
                />
              </v-col>

              <!-- Description -->
              <v-col cols="12">
                <v-textarea
                  v-model="editingSchedule.description"
                  :label="$t('schedules.description')"
                  :placeholder="$t('schedules.descriptionPlaceholder')"
                  rows="2"
                  counter="500"
                  :rules="[v => !v || v.length <= 500 || 'Max 500 characters']"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="cronValidation.isValid === false"
            @click="saveScheduleData"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>{{ $t('schedules.deleteSchedule') }}</v-card-title>
        <v-card-text>
          {{ $t('schedules.deleteConfirm') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deleteScheduleConfirmed"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Trigger Confirmation Dialog -->
    <v-dialog
      v-model="showTriggerDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>{{ $t('schedules.trigger') }}</v-card-title>
        <v-card-text>
          {{ $t('schedules.triggerConfirm') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showTriggerDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            @click="triggerConfirmed"
          >
            {{ $t('schedules.trigger') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedule } from '@/composables/useSchedule'
import { useGlobalState } from '@/composables/useGlobalState'
import { fetchPipelines } from '@/services/pipelineService'

const { t } = useI18n()
const { showSuccess, showError } = useGlobalState()
const {
  schedules,
  loading,
  saving,
  error,
  pagination,
  cronValidation,
  validating,
  commonTimezones,
  cronPresets,
  loadSchedules,
  saveNewSchedule,
  saveSchedule,
  removeSchedule,
  toggleScheduleActive,
  runScheduleNow,
  validateCron,
  getStatusColor: getScheduleStatusColor,
  formatDate,
  formatRelativeTime,
  createEmptySchedule
} = useSchedule()

// Local state
const search = ref('')
const statusFilter = ref(null)
const sortBy = ref('next_run_asc')
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showTriggerDialog = ref(false)
const editingSchedule = ref(createEmptySchedule())
const scheduleToDelete = ref(null)
const scheduleToTrigger = ref(null)
const selectedPreset = ref(null)
const formRef = ref(null)
const deleting = ref(false)
const togglingId = ref(null)
const triggeringId = ref(null)

// Pipelines for selection
const pipelines = ref([])
const loadingPipelines = ref(false)

// Computed properties
const headers = computed(() => [
  { title: t('schedules.pipeline'), key: 'pipelineName', sortable: false },
  { title: t('schedules.cronExpression'), key: 'cronExpression', sortable: false },
  { title: t('schedules.timezone'), key: 'timezone', sortable: false },
  { title: t('schedules.isActive'), key: 'isActive', sortable: false, width: '100px' },
  { title: t('schedules.nextRun'), key: 'nextRunAt', sortable: false },
  { title: t('schedules.lastRun'), key: 'lastRunAt', sortable: false },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '150px' }
])

const statusOptions = computed(() => [
  { title: t('schedules.allStatuses'), value: null },
  { title: t('schedules.active'), value: true },
  { title: t('schedules.inactive'), value: false }
])

const sortOptions = computed(() => [
  { title: t('schedules.sortNextRunAsc'), value: 'next_run_asc' },
  { title: t('schedules.sortNextRunDesc'), value: 'next_run_desc' },
  { title: t('schedules.sortCreatedDesc'), value: 'created_desc' },
  { title: t('schedules.sortPipelineAsc'), value: 'pipeline_asc' }
])

const cronRules = computed(() => [
  v => !!v || t('schedules.validation.cronRequired'),
  v => (v && v.trim().split(/\s+/).length === 6) || t('schedules.validation.cronInvalid')
])

// Methods
async function fetchSchedulesList() {
  await loadSchedules({
    search: search.value || null,
    isActive: statusFilter.value,
    sortBy: sortBy.value,
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  })
}

async function loadPipelinesList() {
  loadingPipelines.value = true
  try {
    const result = await fetchPipelines()
    pipelines.value = Array.isArray(result) ? result : (result.pipelines || [])
  } catch (err) {
    console.error('Error loading pipelines:', err)
    pipelines.value = []
  } finally {
    loadingPipelines.value = false
  }
}

function openCreateDialog() {
  editingSchedule.value = createEmptySchedule()
  selectedPreset.value = null
  cronValidation.value = { isValid: null, errorMessage: null, description: null, nextExecutions: [] }
  showDialog.value = true
  loadPipelinesList()
}

function editSchedule(schedule) {
  editingSchedule.value = {
    id: schedule.id,
    pipelineId: schedule.pipelineId,
    pipelineName: schedule.pipelineName,
    cronExpression: schedule.cronExpression,
    timezone: schedule.timezone,
    description: schedule.description || '',
    isActive: schedule.isActive
  }
  selectedPreset.value = null
  // Validate the existing cron
  validateCron(schedule.cronExpression, schedule.timezone)
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingSchedule.value = createEmptySchedule()
  selectedPreset.value = null
}

function applyPreset(presetValue) {
  if (presetValue) {
    editingSchedule.value.cronExpression = presetValue
    debouncedValidateCron()
  }
}

// Debounced functions
let searchTimeout = null
function debouncedFetch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchSchedulesList()
  }, 300)
}

let cronTimeout = null
function debouncedValidateCron() {
  if (cronTimeout) clearTimeout(cronTimeout)
  cronTimeout = setTimeout(() => {
    if (editingSchedule.value.cronExpression && editingSchedule.value.timezone) {
      validateCron(editingSchedule.value.cronExpression, editingSchedule.value.timezone)
    }
  }, 500)
}

async function saveScheduleData() {
  const { valid } = await formRef.value.validate()
  if (!valid || cronValidation.value.isValid === false) return

  try {
    if (editingSchedule.value.id) {
      await saveSchedule(editingSchedule.value.id, {
        cronExpression: editingSchedule.value.cronExpression,
        timezone: editingSchedule.value.timezone,
        description: editingSchedule.value.description,
        isActive: editingSchedule.value.isActive
      })
      showSuccess(t('schedules.updateSuccess'), t('schedules.title'))
    } else {
      await saveNewSchedule({
        pipelineId: editingSchedule.value.pipelineId,
        cronExpression: editingSchedule.value.cronExpression,
        timezone: editingSchedule.value.timezone,
        description: editingSchedule.value.description,
        isActive: editingSchedule.value.isActive
      })
      showSuccess(t('schedules.createSuccess'), t('schedules.title'))
    }
    closeDialog()
    fetchSchedulesList()
  } catch (err) {
    showError(err.response?.data?.message || err.message || t('schedules.saveError'), t('common.error'))
  }
}

function confirmDelete(schedule) {
  scheduleToDelete.value = schedule
  showDeleteDialog.value = true
}

async function deleteScheduleConfirmed() {
  if (!scheduleToDelete.value) return

  deleting.value = true
  try {
    await removeSchedule(scheduleToDelete.value.id)
    showSuccess(t('schedules.deleteSuccess'), t('schedules.title'))
    showDeleteDialog.value = false
    scheduleToDelete.value = null
    fetchSchedulesList()
  } catch (err) {
    showError(err.message || t('schedules.deleteError'), t('common.error'))
  } finally {
    deleting.value = false
  }
}

async function toggleActive(schedule) {
  togglingId.value = schedule.id
  try {
    await toggleScheduleActive(schedule.id)
    showSuccess(
      schedule.isActive ? t('schedules.disableSuccess') : t('schedules.enableSuccess'),
      t('schedules.title')
    )
    fetchSchedulesList()
  } catch (err) {
    showError(err.message || t('schedules.toggleError'), t('common.error'))
  } finally {
    togglingId.value = null
  }
}

function triggerScheduleNow(schedule) {
  scheduleToTrigger.value = schedule
  showTriggerDialog.value = true
}

async function triggerConfirmed() {
  if (!scheduleToTrigger.value) return

  triggeringId.value = scheduleToTrigger.value.id
  showTriggerDialog.value = false
  
  try {
    await runScheduleNow(scheduleToTrigger.value.id)
    showSuccess(t('schedules.triggerSuccess'), t('schedules.title'))
    fetchSchedulesList()
  } catch (err) {
    showError(err.message || t('schedules.triggerError'), t('common.error'))
  } finally {
    triggeringId.value = null
    scheduleToTrigger.value = null
  }
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success'
    case 'running':
      return 'info'
    case 'failed':
      return 'error'
    case 'cancelled':
      return 'warning'
    default:
      return 'grey'
  }
}

// Lifecycle
onMounted(() => {
  fetchSchedulesList()
})
</script>

<style scoped>
code {
  background-color: rgba(var(--v-theme-surface-variant), 0.4);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
