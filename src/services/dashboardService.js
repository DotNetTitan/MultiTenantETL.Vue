// Dashboard service for handling dashboard-related API calls
import { mockPipelines, mockExecutions } from '@/mocks/pipelines';
import { mockConnectors } from '@/mocks/connectors';

/**
 * Fetches dashboard data including stats and recent executions
 * @returns {Promise<Object>} Object containing stats and executions data
 */
export async function fetchDashboardData() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate stats from actual mock data
    const totalPipelines = mockPipelines.length;
    const activePipelines = mockPipelines.filter(p => p.status === 'Running').length;
    const dataSources = mockConnectors.length;
    const recentExecutions = mockExecutions.length;
    
    const stats = {
      totalPipelines,
      activePipelines,
      dataSources,
      recentExecutions
    };
    
    // Calculate status distribution from executions
    const statusCounts = mockExecutions.reduce((acc, exec) => {
      acc[exec.status] = (acc[exec.status] || 0) + 1;
      return acc;
    }, {});
    
    const statusDistribution = [
      { name: 'Completed', count: statusCounts.Completed || 0 },
      { name: 'Running', count: statusCounts.Running || 0 },
      { name: 'Failed', count: statusCounts.Failed || 0 }
    ];
    
    // Get recent executions (last 5, sorted by start time)
    const sortedExecutions = [...mockExecutions]
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 5);
    
    const recentExecutionsData = sortedExecutions.map(exec => {
      const duration = exec.endTime 
        ? new Date(exec.endTime).getTime() - new Date(exec.startTime).getTime()
        : Date.now() - new Date(exec.startTime).getTime();
      
      return {
        id: exec.id,
        pipelineName: exec.pipelineName,
        startTime: exec.startTime,
        duration: duration,
        status: exec.status,
        rowsProcessed: exec.recordsProcessed || 0
      };
    });
    
    return { stats, statusDistribution, recentExecutions: recentExecutionsData };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}