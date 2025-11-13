<template>
  <v-card class="wizard-card" elevation="0">
    <v-stepper v-model="currentStep" alt-labels flat class="wizard-stepper">
      <v-stepper-header>
        <v-stepper-item
          :complete="currentStep > 1"
          :value="1"
          title="Basic Info"
          subtitle="Type and provider"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :complete="currentStep > 2"
          :value="2"
          title="Connection"
          subtitle="Connection details"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :complete="currentStep > 3"
          :value="3"
          title="Schema"
          subtitle="Define data structure"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :value="4"
          title="Review & Save"
          subtitle="Review configuration"
        />
      </v-stepper-header>

      <v-stepper-window class="stepper-window">
        <!-- Step 1: Basic Info -->
        <v-stepper-window-item :value="1">
          <div class="pa-6">
            <div class="text-h5 mb-4">Data Source Information</div>
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="dataSource.name"
                  label="Data Source Name"
                  placeholder="e.g., Customer Database, Sales API"
                  variant="outlined"
                  :rules="[v => !!v || 'Name is required']"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="dataSource.description"
                  label="Description"
                  placeholder="Brief description of this data source"
                  variant="outlined"
                  rows="2"
                  auto-grow
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="dataSource.type"
                  :items="dataSourceTypes"
                  label="Type"
                  variant="outlined"
                  :rules="[v => !!v || 'Type is required']"
                  required
                  @update:model-value="handleTypeChange"
                >
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon>{{ getTypeIcon(item.value) }}</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="dataSource.provider"
                  :items="providerOptions"
                  label="Provider"
                  variant="outlined"
                  :rules="[v => !!v || 'Provider is required']"
                  required
                  :disabled="!dataSource.type"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="dataSource.direction"
                  :items="directionOptions"
                  label="Direction"
                  variant="outlined"
                  :rules="[v => !!v || 'Direction is required']"
                  required
                  hint="How this data source will be used"
                  persistent-hint
                >
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon>{{ item.raw.icon }}</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </div>
        </v-stepper-window-item>

        <!-- Step 2: Connection Details -->
        <v-stepper-window-item :value="2">
          <div class="pa-6">
            <div class="text-h5 mb-4">Connection Configuration</div>
            
            <!-- Database Connection -->
            <v-row v-if="dataSource.type === 'Database'">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.server"
                  label="Server"
                  placeholder="localhost or server.example.com"
                  variant="outlined"
                  :rules="[v => !!v || 'Server is required']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.port"
                  label="Port"
                  placeholder="Default port"
                  variant="outlined"
                  type="number"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.database"
                  label="Database Name"
                  variant="outlined"
                  :rules="[v => !!v || 'Database is required']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.username"
                  label="Username"
                  variant="outlined"
                  :rules="[v => !!v || 'Username is required']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.password"
                  label="Password"
                  type="password"
                  variant="outlined"
                  :rules="[v => !!v || 'Password is required']"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="dataSource.config.useCustomConnectionString"
                  label="Use Custom Connection String"
                  color="primary"
                  hide-details
                />
              </v-col>
              <v-col v-if="dataSource.config.useCustomConnectionString" cols="12">
                <v-textarea
                  v-model="dataSource.config.connectionString"
                  label="Connection String"
                  variant="outlined"
                  rows="3"
                  :rules="[v => !!v || 'Connection string is required']"
                />
              </v-col>
            </v-row>

            <!-- API Connection -->
            <v-row v-else-if="dataSource.type === 'API'">
              <v-col cols="12">
                <v-text-field
                  v-model="dataSource.config.url"
                  label="API URL"
                  placeholder="https://api.example.com"
                  variant="outlined"
                  :rules="[v => !!v || 'URL is required']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dataSource.config.authType"
                  :items="authTypes"
                  label="Authentication Type"
                  variant="outlined"
                />
              </v-col>
              <v-col v-if="dataSource.config.authType === 'Bearer'" cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.token"
                  label="Bearer Token"
                  type="password"
                  variant="outlined"
                />
              </v-col>
              <v-col v-if="dataSource.config.authType === 'Basic'" cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.username"
                  label="Username"
                  variant="outlined"
                />
              </v-col>
              <v-col v-if="dataSource.config.authType === 'Basic'" cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.password"
                  label="Password"
                  type="password"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="dataSource.config.headers"
                  label="Custom Headers (JSON)"
                  placeholder="{&quot;Content-Type&quot;: &quot;application/json&quot;}"
                  variant="outlined"
                  rows="3"
                />
              </v-col>

              <!-- API Endpoints Configuration -->
              <v-col cols="12">
                <v-divider class="my-4" />
                <ApiEndpointEditor
                  v-model="dataSource.config.endpoints"
                  :direction="dataSource.direction"
                />
              </v-col>
            </v-row>

            <!-- File Connection -->
            <v-row v-else-if="dataSource.type === 'File'">
              <v-col cols="12" md="6">
                <v-select
                  v-model="dataSource.config.format"
                  :items="fileFormats"
                  label="File Format"
                  variant="outlined"
                  :rules="[v => !!v || 'Format is required']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.path"
                  label="File Path"
                  placeholder="/path/to/file.csv"
                  variant="outlined"
                  :rules="[v => !!v || 'Path is required']"
                  required
                />
              </v-col>
              <v-col v-if="dataSource.config.format === 'CSV'" cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.delimiter"
                  label="Delimiter"
                  placeholder=","
                  variant="outlined"
                />
              </v-col>
              <v-col v-if="dataSource.config.format === 'CSV'" cols="12" md="6">
                <v-switch
                  v-model="dataSource.config.hasHeader"
                  label="Has Header Row"
                  color="primary"
                  hide-details
                />
              </v-col>
            </v-row>
          </div>
        </v-stepper-window-item>

        <!-- Step 3: Schema Definition -->
        <v-stepper-window-item :value="3">
          <div class="pa-6">
            <div class="text-h5 mb-4">Schema Definition</div>
            <SchemaEditor
              v-model="dataSource.schema.fields"
              @validate="handleSchemaValidation"
            />
          </div>
        </v-stepper-window-item>

        <!-- Step 4: Review & Save -->
        <v-stepper-window-item :value="4">
          <div class="pa-6">
            <div class="text-h5 mb-4">Review Configuration</div>
            
            <!-- Basic Information -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-information</v-icon>
                Basic Information
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-label</v-icon>
                    </template>
                    <v-list-item-title>Name</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.name }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="dataSource.description">
                    <template #prepend>
                      <v-icon>mdi-text</v-icon>
                    </template>
                    <v-list-item-title>Description</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.description }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon>{{ getTypeIcon(dataSource.type) }}</v-icon>
                    </template>
                    <v-list-item-title>Type</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.type }} - {{ dataSource.provider }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon>{{ getDirectionIcon(dataSource.direction) }}</v-icon>
                    </template>
                    <v-list-item-title>Direction</v-list-item-title>
                    <v-list-item-subtitle>{{ getDirectionLabel(dataSource.direction) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Connection Details -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-connection</v-icon>
                Connection Details
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <!-- Database Connection Details -->
                  <template v-if="dataSource.type === 'Database'">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-server</v-icon>
                      </template>
                      <v-list-item-title>Server</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.server }}{{ dataSource.config.port ? ':' + dataSource.config.port : '' }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-database</v-icon>
                      </template>
                      <v-list-item-title>Database</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.database }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-account</v-icon>
                      </template>
                      <v-list-item-title>Username</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.username }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.useCustomConnectionString">
                      <template #prepend>
                        <v-icon>mdi-link-variant</v-icon>
                      </template>
                      <v-list-item-title>Custom Connection String</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ dataSource.config.connectionString }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>

                  <!-- API Connection Details -->
                  <template v-if="dataSource.type === 'API'">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-web</v-icon>
                      </template>
                      <v-list-item-title>Base URL</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.url }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-shield-lock</v-icon>
                      </template>
                      <v-list-item-title>Authentication</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.authType }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.headers">
                      <template #prepend>
                        <v-icon>mdi-code-json</v-icon>
                      </template>
                      <v-list-item-title>Custom Headers</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ dataSource.config.headers }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>

                  <!-- File Connection Details -->
                  <template v-if="dataSource.type === 'File'">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-file-document</v-icon>
                      </template>
                      <v-list-item-title>Format</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.format }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-folder</v-icon>
                      </template>
                      <v-list-item-title>Path</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.path }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'CSV'">
                      <template #prepend>
                        <v-icon>mdi-table-split-cell</v-icon>
                      </template>
                      <v-list-item-title>Delimiter</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.delimiter || ',' }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'CSV'">
                      <template #prepend>
                        <v-icon>mdi-format-header-1</v-icon>
                      </template>
                      <v-list-item-title>Has Header Row</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.hasHeader ? 'Yes' : 'No' }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- API Endpoints (if applicable) -->
            <v-card v-if="dataSource.type === 'API' && dataSource.config.endpoints && dataSource.config.endpoints.length > 0" variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-api</v-icon>
                API Endpoints ({{ dataSource.config.endpoints.length }})
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item v-for="endpoint in dataSource.config.endpoints" :key="endpoint.id">
                    <template #prepend>
                      <v-chip :color="getMethodColor(endpoint.method)" size="small">
                        {{ endpoint.method }}
                      </v-chip>
                    </template>
                    <v-list-item-title>{{ endpoint.path }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Schema Fields -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-table</v-icon>
                Schema Fields ({{ dataSource.schema.fields.length }})
              </v-card-title>
              <v-card-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Field Name</th>
                      <th>Data Type</th>
                      <th>Required</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="field in dataSource.schema.fields" :key="field.id">
                      <td>
                        <v-icon v-if="field.isPrimaryKey" size="small" color="primary" class="mr-1">mdi-key</v-icon>
                        {{ field.name }}
                      </td>
                      <td>
                        <v-chip size="x-small" variant="outlined">{{ field.type }}</v-chip>
                      </td>
                      <td>
                        <v-icon v-if="field.required" size="small" color="error">mdi-check-circle</v-icon>
                        <v-icon v-else size="small" color="grey">mdi-circle-outline</v-icon>
                      </td>
                      <td class="text-caption text-medium-emphasis">{{ field.description || '-' }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </div>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        v-if="currentStep > 1"
        variant="outlined"
        prepend-icon="mdi-chevron-left"
        @click="currentStep--"
      >
        Back
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="currentStep < 4"
        color="primary"
        variant="elevated"
        append-icon="mdi-chevron-right"
        :disabled="!canProceed"
        @click="currentStep++"
      >
        Next
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="elevated"
        prepend-icon="mdi-content-save"
        :loading="saving"
        :disabled="!canSave"
        @click="handleSave"
      >
        Save
        <v-tooltip activator="parent" location="top">Save Data Source</v-tooltip>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SchemaEditor from './SchemaEditor.vue';
import ApiEndpointEditor from './ApiEndpointEditor.vue';

const props = defineProps({
  dataSource: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      description: '',
      type: '',
      provider: '',
      direction: 'source',
      config: {},
      schema: { fields: [] }
    })
  },
  dataSources: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['save', 'close', 'toggle-fullscreen']);

const currentStep = ref(1);
const saving = ref(false);
const schemaValidation = ref({ isValid: true, errors: [] });

const dataSourceTypes = [
  { title: 'Database', value: 'Database' },
  { title: 'API', value: 'API' },
  { title: 'File', value: 'File' }
];

const directionOptions = [
  { title: 'Source Only', value: 'source', icon: 'mdi-download' },
  { title: 'Destination Only', value: 'destination', icon: 'mdi-upload' },
  { title: 'Both (Source & Destination)', value: 'both', icon: 'mdi-swap-horizontal' }
];

const providersByType = {
  Database: ['SQL Server', 'PostgreSQL', 'MySQL', 'Oracle'],
  API: ['REST'],
  File: ['Local', 'FTP', 'S3', 'Azure Blob']
};

const authTypes = ['None', 'Basic', 'Bearer', 'OAuth2'];
const fileFormats = ['CSV', 'JSON', 'XML', 'Excel'];
const httpMethods = {
  source: ['GET'],
  destination: ['POST', 'PUT', 'PATCH']
};

const providerOptions = computed(() => {
  return providersByType[props.dataSource.type] || [];
});

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return !!props.dataSource.name && !!props.dataSource.type && !!props.dataSource.provider;
    case 2:
      return validateConnectionConfig();
    case 3:
      return schemaValidation.value.isValid && props.dataSource.schema.fields.length > 0;
    case 4:
      return true;
    default:
      return false;
  }
});

const canSave = computed(() => {
  return props.dataSource.name &&
         props.dataSource.type &&
         props.dataSource.provider &&
         validateConnectionConfig() &&
         schemaValidation.value.isValid &&
         props.dataSource.schema.fields.length > 0;
});

function getTypeIcon(type) {
  const icons = {
    Database: 'mdi-database',
    API: 'mdi-api',
    File: 'mdi-file'
  };
  return icons[type] || 'mdi-help-circle';
}

function getDirectionIcon(direction) {
  const icons = {
    source: 'mdi-download',
    destination: 'mdi-upload',
    both: 'mdi-swap-horizontal'
  };
  return icons[direction] || 'mdi-help-circle';
}

function getDirectionLabel(direction) {
  const labels = {
    source: 'Source Only',
    destination: 'Destination Only',
    both: 'Both (Source & Destination)'
  };
  return labels[direction] || direction;
}

function getMethodColor(method) {
  const colors = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    PATCH: 'purple',
    DELETE: 'red'
  };
  return colors[method] || 'grey';
}

function handleTypeChange() {
  props.dataSource.provider = '';
  props.dataSource.config = getDefaultConfig(props.dataSource.type);
}

function getDefaultConfig(type) {
  switch (type) {
    case 'Database':
      return {
        server: '',
        port: '',
        database: '',
        username: '',
        password: '',
        useCustomConnectionString: false,
        connectionString: ''
      };
    case 'API':
      return {
        url: '',
        authType: 'None',
        token: '',
        username: '',
        password: '',
        headers: '',
        endpoints: []
      };
    case 'File':
      return {
        format: 'CSV',
        path: '',
        delimiter: ',',
        hasHeader: true
      };
    default:
      return {};
  }
}

function validateConnectionConfig() {
  const { type, config, direction } = props.dataSource;
  
  if (type === 'Database') {
    if (config.useCustomConnectionString) {
      return !!config.connectionString;
    }
    return !!config.server && !!config.database && !!config.username && !!config.password;
  }
  
  if (type === 'API') {
    // Check basic config
    if (!config.url) return false;
    
    // Check endpoints are configured
    if (!config.endpoints || config.endpoints.length === 0) return false;
    
    // Validate direction-specific endpoint requirements
    const hasGetEndpoint = config.endpoints.some(e => e.method === 'GET');
    const hasWriteEndpoint = config.endpoints.some(e => ['POST', 'PUT', 'PATCH'].includes(e.method));
    
    if (direction === 'source' && !hasGetEndpoint) {
      return false; // Source needs at least one GET endpoint
    }
    
    if (direction === 'destination' && !hasWriteEndpoint) {
      return false; // Destination needs at least one POST/PUT/PATCH endpoint
    }
    
    if (direction === 'both' && (!hasGetEndpoint || !hasWriteEndpoint)) {
      return false; // Both needs at least one GET and one write endpoint
    }
    
    // Validate each endpoint has required fields
    return config.endpoints.every(endpoint => {
      const hasBasics = endpoint.method && endpoint.path && endpoint.responseDataPath;
      
      // For write methods, also need request configuration
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        return hasBasics && endpoint.requestDataPath;
      }
      
      return hasBasics;
    });
  }
  
  if (type === 'File') {
    return !!config.format && !!config.path;
  }
  
  return false;
}

function handleSchemaValidation(validation) {
  schemaValidation.value = validation;
}

async function handleSave() {
  if (!canSave.value) return;
  
  saving.value = true;
  try {
    emit('save', props.dataSource);
  } finally {
    saving.value = false;
  }
}

// Initialize config if empty
watch(() => props.dataSource.type, (newType) => {
  if (newType && !props.dataSource.config) {
    props.dataSource.config = getDefaultConfig(newType);
  }
}, { immediate: true });
</script>

<style scoped>
.wizard-card {
  display: flex;
  flex-direction: column;
}

.wizard-stepper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.wizard-stepper :deep(.v-stepper-header) {
  flex-shrink: 0;
  padding: 24px 16px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

/* Style stepper items */
.wizard-stepper :deep(.v-stepper-item) {
  padding: 12px 16px;
}

.wizard-stepper :deep(.v-stepper-item__avatar) {
  margin-bottom: 8px;
  width: 40px;
  height: 40px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-surface), 1);
}

.wizard-stepper :deep(.v-stepper-item--selected .v-stepper-item__avatar) {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 8px rgba(var(--v-theme-primary), 0.3);
  transform: scale(1.1);
  transition: all 0.3s ease;
}

.wizard-stepper :deep(.v-stepper-item--complete .v-stepper-item__avatar) {
  background: rgb(var(--v-theme-success));
  border-color: rgb(var(--v-theme-success));
}

.wizard-stepper :deep(.v-stepper-item__title) {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.wizard-stepper :deep(.v-stepper-item--selected .v-stepper-item__title) {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.wizard-stepper :deep(.v-stepper-item__subtitle) {
  font-size: 12px;
  opacity: 0.7;
}

/* Step arrow between items */
.step-arrow {
  color: rgba(var(--v-theme-primary), 0.5);
  font-size: 28px;
  margin: 0 16px;
  align-self: center;
  margin-top: 20px;
}

.stepper-window {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.stepper-window :deep(.v-stepper-window-item) {
  background: transparent !important;
}


</style>
