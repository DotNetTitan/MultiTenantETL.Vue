import api from './api'

/**
 * Fetches schedules with optional filtering and pagination
 * @param {Object} params - Filter parameters
 * @param {string} params.pipelineId - Filter by pipeline ID
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.search - Search term
 * @param {string} params.sortBy - Sort field (next_run_asc, next_run_desc, created_desc, pipeline_asc)
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Page size (default: 20)
 * @returns {Promise<Object>} Paginated list of schedule objects
 */
export async function fetchSchedules(params = {}) {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.pipelineId) queryParams.append('pipelineId', params.pipelineId)
    if (params.isActive !== undefined && params.isActive !== null) {
      queryParams.append('isActive', params.isActive)
    }
    if (params.search) queryParams.append('search', params.search)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.page) queryParams.append('page', params.page)
    if (params.pageSize) queryParams.append('pageSize', params.pageSize)
    
    const queryString = queryParams.toString()
    const url = queryString ? `/api/schedules?${queryString}` : '/api/schedules'
    
    const response = await api.get(url)
    return response.data
  } catch (error) {
    if (!error.silent) {
      console.error('Error fetching schedules:', error)
    }
    throw error
  }
}

/**
 * Fetches a single schedule by ID
 * @param {string} id - Schedule ID
 * @returns {Promise<Object>} Schedule object
 */
export async function fetchScheduleById(id) {
  try {
    const response = await api.get(`/api/schedules/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching schedule ${id}:`, error)
    throw error
  }
}

/**
 * Fetches schedule by pipeline ID
 * @param {string} pipelineId - Pipeline ID
 * @returns {Promise<Object|null>} Schedule object or null if not found
 */
export async function fetchScheduleByPipelineId(pipelineId) {
  try {
    const response = await api.get(`/api/schedules/pipeline/${pipelineId}`)
    return response.data
  } catch (error) {
    // 404 is expected when no schedule exists for a pipeline
    if (error.response?.status === 404) {
      return null
    }
    console.error(`Error fetching schedule for pipeline ${pipelineId}:`, error)
    throw error
  }
}

/**
 * Creates a new schedule
 * @param {Object} schedule - Schedule data
 * @param {string} schedule.pipelineId - Pipeline ID
 * @param {string} schedule.cronExpression - Cron expression
 * @param {string} schedule.timezone - Timezone
 * @param {string} schedule.description - Optional description
 * @param {boolean} schedule.isActive - Whether the schedule is active
 * @returns {Promise<Object>} Created schedule
 */
export async function createSchedule(schedule) {
  try {
    const response = await api.post('/api/schedules', {
      pipelineId: schedule.pipelineId,
      cronExpression: schedule.cronExpression,
      timezone: schedule.timezone,
      description: schedule.description || null,
      isActive: schedule.isActive ?? true
    })
    return response.data
  } catch (error) {
    console.error('Error creating schedule:', error)
    throw error
  }
}

/**
 * Updates an existing schedule
 * @param {string} id - Schedule ID
 * @param {Object} schedule - Schedule data
 * @param {string} schedule.cronExpression - Cron expression
 * @param {string} schedule.timezone - Timezone
 * @param {string} schedule.description - Optional description
 * @param {boolean} schedule.isActive - Whether the schedule is active
 * @returns {Promise<Object>} Updated schedule
 */
export async function updateSchedule(id, schedule) {
  try {
    const response = await api.put(`/api/schedules/${id}`, {
      cronExpression: schedule.cronExpression,
      timezone: schedule.timezone,
      description: schedule.description || null,
      isActive: schedule.isActive
    })
    return response.data
  } catch (error) {
    console.error(`Error updating schedule ${id}:`, error)
    throw error
  }
}

/**
 * Deletes a schedule
 * @param {string} id - Schedule ID
 * @returns {Promise<void>}
 */
export async function deleteSchedule(id) {
  try {
    await api.delete(`/api/schedules/${id}`)
  } catch (error) {
    console.error(`Error deleting schedule ${id}:`, error)
    throw error
  }
}

/**
 * Enables a schedule
 * @param {string} id - Schedule ID
 * @returns {Promise<Object>} Updated schedule
 */
export async function enableSchedule(id) {
  try {
    const response = await api.post(`/api/schedules/${id}/enable`)
    return response.data
  } catch (error) {
    console.error(`Error enabling schedule ${id}:`, error)
    throw error
  }
}

/**
 * Disables a schedule
 * @param {string} id - Schedule ID
 * @returns {Promise<Object>} Updated schedule
 */
export async function disableSchedule(id) {
  try {
    const response = await api.post(`/api/schedules/${id}/disable`)
    return response.data
  } catch (error) {
    console.error(`Error disabling schedule ${id}:`, error)
    throw error
  }
}

/**
 * Triggers a schedule immediately (manual execution)
 * @param {string} id - Schedule ID
 * @returns {Promise<Object>} Updated schedule
 */
export async function triggerSchedule(id) {
  try {
    const response = await api.post(`/api/schedules/${id}/trigger`)
    return response.data
  } catch (error) {
    console.error(`Error triggering schedule ${id}:`, error)
    throw error
  }
}

/**
 * Validates a cron expression
 * @param {string} cronExpression - The cron expression to validate
 * @param {string} timezone - The timezone for the schedule
 * @returns {Promise<Object>} Validation result with isValid, errorMessage, description, and nextExecutions
 */
export async function validateCronExpression(cronExpression, timezone = 'UTC') {
  try {
    const response = await api.post('/api/schedules/validate-cron', {
      cronExpression,
      timezone
    })
    return response.data
  } catch (error) {
    console.error('Error validating cron expression:', error)
    // Return a validation result instead of throwing
    return {
      isValid: false,
      errorMessage: error.message || 'Failed to validate cron expression'
    }
  }
}

/**
 * Toggle schedule active state
 * @param {string} id - Schedule ID
 * @param {boolean} isActive - New active state
 * @returns {Promise<Object>} Updated schedule
 */
export async function toggleSchedule(id, isActive) {
  return isActive ? enableSchedule(id) : disableSchedule(id)
}

// Export as a named service object for alternative import style
export const scheduleService = {
  getAll: fetchSchedules,
  getById: fetchScheduleById,
  getByPipelineId: fetchScheduleByPipelineId,
  create: createSchedule,
  update: updateSchedule,
  delete: deleteSchedule,
  enable: enableSchedule,
  disable: disableSchedule,
  trigger: triggerSchedule,
  validateCron: validateCronExpression,
  toggle: toggleSchedule
}
