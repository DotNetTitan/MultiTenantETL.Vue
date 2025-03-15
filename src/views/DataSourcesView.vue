<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">Data Sources</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus" 
        @click="showCreateDialog = true"
      >
        Create Data Source
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Search Data Sources"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchDataSources"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="typeFilter"
              label="Type"
              :items="typeOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchDataSources"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="sortBy"
              label="Sort By"
              :items="sortOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchDataSources"
            />
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="dataSources"
          :loading="loading"
          :items-per-page="10"
          class="mt-2"
        >
          <template v-slot:item.type="{ item }">
            <v-chip
              :color="getTypeColor(item.type)"
              text-color="white"
              size="small"
            >
              {{ item.type }}
            </v-chip>
          </template>
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              @click="editDataSource(item)"
              title="Edit data source"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="success"
              @click="testConnection(item)"
              title="Test connection"
            >
              <v-icon>mdi-connection</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
              title="Delete data source"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Data Source Dialog -->
    <v-dialog
      v-model="showCreateDialog"
      max-width="700px"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ editedDataSource.id ? 'Edit Data Source' : 'Create Data Source' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveDataSource">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedDataSource.name"
                  label="Data Source Name"
                  required
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedDataSource.type"
                  label="Type"
                  :items="dataSourceTypes"
                  :rules="[v => !!v || 'Type is required']"
                  @update:model-value="updateDataSourceForm"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editedDataSource.isSource"
                  label="Can be used as source"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editedDataSource.isDestination"
                  label="Can be used as destination"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editedDataSource.requiresCredentials"
                  label="Requires credentials"
                  hide-details
                  @update:model-value="updateCredentialsFields"
                />
              </v-col>
            </v-row>
            
            <!-- Database specific fields -->
            <div v-if="editedDataSource.type === 'Database'">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedDataSource.database.provider"
                    label="Database Provider"
                    :items="['SQL Server', 'MySQL', 'PostgreSQL', 'Oracle', 'SQLite']"
                    :rules="[v => !!v || 'Provider is required']"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedDataSource.database.server"
                    label="Server/Host"
                    :rules="[v => !!v || 'Server is required']"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedDataSource.database.port"
                    label="Port"
                    type="number"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedDataSource.database.databaseName"
                    label="Database Name"
                    :rules="[v => !!v || 'Database name is required']"
                  />
                </v-col>
              </v-row>
            </div>
            
            <!-- File specific fields -->
            <div v-if="editedDataSource.type === 'File'">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedDataSource.file.storageType"
                    label="Storage Type"
                    :items="['Local', 'SFTP', 'S3', 'Azure Blob', 'Google Cloud Storage']"
                    :rules="[v => !!v || 'Storage type is required']"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedDataSource.file.path"
                    label="Path/Bucket"
                    :rules="[v => !!v || 'Path is required']"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedDataSource.file.fileType"
                    label="File Type"
                    :items="['CSV', 'JSON', 'XML', 'Excel', 'Parquet', 'Avro']"
                    :rules="[v => !!v || 'File type is required']"
                  />
                </v-col>
                <v-col cols="12" md="6" v-if="editedDataSource.file.fileType === 'CSV'">
                  <v-text-field
                    v-model="editedDataSource.file.delimiter"
                    label="Delimiter"
                    placeholder=","
                  />
                </v-col>
              </v-row>
            </div>
            
            <!-- API specific fields -->
            <div v-if="editedDataSource.type === 'API'">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedDataSource.api.baseUrl"
                    label="Base URL"
                    :rules="[v => !!v || 'Base URL is required']"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedDataSource.api.authType"
                    label="Authentication Type"
                    :items="['None', 'Basic', 'Bearer Token', 'API Key', 'OAuth2']"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedDataSource.api.dataFormat"
                    label="Data Format"
                    :items="['JSON', 'XML', 'CSV']"
                    :rules="[v => !!v || 'Data format is required']"
                  />
                </v-col>
              </v-row>
            </div>
            
            <!-- Credentials fields -->
            <div v-if="editedDataSource.requiresCredentials">
              <v-divider class="my-4" />
              <div class="text-subtitle-1 mb-2">Credentials</div>
              
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedDataSource.credentials.username"
                    label="Username"
                    :rules="credentialsRules.username"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedDataSource.credentials.password"
                    label="Password"
                    type="password"
                    :rules="credentialsRules.password"
                  />
                </v-col>
                
                <v-col cols="12" v-if="editedDataSource.api?.authType === 'API Key'">
                  <v-text-field
                    v-model="editedDataSource.credentials.apiKey"
                    label="API Key"
                    :rules="[v => !!v || 'API Key is required']"
                  />
                </v-col>
                
                <v-col cols="12" v-if="editedDataSource.api?.authType === 'Bearer Token'">
                  <v-text-field
                    v-model="editedDataSource.credentials.token"
                    label="Bearer Token"
                    :rules="[v => !!v || 'Token is required']"
                  />
                </v-col>
              </v-row>
            </div>
            
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="editedDataSource.description"
                  label="Description"
                  rows="2"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showCreateDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveDataSource"
            :loading="savingDataSource"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="text-h5">
          Delete Data Source
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete the data source "{{ dataSourceToDelete?.name }}"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteDataSource"
            :loading="deletingDataSource"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Connection Test Dialog -->
    <v-dialog
      v-model="showConnectionDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title>
          Testing Connection
        </v-card-title>
        <v-card-text>
          <div v-if="testingConnection" class="d-flex flex-column align-center py-4">
            <v-progress-circular indeterminate size="64" width="4" />
            <div class="mt-4">Testing connection to {{ connectionTestSource?.name }}...</div>
          </div>
          <div v-else-if="connectionTestResult" class="text-center py-4">
            <v-icon :color="connectionTestSuccess ? 'success' : 'error'" size="64">
              {{ connectionTestSuccess ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
            <div class="mt-4 text-h6">
              {{ connectionTestSuccess ? 'Connection Successful' : 'Connection Failed' }}
            </div>
            <div class="mt-2">{{ connectionTestMessage }}</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showConnectionDialog = false"
            :disabled="testingConnection"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useTenantStore } from '@/stores/tenant';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

// Data table
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Type', key: 'type', width: '120px' },
  { title: 'Description', key: 'description' },
  { title: 'Created', key: 'createdAt', width: '150px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px', align: 'end' }
];

// Filters and sorting
const search = ref('');
const typeFilter = ref('All');
const sortBy = ref('name_asc');
const typeOptions = ref([
  { title: 'All Types', value: 'All' },
  { title: 'Database', value: 'Database' },
  { title: 'File', value: 'File' },
  { title: 'API', value: 'API' }
]);
const sortOptions = ref([
  { title: 'Name (A-Z)', value: 'name_asc' },
  { title: 'Name (Z-A)', value: 'name_desc' },
  { title: 'Created (Newest)', value: 'created_desc' },
  { title: 'Created (Oldest)', value: 'created_asc' },
  { title: 'Type', value: 'type_asc' }
]);

// Data source data
const dataSources = ref([]);
const dataSourceTypes = ref(['Database', 'File', 'API']);
const loading = ref(false);
const savingDataSource = ref(false);
const deletingDataSource = ref(false);

// Dialog controls
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const showConnectionDialog = ref(false);
const dataSourceToDelete = ref(null);
const connectionTestSource = ref(null);
const testingConnection = ref(false);
const connectionTestResult = ref(false);
const connectionTestSuccess = ref(false);
const connectionTestMessage = ref('');

// Form data
const form = ref(null);
const editedDataSource = ref(createEmptyDataSource());

// Validation rules for credentials
const credentialsRules = computed(() => {
  if (!editedDataSource.value.requiresCredentials) {
    return {
      username: [],
      password: []
    };
  }
  
  return {
    username: [v => !!v || 'Username is required'],
    password: [v => !!v || 'Password is required']
  };
});

function createEmptyDataSource() {
  return {
    id: null,
    name: '',
    description: '',
    type: 'Database',
    isSource: true,
    isDestination: true,
    requiresCredentials: true,
    database: {
      provider: 'SQL Server',
      server: '',
      port: '',
      databaseName: ''
    },
    file: {
      storageType: 'Local',
      path: '',
      fileType: 'CSV',
      delimiter: ','
    },
    api: {
      baseUrl: '',
      authType: 'None',
      dataFormat: 'JSON'
    },
    credentials: {
      username: '',
      password: '',
      apiKey: '',
      token: ''
    }
  };
}

function getTypeColor(type) {
  switch (type) {
    case 'Database':
      return 'primary';
    case 'File':
      return 'success';
    case 'API':
      return 'info';
    default:
      return 'grey';
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

async function fetchDataSources() {
  try {
    loading.value = true;
    
    // In a real app, these would be actual API calls
    // For now, using simulated data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    dataSources.value = [
      {
        id: '1',
        name: 'SQL Server - Sales',
        description: 'Main sales database',
        type: 'Database',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        database: {
          provider: 'SQL Server',
          server: 'sales-db.example.com',
          port: '1433',
          databaseName: 'SalesDB'
        },
        isSource: true,
        isDestination: true,
        requiresCredentials: true
      },
      {
        id: '2',
        name: 'SFTP - Customer Files',
        description: 'SFTP server containing customer data files',
        type: 'File',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        file: {
          storageType: 'SFTP',
          path: '/customers/data',
          fileType: 'CSV',
          delimiter: ','
        },
        isSource: true,
        isDestination: false,
        requiresCredentials: true
      },
      {
        id: '3',
        name: 'ERP API',
        description: 'REST API for the ERP system',
        type: 'API',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        api: {
          baseUrl: 'https://erp.example.com/api/v1',
          authType: 'Bearer Token',
          dataFormat: 'JSON'
        },
        isSource: true,
        isDestination: true,
        requiresCredentials: true
      },
      {
        id: '4',
        name: 'Analytics DB',
        description: 'PostgreSQL database for analytics data',
        type: 'Database',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        database: {
          provider: 'PostgreSQL',
          server: 'analytics-db.example.com',
          port: '5432',
          databaseName: 'analytics'
        },
        isSource: true,
        isDestination: true,
        requiresCredentials: true
      },
      {
        id: '5',
        name: 'Data Warehouse',
        description: 'Central data warehouse',
        type: 'Database',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        database: {
          provider: 'SQL Server',
          server: 'dw.example.com',
          port: '1433',
          databaseName: 'DataWarehouse'
        },
        isSource: true,
        isDestination: true,
        requiresCredentials: true
      }
    ];
    
    // Apply filters
    if (search.value) {
      const searchLower = search.value.toLowerCase();
      dataSources.value = dataSources.value.filter(ds => 
        ds.name.toLowerCase().includes(searchLower) || 
        ds.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (typeFilter.value !== 'All') {
      dataSources.value = dataSources.value.filter(ds => ds.type === typeFilter.value);
    }
    
    // Apply sorting
    const [field, direction] = sortBy.value.split('_');
    dataSources.value.sort((a, b) => {
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
  } catch (error) {
    console.error('Error fetching data sources:', error);
  } finally {
    loading.value = false;
  }
}

function updateDataSourceForm() {
  // Reset specific fields when changing data source type
  if (editedDataSource.value.type === 'Database') {
    editedDataSource.value.database = {
      provider: 'SQL Server',
      server: '',
      port: '',
      databaseName: ''
    };
  } else if (editedDataSource.value.type === 'File') {
    editedDataSource.value.file = {
      storageType: 'Local',
      path: '',
      fileType: 'CSV',
      delimiter: ','
    };
  } else if (editedDataSource.value.type === 'API') {
    editedDataSource.value.api = {
      baseUrl: '',
      authType: 'None',
      dataFormat: 'JSON'
    };
  }
  
  updateCredentialsFields();
}

function updateCredentialsFields() {
  if (!editedDataSource.value.requiresCredentials) {
    editedDataSource.value.credentials = {
      username: '',
      password: '',
      apiKey: '',
      token: ''
    };
  }
}

function editDataSource(dataSource) {
  // Clone the data source to avoid modifying the original directly
  editedDataSource.value = JSON.parse(JSON.stringify(dataSource));
  
  showCreateDialog.value = true;
}

function confirmDelete(dataSource) {
  dataSourceToDelete.value = dataSource;
  showDeleteDialog.value = true;
}

async function deleteDataSource() {
  try {
    deletingDataSource.value = true;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove from local array
    const index = dataSources.value.findIndex(ds => ds.id === dataSourceToDelete.value.id);
    if (index !== -1) {
      dataSources.value.splice(index, 1);
    }
    
    showDeleteDialog.value = false;
    dataSourceToDelete.value = null;
  } catch (error) {
    console.error('Error deleting data source:', error);
  } finally {
    deletingDataSource.value = false;
  }
}

async function saveDataSource() {
  try {
    savingDataSource.value = true;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showCreateDialog.value = false;
    
    // Refresh the list
    await fetchDataSources();
  } catch (error) {
    console.error('Error saving data source:', error);
  } finally {
    savingDataSource.value = false;
  }
}

async function testConnection(dataSource) {
  try {
    connectionTestSource.value = dataSource;
    showConnectionDialog.value = true;
    testingConnection.value = true;
    connectionTestResult.value = false;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random success/failure for demo purposes
    const success = Math.random() > 0.3;
    connectionTestSuccess.value = success;
    connectionTestMessage.value = success
      ? `Successfully connected to ${dataSource.name}`
      : `Failed to connect to ${dataSource.name}. Please check your credentials and connection details.`;
    
    connectionTestResult.value = true;
  } catch (error) {
    console.error('Error testing connection:', error);
    connectionTestSuccess.value = false;
    connectionTestMessage.value = `An error occurred: ${error.message}`;
    connectionTestResult.value = true;
  } finally {
    testingConnection.value = false;
  }
}

onMounted(async () => {
  await fetchDataSources();
  
  // Check if we need to open the create dialog from route
  if (route.query.action === 'create') {
    showCreateDialog.value = true;
  }
  
  // Refetch if tenant changes
  tenantStore.$subscribe(() => {
    if (tenantStore.currentTenantId) {
      fetchDataSources();
    }
  });
});
</script>
