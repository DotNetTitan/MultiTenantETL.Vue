/**
 * Application Constants
 * Fetched from backend on app initialization to avoid hardcoding
 */

import axios from '@/services/api'

export const AppConstants = {
  roles: null,
  oauthConfig: null,
  supportedLanguages: null,
  _initialized: false
}

/**
 * Initialize constants from backend
 * Should be called once during app startup
 * @returns {Promise<void>}
 */
export async function initializeConstants() {
  if (AppConstants._initialized) {
    return
  }

  try {
    const { data } = await axios.get('/api/metadata/app-constants')
    
    console.log('Backend response:', data) // Debug log
    
    // Handle both oAuthConfig (from backend) and oauthConfig (expected)
    const oauthConfig = data.oAuthConfig || data.oauthConfig
    
    // Validate response structure
    if (!data || !oauthConfig || !data.roles) {
      throw new Error('Invalid response structure from backend')
    }
    
    AppConstants.roles = data.roles
    AppConstants.oauthConfig = oauthConfig
    AppConstants.supportedLanguages = data.supportedLanguages
    AppConstants._initialized = true

    console.log('App constants initialized from backend', {
      roles: AppConstants.roles,
      oauthConfig: AppConstants.oauthConfig,
      languages: AppConstants.supportedLanguages?.length
    })
  } catch (error) {
    console.error('Failed to initialize app constants:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    
    // Fallback to defaults if backend is unavailable
    console.warn('Using fallback constants - backend unavailable or returned invalid data')
    
    AppConstants.roles = {
      superAdmin: 'SuperAdmin',
      tenantAdmin: 'TenantAdmin',
      user: 'User',
      viewer: 'Viewer'
    }
    
    AppConstants.oauthConfig = {
      clientId: 'multitenant-etl-spa',
      scopes: ['openid', 'email', 'profile', 'roles', 'api', 'offline_access'],
      authorizeEndpoint: '/connect/authorize',
      tokenEndpoint: '/connect/token',
      revokeEndpoint: '/connect/revoke'
    }
    
    AppConstants.supportedLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' }
    ]
    
    AppConstants._initialized = true
  }
}

/**
 * Get role constants
 * @returns {Object} Role names
 */
export function getRoles() {
  if (!AppConstants._initialized) {
    console.warn('Constants not initialized, using defaults')
  }
  return AppConstants.roles
}

/**
 * Get OAuth configuration
 * @returns {Object} OAuth config
 */
export function getOAuthConfig() {
  if (!AppConstants._initialized) {
    console.warn('Constants not initialized, using defaults')
  }
  
  if (!AppConstants.oauthConfig) {
    console.error('OAuth config is null/undefined!', {
      initialized: AppConstants._initialized,
      roles: AppConstants.roles,
      languages: AppConstants.supportedLanguages
    })
    // Return fallback
    return {
      clientId: 'multitenant-etl-spa',
      scopes: ['openid', 'email', 'profile', 'roles', 'api', 'offline_access'],
      authorizeEndpoint: '/connect/authorize',
      tokenEndpoint: '/connect/token',
      revokeEndpoint: '/connect/revoke'
    }
  }
  
  return AppConstants.oauthConfig
}

/**
 * Get supported languages
 * @returns {Array} Supported languages
 */
export function getSupportedLanguages() {
  if (!AppConstants._initialized) {
    console.warn('Constants not initialized, using defaults')
  }
  return AppConstants.supportedLanguages
}
