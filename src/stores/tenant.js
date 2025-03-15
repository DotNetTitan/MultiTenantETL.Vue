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
      const response = await axios.get('/api/tenants')
      tenants.value = response.data
      
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
      const response = await axios.post('/api/tenants', tenantData)
      tenants.value.push(response.data)
      return response.data
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
