// Dashboard service for handling dashboard-related API calls

/**
 * Fetches dashboard data including stats and recent executions
 * @returns {Promise<Object>} Object containing stats and executions data
 */
export async function fetchDashboardData() {
  try {
    // In a real app, this would be an actual API call
    // For now, using simulated data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const stats = {
      totalPipelines: 12,
      activePipelines: 3,
      dataSources: 8,
      recentExecutions: 27
    };
    
    const statusDistribution = [
      { name: 'Completed', count: 18 },
      { name: 'Running', count: 3 },
      { name: 'Failed', count: 6 }
    ];
    
    const recentExecutions = [
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
    
    return { stats, statusDistribution, recentExecutions };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}