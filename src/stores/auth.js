import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import { authService } from '@/services/authService'
import { getCurrentUser, isAdmin as checkIsAdmin } from '@/utils/jwtHelper'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const error = ref(null)
  const loading = ref(false)
  const apiOffline = ref(false)

  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value ? checkIsAdmin() : false)
  const token = computed(() => authService.getAccessToken()) // For backward compatibility

  /**
   * Initialize - load user from token if available
   */
  function initialize() {
    if (authService.isAuthenticated()) {
      user.value = getCurrentUser()
    }
  }

  /**
   * Login with email and password
   * Note: This initiates OAuth Authorization Code Flow with PKCE
   * The browser will redirect to the authorization endpoint, then to callback
   */
  async function login(credentials) {
    try {
      loading.value = true
      error.value = null
      apiOffline.value = false

      // Initiate OAuth flow - this will redirect the browser
      // No response is returned as the browser navigates away
      await authService.initiateLogin(credentials)
      
      // This code won't execute because browser redirects
      // The callback page will handle setting the user
    } catch (err) {
      console.error('Login error:', err)

      if (err.isNetworkError || err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED') {
        apiOffline.value = true
        error.value = 'Cannot connect to the server. Please ensure the API server is running.'
      } else if (err.response?.status === 401 || err.oauthError === 'invalid_grant') {
        // Check for specific error descriptions from OAuth
        const errorDescription = err.response?.data?.error_description || err.message
        
        if (errorDescription?.includes('inactive')) {
          error.value = 'Your account has been deactivated. Please contact your administrator.'
        } else if (errorDescription?.includes('locked')) {
          error.value = 'Your account is locked due to too many failed login attempts.'
        } else if (errorDescription?.includes('not confirmed')) {
          error.value = 'Please confirm your email address before logging in.'
        } else {
          error.value = 'Invalid email or password'
        }
      } else if (err.response?.status === 429) {
        error.value = 'Too many login attempts. Please try again later.'
      } else {
        error.value = err.message || 'Login failed. Please try again later.'
      }
      loading.value = false
      throw err
    }
    // Don't set loading.value = false here because browser redirects
  }

  /**
   * Register new user
   */
  async function register(userData) {
    try {
      loading.value = true
      error.value = null

      await authService.register(userData)
      return true
    } catch (err) {
      console.error('Registration error:', err)
      error.value = err.response?.data?.message || err.userMessage || 'Registration failed. Please try again.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      // Clear state immediately to update UI
      clearAuth()

      // Navigate immediately
      router.push('/login')

      // Call backend to revoke tokens in background
      await authService.logout()
    } catch (err) {
      console.warn('Logout error handled:', err.message)
    }
  }

  /**
   * Forgot password
   */
  async function forgotPassword(email) {
    try {
      loading.value = true
      error.value = null

      await authService.forgotPassword(email)
      return true
    } catch (err) {
      console.error('Forgot password error:', err)
      error.value = err.response?.data?.message || err.userMessage || 'Failed to send reset email.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset password
   */
  async function resetPassword(userId, token, newPassword) {
    try {
      loading.value = true
      error.value = null

      await authService.resetPassword(userId, token, newPassword)
      return true
    } catch (err) {
      console.error('Reset password error:', err)
      error.value = err.response?.data?.message || err.userMessage || 'Failed to reset password.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Change password (authenticated users)
   */
  async function changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      loading.value = true
      error.value = null

      await authService.changePassword(currentPassword, newPassword, confirmPassword)
      return true
    } catch (err) {
      console.error('Change password error:', err)
      error.value = err.response?.data?.message || err.userMessage || 'Failed to change password.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Switch tenant
   */
  async function switchTenant(tenantId) {
    try {
      loading.value = true
      error.value = null

      const response = await authService.switchTenant(tenantId)

      // Update user with new token data (includes updated tenant info)
      user.value = response.user

      return true
    } catch (err) {
      console.error('Tenant switch error:', err)
      error.value = 'Failed to switch tenant. Please try again.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear authentication state
   */
  function clearAuth() {
    user.value = null
    authService.clearTokens()
  }

  /**
   * Reset UI state (loading, error)
   */
  function resetState() {
    loading.value = false
    error.value = null
    apiOffline.value = false
  }

  /**
   * Legacy methods for backward compatibility
   */
  function setUser(userData) {
    user.value = userData
  }

  function setToken(newToken) {
    // Not used anymore - tokens managed by authService
    console.warn('setToken is deprecated - use authService directly')
  }

  // Initialize on store creation
  initialize()

  return {
    // State
    user,
    error,
    loading,
    apiOffline,
    token, // For backward compatibility

    // Computed
    isAuthenticated,
    isAdmin,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    switchTenant,
    clearAuth,
    resetState,
    initialize,

    // Legacy (backward compatibility)
    setUser,
    setToken
  }
})
