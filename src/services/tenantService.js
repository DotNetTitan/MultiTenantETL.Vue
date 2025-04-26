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
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Global Industries',
    identifier: 'global',
    description: 'International industrial manufacturing company',
    contactName: 'Emily Johnson',
    contactEmail: 'emily@globalindustries.com',
    isActive: true,
    createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Tech Solutions',
    identifier: 'techsol',
    description: 'IT solutions and consulting services',
    contactName: 'Michael Williams',
    contactEmail: 'michael@techsolutions.com',
    isActive: false,
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
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

// Sort functions
const sortFunctions = {
  name_asc: (a, b) => a.name.localeCompare(b.name),
  name_desc: (b, a) => a.name.localeCompare(b.name),
  createdAt_asc: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  createdAt_desc: (b, a) => new Date(a.createdAt) - new Date(b.createdAt)
};

export const tenantService = {
  async getAll(filters = {}, sortBy = 'name') {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let tenants = getStoredTenants();
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      const isActive = filters.status === 'active';
      tenants = tenants.filter(tenant => tenant.isActive === isActive);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      tenants = tenants.filter(tenant => 
        tenant.name.toLowerCase().includes(searchLower) ||
        tenant.identifier.toLowerCase().includes(searchLower) ||
        tenant.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (filters.sort && sortFunctions[filters.sort]) {
      tenants.sort(sortFunctions[filters.sort]);
    } else {
      // Default sort by name
      tenants.sort(sortFunctions.name_asc);
    }

    return tenants;
  },

  async getById(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenant = getStoredTenants().find(t => t.id === id);
    if (!tenant) {
      const error = new Error('Tenant not found');
      error.response = { status: 404 };
      throw error;
    }
    
    return { ...tenant };
  },

  async create(tenantData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const tenants = getStoredTenants();
    
    // Check if identifier is already taken
    if (tenants.some(t => t.identifier === tenantData.identifier)) {
      const error = new Error('Tenant identifier already exists');
      error.response = { status: 400 };
      throw error;
    }
    
    const newTenant = {
      ...tenantData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tenants.push(newTenant);
    saveTenants(tenants);
    
    return { ...newTenant };
  },

  async update(id, tenantData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const tenants = getStoredTenants();
    const index = tenants.findIndex(t => t.id === id);
    
    if (index === -1) {
      const error = new Error('Tenant not found');
      error.response = { status: 404 };
      throw error;
    }
    
    // Check if identifier is already taken by another tenant
    if (tenantData.identifier && 
        tenantData.identifier !== tenants[index].identifier && 
        tenants.some(t => t.identifier === tenantData.identifier)) {
      const error = new Error('Tenant identifier already exists');
      error.response = { status: 400 };
      throw error;
    }
    
    const updatedTenant = {
      ...tenants[index],
      ...tenantData,
      updatedAt: new Date().toISOString()
    };
    
    tenants[index] = updatedTenant;
    saveTenants(tenants);
    
    return { ...updatedTenant };
  },

  async delete(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const tenants = getStoredTenants();
    const index = tenants.findIndex(t => t.id === id);
    
    if (index === -1) {
      const error = new Error('Tenant not found');
      error.response = { status: 404 };
      throw error;
    }
    
    tenants.splice(index, 1);
    saveTenants(tenants);
    
    return true;
  },

  async toggleStatus(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const tenants = getStoredTenants();
    const index = tenants.findIndex(t => t.id === id);
    
    if (index === -1) {
      const error = new Error('Tenant not found');
      error.response = { status: 404 };
      throw error;
    }
    
    const updatedTenant = {
      ...tenants[index],
      isActive: !tenants[index].isActive,
      updatedAt: new Date().toISOString()
    };
    
    tenants[index] = updatedTenant;
    saveTenants(tenants);
    
    return { ...updatedTenant };
  },

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  },

  applyFilters(tenants, filters = {}) {
    let filtered = [...tenants];
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(tenant => tenant.isActive === isActive);
    }

    // Apply search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(tenant => 
        tenant.name.toLowerCase().includes(searchLower) ||
        tenant.identifier.toLowerCase().includes(searchLower) ||
        tenant.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    if (filters.sort && sortFunctions[filters.sort]) {
      filtered.sort(sortFunctions[filters.sort]);
    }
    
    return filtered;
  }
}