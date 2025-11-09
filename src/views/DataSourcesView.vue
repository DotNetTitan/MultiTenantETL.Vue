<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">Data Sources</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus" 
        @click="createNewDataSource"
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
          <template v-slot:item.description="{ item }">
            <div>
              <div>{{ item.description || '-' }}</div>
              <div v-if="item.schema && item.schema.fields && item.schema.fields.length > 0" class="text-caption text-grey">
                <v-icon size="x-small" class="mr-1">mdi-table</v-icon>
                {{ item.schema.fields.length }} field{{ item.schema.fields.length !== 1 ? 's' : '' }}
              </div>
            </div>
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
              color="info"
              @click="viewSchema(item)"
              title="View schema"
            >
              <v-icon>mdi-table-eye</v-icon>
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
      :fullscreen="isDialogFullscreen"
      :max-width="isDialogFullscreen ? undefined : '900px'"
      persistent
      @update:model-value="handleDialogClose"
    >
      <DataSourceWizard
        :data-source="editedDataSource"
        @save="handleWizardSave"
        @close="showCreateDialog = false"
        @toggle-fullscreen="isDialogFullscreen = $event"
      />
    </v-dialog>

    <!-- Old inline form (keeping as backup, can be removed later) -->
    <v-dialog
      v-if="false"
      v-model="showCreateDialog"
      max-width="700px"
      persistent
      @update:model-value="handleDialogClose"
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
                  color="primary"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editedDataSource.isDestination"
                  label="Can be used as destination"
                  color="primary"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editedDataSource.requiresCredentials"
                  label="Requires credentials"
                  color="primary"
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
            
            <!-- Schema Definition -->
            <v-divider class="my-4" />
            <div class="text-subtitle-1 mb-2">Schema Definition</div>
            
            <!-- Schema Preview (if fields exist) -->
            <SchemaPreview
              v-if="editedDataSource.schema.fields && editedDataSource.schema.fields.length > 0"
              :fields="editedDataSource.schema.fields"
              class="mb-4"
            />
            
            <SchemaEditor
              v-model="editedDataSource.schema.fields"
              @validate="handleSchemaValidation"
            />
            
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

    <!-- Schema Change Warning Dialog -->
    <SchemaChangeWarningDialog
      v-model="showSchemaWarningDialog"
      :affected-pipelines="affectedPipelines"
      @cancel="handleSchemaWarningCancel"
      @proceed="handleSchemaWarningProceed"
    />

    <!-- Schema Viewer Dialog -->
    <v-dialog
      v-model="showSchemaDialog"
      max-width="900px"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-table-eye</v-icon>
          {{ selectedDataSource?.name }} - Schema
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="showSchemaDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <div v-if="loadingSchema" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <div class="mt-4">Loading schema...</div>
          </div>
          
          <div v-else-if="schemaError" class="text-center py-8">
            <v-icon size="64" color="error">mdi-alert-circle</v-icon>
            <div class="mt-4 text-error">{{ schemaError }}</div>
          </div>
          
          <div v-else-if="dataSourceSchema && dataSourceSchema.fields">
            <!-- Schema Metadata -->
            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <v-row dense>
                  <v-col cols="6">
                    <div class="text-caption text-grey">Total Fields</div>
                    <div class="text-h6">{{ dataSourceSchema.fields.length }}</div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-caption text-grey">Schema Version</div>
                    <div class="text-h6">{{ dataSourceSchema.version || 1 }}</div>
                  </v-col>
                  <v-col cols="12" v-if="dataSourceSchema.lastModified">
                    <div class="text-caption text-grey">Last Modified</div>
                    <div class="text-body-2">{{ formatDate(dataSourceSchema.lastModified) }}</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Fields Table -->
            <v-table density="comfortable" hover>
              <thead>
                <tr>
                  <th class="text-left">Field Name</th>
                  <th class="text-left">Data Type</th>
                  <th class="text-center">Required</th>
                  <th class="text-center">Nullable</th>
                  <th class="text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in dataSourceSchema.fields" :key="field.name">
                  <td>
                    <div class="d-flex align-center">
                      <v-icon size="small" class="mr-2" color="primary">mdi-table-column</v-icon>
                      <strong>{{ field.name }}</strong>
                    </div>
                  </td>
                  <td>
                    <v-chip size="small" color="primary" variant="tonal">
                      {{ field.type }}
                    </v-chip>
                    <span v-if="field.length" class="text-caption ml-1">({{ field.length }})</span>
                  </td>
                  <td class="text-center">
                    <v-icon 
                      :color="field.required ? 'error' : 'grey-lighten-1'" 
                      size="small"
                    >
                      {{ field.required ? 'mdi-check-circle' : 'mdi-minus-circle' }}
                    </v-icon>
                  </td>
                  <td class="text-center">
                    <v-icon 
                      :color="field.nullable ? 'success' : 'grey-lighten-1'" 
                      size="small"
                    >
                      {{ field.nullable ? 'mdi-check-circle' : 'mdi-close-circle' }}
                    </v-icon>
                  </td>
                  <td>
                    <span class="text-caption">{{ field.description || '-' }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="showSchemaDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useTenantStore } from '@/stores/tenant';
import { useDataSource } from '@/composables/useDataSource';
import { 
  fetchDataSources as getDataSources, 
  saveDataSource as saveDataSourceAPI, 
  deleteDataSource as deleteDataSourceAPI, 
  testConnection as testDataSourceConnection,
  fetchDataSourceById
} from '@/services/dataSourceService';
import DataSourceWizard from '@/components/datasource/DataSourceWizard.vue';
import SchemaEditor from '@/components/datasource/SchemaEditor.vue';
import SchemaPreview from '@/components/datasource/SchemaPreview.vue';
import SchemaChangeWarningDialog from '@/components/dialogs/SchemaChangeWarningDialog.vue';
import { findPipelinesUsingDataSource } from '@/services/pipelineService';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const { validateConnection } = useDataSource();

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
const showSchemaDialog = ref(false);
const isDialogFullscreen = ref(false);
const showSchemaWarningDialog = ref(false);
const dataSourceToDelete = ref(null);
const connectionTestSource = ref(null);
const selectedDataSource = ref(null);
const testingConnection = ref(false);
const connectionTestResult = ref(false);
const connectionTestSuccess = ref(false);
const connectionTestMessage = ref('');
const affectedPipelines = ref([]);
const originalSchema = ref(null);
const schemaHasChanged = ref(false);
const loadingSchema = ref(false);
const dataSourceSchema = ref(null);
const schemaError = ref(null);

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
    type: '',
    provider: '',
    isSource: true,
    isDestination: true,
    requiresCredentials: true,
    config: {},
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
    },
    schema: {
      fields: [],
      version: 1,
      isManual: true,
      lastModified: new Date().toISOString()
    }
  };
}

function handleSchemaValidation(validation) {
  // Store validation result if needed
  console.log('Schema validation:', validation);
  
  // Check if schema has changed
  if (originalSchema.value && editedDataSource.value.schema) {
    const currentSchemaStr = JSON.stringify(editedDataSource.value.schema.fields);
    const originalSchemaStr = JSON.stringify(originalSchema.value);
    schemaHasChanged.value = currentSchemaStr !== originalSchemaStr;
  }
}

function editDataSource(dataSource) {
  router.push(`/data-sources/${dataSource.id}/edit`);
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
    
    const filters = {
      search: search.value,
      type: typeFilter.value,
      sortBy: sortBy.value
    };
    
    dataSources.value = await getDataSources(filters);
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

function confirmDelete(dataSource) {
  dataSourceToDelete.value = dataSource;
  showDeleteDialog.value = true;
}

async function deleteDataSource() {
  try {
    deletingDataSource.value = true;
    
    await deleteDataSourceAPI(dataSourceToDelete.value.id);
    
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

const validateSchema = async (dataSource) => {
  // Since we're using mock data, just return success
  return { isValid: true, errors: [] };
};

const validateDatabaseSchema = async (dataSource) => {
  return { isValid: true, errors: [] };
};

const validateFileSchema = async (dataSource) => {
  return { isValid: true, errors: [] };
};

const validateApiSchema = async (dataSource) => {
  return { isValid: true, errors: [] };
};

async function saveDataSource() {
  try {
    // Check if this is an edit and schema has changed
    if (editedDataSource.value.id && schemaHasChanged.value) {
      // Check if data source is used in any pipelines
      const pipelines = await findPipelinesUsingDataSource(editedDataSource.value.id);
      
      if (pipelines.length > 0) {
        // Show warning dialog
        affectedPipelines.value = pipelines;
        showSchemaWarningDialog.value = true;
        return; // Don't save yet, wait for user confirmation
      }
    }
    
    // Proceed with save
    await performSave();
  } catch (error) {
    console.error('Error saving data source:', error);
  }
}

async function handleWizardSave(dataSource) {
  try {
    // Check if this is an edit and schema has changed
    if (dataSource.id && schemaHasChanged.value) {
      // Check if data source is used in any pipelines
      const pipelines = await findPipelinesUsingDataSource(dataSource.id);
      
      if (pipelines.length > 0) {
        // Show warning dialog
        affectedPipelines.value = pipelines;
        showSchemaWarningDialog.value = true;
        return; // Don't save yet, wait for user confirmation
      }
    }
    
    // Proceed with save
    await performSave(dataSource);
  } catch (error) {
    console.error('Error saving data source:', error);
  }
}

async function performSave(dataSource = null) {
  try {
    savingDataSource.value = true;
    
    const dataToSave = dataSource || editedDataSource.value;
    const savedDataSource = await saveDataSourceAPI(dataToSave);
    
    if (dataToSave.id) {
      const index = dataSources.value.findIndex(ds => ds.id === dataToSave.id);
      if (index !== -1) {
        dataSources.value[index] = savedDataSource;
      }
    } else {
      dataSources.value.push(savedDataSource);
    }
    
    showCreateDialog.value = false;
    showSchemaWarningDialog.value = false;
    
    // Reset form to empty state
    editedDataSource.value = createEmptyDataSource();
    originalSchema.value = null;
    schemaHasChanged.value = false;
  } catch (error) {
    console.error('Error saving data source:', error);
  } finally {
    savingDataSource.value = false;
  }
}

function handleSchemaWarningCancel() {
  showSchemaWarningDialog.value = false;
}

function handleSchemaWarningProceed() {
  performSave();
}

function createNewDataSource() {
  router.push('/data-sources/new');
}

function handleDialogClose(isOpen) {
  if (!isOpen) {
    // Dialog is closing - reset form if not saving
    if (!savingDataSource.value) {
      editedDataSource.value = createEmptyDataSource();
      originalSchema.value = null;
      schemaHasChanged.value = false;
    }
  }
}

async function testConnection(dataSource) {
  try {
    connectionTestSource.value = dataSource;
    showConnectionDialog.value = true;
    testingConnection.value = true;
    connectionTestResult.value = false;
    
    const result = await validateConnection(dataSource);
    
    connectionTestSuccess.value = result.success;
    connectionTestMessage.value = result.success
      ? `Successfully connected to ${dataSource.name}`
      : `Failed to connect to ${dataSource.name}: ${result.message}`;
    
    connectionTestResult.value = true;
  } catch (error) {
    console.error('Error testing connection:', error);
    connectionTestSuccess.value = false;
    connectionTestMessage.value = `Error testing connection: ${error.message}`;
    connectionTestResult.value = true;
  } finally {
    testingConnection.value = false;
  }
}

async function viewSchema(dataSource) {
  try {
    selectedDataSource.value = dataSource;
    showSchemaDialog.value = true;
    loadingSchema.value = true;
    dataSourceSchema.value = null;
    schemaError.value = null;
    
    // Fetch the full data source details to get the schema
    const fullDataSource = await fetchDataSourceById(dataSource.id);
    
    if (!fullDataSource.schema || !fullDataSource.schema.fields || fullDataSource.schema.fields.length === 0) {
      schemaError.value = 'No schema defined for this data source';
    } else {
      dataSourceSchema.value = fullDataSource.schema;
    }
  } catch (error) {
    console.error('Error loading schema:', error);
    schemaError.value = error.message || 'Failed to load schema';
  } finally {
    loadingSchema.value = false;
  }
}

function getMethodColor(method) {
  const colors = {
    'GET': 'success',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'error',
    'PATCH': 'info'
  };
  return colors[method] || 'grey';
}

let tenantSubscription = null;

onMounted(async () => {
  await fetchDataSources();
  
  // Check if we need to open the create dialog from route
  if (route.query.action === 'create') {
    showCreateDialog.value = true;
  }
  
  // Refetch if tenant changes
  tenantSubscription = tenantStore.$subscribe(() => {
    if (tenantStore.currentTenantId) {
      fetchDataSources();
    }
  });
});

onBeforeUnmount(() => {
  // Clean up tenant subscription
  if (tenantSubscription) {
    tenantSubscription();
  }
  
  // Reset all state
  showCreateDialog.value = false;
  showDeleteDialog.value = false;
  showConnectionDialog.value = false;
  showSchemaDialog.value = false;
  dataSourceToDelete.value = null;
  connectionTestSource.value = null;
  selectedDataSource.value = null;
  editedDataSource.value = createEmptyDataSource();
});
</script>

<style scoped>
/* Theme-aware styling */
:deep(.v-card) {
  border-radius: var(--app-border-radius);
  transition: all var(--app-transition-speed) ease;
}

:deep(.v-dialog > .v-card) {
  border-radius: var(--app-border-radius);
  overflow: hidden;
}

:deep(.v-list-item:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.execution-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>
