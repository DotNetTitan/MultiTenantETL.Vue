import { API_ENDPOINTS } from '@/config/api'

// Mock data
const mockPipelines = [
  {
    id: '1',
    name: 'Customer Data Integration',
    description: 'Integrates customer data from multiple sources',
    status: 'Active',
    sourceId: '1',
    transformationIds: ['1', '4'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Sales Data Processing',
    description: 'Processes daily sales data for reporting',
    status: 'Active',
    sourceId: '2',
    transformationIds: ['2', '3'],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Marketing Campaign Analysis',
    description: 'Analyzes marketing campaign performance',
    status: 'Inactive',
    sourceId: '3',
    transformationIds: ['5'],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
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

export const pipelineService = {
  async getAll() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockPipelines];
  },

  async getById(id) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const pipeline = mockPipelines.find(p => p.id === id);
    
    if (!pipeline) {
      const error = new Error('Pipeline not found');
      error.response = { status: 404 };
      throw error;
    }
    
    return { ...pipeline };
  },

  async create(pipelineData) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newPipeline = {
      ...pipelineData,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      lastRunAt: null
    };
    
    mockPipelines.push(newPipeline);
    return { ...newPipeline };
  },

  async update(id, pipelineData) {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = mockPipelines.findIndex(p => p.id === id);
    if (index === -1) {
      const error = new Error('Pipeline not found');
      error.response = { status: 404 };
      throw error;
    }
    
    const updatedPipeline = {
      ...mockPipelines[index],
      ...pipelineData
    };
    
    mockPipelines[index] = updatedPipeline;
    return { ...updatedPipeline };
  },

  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = mockPipelines.findIndex(p => p.id === id);
    if (index === -1) {
      const error = new Error('Pipeline not found');
      error.response = { status: 404 };
      throw error;
    }
    
    mockPipelines.splice(index, 1);
    return true;
  },

  async execute(id) {
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
      status: Math.random() > 0.2 ? 'Completed' : 'Failed', // 80% chance of success
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes later
      recordsProcessed: Math.floor(Math.random() * 5000) + 500,
      errors: []
    };
    
    if (newExecution.status === 'Failed') {
      newExecution.errors = ['Random error occurred during execution'];
    }
    
    mockExecutions.push(newExecution);
    
    // Update pipeline's last run date
    pipeline.lastRunAt = newExecution.startTime;
    
    return newExecution;
  },

  async getExecutions(filters = {}) {
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
  },

  async getExecutionById(id) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const execution = mockExecutions.find(e => e.id === id);
    if (!execution) {
      const error = new Error('Execution not found');
      error.response = { status: 404 };
      throw error;
    }
    
    return { ...execution };
  }
}