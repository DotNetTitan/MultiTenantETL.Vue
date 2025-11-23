import axios from 'axios'
import { API_CONFIG } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'

// Create axios instance with configuration
const api = axios.create(API_CONFIG)

// Request interceptor - add auth token and tenant header
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const tenantStore = useTenantStore()

    // Add auth token if it exists
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

// Response interceptor - handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Import auth service dynamically to avoid circular dependency
        const { authService } = await import('./authService')

        // Attempt token refresh
        await authService.refreshToken()

        // Retry original request with new token
        const newToken = localStorage.getItem('access_token')
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }

        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - logout and redirect to login
        const authStore = useAuthStore()
        authStore.clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 403:
          error.userMessage = 'You do not have permission to perform this action.'
          break
        case 404:
          error.userMessage = 'The requested resource was not found.'
          break
        case 422:
          error.userMessage = error.response.data?.message || 'Validation failed. Please check your input.'
          break
        case 429:
          error.userMessage = 'Too many requests. Please try again later.'
          break
        case 500:
        case 502:
        case 503:
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