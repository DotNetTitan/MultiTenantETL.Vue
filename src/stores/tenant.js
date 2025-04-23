import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useTenantStore = defineStore('tenant', () => {
  const currentTenantId = ref(localStorage.getItem('currentTenantId') || null)
  const tenants = ref([])
  const loading = ref(false)
  const error = ref(null)

  const currentTenant = computed(() => {
    if (!currentTenantId.value) return null
    return tenants.value.find(t => t.id === currentTenantId.value) || null
  })

  async function fetchTenants() {
    try {
      loading.value = true
      error.value = null

      // Mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      tenants.value = [
        {
          id: '1',
          name: 'Acme Corporation',
          identifier: 'acme',
          description: 'A multinational company producing various products',
          isActive: true
        },
        {
          id: '2',
          name: 'Globex Corporation',
          identifier: 'globex',
          description: 'Electronics manufacturing company',
          isActive: true
        },
        {
          id: '3',
          name: 'Initech',
          identifier: 'initech',
          description: 'Software company',
          isActive: true
        }
      ]
      
      // Set first tenant as default if none selected and user has access to tenants
      if (!currentTenantId.value && tenants.value.length > 0) {
        setCurrentTenant(tenants.value[0].id)
      }
    } catch (err) {
      console.error('Error fetching tenants:', err)
      error.value = 'Failed to load tenants'
    } finally {
      loading.value = false
    }
  }

  async function createTenant(tenantData) {
    try {
      loading.value = true
      error.value = null
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      const newTenant = {
        ...tenantData,
        id: Math.random().toString(36).substring(2, 15)
      }
      tenants.value.push(newTenant)
      return newTenant
    } catch (err) {
      console.error('Error creating tenant:', err)
      error.value = 'Failed to create tenant'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCurrentTenant(tenantId) {
    currentTenantId.value = tenantId
    localStorage.setItem('currentTenantId', tenantId)
    
    // Set tenant ID in request headers for API calls
    if (tenantId) {
      axios.defaults.headers.common['X-Tenant-Id'] = tenantId
    } else {
      delete axios.defaults.headers.common['X-Tenant-Id']
    }
  }

  // Initialize axios header if tenant ID exists
  if (currentTenantId.value) {
    axios.defaults.headers.common['X-Tenant-Id'] = currentTenantId.value
  }

  return {
    currentTenantId,
    currentTenant,
    tenants,
    loading,
    error,
    fetchTenants,
    createTenant,
    setCurrentTenant
  }
})
