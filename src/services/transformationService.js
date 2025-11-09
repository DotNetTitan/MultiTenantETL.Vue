// Mock implementation of transformation service
import { API_ENDPOINTS } from '@/config/api'

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

// Mock transformations data - generic templates
const mockTransformations = [
  {
    id: '1',
    name: 'Equals Filter',
    type: 'Filter',
    description: 'Filter rows where a field equals a specific value',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dataSourceId: null,
    dataSourceName: null,
    usedInPipelines: ['Sales Data ETL', 'Customer Import'],
    config: {
      operator: 'equals',
      valueType: 'string',
      defaultValue: 'Completed'
    }
  },
  {
    id: '2',
    name: 'High Value Filter',
    type: 'Filter',
    description: 'Filter rows where a numeric field is greater than 1000',
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    dataSourceId: null,
    dataSourceName: null,
    usedInPipelines: [],
    config: {
      operator: 'greaterThan',
      valueType: 'number',
      defaultValue: '1000'
    }
  },
  {
    id: '3',
    name: 'Status Code Mapper',
    type: 'Map',
    description: 'Maps single-letter status codes to full names',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    dataSourceId: null,
    dataSourceName: null,
    usedInPipelines: ['Sales Data ETL'],
    config: {
      mappings: [
        { from: 'P', to: 'Pending' },
        { from: 'C', to: 'Completed' },
        { from: 'X', to: 'Cancelled' },
        { from: 'R', to: 'Refunded' }
      ]
    }
  },
  {
    id: '6',
    name: 'Phone Number Formatter',
    type: 'Script',
    description: 'Formats phone numbers to (XXX) XXX-XXXX pattern',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    dataSourceId: null,
    dataSourceName: null,
    usedInPipelines: ['Customer Import'],
    config: {
      scriptLanguage: 'javascript',
      script: `// Format phone numbers to (XXX) XXX-XXXX
if (row.phone) {
  let digits = row.phone.replace(/\\D/g, '');
  if (digits.length === 10) {
    row.phone = \`(\${digits.substring(0, 3)}) \${digits.substring(3, 6)}-\${digits.substring(6)}\`;
  }
}
return row;`
    }
  },
  {
    id: '7',
    name: 'Calculate Total Value',
    type: 'Script',
    description: 'Multiplies quantity by price to get total value',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    dataSourceId: null,
    dataSourceName: null,
    usedInPipelines: ['Product Sync'],
    config: {
      scriptLanguage: 'javascript',
      script: `// Calculate total value
if (row.quantity && row.price) {
  row.total_value = row.quantity * row.price;
}
return row;`
    }
  },
  {
    id: '8',
    name: 'Trim Whitespace',
    type: 'Script',
    description: 'Removes leading and trailing spaces from text fields',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dataSourceId: null,
    dataSourceName: null,
    usedInPipelines: [],
    config: {
      scriptLanguage: 'javascript',
      script: `// Trim whitespace from text fields
if (typeof row.field_name === 'string') {
  row.field_name = row.field_name.trim();
}
return row;`
    }
  },
  {
    id: '9',
    name: 'Data Validation (C#)',
    type: 'Script',
    description: 'Validates and cleans data using C# with better performance',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    dataSourceId: null,
    dataSourceName: null,
    usedInPipelines: [],
    config: {
      scriptLanguage: 'csharp',
      script: `// Validate and clean data
if (row.ContainsKey("email") && row["email"] != null)
{
    var email = row["email"].ToString();
    if (!email.Contains("@"))
    {
        row["email_valid"] = false;
    }
    else
    {
        row["email_valid"] = true;
        row["email"] = email.ToLower().Trim();
    }
}
return row;`
    }
  },
  {
    id: '10',
    name: 'Complex Calculation (C#)',
    type: 'Script',
    description: 'Performs complex calculations with C# for better performance',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dataSourceId: null,
    dataSourceName: null,
    usedInPipelines: [],
    config: {
      scriptLanguage: 'csharp',
      script: `// Complex business logic
if (row.ContainsKey("quantity") && row.ContainsKey("price"))
{
    var quantity = Convert.ToDecimal(row["quantity"]);
    var price = Convert.ToDecimal(row["price"]);
    
    // Calculate with discount tiers
    var total = quantity * price;
    if (total > 1000) total *= 0.9m;  // 10% discount
    else if (total > 500) total *= 0.95m;  // 5% discount
    
    row["total_with_discount"] = Math.Round(total, 2);
}
return row;`
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
