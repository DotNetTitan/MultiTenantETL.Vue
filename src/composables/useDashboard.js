import { ref } from 'vue';
import { fetchDashboardData } from '@/services/dashboardService';
import { useTenantStore } from '@/stores/tenant';

/**
 * Composable for dashboard functionality
 * @returns {Object} Dashboard composable functions and reactive data
 */
export function useDashboard() {
  const tenantStore = useTenantStore();
  const loading = ref(true);
  const recentExecutions = ref([]);
  const stats = ref({
    totalPipelines: 0,
    activePipelines: 0,
    connectors: 0,
    recentExecutions: 0
  });
  const statusDistribution = ref([
    { name: 'Completed', count: 0 },
    { name: 'Running', count: 0 },
    { name: 'Failed', count: 0 }
  ]);

  /**
   * Get the appropriate color for a status
   * @param {string} status - The status name
   * @returns {string} Color name
   */
  function getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'grey';
    }
  }

  /**
   * Get the appropriate icon for a status
   * @param {string} status - The status name
   * @returns {string} Icon name
   */
  function getStatusIcon(status) {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'mdi-check-circle';
      case 'running':
        return 'mdi-progress-clock';
      case 'failed':
        return 'mdi-alert-circle';
      case 'cancelled':
        return 'mdi-cancel';
      default:
        return 'mdi-information';
    }
  }

  /**
   * Format a date string
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Format a duration in milliseconds
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration string
   */
  function formatDuration(milliseconds) {
    if (!milliseconds) return '-';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Fetch dashboard data from the API
   */
  async function loadDashboardData() {
    try {
      loading.value = true;
      
      const data = await fetchDashboardData();
      
      stats.value = data.stats;
      statusDistribution.value = data.statusDistribution;
      recentExecutions.value = data.recentExecutions;
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Setup tenant subscription to refresh data when tenant changes
   */
  function setupTenantSubscription() {
    tenantStore.$subscribe(() => {
      if (tenantStore.currentTenantId) {
        loadDashboardData();
      }
    });
  }

  return {
    // Reactive data
    loading,
    stats,
    recentExecutions,
    statusDistribution,
    
    // Methods
    getStatusColor,
    getStatusIcon,
    formatDate,
    formatDuration,
    loadDashboardData,
    setupTenantSubscription
  };
}