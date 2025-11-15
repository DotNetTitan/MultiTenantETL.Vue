import { mockTransformations } from '@/mocks/transformations'

// Mock columns based on actual data sources
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

// Sort functions
const sortFunctions = {
  name_asc: (a, b) => a.name.localeCompare(b.name),
  name_desc: (a, b) => b.name.localeCompare(a.name),
  type_asc: (a, b) => a.type.localeCompare(b.type),
  created_desc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  created_asc: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
};

export const transformationService = {
  async getAll(filters = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let transformations = [...mockTransformations];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      transformations = transformations.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type && filters.type !== 'All') {
      transformations = transformations.filter(t => t.type === filters.type);
    }

    // Apply sorting
    if (filters.sort && sortFunctions[filters.sort]) {
      transformations.sort(sortFunctions[filters.sort]);
    }

    return transformations;
  },

  async getById(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const transformation = mockTransformations.find(t => t.id === id);
    if (!transformation) {
      const error = new Error('Transformation not found');
      error.response = { status: 404 };
      throw error;
    }

    return { ...transformation };
  },

  async create(transformationData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const newTransformation = {
      ...transformationData,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString()
    };

    mockTransformations.push(newTransformation);
    return { ...newTransformation };
  },

  async update(id, transformationData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const index = mockTransformations.findIndex(t => t.id === id);
    if (index === -1) {
      const error = new Error('Transformation not found');
      error.response = { status: 404 };
      throw error;
    }

    const updatedTransformation = {
      ...mockTransformations[index],
      ...transformationData
    };

    mockTransformations[index] = updatedTransformation;
    return { ...updatedTransformation };
  },

  async delete(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const index = mockTransformations.findIndex(t => t.id === id);
    if (index === -1) {
      const error = new Error('Transformation not found');
      error.response = { status: 404 };
      throw error;
    }

    mockTransformations.splice(index, 1);
    return true;
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
    let filtered = [...transformations];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filters.type && filters.type !== 'All') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Apply sorting
    if (filters.sort && sortFunctions[filters.sort]) {
      filtered.sort(sortFunctions[filters.sort]);
    }

    return filtered;
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
