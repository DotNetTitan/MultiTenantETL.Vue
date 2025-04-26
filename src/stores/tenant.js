import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tenantService } from '@/services/tenantService'
import api from '@/services/api'

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
      const response = await tenantService.getAll()
      tenants.value = response
    } catch (err) {
      console.error('Error fetching tenants:', err)
      if (err.code === 'ERR_CONNECTION_REFUSED') {
        error.value = 'Unable to connect to the server. Please check if the API server is running.'
      } else if (err.response?.status === 401) {
        error.value = 'Authentication required'
      } else {
        error.value = 'Failed to load tenants. Please try again later.'
      }
      tenants.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTenant(tenantData) {
    try {
      loading.value = true
      error.value = null
      const newTenant = await tenantService.create(tenantData)
      tenants.value.push(newTenant)
      return newTenant
    } catch (err) {
      console.error('Error creating tenant:', err)
      if (err.code === 'ERR_CONNECTION_REFUSED') {
        error.value = 'Unable to connect to the server. Please check if the API server is running.'
      } else {
        error.value = 'Failed to create tenant. Please try again later.'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCurrentTenant(tenantId) {
    currentTenantId.value = tenantId
    localStorage.setItem('currentTenantId', tenantId || '')
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
