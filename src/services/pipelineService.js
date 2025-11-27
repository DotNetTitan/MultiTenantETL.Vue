import api from './api'

/**
 * Fetches the list of pipelines with optional filtering
 * @param {Object} filters - Filter parameters
 * @param {string} filters.search - Search term to filter pipelines
 * @param {string} filters.status - Status to filter by
 * @param {string} filters.sortBy - Sort field and direction (e.g., 'name_asc')
 * @returns {Promise<Array>} List of pipeline objects
 */
export async function fetchPipelines(filters = {}) {
  try {
    const params = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 20
    }

    if (filters.search) {
      params.search = filters.search
    }

    if (filters.name) {
      params.name = filters.name
    }

    if (filters.status && filters.status !== 'All') {
      params.status = filters.status
    }

    if (filters.isScheduled !== undefined) {
      params.isScheduled = filters.isScheduled
    }

    if (filters.isActive !== undefined) {
      params.isActive = filters.isActive
    }

    if (filters.sortBy) {
      params.sortBy = filters.sortBy
    }

    const response = await api.get('/api/pipelines', { params })
    // Backend returns PagedPipelineResponse with pipelines property (camelCase due to JSON config)
    return response.data.pipelines || []
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    throw error;
  }
}

/**
 * Fetches a single pipeline by ID
 * @param {string} id - Pipeline ID
 * @returns {Promise<Object>} Pipeline object
 */
export async function fetchPipelineById(id) {
  try {
    const response = await api.get(`/api/pipelines/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching pipeline ${id}:`, error);
    throw error;
  }
}

/**
 * Creates or updates a pipeline
 * @param {Object} pipeline - Pipeline data
 * @returns {Promise<Object>} Created/updated pipeline
 */
export async function savePipeline(pipeline) {
  try {
    if (pipeline.id) {
      // Update existing pipeline
      const payload = {
        name: pipeline.name,
        description: pipeline.description || null,
        fieldMappings: pipeline.fieldMappings || [],
        schedule: pipeline.schedule || null,
        isScheduled: pipeline.isScheduled || false,
        isActive: pipeline.isActive
      }
      
      const response = await api.put(`/api/pipelines/${pipeline.id}`, payload)
      return response.data
    } else {
      // Create new pipeline
      const payload = {
        name: pipeline.name,
        description: pipeline.description || null,
        sourceConnectorId: pipeline.sourceId,
        destinationConnectorId: pipeline.destinationId,
        fieldMappings: pipeline.fieldMappings || [],
        schedule: pipeline.schedule || null,
        isScheduled: pipeline.isScheduled || false
      }
      
      const response = await api.post('/api/pipelines', payload)
      return response.data
    }
  } catch (error) {
    console.error('Error saving pipeline:', error);
    throw error;
  }
}

/**
 * Deletes a pipeline
 * @param {string} id - Pipeline ID to delete
 * @returns {Promise<boolean>} Success indicator
 */
export async function deletePipeline(id) {
  try {
    await api.delete(`/api/pipelines/${id}`)
    return true
  } catch (error) {
    console.error(`Error deleting pipeline ${id}:`, error);
    throw error;
  }
}

/**
 * Executes a pipeline
 * @param {string} id - Pipeline ID to execute
 * @returns {Promise<Object>} Execution result
 */
export async function executePipeline(id) {
  try {
    // TODO: This will be implemented when we add the execution engine
    const response = await api.post(`/api/pipelines/${id}/execute`)
    return response.data
  } catch (error) {
    console.error(`Error executing pipeline ${id}:`, error);
    throw error;
  }
}

/**
 * Gets a list of pipeline executions with optional filters
 * @param {Object} filters - Filter parameters
 * @param {string} filters.pipelineId - Filter by pipeline ID
 * @param {string} filters.status - Filter by execution status
 * @param {Date} filters.startDate - Filter by execution start date (minimum)
 * @param {Date} filters.endDate - Filter by execution start date (maximum)
 * @returns {Promise<Array>} List of execution objects
 */
export async function getExecutions(filters = {}) {
  try {
    // TODO: This will be implemented when we add the execution engine
    const params = {}
    
    if (filters.pipelineId) {
      params.pipelineId = filters.pipelineId
    }
    
    if (filters.status && filters.status !== 'All') {
      params.status = filters.status
    }
    
    if (filters.startDate) {
      params.startDate = filters.startDate
    }
    
    if (filters.endDate) {
      params.endDate = filters.endDate
    }
    
    const response = await api.get('/api/executions', { params })
    return response.data.executions || []
  } catch (error) {
    console.error('Error getting executions:', error);
    throw error;
  }
}

/**
 * Gets a specific execution by ID
 * @param {string} id - Execution ID
 * @returns {Promise<Object>} Execution object
 */
export async function getExecutionById(id) {
  try {
    // TODO: This will be implemented when we add the execution engine
    const response = await api.get(`/api/executions/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error getting execution ${id}:`, error);
    throw error;
  }
}

/**
 * Finds all pipelines that use a specific connector
 * @param {string} connectorId - Connector ID
 * @returns {Promise<Array>} List of pipelines using the connector
 */
export async function findPipelinesUsingConnector(connectorId) {
  try {
    // This will filter pipelines by connector on the backend
    const response = await api.get('/api/pipelines', {
      params: {
        sourceConnectorId: connectorId,
        destinationConnectorId: connectorId
      }
    })
    return response.data.pipelines || []
  } catch (error) {
    console.error(`Error finding pipelines using connector ${connectorId}:`, error);
    throw error;
  }
}

// For backward compatibility with code that might use the old object-based API
export const pipelineService = {
  getAll: fetchPipelines,
  getById: fetchPipelineById,
  create: pipeline => savePipeline(pipeline),
  update: (id, pipelineData) => {
    const pipeline = { id, ...pipelineData };
    return savePipeline(pipeline);
  },
  delete: deletePipeline,
  execute: executePipeline,
  getExecutions,
  getExecutionById,
  findPipelinesUsingConnector
};
