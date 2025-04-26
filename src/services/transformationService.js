// Mock implementation of transformation service
import { API_ENDPOINTS } from '@/config/api'

// Mock columns for development
const mockColumns = [
  'id', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state',
  'zipCode', 'country', 'age', 'income', 'purchaseAmount', 'orderDate', 'productCategory'
]

// Transformation types
const transformationTypes = ['Filter', 'Map', 'Aggregation', 'Script']

// Sort functions
const sortFunctions = {
  name_asc: (a, b) => a.name.localeCompare(b.name),
  name_desc: (a, b) => b.name.localeCompare(a.name),
  type_asc: (a, b) => a.type.localeCompare(b.type),
  created_desc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  created_asc: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
};

// Mock transformations data
const mockTransformations = [
  {
    id: '1',
    name: 'Filter Inactive Customers',
    type: 'Filter',
    description: 'Removes inactive customers from the dataset',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    config: {
      filterColumn: 'isActive',
      operator: 'equals',
      value: 'true'
    }
  },
  {
    id: '2',
    name: 'Map Customer Segments',
    type: 'Map',
    description: 'Maps numeric customer segments to readable names',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    config: {
      sourceColumn: 'segmentId',
      targetColumn: 'segmentName',
      mappings: [
        { from: '1', to: 'High Value' },
        { from: '2', to: 'Medium Value' },
        { from: '3', to: 'Low Value' }
      ]
    }
  },
  {
    id: '3',
    name: 'Sales by Region Aggregation',
    type: 'Aggregation',
    description: 'Aggregates sales data by region',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    config: {
      groupByColumns: ['region', 'country'],
      aggregationType: 'sum',
      aggregationColumn: 'salesAmount',
      resultColumn: 'totalSales'
    }
  },
  {
    id: '4',
    name: 'Format Phone Numbers',
    type: 'Script',
    description: 'Formats phone numbers to a consistent pattern',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    config: {
      script: `// Format phone numbers to (XXX) XXX-XXXX
data.forEach(row => {
  if (row.phone) {
    // Remove any non-digit characters
    let digits = row.phone.replace(/\\D/g, '');
    
    // Check if we have enough digits for a US phone number
    if (digits.length === 10) {
      row.phone = \`(\${digits.substring(0, 3)}) \${digits.substring(3, 6)}-\${digits.substring(6)}\`;
    }
  }
});

return data;`
    }
  },
  {
    id: '5',
    name: 'Remove Duplicate Orders',
    type: 'Filter',
    description: 'Removes duplicate orders based on order ID',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    config: {
      filterColumn: 'isDuplicate',
      operator: 'equals',
      value: 'false'
    }
  }
];

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
      case 'Aggregation':
        return 'deep-purple';
      case 'Script':
        return 'orange';
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