import api from './api'
import { API_ENDPOINTS } from '@/config/api'
import { getCurrentUser } from '@/utils/jwtHelper'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// OAuth client configuration  
const CLIENT_ID = 'multitenant-etl-postman'
const CLIENT_SECRET = 'super-secret-oauth-key-2025-change-in-prod'
const SCOPES = 'openid email profile roles api offline_access'

/**
 * Authentication Service
 * Handles OAuth 2.0 authentication with OpenIddict backend
 */
export const authService = {
  /**
   * Login with email and password using OAuth 2.0 password grant
   * @param {Object} credentials - { email, password } or { username, password }
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string, expiresIn: number}>}
   */
  async login(credentials) {
    try {
      // Prepare OAuth 2.0 token request (form-urlencoded)
      const params = new URLSearchParams({
        username: credentials.email || credentials.username,
        password: credentials.password,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'password',
        scope: SCOPES
      })

      // Make token request with form-urlencoded content type
      const response = await fetch(`${API_BASE}/connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw {
          response: { status: response.status, data: errorData },
          oauthError: errorData.error,
          message: errorData.error_description || errorData.error || 'Login failed'
        }
      }

      const data = await response.json()
      const { access_token, refresh_token, id_token, expires_in, token_type } = data

      // Store tokens (access_token is encrypted JWE, id_token is readable JWT)
      this.setTokens(access_token, refresh_token, id_token)

      // Decode id_token (not access_token - it's encrypted!) to get user information
      const user = getCurrentUser()

      return {
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
        idToken: id_token,
        expiresIn: expires_in,
        tokenType: token_type || 'Bearer'
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>}
   */
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: SCOPES
      })

      const response = await fetch(`${API_BASE}/connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      const { access_token, refresh_token, id_token, expires_in, token_type } = data

      this.setTokens(access_token, refresh_token, id_token)

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        idToken: id_token,
        expiresIn: expires_in,
        tokenType: token_type || 'Bearer'
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      throw error
    }
  },

  /**
   * Logout - revoke tokens and clear session
   */
  async logout() {
    try {
      const accessToken = this.getAccessToken()
      const refreshToken = this.getRefreshToken()

      // Call backend logout endpoint
      if (accessToken) {
        await api.post(API_ENDPOINTS.auth.logout)
      }

      // Revoke refresh token if exists
      if (refreshToken) {
        const params = new URLSearchParams({
          token: refreshToken,
          token_type_hint: 'refresh_token',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET
        })

        await fetch(`${API_BASE}/connect/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Don't throw - logout should always succeed locally
    } finally {
      this.clearTokens()
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - { email, password, firstName, lastName }
   * @returns {Promise<Object>}
   */
  async register(userData) {
    const response = await api.post(API_ENDPOINTS.auth.register, {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    })
    return response.data
  },

  /**
   * Confirm email address
   * @param {string} userId - User ID (UUID)
   * @param {string} token - Email confirmation token
   * @returns {Promise<Object>}
   * */
  async confirmEmail(userId, token) {
    const response = await api.post(API_ENDPOINTS.auth.confirmEmail, {
      userId,
      token
    })
    return response.data
  },

  /**
   * Request password reset email
   * @param {string} email - User's email address
   * @returns {Promise<Object>}
   */
  async forgotPassword(email) {
    const response = await api.post(API_ENDPOINTS.auth.forgotPassword, {
      email
    })
    return response.data
  },

  /**
   * Reset password with token
   * @param {string} userId - User ID (UUID)
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>}
   */
  async resetPassword(userId, token, newPassword) {
    const response = await api.post(API_ENDPOINTS.auth.resetPassword, {
      userId,
      token,
      newPassword
    })
    return response.data
  },

  /**
   * Change password for authenticated user
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirmation of new password
   * @returns {Promise<Object>}
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    const response = await api.post(API_ENDPOINTS.auth.changePassword, {
      currentPassword,
      newPassword,
      confirmPassword
    })
    return response.data
  },

  /**
   * Switch tenant for multi-tenant support
   * @param {string} tenantId - Tenant ID (UUID)
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async switchTenant(tenantId) {
    const response = await api.post(API_ENDPOINTS.auth.switchTenant, {
      tenantId
    })

    // Backend should return new tokens with updated tenant claim
    const { access_token, refresh_token, id_token, expires_in } = response.data

    this.setTokens(access_token, refresh_token, id_token)

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      idToken: id_token,
      expiresIn: expires_in
    }
  },

  /**
   * Check if user is authenticated (token exists and not expired)
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = this.getIdToken()
    if (!token) return false

    try {
      const user = getCurrentUser()
      return user && user.exp * 1000 > Date.now()
    } catch {
      return false
    }
  },

  // Token storage helpers
  setTokens(accessToken, refreshToken, idToken) {
    if (accessToken) {
      localStorage.setItem('access_token', accessToken)
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
    if (idToken) {
      localStorage.setItem('id_token', idToken)
    }
  },

  getAccessToken() {
    return localStorage.getItem('access_token')
  },

  getRefreshToken() {
    return localStorage.getItem('refresh_token')
  },

  getIdToken() {
    return localStorage.getItem('id_token')
  },

  clearTokens() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('id_token')
  }
}