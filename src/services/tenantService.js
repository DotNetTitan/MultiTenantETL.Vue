import api from './api'
import { API_ENDPOINTS } from '@/config/api'

// Local storage key for tenants
const TENANTS_STORAGE_KEY = 'app_tenants'

// Initial mock data
const initialTenants = [
  {
    id: '1',
    name: 'Acme Corporation',
    identifier: 'acme',
    description: 'A multinational company producing various products',
    contactName: 'John Smith',
    contactEmail: 'john.smith@acme.com',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Helper to get tenants from storage
const getStoredTenants = () => {
  const stored = localStorage.getItem(TENANTS_STORAGE_KEY)
  return stored ? JSON.parse(stored) : initialTenants
}

// Helper to save tenants to storage
const saveTenants = (tenants) => {
  localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants))
}

const sortFunctions = {
  name_asc: (a, b) => a.name.localeCompare(b.name),
  name_desc: (b, a) => a.name.localeCompare(b.name),
  createdAt_asc: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  createdAt_desc: (b, a) => new Date(a.createdAt) - new Date(b.createdAt)
};

export const tenantService = {
  async getAll(filters = {}, sortBy = 'name') {
    await new Promise(resolve => setTimeout(resolve, 100))
    let tenants = getStoredTenants()
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      const isActive = filters.status === 'active'
      tenants = tenants.filter(tenant => tenant.isActive === isActive)
    }

    // Apply sorting
    tenants.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      return 0
    })

    return tenants
  },

  async getById(id) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const tenant = getStoredTenants().find(t => t.id === id)
    if (!tenant) {
      throw new Error('Tenant not found')
    }
    return tenant
  },

  async create(tenantData) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const tenants = getStoredTenants()
    const newTenant = {
      ...tenantData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    tenants.push(newTenant)
    saveTenants(tenants)
    return newTenant
  },

  async update(id, tenantData) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const tenants = getStoredTenants()
    const index = tenants.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error('Tenant not found')
    }
    const updatedTenant = {
      ...tenants[index],
      ...tenantData,
      updatedAt: new Date().toISOString()
    }
    tenants[index] = updatedTenant
    saveTenants(tenants)
    return updatedTenant
  },

  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const tenants = getStoredTenants()
    const filtered = tenants.filter(t => t.id !== id)
    saveTenants(filtered)
  },

  async toggleStatus(id) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const tenants = getStoredTenants()
    const index = tenants.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error('Tenant not found')
    }
    const updatedTenant = {
      ...tenants[index],
      isActive: !tenants[index].isActive,
      updatedAt: new Date().toISOString()
    }
    tenants[index] = updatedTenant
    saveTenants(tenants)
    return updatedTenant
  },

  formatDate(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString()
  },

  applyFilters(tenants, filters = {}) {
    let filtered = [...tenants];
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(tenant => tenant.isActive === isActive);
    }

    // Apply sorting
    if (filters.sort && sortFunctions[filters.sort]) {
      filtered.sort(sortFunctions[filters.sort]);
    }
    
    return filtered;
  }
}