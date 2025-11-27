import api from './api'

// Mock columns based on actual data sources (will be replaced with schema-based columns later)
const mockColumns = [
  // From SQL Server - Sales (Data Source 1)
  'OrderId', 'CustomerId', 'OrderDate', 'TotalAmount', 'Status',
  // From SFTP - Customer Files (Data Source 2)
  'customer_id', 'first_name', 'last_name', 'email', 'phone',
  // From ERP API (Data Source 3)
  'id', 'product_code', 'quantity', 'price', 'last_updated'
]

// Transformation types
const transformationTypes = ['Filter', 'Map', 'Script', 'Trim', 'Case Convert', 'Substring', 'Replace']

export const transformationService = {
  async getAll(filters = {}) {
    const params = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 20
    }

    if (filters.search) {
      params.search = filters.search
    }

    if (filters.name) {
      params.name = filters.name
    }

    if (filters.type && filters.type !== 'All') {
      params.type = filters.type
    }

    if (filters.sort) {
      params.sort = filters.sort
    }

    const response = await api.get('/api/transformations', { params })
    
    // Return just the transformations array for backward compatibility
    // The paginated response has: { transformations, totalCount, page, pageSize, totalPages }
    return response.data.transformations || []
  },

  async getById(id) {
    const response = await api.get(`/api/transformations/${id}`)
    return response.data
  },

  async create(transformationData) {
    const payload = {
      name: transformationData.name,
      description: transformationData.description || null,
      type: transformationData.type,
      config: transformationData.config
    }

    const response = await api.post('/api/transformations', payload)
    return response.data
  },

  async update(id, transformationData) {
    const payload = {
      name: transformationData.name,
      description: transformationData.description || null,
      config: transformationData.config
    }

    const response = await api.put(`/api/transformations/${id}`, payload)
    return response.data
  },

  async delete(id) {
    await api.delete(`/api/transformations/${id}`)
    return true
  },

  async clone(transformation) {
    const cloned = {
      ...transformation,
      id: null,
      name: `Copy of ${transformation.name}`
    };
    return this.create(cloned);
  },

  getAvailableColumns() {
    return mockColumns;
  },

  getTransformationTypes() {
    return transformationTypes;
  },

  createEmpty() {
    return {
      id: null,
      name: '',
      type: 'Filter',
      description: '',
      config: {}
    };
  },

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  },

  getTypeColor(type) {
    switch (type) {
      case 'Filter':
        return 'indigo';
      case 'Map':
        return 'teal';
      case 'Script':
        return 'orange';
      case 'Trim':
        return 'cyan';
      case 'Case Convert':
        return 'blue';
      case 'Substring':
        return 'pink';
      case 'Replace':
        return 'amber';
      default:
        return 'blue';
    }
  },

  applyFilters(transformations, filters = {}) {
    // This method is kept for backward compatibility but filtering is now done server-side
    // It can be used for additional client-side filtering if needed
    return transformations
  }
}

// Named exports for consistency with other services
export const fetchTransformations = (filters) => transformationService.getAll(filters);
export const fetchTransformationById = (id) => transformationService.getById(id);
export const saveTransformation = (transformation) => {
  if (transformation.id) {
    return transformationService.update(transformation.id, transformation);
  }
  return transformationService.create(transformation);
};
export const deleteTransformation = (id) => transformationService.delete(id);
export const getAvailableColumns = () => transformationService.getAvailableColumns();
