import api from './api'

/**
 * Fetches the list of connectors with optional filtering
 * @param {Object} filters - Filter parameters
 * @param {string} filters.search - Search term to filter connectors
 * @param {string} filters.type - Type to filter by (Database, File, API)
 * @param {string} filters.provider - Provider to filter by
 * @param {string} filters.direction - Direction to filter by (source, destination, both)
 * @param {boolean} filters.isActive - Active status filter
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.pageSize - Page size (default: 20)
 * @returns {Promise<Object>} Paginated list of connector objects
 */
export async function fetchConnectors(filters = {}) {
  try {
    const response = await api.post('/api/connectors/search', {
      name: filters.search || null,
      type: filters.type && filters.type !== 'All' ? filters.type : null,
      provider: filters.provider || null,
      direction: filters.direction || null,
      isActive: filters.isActive,
      page: filters.page || 1,
      pageSize: filters.pageSize || 20
    })
    
    return response.data
  } catch (error) {
    // Don't log errors for silent failures (like during logout)
    if (!error.silent) {
      console.error('Error fetching connectors:', error)
    }
    throw error
  }
}

/**
 * Fetches a single connector by ID
 * @param {string} id - Connector ID
 * @returns {Promise<Object>} Connector object
 */
export async function fetchConnectorById(id) {
  try {
    const response = await api.get(`/api/connectors/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching connector ${id}:`, error)
    throw error
  }
}

/**
 * Creates a new connector
 * @param {Object} connector - Connector data
 * @returns {Promise<Object>} Created connector
 */
export async function createConnector(connector) {
  try {
    const response = await api.post('/api/connectors', {
      name: connector.name,
      description: connector.description || null,
      type: connector.type,
      provider: connector.provider,
      direction: connector.direction,
      config: connector.config,
      schema: connector.schema || null
    })
    return response.data
  } catch (error) {
    console.error('Error creating connector:', error)
    throw error
  }
}

/**
 * Updates an existing connector
 * @param {string} id - Connector ID
 * @param {Object} connector - Connector data
 * @returns {Promise<Object>} Updated connector
 */
export async function updateConnector(id, connector) {
  try {
    const response = await api.put(`/api/connectors/${id}`, {
      name: connector.name,
      description: connector.description || null,
      direction: connector.direction,
      config: connector.config,
      schema: connector.schema || null,
      isActive: connector.isActive
    })
    return response.data
  } catch (error) {
    console.error('Error updating connector:', error)
    throw error
  }
}

/**
 * Deletes a connector
 * @param {string} id - Connector ID to delete
 * @returns {Promise<boolean>} Success indicator
 */
export async function deleteConnector(id) {
  try {
    await api.delete(`/api/connectors/${id}`)
    return true
  } catch (error) {
    console.error(`Error deleting connector ${id}:`, error)
    throw error
  }
}

/**
 * Tests a new connection configuration
 * @param {Object} connector - Connector configuration to test
 * @returns {Promise<Object>} Connection test result
 */
export async function testConnection(connector) {
  try {
    const payload = {
      type: connector.type,
      provider: connector.provider,
      config: connector.config
    };
    console.log('Test connection payload:', payload);
    const response = await api.post('/api/connectors/test-connection', payload)
    return response.data
  } catch (error) {
    console.error('Error testing connection:', error)
    throw error
  }
}

/**
 * Tests an existing connector's connection
 * @param {string} id - Connector ID
 * @returns {Promise<Object>} Connection test result
 */
export async function testExistingConnection(id) {
  try {
    const response = await api.post(`/api/connectors/${id}/test`)
    return response.data
  } catch (error) {
    console.error(`Error testing connector ${id}:`, error)
    throw error
  }
}

/**
 * Detects the schema of a connector
 * @param {string} connectorId - Connector ID
 * @param {string} tableOrResourceName - Table name (for databases) or resource name
 * @returns {Promise<Object>} Schema information
 */
export async function detectSchema(connectorId, tableOrResourceName = null) {
  try {
    const response = await api.post('/api/connectors/detect-schema', {
      connectorId,
      tableOrResourceName
    })
    return response.data
  } catch (error) {
    console.error(`Error detecting schema for connector ${connectorId}:`, error)
    throw error
  }
}

/**
 * Detects the schema from connection configuration (for new connectors before saving)
 * @param {string} type - Connector type (Database, File, API)
 * @param {string} provider - Provider (SqlServer, PostgreSQL, MySQL, etc.)
 * @param {Object} config - Connection configuration
 * @param {string} tableOrResourceName - Table name (for databases) or resource name
 * @returns {Promise<Object>} Schema information
 */
export async function detectSchemaPreview(type, provider, config, tableOrResourceName = null) {
  try {
    const response = await api.post('/api/connectors/detect-schema-preview', {
      type,
      provider,
      config,
      tableOrResourceName
    })
    return response.data
  } catch (error) {
    console.error(`Error detecting schema preview for ${type}/${provider}:`, error)
    throw error
  }
}

/**
 * Gets all active connectors (simplified list)
 * @returns {Promise<Array>} List of all active connectors
 */
export async function getAllConnectors() {
  try {
    const response = await api.get('/api/connectors')
    return response.data
  } catch (error) {
    console.error('Error fetching all connectors:', error)
    throw error
  }
}

/**
 * Gets connectors that can be used as sources (for pipeline input)
 * @returns {Promise<Array>} List of source connectors
 */
export async function getSourceConnectors() {
  try {
    const connectors = await getAllConnectors()
    return connectors.filter(c => c.isSource)
  } catch (error) {
    console.error('Error fetching source connectors:', error)
    throw error
  }
}

/**
 * Gets connectors that can be used as destinations (for pipeline output)
 * @returns {Promise<Array>} List of destination connectors
 */
export async function getDestinationConnectors() {
  try {
    const connectors = await getAllConnectors()
    return connectors.filter(c => c.isDestination)
  } catch (error) {
    console.error('Error fetching destination connectors:', error)
    throw error
  }
}

export const connectorService = {
  search: fetchConnectors,
  getAll: getAllConnectors,
  getById: fetchConnectorById,
  create: createConnector,
  update: updateConnector,
  delete: deleteConnector,
  testConnection,
  testExisting: testExistingConnection,
  detectSchema,
  detectSchemaPreview,
  getSources: getSourceConnectors,
  getDestinations: getDestinationConnectors
}
