/**
 * Metadata Service
 * Provides configuration metadata for the application
 * 
 * TODO: Replace mock data with real API calls when backend is ready
 * API Endpoint: GET /api/metadata/*
 */

// Mock flag - set to false when backend is ready
const USE_MOCK_DATA = true;

// Mock metadata - simulates backend response
const MOCK_METADATA = {
  connectorConfig: {
    types: [
      { value: 'Database', labelKey: 'connectors.database', icon: 'mdi-database' },
      { value: 'API', labelKey: 'connectors.api', icon: 'mdi-api' },
      { value: 'File', labelKey: 'connectors.file', icon: 'mdi-file-document' }
    ],
    
    providers: {
      Database: ['SQL Server', 'PostgreSQL', 'MySQL', 'Oracle', 'SQLite'],
      API: ['REST', 'GraphQL', 'SOAP'],
      File: ['Local', 'FTP', 'S3', 'Azure Blob', 'Google Cloud Storage']
    },
    
    directions: [
      { value: 'source', labelKey: 'connectors.sourceOnly', icon: 'mdi-export' },
      { value: 'destination', labelKey: 'connectors.destinationOnly', icon: 'mdi-import' },
      { value: 'both', labelKey: 'connectors.both', icon: 'mdi-swap-horizontal' }
    ],
    
    authTypes: [
      { value: 'None', labelKey: 'connectors.authNone' },
      { value: 'Basic', labelKey: 'connectors.authBasic' },
      { value: 'Bearer', labelKey: 'connectors.authBearer' },
      { value: 'OAuth2', labelKey: 'connectors.authOAuth2' },
      { value: 'API Key', labelKey: 'connectors.authApiKey' }
    ],
    
    fileFormats: [
      { value: 'CSV', labelKey: 'common.csv', extension: '.csv' },
      { value: 'JSON', labelKey: 'common.json', extension: '.json' },
      { value: 'Excel', labelKey: 'common.excel', extension: '.xlsx' },
      { value: 'XML', labelKey: 'common.xml', extension: '.xml' },
      { value: 'Parquet', labelKey: 'common.parquet', extension: '.parquet' }
    ],
    
    writeOperations: [
      { 
        value: 'INSERT', 
        labelKey: 'connectors.writeOperationInsert',
        descriptionKey: 'connectors.insertDescription',
        requiresPrimaryKey: false
      },
      { 
        value: 'UPDATE', 
        labelKey: 'connectors.writeOperationUpdate',
        descriptionKey: 'connectors.updateDescription',
        requiresPrimaryKey: true
      },
      { 
        value: 'UPSERT', 
        labelKey: 'connectors.writeOperationUpsert',
        descriptionKey: 'connectors.upsertDescription',
        requiresPrimaryKey: true
      },
      { 
        value: 'BULK_INSERT', 
        labelKey: 'connectors.writeOperationBulkInsert',
        descriptionKey: 'connectors.bulkInsertDescription',
        requiresPrimaryKey: false
      }
    ],
    
    httpMethods: [
      { value: 'GET', labelKey: 'common.httpGet', color: 'success' },
      { value: 'POST', labelKey: 'common.httpPost', color: 'primary' },
      { value: 'PUT', labelKey: 'common.httpPut', color: 'warning' },
      { value: 'PATCH', labelKey: 'common.httpPatch', color: 'info' },
      { value: 'DELETE', labelKey: 'common.httpDelete', color: 'error' }
    ]
  },
  
  transformationTypes: [
    { 
      value: 'Filter', 
      labelKey: 'transformations.filter',
      icon: 'mdi-filter', 
      categoryKey: 'transformations.categoryDataQuality',
      descriptionKey: 'transformations.filterDescription'
    },
    { 
      value: 'Map', 
      labelKey: 'transformations.map',
      icon: 'mdi-map', 
      categoryKey: 'transformations.categoryTransformation',
      descriptionKey: 'transformations.mapDescription'
    },
    { 
      value: 'Script', 
      labelKey: 'transformations.script',
      icon: 'mdi-code-braces', 
      categoryKey: 'transformations.categoryCustom',
      descriptionKey: 'transformations.scriptDescription'
    },
    { 
      value: 'Trim', 
      labelKey: 'transformations.trim',
      icon: 'mdi-content-cut', 
      categoryKey: 'transformations.categoryText',
      descriptionKey: 'transformations.trimDescription'
    },
    { 
      value: 'Case', 
      labelKey: 'transformations.case',
      icon: 'mdi-format-letter-case', 
      categoryKey: 'transformations.categoryText',
      descriptionKey: 'transformations.caseDescription'
    },
    { 
      value: 'Substring', 
      labelKey: 'transformations.substring',
      icon: 'mdi-text-box-outline', 
      categoryKey: 'transformations.categoryText',
      descriptionKey: 'transformations.substringDescription'
    },
    { 
      value: 'Replace', 
      labelKey: 'transformations.replace',
      icon: 'mdi-find-replace', 
      categoryKey: 'transformations.categoryText',
      descriptionKey: 'transformations.replaceDescription'
    }
  ],
  
  dataTypes: [
    { value: 'string', labelKey: 'schema.dataTypes.string', icon: 'mdi-format-text' },
    { value: 'integer', labelKey: 'schema.dataTypes.integer', icon: 'mdi-numeric' },
    { value: 'bigInteger', labelKey: 'schema.dataTypes.bigInteger', icon: 'mdi-numeric' },
    { value: 'decimal', labelKey: 'schema.dataTypes.decimal', icon: 'mdi-decimal' },
    { value: 'boolean', labelKey: 'schema.dataTypes.boolean', icon: 'mdi-checkbox-marked' },
    { value: 'date', labelKey: 'schema.dataTypes.date', icon: 'mdi-calendar' },
    { value: 'dateTime', labelKey: 'schema.dataTypes.dateTime', icon: 'mdi-calendar-clock' },
    { value: 'timestamp', labelKey: 'schema.dataTypes.timestamp', icon: 'mdi-clock-outline' },
    { value: 'json', labelKey: 'schema.dataTypes.json', icon: 'mdi-code-json' },
    { value: 'textLong', labelKey: 'schema.dataTypes.textLong', icon: 'mdi-text-long' }
  ],
  
  scheduleFrequencies: [
    { value: 'daily', labelKey: 'pipelines.daily', icon: 'mdi-calendar-today' },
    { value: 'weekly', labelKey: 'pipelines.weekly', icon: 'mdi-calendar-week' },
    { value: 'monthly', labelKey: 'pipelines.monthly', icon: 'mdi-calendar-month' },
    { value: 'custom', labelKey: 'pipelines.custom', icon: 'mdi-cog' }
  ],
  
  daysOfWeek: [
    { value: 'monday', labelKey: 'pipelines.monday', shortKey: 'common.mon' },
    { value: 'tuesday', labelKey: 'pipelines.tuesday', shortKey: 'common.tue' },
    { value: 'wednesday', labelKey: 'pipelines.wednesday', shortKey: 'common.wed' },
    { value: 'thursday', labelKey: 'pipelines.thursday', shortKey: 'common.thu' },
    { value: 'friday', labelKey: 'pipelines.friday', shortKey: 'common.fri' },
    { value: 'saturday', labelKey: 'pipelines.saturday', shortKey: 'common.sat' },
    { value: 'sunday', labelKey: 'pipelines.sunday', shortKey: 'common.sun' }
  ]
};

/**
 * Simulates API delay for realistic testing
 */
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get connector configuration metadata
 * @returns {Promise<Object>} Connector configuration
 */
export async function getConnectorConfig() {
  if (USE_MOCK_DATA) {
    await delay(100);
    return MOCK_METADATA.connectorConfig;
  }
  
  // TODO: Replace with real API call
  // const { data } = await axios.get('/api/metadata/connector-config');
  // return data;
  
  throw new Error('Backend API not implemented yet');
}

/**
 * Get transformation types metadata
 * @returns {Promise<Array>} Transformation types
 */
export async function getTransformationTypes() {
  if (USE_MOCK_DATA) {
    await delay(100);
    return MOCK_METADATA.transformationTypes;
  }
  
  // TODO: Replace with real API call
  // const { data } = await axios.get('/api/metadata/transformation-types');
  // return data;
  
  throw new Error('Backend API not implemented yet');
}

/**
 * Get data types metadata
 * @returns {Promise<Array>} Data types
 */
export async function getDataTypes() {
  if (USE_MOCK_DATA) {
    await delay(50);
    return MOCK_METADATA.dataTypes;
  }
  
  // TODO: Replace with real API call
  // const { data } = await axios.get('/api/metadata/data-types');
  // return data;
  
  throw new Error('Backend API not implemented yet');
}

/**
 * Get schedule frequencies metadata
 * @returns {Promise<Array>} Schedule frequencies
 */
export async function getScheduleFrequencies() {
  if (USE_MOCK_DATA) {
    await delay(50);
    return MOCK_METADATA.scheduleFrequencies;
  }
  
  // TODO: Replace with real API call
  // const { data } = await axios.get('/api/metadata/schedule-frequencies');
  // return data;
  
  throw new Error('Backend API not implemented yet');
}

/**
 * Get days of week metadata
 * @returns {Promise<Array>} Days of week
 */
export async function getDaysOfWeek() {
  if (USE_MOCK_DATA) {
    await delay(50);
    return MOCK_METADATA.daysOfWeek;
  }
  
  // TODO: Replace with real API call
  // const { data } = await axios.get('/api/metadata/days-of-week');
  // return data;
  
  throw new Error('Backend API not implemented yet');
}

/**
 * Get all metadata at once (for initial app load)
 * @returns {Promise<Object>} All metadata
 */
export async function getAllMetadata() {
  if (USE_MOCK_DATA) {
    await delay(200);
    return MOCK_METADATA;
  }
  
  // TODO: Replace with real API call
  // const { data } = await axios.get('/api/metadata/all');
  // return data;
  
  throw new Error('Backend API not implemented yet');
}

/**
 * Cache metadata in localStorage
 * @param {Object} metadata - Metadata to cache
 */
export function cacheMetadata(metadata) {
  try {
    localStorage.setItem('app-metadata', JSON.stringify(metadata));
    localStorage.setItem('app-metadata-timestamp', Date.now().toString());
  } catch (error) {
    console.warn('Failed to cache metadata:', error);
  }
}

/**
 * Get cached metadata from localStorage
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns {Object|null} Cached metadata or null if expired/not found
 */
export function getCachedMetadata(maxAge = 3600000) {
  try {
    const cached = localStorage.getItem('app-metadata');
    const timestamp = localStorage.getItem('app-metadata-timestamp');
    
    if (!cached || !timestamp) return null;
    
    const age = Date.now() - parseInt(timestamp);
    if (age > maxAge) {
      // Cache expired
      localStorage.removeItem('app-metadata');
      localStorage.removeItem('app-metadata-timestamp');
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.warn('Failed to get cached metadata:', error);
    return null;
  }
}
