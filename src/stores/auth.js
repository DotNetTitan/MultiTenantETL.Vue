import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const error = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.isAdmin || false)

  async function login(credentials) {
    try {
      loading.value = true
      error.value = null
      
      // TODO: Replace with actual API endpoint
      // Mock login for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate successful login
      const response = {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: '1',
            username: credentials.username,
            email: `${credentials.username}@example.com`,
            isAdmin: credentials.username === 'admin'
          }
        }
      }
      
      setUser(response.data.user)
      setToken(response.data.token)
      router.push('/')
    } catch (err) {
      console.error('Login error:', err)
      error.value = 'Invalid username or password'
    } finally {
      loading.value = false
    }
  }

  function logout() {
    setUser(null)
    setToken(null)
    router.push('/login')
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // Initialize axios header if token exists
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  return {
    token,
    user,
    error,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout
  }
})
