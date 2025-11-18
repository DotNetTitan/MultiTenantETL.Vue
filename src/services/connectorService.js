import { mockConnectors } from '@/mocks/connectors'

/**
 * Fetches the list of connectors with optional filtering
 * @param {Object} filters - Filter parameters
 * @param {string} filters.search - Search term to filter connectors
 * @param {string} filters.type - Type to filter by (Database, File, API)
 * @param {string} filters.sortBy - Sort field and direction (e.g., 'name_asc')
 * @returns {Promise<Array>} List of connector objects
 */
export async function fetchConnectors(filters = {}) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get a copy of the mock data
    let connectors = [...mockConnectors];
    
    // Apply filters if provided
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      connectors = connectors.filter(c => 
        c.name.toLowerCase().includes(searchLower) || 
        c.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.type && filters.type !== 'All') {
      connectors = connectors.filter(c => c.type === filters.type);
    }
    
    // Apply sorting if provided
    if (filters.sortBy) {
      const [field, direction] = filters.sortBy.split('_');
      connectors.sort((a, b) => {
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
    
    return connectors;
  } catch (error) {
    console.error('Error fetching connectors:', error);
    throw error;
  }
}

/**
 * Fetches a single connector by ID
 * @param {string} id - Connector ID
 * @returns {Promise<Object>} Connector object
 */
export async function fetchConnectorById(id) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const connector = mockConnectors.find(c => c.id === id);
    
    if (!connector) {
      const error = new Error('Connector not found');
      error.response = { status: 404 };
      throw error;
    }
    
    return { ...connector };
  } catch (error) {
    console.error(`Error fetching connector ${id}:`, error);
    throw error;
  }
}

/**
 * Creates or updates a connector
 * @param {Object} connector - Connector data
 * @returns {Promise<Object>} Created/updated connector
 */
export async function saveConnector(connector) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if it's an update or create
    if (connector.id) {
      // Update existing connector
      const index = mockConnectors.findIndex(c => c.id === connector.id);
      
      if (index === -1) {
        const error = new Error('Connector not found');
        error.response = { status: 404 };
        throw error;
      }
      
      const updatedConnector = {
        ...mockConnectors[index],
        ...connector
      };
      
      mockConnectors[index] = updatedConnector;
      return { ...updatedConnector };
    } else {
      // Create new connector
      const newConnector = {
        ...connector,
        id: Math.random().toString(36).substring(2, 15),
        createdAt: new Date().toISOString()
      };
      
      mockConnectors.push(newConnector);
      return { ...newConnector };
    }
  } catch (error) {
    console.error('Error saving connector:', error);
    throw error;
  }
}

/**
 * Deletes a connector
 * @param {string} id - Connector ID to delete
 * @returns {Promise<boolean>} Success indicator
 */
export async function deleteConnector(id) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = mockConnectors.findIndex(c => c.id === id);
    if (index === -1) {
      const error = new Error('Connector not found');
      error.response = { status: 404 };
      throw error;
    }
    
    mockConnectors.splice(index, 1);
    return true;
  } catch (error) {
    console.error(`Error deleting connector ${id}:`, error);
    throw error;
  }
}

/**
 * Tests the connection to a connector
 * @param {Object} connector - Connector configuration to test
 * @returns {Promise<Object>} Connection test result
 */
export async function testConnection(connector) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate different validation scenarios based on connector type
    switch (connector.type) {
      case 'Database': {
        const hasCredentials = connector.requiresCredentials && 
          connector.credentials?.username && 
          connector.credentials?.password;
        
        const hasValidConfig = connector.database?.server && 
          connector.database?.databaseName;
        
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
        if (!connector.api?.baseUrl) {
          return {
            success: false,
            message: 'Missing API URL'
          };
        }
        
        if (connector.api.authType !== 'None' && !connector.credentials) {
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
        if (!connector.file?.path) {
          return {
            success: false,
            message: 'Missing file path'
          };
        }
        
        if (connector.file.storageType === 'SFTP' && 
            (!connector.credentials?.username || !connector.credentials?.password)) {
          return {
            success: false,
            message: 'Missing SFTP credentials'
          };
        }
        
        return {
          success: true,
          message: 'File access successful',
          schema: connector.file.fileType === 'CSV' ? {
            delimiter: dataSource.file.delimiter || ',',
            hasHeader: true,
            sampleColumns: ['id', 'name', 'email', 'created_at']
          } : null
        };
      }
      
      default:
        return {
          success: false,
          message: 'Unsupported connector type'
        };
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    throw error;
  }
}

/**
 * Detects the schema of a connector
 * @param {string} id - Connector ID
 * @returns {Promise<Object>} Schema information
 */
export async function detectSchema(id) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const connector = mockConnectors.find(c => c.id === id);
    
    if (!connector) {
      const error = new Error('Connector not found');
      error.response = { status: 404 };
      throw error;
    }
    
    // Return mock schema based on connector type
    switch (connector.type) {
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
          fileType: connector.file.fileType,
          delimiter: connector.file.delimiter,
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
    console.error(`Error detecting schema for connector ${id}:`, error);
    throw error;
  }
}

/**
 * Gets connectors that can be used as sources (for pipeline input)
 * @returns {Promise<Array>} List of source connectors
 */
export async function getSourceConnectors() {
  try {
    const connectors = await fetchConnectors();
    return connectors.filter(c => c.isSource);
  } catch (error) {
    console.error('Error fetching source connectors:', error);
    throw error;
  }
}

/**
 * Gets connectors that can be used as destinations (for pipeline output)
 * @returns {Promise<Array>} List of destination connectors
 */
export async function getDestinationConnectors() {
  try {
    const connectors = await fetchConnectors();
    return connectors.filter(c => c.isDestination);
  } catch (error) {
    console.error('Error fetching destination connectors:', error);
    throw error;
  }
}

export const connectorService = {
  getAll: fetchConnectors,
  getById: fetchConnectorById,
  create: connector => saveConnector(connector),
  update: (id, connectorData) => {
    const connector = { id, ...connectorData };
    return saveConnector(connector);
  },
  delete: deleteConnector,
  testConnection,
  detectSchema,
  getSources: getSourceConnectors,
  getDestinations: getDestinationConnectors
};
