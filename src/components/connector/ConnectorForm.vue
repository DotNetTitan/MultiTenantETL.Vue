<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <FormInput
      v-model="form.name"
      label="Name"
      :error="errors.name"
      required
    />

    <div class="grid grid-cols-2 gap-4">
      <FormInput
        v-model="form.type"
        label="Type"
        type="select"
        :options="dataSourceTypes"
        :error="errors.type"
        required
        @change="handleTypeChange"
      />
      
      <FormInput
        v-model="form.provider"
        label="Provider"
        type="select"
        :options="providerOptions"
        :error="errors.provider"
        required
      />
    </div>

    <div v-if="form.type === 'Database'">
      <div class="grid grid-cols-2 gap-4">
        <FormInput
          v-model="form.server"
          label="Server"
          :error="errors.server"
          required
        />
        <FormInput
          v-model="form.database"
          label="Database"
          :error="errors.database"
          required
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4 mt-4">
        <FormInput
          v-model="form.username"
          label="Username"
          :error="errors.username"
          required
        />
        <FormInput
          v-model="form.password"
          label="Password"
          type="password"
          :error="errors.password"
          required
        />
      </div>

      <div class="mt-4">
        <FormInput
          v-model="form.connectionString"
          label="Connection String"
          type="textarea"
          :error="errors.connectionString"
          :disabled="!form.customConnection"
        />
        <v-row align="center" class="mt-2">
          <v-col cols="auto">
            <v-switch
              v-model="form.customConnection"
              label="Custom Connection String"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>
        </v-row>
      </div>
    </div>

    <div v-else-if="form.type === 'API'">
      <FormInput
        v-model="form.url"
        label="URL"
        :error="errors.url"
        required
      />
      
      <div class="grid grid-cols-2 gap-4 mt-4">
        <FormInput
          v-model="form.authType"
          label="Authentication Type"
          type="select"
          :options="authTypes"
          :error="errors.authType"
        />
        
        <template v-if="form.authType === 'Bearer'">
          <FormInput
            v-model="form.token"
            label="Token"
            type="password"
            :error="errors.token"
          />
        </template>
      </div>

      <div class="mt-4">
        <FormInput
          v-model="form.headers"
          label="Headers"
          type="textarea"
          :error="errors.headers"
          placeholder="Enter headers in JSON format"
        />
      </div>
    </div>

    <div v-else-if="form.type === 'File'">
      <div class="grid grid-cols-2 gap-4">
        <FormInput
          v-model="form.format"
          label="File Format"
          type="select"
          :options="fileFormats"
          :error="errors.format"
          required
        />
        
        <FormInput
          v-model="form.path"
          label="File Path"
          :error="errors.path"
          required
        />
      </div>

      <div v-if="form.format === 'CSV'" class="mt-4">
        <FormInput
          v-model="form.delimiter"
          label="Delimiter"
          :error="errors.delimiter"
        />
        <div class="mt-2">
          <v-switch
            v-model="form.hasHeader"
            label="Has Header Row"
            color="primary"
            inset
            density="compact"
            hide-details
          />
        </div>
      </div>
    </div>

    <div class="mt-4 space-y-4">
      <FormInput
        v-model="form.retryConfig.maxAttempts"
        label="Max Retry Attempts"
        type="number"
        :error="errors.maxAttempts"
      />

      <FormInput
        v-model="form.retryConfig.delaySeconds"
        label="Retry Delay (seconds)"
        type="number"
        :error="errors.delaySeconds"
      />
    </div>

    <div class="flex justify-between mt-6">
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="!isFormValid || testing"
        @click="handleTestConnection"
      >
        {{ testing ? 'Testing...' : 'Test Connection' }}
      </button>

      <div class="space-x-2">
        <button
          type="button"
          class="btn btn-outline"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid || saving"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useConnector } from '@/composables/useConnector';
import { useTranslatedMetadata } from '@/composables/useTranslatedMetadata';
import FormInput from '@/components/form/FormInput.vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['save', 'cancel']);

const { validateConnection, getConnectionTemplate } = useDataSource();

// Use translated metadata service
const {
  dataSourceTypes: metadataTypes,
  authTypes: metadataAuthTypes,
  fileFormats: metadataFileFormats,
  getProvidersForType
} = useTranslatedMetadata();

// Map to simple arrays for FormInput compatibility
const dataSourceTypes = computed(() => 
  metadataTypes.value.map(type => type.value)
);

const authTypes = computed(() => 
  metadataAuthTypes.value.map(auth => auth.value)
);

const fileFormats = computed(() => 
  metadataFileFormats.value.map(format => format.value)
);

// Get providers dynamically based on selected type
const providerOptions = computed(() => 
  getProvidersForType(form.value.type)
);

const form = ref({
  name: '',
  type: 'Database',
  provider: '',
  server: '',
  database: '',
  username: '',
  password: '',
  connectionString: '',
  customConnection: false,
  url: '',
  authType: 'None',
  token: '',
  headers: '',
  format: 'CSV',
  path: '',
  delimiter: ',',
  hasHeader: true,
  retryConfig: {
    maxAttempts: 3,
    delaySeconds: 5
  },
  ...props.initialData
});

const errors = ref({});
const testing = ref(false);
const saving = ref(false);

// Clear errors when form fields change
watch(() => form.value, () => {
  clearFormErrors();
}, { deep: true });

function clearFormErrors() {
  errors.value = {};
}

const isFormValid = computed(() => {
  const requiredFields = ['name', 'type', 'provider'];
  
  if (form.value.type === 'Database') {
    requiredFields.push('server', 'database', 'username', 'password');
  } else if (form.value.type === 'API') {
    requiredFields.push('url', 'method');
    if (form.value.method !== 'GET') {
      requiredFields.push('requestBody');
    }
  } else if (form.value.type === 'File') {
    requiredFields.push('format', 'path');
    if (form.value.format === 'CSV') {
      requiredFields.push('delimiter');
    }
  }

  return requiredFields.every(field => {
    const value = form.value[field];
    if (!value && value !== false) {
      errors.value[field] = 'This field is required';
      return false;
    }
    return true;
  });
});

watch(() => form.value.type, (newType) => {
  form.value.provider = '';
  errors.value = {};
});

watch(
  () => [form.value.server, form.value.database, form.value.username, form.value.password],
  () => {
    if (!form.value.customConnection && form.value.type === 'Database') {
      form.value.connectionString = getConnectionTemplate(form.value.provider)
        .replace('{server}', form.value.server)
        .replace('{database}', form.value.database)
        .replace('{username}', form.value.username)
        .replace('{password}', form.value.password);
    }
  }
);

const handleTypeChange = () => {
  form.value.provider = '';
  form.value.connectionString = '';
  errors.value = {};
};

const handleTestConnection = async () => {
  testing.value = true;
  errors.value = {};

  try {
    const result = await validateConnection(form.value);
    if (result.success) {
      emit('notify', {
        type: 'success',
        message: 'Connection test successful!'
      });
    } else {
      emit('notify', {
        type: 'error',
        message: `Connection test failed: ${result.message}`
      });
    }
  } catch (err) {
    errors.value.connection = err.message;
  } finally {
    testing.value = false;
  }
};

const handleSubmit = () => {
  if (!isFormValid.value) return;
  
  saving.value = true;
  errors.value = {};

  try {
    emit('save', form.value);
  } catch (err) {
    errors.value.submit = err.message;
  } finally {
    saving.value = false;
  }
};
</script>