import { mockDataSources } from '@/mocks/dataSources'

/**
 * Fetches the list of data sources with optional filtering
 * @param {Object} filters - Filter parameters
 * @param {string} filters.search - Search term to filter data sources
 * @param {string} filters.type - Type to filter by (Database, File, API)
 * @param {string} filters.sortBy - Sort field and direction (e.g., 'name_asc')
 * @returns {Promise<Array>} List of data source objects
 */
export async function fetchDataSources(filters = {}) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get a copy of the mock data
    let dataSources = [...mockDataSources];
    
    // Apply filters if provided
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      dataSources = dataSources.filter(ds => 
        ds.name.toLowerCase().includes(searchLower) || 
        ds.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.type && filters.type !== 'All') {
      dataSources = dataSources.filter(ds => ds.type === filters.type);
    }
    
    // Apply sorting if provided
    if (filters.sortBy) {
      const [field, direction] = filters.sortBy.split('_');
      dataSources.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (field === 'created') {
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
        }
        
        if (direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    return dataSources;
  } catch (error) {
    console.error('Error fetching data sources:', error);
    throw error;
  }
}

/**
 * Fetches a single data source by ID
 * @param {string} id - Data source ID
 * @returns {Promise<Object>} Data source object
 */
export async function fetchDataSourceById(id) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const dataSource = mockDataSources.find(ds => ds.id === id);
    
    if (!dataSource) {
      const error = new Error('Data source not found');
      error.response = { status: 404 };
      throw error;
    }
    
    return { ...dataSource };
  } catch (error) {
    console.error(`Error fetching data source ${id}:`, error);
    throw error;
  }
}

/**
 * Creates or updates a data source
 * @param {Object} dataSource - Data source data
 * @returns {Promise<Object>} Created/updated data source
 */
export async function saveDataSource(dataSource) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if it's an update or create
    if (dataSource.id) {
      // Update existing data source
      const index = mockDataSources.findIndex(ds => ds.id === dataSource.id);
      
      if (index === -1) {
        const error = new Error('Data source not found');
        error.response = { status: 404 };
        throw error;
      }
      
      const updatedDataSource = {
        ...mockDataSources[index],
        ...dataSource
      };
      
      mockDataSources[index] = updatedDataSource;
      return { ...updatedDataSource };
    } else {
      // Create new data source
      const newDataSource = {
        ...dataSource,
        id: Math.random().toString(36).substring(2, 15),
        createdAt: new Date().toISOString()
      };
      
      mockDataSources.push(newDataSource);
      return { ...newDataSource };
    }
  } catch (error) {
    console.error('Error saving data source:', error);
    throw error;
  }
}

/**
 * Deletes a data source
 * @param {string} id - Data source ID to delete
 * @returns {Promise<boolean>} Success indicator
 */
export async function deleteDataSource(id) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = mockDataSources.findIndex(ds => ds.id === id);
    if (index === -1) {
      const error = new Error('Data source not found');
      error.response = { status: 404 };
      throw error;
    }
    
    mockDataSources.splice(index, 1);
    return true;
  } catch (error) {
    console.error(`Error deleting data source ${id}:`, error);
    throw error;
  }
}

/**
 * Tests the connection to a data source
 * @param {Object} dataSource - Data source configuration to test
 * @returns {Promise<Object>} Connection test result
 */
export async function testConnection(dataSource) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate different validation scenarios based on data source type
    switch (dataSource.type) {
      case 'Database': {
        const hasCredentials = dataSource.requiresCredentials && 
          dataSource.credentials?.username && 
          dataSource.credentials?.password;
        
        const hasValidConfig = dataSource.database?.server && 
          dataSource.database?.databaseName;
        
        if (!hasCredentials) {
          return {
            success: false,
            message: 'Missing database credentials'
          };
        }
        
        if (!hasValidConfig) {
          return {
            success: false,
            message: 'Invalid database configuration'
          };
        }
        
        return {
          success: true,
          message: 'Database connection successful',
          schema: {
            tables: ['Users', 'Orders', 'Products'],
            views: ['OrderSummary'],
            procedures: ['GetOrderDetails']
          }
        };
      }
      
      case 'API': {
        if (!dataSource.api?.baseUrl) {
          return {
            success: false,
            message: 'Missing API URL'
          };
        }
        
        if (dataSource.api.authType !== 'None' && !dataSource.credentials) {
          return {
            success: false,
            message: 'Missing API credentials'
          };
        }
        
        return {
          success: true,
          message: 'API connection successful',
          schema: {
            endpoints: ['/users', '/orders', '/products'],
            methods: ['GET', 'POST', 'PUT', 'DELETE']
          }
        };
      }
      
      case 'File': {
        if (!dataSource.file?.path) {
          return {
            success: false,
            message: 'Missing file path'
          };
        }
        
        if (dataSource.file.storageType === 'SFTP' && 
            (!dataSource.credentials?.username || !dataSource.credentials?.password)) {
          return {
            success: false,
            message: 'Missing SFTP credentials'
          };
        }
        
        return {
          success: true,
          message: 'File access successful',
          schema: dataSource.file.fileType === 'CSV' ? {
            delimiter: dataSource.file.delimiter || ',',
            hasHeader: true,
            sampleColumns: ['id', 'name', 'email', 'created_at']
          } : null
        };
      }
      
      default:
        return {
          success: false,
          message: 'Unsupported data source type'
        };
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    throw error;
  }
}

/**
 * Detects the schema of a data source
 * @param {string} id - Data source ID
 * @returns {Promise<Object>} Schema information
 */
export async function detectSchema(id) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const dataSource = mockDataSources.find(ds => ds.id === id);
    
    if (!dataSource) {
      const error = new Error('Data source not found');
      error.response = { status: 404 };
      throw error;
    }
    
    // Return mock schema based on data source type
    switch (dataSource.type) {
      case 'Database':
        return {
          tables: [
            {
              name: 'Users',
              columns: [
                { name: 'Id', type: 'int', nullable: false },
                { name: 'Email', type: 'varchar(255)', nullable: false },
                { name: 'FirstName', type: 'varchar(100)', nullable: true },
                { name: 'LastName', type: 'varchar(100)', nullable: true },
                { name: 'CreatedAt', type: 'datetime', nullable: false }
              ]
            },
            {
              name: 'Orders',
              columns: [
                { name: 'Id', type: 'int', nullable: false },
                { name: 'UserId', type: 'int', nullable: false },
                { name: 'Amount', type: 'decimal(18,2)', nullable: false },
                { name: 'Status', type: 'varchar(50)', nullable: false },
                { name: 'CreatedAt', type: 'datetime', nullable: false }
              ]
            },
            {
              name: 'Products',
              columns: [
                { name: 'Id', type: 'int', nullable: false },
                { name: 'Name', type: 'varchar(200)', nullable: false },
                { name: 'Price', type: 'decimal(18,2)', nullable: false },
                { name: 'Category', type: 'varchar(100)', nullable: true },
                { name: 'InStock', type: 'boolean', nullable: false }
              ]
            }
          ]
        };
      
      case 'API':
        return {
          endpoints: [
            {
              path: '/users',
              methods: ['GET', 'POST'],
              fields: ['id', 'email', 'firstName', 'lastName', 'createdAt']
            },
            {
              path: '/orders',
              methods: ['GET', 'POST', 'PUT'],
              fields: ['id', 'userId', 'amount', 'status', 'createdAt']
            },
            {
              path: '/products',
              methods: ['GET', 'POST', 'PUT', 'DELETE'],
              fields: ['id', 'name', 'price', 'category', 'inStock']
            }
          ]
        };
      
      case 'File':
        return {
          fileType: dataSource.file.fileType,
          delimiter: dataSource.file.delimiter,
          hasHeader: true,
          columns: [
            { name: 'id', type: 'int', position: 0 },
            { name: 'name', type: 'varchar', position: 1 },
            { name: 'email', type: 'varchar', position: 2 },
            { name: 'created_at', type: 'datetime', position: 3 }
          ]
        };
      
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error detecting schema for data source ${id}:`, error);
    throw error;
  }
}

/**
 * Gets data sources that can be used as sources (for pipeline input)
 * @returns {Promise<Array>} List of source data sources
 */
export async function getSourceDataSources() {
  try {
    const dataSources = await fetchDataSources();
    return dataSources.filter(ds => ds.isSource);
  } catch (error) {
    console.error('Error fetching source data sources:', error);
    throw error;
  }
}

/**
 * Gets data sources that can be used as destinations (for pipeline output)
 * @returns {Promise<Array>} List of destination data sources
 */
export async function getDestinationDataSources() {
  try {
    const dataSources = await fetchDataSources();
    return dataSources.filter(ds => ds.isDestination);
  } catch (error) {
    console.error('Error fetching destination data sources:', error);
    throw error;
  }
}

// For backward compatibility with code that might use the old object-based API
export const dataSourceService = {
  getAll: fetchDataSources,
  getById: fetchDataSourceById,
  create: dataSource => saveDataSource(dataSource),
  update: (id, dataSourceData) => {
    const dataSource = { id, ...dataSourceData };
    return saveDataSource(dataSource);
  },
  delete: deleteDataSource,
  testConnection,
  detectSchema,
  getSources: getSourceDataSources,
  getDestinations: getDestinationDataSources
};
