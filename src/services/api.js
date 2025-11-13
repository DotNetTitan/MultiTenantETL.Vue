import axios from 'axios'
import { API_CONFIG } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'

// Create axios instance with configuration
const api = axios.create(API_CONFIG)

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const tenantStore = useTenantStore()

    // Add auth token if it exists
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    // Add tenant ID if it exists
    if (tenantStore.currentTenantId) {
      config.headers['X-Tenant-Id'] = tenantStore.currentTenantId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Unauthorized - token expired or invalid
          await authStore.logout()
          window.location.href = '/login'
          break
        case 403:
          // Forbidden - user doesn't have permission
          error.userMessage = 'You do not have permission to perform this action.'
          break
        case 404:
          // Not found
          error.userMessage = 'The requested resource was not found.'
          break
        case 422:
          // Validation error
          error.userMessage = error.response.data?.message || 'Validation failed. Please check your input.'
          break
        case 500:
        case 502:
        case 503:
          // Server errors
          error.userMessage = 'A server error occurred. Please try again later.'
          break
        default:
          error.userMessage = error.response.data?.message || 'An error occurred. Please try again.'
      }
    } else if (error.request) {
      // Request made but no response received (network error)
      error.userMessage = 'Network error. Please check your internet connection.'
      error.isNetworkError = true
    } else {
      // Something else happened
      error.userMessage = 'An unexpected error occurred.'
    }
    
    return Promise.reject(error)
  }
)

export default api