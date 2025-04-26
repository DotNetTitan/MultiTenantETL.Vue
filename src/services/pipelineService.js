import { API_ENDPOINTS } from '@/config/api'

// Mock data
const mockPipelines = [
  {
    id: '1',
    name: 'Sales Data ETL',
    description: 'Extract sales data from SQL Server, transform, and load to data warehouse',
    sourceName: 'SQL Server - Sales',
    destinationName: 'Data Warehouse',
    status: 'Idle',
    sourceId: '1',
    destinationId: '5',
    transformationIds: ['1', '4'],
    transformations: [],
    isScheduled: true,
    schedule: {
      frequency: 'Daily',
      time: '02:00',
      cronExpression: '0 2 * * *'
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Customer Import',
    description: 'Import customer data from CSV files',
    sourceName: 'SFTP - Customer Files',
    destinationName: 'Customer Database',
    status: 'Idle',
    sourceId: '2',
    destinationId: '6',
    transformationIds: ['2', '3'],
    transformations: [],
    isScheduled: true,
    schedule: {
      frequency: 'Weekly',
      time: '04:30',
      cronExpression: '30 4 * * 1'
    },
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Product Sync',
    description: 'Sync product data between systems',
    sourceName: 'ERP API',
    destinationName: 'E-commerce Platform',
    status: 'Running',
    sourceId: '3',
    destinationId: '7',
    transformationIds: ['5'],
    transformations: [],
    isScheduled: false,
    schedule: null,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    name: 'Analytics Export',
    description: 'Export analytics data to reporting system',
    sourceName: 'Analytics DB',
    destinationName: 'Reporting System',
    status: 'Failed',
    sourceId: '4',
    destinationId: '8',
    transformationIds: [],
    transformations: [],
    isScheduled: true,
    schedule: {
      frequency: 'Daily',
      time: '01:00',
      cronExpression: '0 1 * * *'
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

const mockExecutions = [
  {
    id: '1',
    pipelineId: '1',
    status: 'Completed',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    recordsProcessed: 1245,
    errors: []
  },
  {
    id: '2',
    pipelineId: '2',
    status: 'Completed',
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    recordsProcessed: 3456,
    errors: []
  },
  {
    id: '3',
    pipelineId: '1',
    status: 'Failed',
    startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
    recordsProcessed: 560,
    errors: ['Data validation failed: Missing required fields']
  },
  {
    id: '4',
    pipelineId: '3',
    status: 'Completed',
    startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
    recordsProcessed: 9872,
    errors: []
  }
];

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
    
    const pipeline = mockPipelines.find(p => p.id === id);
    
    if (!pipeline) {
      const error = new Error('Pipeline not found');
      error.response = { status: 404 };
      throw error;
    }
    
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
  getExecutionById
};