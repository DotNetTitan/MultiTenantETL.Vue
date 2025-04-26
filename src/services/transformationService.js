import api from './api'
import { API_ENDPOINTS } from '@/config/api'

// Mock columns for development
const mockColumns = [
  'id', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state',
  'zipCode', 'country', 'age', 'income', 'purchaseAmount', 'orderDate', 'productCategory'
]

// Transformation types
const transformationTypes = ['Filter', 'Map', 'Aggregation', 'Script']

export const transformationService = {
  async getAll(filters = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock data for development
    let transformations = [
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
    ]

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      transformations = transformations.filter(t => 
        t.name.toLowerCase().includes(searchLower) || 
        t.description.toLowerCase().includes(searchLower)
      )
    }

    if (filters.type && filters.type !== 'All') {
      transformations = transformations.filter(t => t.type === filters.type)
    }

    // Apply sorting
    if (filters.sort) {
      const [field, direction] = filters.sort.split('_')
      transformations.sort((a, b) => {
        let aVal = a[field]
        let bVal = b[field]
        
        if (field === 'created') {
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
        }
        
        if (direction === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }

    return transformations
  },

  async create(transformationData) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newTransformation = {
      ...transformationData,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString()
    }

    return newTransformation
  },

  async update(id, transformationData) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { ...transformationData, id }
  },

  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 1000))
  },

  async clone(transformation) {
    const cloned = {
      ...transformation,
      id: null,
      name: `Copy of ${transformation.name}`
    }
    return this.create(cloned)
  },

  getAvailableColumns() {
    return mockColumns
  },

  getTransformationTypes() {
    return transformationTypes
  },

  createEmpty() {
    return {
      id: null,
      name: '',
      type: 'Filter',
      description: '',
      config: {
        // Filter config
        filterColumn: '',
        operator: 'equals',
        value: '',
        
        // Map config
        sourceColumn: '',
        targetColumn: '',
        mappings: [],
        
        // Aggregation config
        groupByColumns: [],
        aggregationType: 'sum',
        aggregationColumn: '',
        resultColumn: '',
        
        // Script config
        script: ''
      }
    }
  },

  formatDate(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString()
  },

  getTypeColor(type) {
    switch (type) {
      case 'Filter':
        return 'info'
      case 'Map':
        return 'success'
      case 'Aggregation':
        return 'warning'
      case 'Script':
        return 'deep-purple'
      default:
        return 'grey'
    }
  }
}