import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const error = ref(null)
  const loading = ref(false)
  const apiOffline = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.isAdmin || false)

  async function login(credentials) {
    try {
      loading.value = true
      error.value = null
      apiOffline.value = false
      
      const response = await authService.login(credentials)
      setUser(response.user)
      setToken(response.token)
      router.push('/')
    } catch (err) {
      console.error('Login error:', err)
      
      if (err.isConnectionError || err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED') {
        apiOffline.value = true
        error.value = 'Cannot connect to the server. Please ensure the API server is running.'
      } else if (err.response?.status === 401) {
        error.value = 'Invalid username or password'
      } else if (err.response?.status === 429) {
        error.value = 'Too many login attempts. Please try again later.'
      } else {
        error.value = 'Login failed. Please try again later.'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await authService.logout()
      }
    } catch (err) {
      // Even if logout API call fails, we still want to clear user session locally
      console.warn('Logout error handled:', err.message)
    } finally {
      setUser(null)
      setToken(null)
      router.push('/login')
    }
  }

  function setUser(userData) {
    user.value = userData
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  return {
    token,
    user,
    error,
    loading,
    apiOffline,
    isAuthenticated,
    isAdmin,
    login,
    logout
  }
})
