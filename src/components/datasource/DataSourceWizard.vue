<template>
  <v-card class="wizard-card" :class="{ 'fullscreen-mode': isFullscreen }">
    <v-toolbar color="primary" dark flat>
      <v-btn icon @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-toolbar-title>
        {{ dataSource.id ? 'Edit Data Source' : 'Create New Data Source' }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="toggleFullscreen" :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'">
        <v-icon>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
      </v-btn>
      <v-btn variant="text" @click="handleSave" :loading="saving" :disabled="!canSave">
        Save Data Source
      </v-btn>
    </v-toolbar>

    <v-stepper v-model="currentStep" alt-labels flat class="wizard-stepper">
      <v-stepper-header>
        <v-stepper-item
          :complete="currentStep > 1"
          :value="1"
          title="Basic Info"
          subtitle="Type and provider"
        />
        <v-divider />
        <v-stepper-item
          :complete="currentStep > 2"
          :value="2"
          title="Connection"
          subtitle="Connection details"
        />
        <v-divider />
        <v-stepper-item
          :complete="currentStep > 3"
          :value="3"
          title="Schema"
          subtitle="Define data structure"
        />
        <v-divider />
        <v-stepper-item
          :value="4"
          title="Test & Save"
          subtitle="Verify connection"
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
              <v-col cols="12" md="6">
                <v-select
                  v-model="dataSource.type"
                  :items="dataSourceTypes"
                  label="Type"
                  variant="outlined"
                  :rules="[v => !!v || 'Type is required']"
                  required
                  @update:model-value="handleTypeChange"
                >
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon>{{ getTypeIcon(item.value) }}</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="6">
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
                  placeholder='{"Content-Type": "application/json"}'
                  variant="outlined"
                  rows="3"
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

        <!-- Step 4: Test & Save -->
        <v-stepper-window-item :value="4">
          <div class="pa-6">
            <div class="text-h5 mb-4">Test Connection</div>
            
            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <div class="text-subtitle-1 mb-2">Connection Summary</div>
                <v-list density="compact">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-label</v-icon>
                    </template>
                    <v-list-item-title>Name</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.name }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>{{ getTypeIcon(dataSource.type) }}</v-icon>
                    </template>
                    <v-list-item-title>Type</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.type }} - {{ dataSource.provider }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="dataSource.type === 'Database'">
                    <template v-slot:prepend>
                      <v-icon>mdi-server</v-icon>
                    </template>
                    <v-list-item-title>Server</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.config.server }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="dataSource.type === 'API'">
                    <template v-slot:prepend>
                      <v-icon>mdi-web</v-icon>
                    </template>
                    <v-list-item-title>URL</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.config.url }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-table</v-icon>
                    </template>
                    <v-list-item-title>Schema Fields</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.schema.fields.length }} fields defined</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <v-btn
              block
              color="primary"
              variant="outlined"
              size="large"
              prepend-icon="mdi-connection"
              @click="testConnection"
              :loading="testing"
            >
              Test Connection
            </v-btn>

            <v-alert v-if="testResult" :type="testResult.success ? 'success' : 'error'" class="mt-4">
              <v-icon start>{{ testResult.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
              {{ testResult.message }}
            </v-alert>
          </div>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        v-if="currentStep > 1"
        variant="outlined"
        @click="currentStep--"
      >
        <v-icon start>mdi-chevron-left</v-icon>
        Back
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="currentStep < 4"
        color="primary"
        @click="currentStep++"
        :disabled="!canProceed"
      >
        Next
        <v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SchemaEditor from './SchemaEditor.vue';

const props = defineProps({
  dataSource: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      type: '',
      provider: '',
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
const testing = ref(false);
const testResult = ref(null);
const schemaValidation = ref({ isValid: true, errors: [] });
const isFullscreen = ref(false);

// Expose isFullscreen to template for styling
defineExpose({ isFullscreen });

const dataSourceTypes = [
  { title: 'Database', value: 'Database' },
  { title: 'API', value: 'API' },
  { title: 'File', value: 'File' }
];

const providersByType = {
  Database: ['SQL Server', 'PostgreSQL', 'MySQL', 'Oracle'],
  API: ['REST', 'GraphQL', 'SOAP'],
  File: ['Local', 'FTP', 'S3', 'Azure Blob']
};

const authTypes = ['None', 'Basic', 'Bearer', 'OAuth2'];
const fileFormats = ['CSV', 'JSON', 'XML', 'Excel'];

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
        headers: ''
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
  const { type, config } = props.dataSource;
  
  if (type === 'Database') {
    if (config.useCustomConnectionString) {
      return !!config.connectionString;
    }
    return !!config.server && !!config.database && !!config.username && !!config.password;
  }
  
  if (type === 'API') {
    return !!config.url;
  }
  
  if (type === 'File') {
    return !!config.format && !!config.path;
  }
  
  return false;
}

function handleSchemaValidation(validation) {
  schemaValidation.value = validation;
}

async function testConnection() {
  testing.value = true;
  testResult.value = null;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock success
    testResult.value = {
      success: true,
      message: 'Connection successful! Data source is ready to use.'
    };
  } catch (error) {
    testResult.value = {
      success: false,
      message: `Connection failed: ${error.message}`
    };
  } finally {
    testing.value = false;
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  emit('toggle-fullscreen', isFullscreen.value);
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
  max-height: 90vh;
  height: 100%;
}

.wizard-card.fullscreen-mode {
  max-height: 100vh;
  height: 100vh;
}

.wizard-stepper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.wizard-stepper :deep(.v-stepper-header) {
  flex-shrink: 0;
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
