import { mockPipelines, mockExecutions } from '@/mocks/pipelines'

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
    // In a real app, this would be an API call with query params
    // For now, using simulated data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get a copy of the mock data
    let pipelines = [...mockPipelines];
    
    // Apply filters if provided
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      pipelines = pipelines.filter(p => 
        p.name.toLowerCase().includes(searchLower) || 
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.status && filters.status !== 'All') {
      pipelines = pipelines.filter(p => p.status === filters.status);
    }
    
    // Apply sorting if provided
    if (filters.sortBy) {
      const [field, direction] = filters.sortBy.split('_');
      pipelines.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (field === 'lastRun') {
          aVal = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0;
          bVal = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0;
        }
        
        if (direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    return pipelines;
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('Fetching pipeline with ID:', id);
    console.log('Available pipelines:', mockPipelines.map(p => ({ id: p.id, name: p.name })));
    
    const pipeline = mockPipelines.find(p => p.id === id);
    
    if (!pipeline) {
      console.error('Pipeline not found with ID:', id);
      const error = new Error('Pipeline not found');
      error.response = { status: 404 };
      throw error;
    }
    
    console.log('Found pipeline:', pipeline.name);
    return { ...pipeline };
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if it's an update or create
    if (pipeline.id) {
      // Update existing pipeline
      const index = mockPipelines.findIndex(p => p.id === pipeline.id);
      
      if (index === -1) {
        const error = new Error('Pipeline not found');
        error.response = { status: 404 };
        throw error;
      }
      
      const updatedPipeline = {
        ...mockPipelines[index],
        ...pipeline
      };
      
      mockPipelines[index] = updatedPipeline;
      return { ...updatedPipeline };
    } else {
      // Create new pipeline
      const newPipeline = {
        ...pipeline,
        id: Math.random().toString(36).substring(2, 15),
        createdAt: new Date().toISOString(),
        lastRunAt: null
      };
      
      mockPipelines.push(newPipeline);
      return { ...newPipeline };
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = mockPipelines.findIndex(p => p.id === id);
    if (index === -1) {
      const error = new Error('Pipeline not found');
      error.response = { status: 404 };
      throw error;
    }
    
    mockPipelines.splice(index, 1);
    return true;
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pipeline = mockPipelines.find(p => p.id === id);
    if (!pipeline) {
      const error = new Error('Pipeline not found');
      error.response = { status: 404 };
      throw error;
    }
    
    // Create a new execution record
    const newExecution = {
      id: Math.random().toString(36).substring(2, 15),
      pipelineId: id,
      status: 'Running', // Initial status is running
      startTime: new Date().toISOString(),
      endTime: null, // Will be set when execution completes
      recordsProcessed: 0,
      errors: []
    };
    
    mockExecutions.push(newExecution);
    
    // Update pipeline's last run date
    pipeline.lastRunAt = newExecution.startTime;
    pipeline.status = 'Running';
    
    return { ...newExecution };
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let filteredExecutions = [...mockExecutions];
    
    // Apply pipeline filter
    if (filters.pipelineId) {
      filteredExecutions = filteredExecutions.filter(e => e.pipelineId === filters.pipelineId);
    }
    
    // Apply status filter
    if (filters.status && filters.status !== 'All') {
      filteredExecutions = filteredExecutions.filter(e => e.status === filters.status);
    }
    
    // Apply date filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredExecutions = filteredExecutions.filter(e => new Date(e.startTime) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredExecutions = filteredExecutions.filter(e => new Date(e.startTime) <= endDate);
    }
    
    // Sort by date (newest first)
    filteredExecutions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    return filteredExecutions;
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const execution = mockExecutions.find(e => e.id === id);
    if (!execution) {
      const error = new Error('Execution not found');
      error.response = { status: 404 };
      throw error;
    }
    
    return { ...execution };
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find pipelines where the connector is used as source or destination
    const pipelines = mockPipelines.filter(p => 
      p.sourceId === connectorId || p.destinationId === connectorId
    );
    
    // Return simplified pipeline info
    return pipelines.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      usedAs: p.sourceId === connectorId ? 'source' : 'destination',
      status: p.status
    }));
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
