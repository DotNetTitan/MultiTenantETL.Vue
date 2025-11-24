import api from './api'
import { API_ENDPOINTS } from '@/config/api'
import { getCurrentUser } from '@/utils/jwtHelper'
import { 
  generateCodeVerifier, 
  generateCodeChallenge, 
  generateState, 
  storePKCEParams, 
  retrievePKCEParams,
  clearPKCEParams
} from '@/utils/pkce'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// OAuth client configuration for SPA (Public Client)
const CLIENT_ID = 'multitenant-etl-spa'

// OAuth scopes
const SCOPES = {
  OPENID: 'openid',
  EMAIL: 'email',
  PROFILE: 'profile',
  ROLES: 'roles',
  API: 'api',
  OFFLINE_ACCESS: 'offline_access'
}

const DEFAULT_SCOPES = `${SCOPES.OPENID} ${SCOPES.EMAIL} ${SCOPES.PROFILE} ${SCOPES.ROLES} ${SCOPES.API} ${SCOPES.OFFLINE_ACCESS}`

/**
 * Authentication Service
 * Handles OAuth 2.0 Authorization Code Flow with PKCE
 */
export const authService = {
  /**
   * Initiate OAuth 2.0 Authorization Code Flow with PKCE
   * This redirects the browser to the authorization endpoint
   * @param {Object} credentials - { email, password } or { username, password }
   */
  async initiateLogin(credentials) {
    try {
      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      const state = generateState()

      // Store PKCE parameters and credentials for the callback
      storePKCEParams(state, codeVerifier)
      sessionStorage.setItem('login_credentials', JSON.stringify(credentials))

      // Build authorization URL
      const authParams = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        scope: DEFAULT_SCOPES,
        redirect_uri: `${window.location.origin}/auth/callback`,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        username: credentials.email || credentials.username,
        password: credentials.password
      })

      // Redirect to authorization endpoint
      window.location.href = `${API_BASE}/connect/authorize?${authParams.toString()}`
    } catch (error) {
      console.error('Login initiation error:', error)
      throw error
    }
  },

  /**
   * Handle OAuth callback - exchange authorization code for tokens
   * Called from the callback page after redirect
   * @param {string} code - Authorization code from URL
   * @param {string} state - State parameter from URL
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string, expiresIn: number}>}
   */
  async handleCallback(code, state) {
    // Retrieve and validate PKCE parameters
    const { state: storedState, codeVerifier } = retrievePKCEParams()

    if (!storedState || storedState !== state) {
      clearPKCEParams()
      throw new Error('State mismatch - possible CSRF attack')
    }

    if (!codeVerifier) {
      clearPKCEParams()
      throw new Error('Code verifier not found')
    }

    try {
      // Exchange authorization code for tokens
      // Note: Authorization codes are single-use per OAuth 2.0 spec
      // If this fails with "invalid_grant", the code was already used
      const tokenParams = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${window.location.origin}/auth/callback`,
        code_verifier: codeVerifier
      })

      const tokenResponse = await fetch(`${API_BASE}/connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenParams
      })

      if (!tokenResponse.ok) {
        let errorData
        const contentType = tokenResponse.headers.get('content-type')
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await tokenResponse.json()
          } else {
            // Non-JSON response (HTML error page, plain text, etc.)
            const text = await tokenResponse.text()
            console.error('Non-JSON error response:', text)
            errorData = {
              error: 'server_error',
              error_description: `Server returned ${tokenResponse.status}: ${tokenResponse.statusText}`
            }
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorData = {
            error: 'parse_error',
            error_description: 'Failed to parse server error response'
          }
        }
        
        // If code already used and we have valid tokens, consider it success
        // This handles dev environment double-execution gracefully
        if (errorData.error === 'invalid_grant' && this.isAuthenticated()) {
          const user = getCurrentUser()
          return {
            user,
            accessToken: this.getAccessToken(),
            refreshToken: this.getRefreshToken(),
            idToken: this.getIdToken(),
            expiresIn: 900, // 15 minutes
            tokenType: 'Bearer'
          }
        }

        throw {
          response: { status: tokenResponse.status, data: errorData },
          oauthError: errorData.error,
          message: errorData.error_description || errorData.error || 'Token exchange failed'
        }
      }

      const data = await tokenResponse.json()
      const { access_token, refresh_token, id_token, expires_in, token_type } = data

      // Store tokens
      this.setTokens(access_token, refresh_token, id_token)

      // Clean up session storage after successful exchange
      clearPKCEParams()
      sessionStorage.removeItem('login_credentials')

      // Decode id_token to get user information
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
      console.error('Callback handling error:', error)
      // Clear PKCE params on error to prevent reuse attempts
      clearPKCEParams()
      throw error
    }
  },

  /**
   * Legacy login method for backward compatibility
   * @deprecated Use initiateLogin instead
   */
  async login(credentials) {
    return this.initiateLogin(credentials)
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string, idToken: string, expiresIn: number, tokenType: string}>}
   */
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: DEFAULT_SCOPES
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

      // Decode id_token to get updated user information
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
          client_id: CLIENT_ID
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
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string, idToken: string}>}
   */
  async switchTenant(tenantId) {
    console.log('Switching to tenant:', tenantId, 'Type:', typeof tenantId)
    
    const payload = { tenantId }
    console.log('Request payload:', JSON.stringify(payload))
    
    try {
      const response = await api.post(API_ENDPOINTS.auth.switchTenant, payload)

      // Backend updates the database and tells us to refresh token
      if (response.data.requiresTokenRefresh) {
        // Refresh token to get new tokens with updated tenant claims
        const tokenResponse = await this.refreshToken()
        
        return {
          user: tokenResponse.user,
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          idToken: tokenResponse.idToken,
          expiresIn: tokenResponse.expiresIn,
          tokenType: tokenResponse.tokenType,
          tenantName: response.data.tenantName
        }
      }

      // Fallback (shouldn't reach here)
      const user = getCurrentUser()
      return {
        user,
        accessToken: this.getAccessToken(),
        refreshToken: this.getRefreshToken(),
        idToken: this.getIdToken(),
        tenantName: response.data.tenantName
      }
    } catch (error) {
      console.error('Switch tenant error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      })
      throw error
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