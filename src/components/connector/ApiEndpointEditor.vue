<template>
  <div class="api-endpoint-editor">
    <div class="d-flex align-center mb-4">
      <div class="flex-grow-1">
        <h4 class="text-subtitle-1">{{ $t('connectors.apiEndpoints') }}</h4>
        <p class="text-caption text-grey">{{ getRequirementText() }}</p>
      </div>
      <v-btn
        size="small"
        color="primary"
        prepend-icon="mdi-plus"
        @click="addEndpoint"
      >
        {{ $t('connectors.apiEndpointConfig.addEndpoint') }}
      </v-btn>
    </div>

    <div v-if="localEndpoints.length === 0" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-2">mdi-api-off</v-icon>
      <p class="mt-2 text-grey">{{ $t('connectors.apiEndpointConfig.noEndpoints') }}</p>
      <p class="text-caption text-grey">{{ $t('connectors.apiEndpointConfig.addEndpointsHint') }}</p>
    </div>

    <v-expansion-panels v-else class="mb-4">
      <v-expansion-panel
        v-for="(endpoint, index) in localEndpoints"
        :key="endpoint.id"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-chip :color="getMethodColor(endpoint.method)" size="small" class="mr-2">
              {{ endpoint.method }}
            </v-chip>
            <span class="font-weight-medium">{{ endpoint.path || $t('connectors.apiEndpointConfig.untitledEndpoint') }}</span>
            <v-spacer />
            <v-btn
              icon
              size="small"
              variant="text"
              color="error"
              @click.stop="removeEndpoint(index)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-form>
            <v-row>
              <!-- Method and Path -->
              <v-col cols="12" md="3">
                <v-select
                  v-model="endpoint.method"
                  :items="availableMethods"
                  :label="$t('connectors.apiEndpointConfig.httpMethod')"
                  variant="outlined"
                  density="compact"
                  required
                />
              </v-col>
              <v-col cols="12" md="9">
                <v-text-field
                  v-model="endpoint.path"
                  :label="$t('connectors.apiEndpointConfig.endpointPath')"
                  :placeholder="$t('connectors.apiEndpointConfig.pathPlaceholder')"
                  variant="outlined"
                  density="compact"
                  required
                  :hint="$t('connectors.apiEndpointConfig.pathHint')"
                  persistent-hint
                />
              </v-col>

              <!-- Description -->
              <v-col cols="12">
                <v-text-field
                  v-model="endpoint.description"
                  :label="$t('common.description')"
                  :placeholder="$t('connectors.apiEndpointConfig.descPlaceholder')"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <!-- Request Schema (for POST/PUT) -->
              <v-col v-if="requestBodyMethods.includes(endpoint.method)" cols="12">
                <v-divider class="mb-3" />
                <h5 class="text-subtitle-2 mb-2">{{ $t('connectors.apiEndpointConfig.requestConfig') }}</h5>
                <v-textarea
                  v-model="endpoint.requestSchema"
                  :label="$t('connectors.apiEndpointConfig.requestSchema')"
                  placeholder="{&quot;customer&quot;: {&quot;name&quot;: &quot;&quot;, &quot;email&quot;: &quot;&quot;}}"
                  variant="outlined"
                  rows="4"
                  :hint="$t('connectors.apiEndpointConfig.requestSchemaHint')"
                  persistent-hint
                />
              </v-col>

              <v-col v-if="requestBodyMethods.includes(endpoint.method)" cols="12">
                <v-text-field
                  v-model="endpoint.requestDataPath"
                  :label="$t('connectors.apiEndpointConfig.requestDataPath')"
                  placeholder="customer"
                  variant="outlined"
                  density="compact"
                  :hint="$t('connectors.apiEndpointConfig.requestDataPathHint')"
                  persistent-hint
                />
              </v-col>

              <!-- Response Schema -->
              <v-col cols="12">
                <v-divider class="mb-3" />
                <h5 class="text-subtitle-2 mb-2">{{ $t('connectors.apiEndpointConfig.responseConfig') }}</h5>
                <v-textarea
                  v-model="endpoint.responseSchema"
                  :label="$t('connectors.apiEndpointConfig.responseSchema')"
                  placeholder="{&quot;status&quot;: &quot;success&quot;, &quot;data&quot;: {&quot;customer&quot;: {...}}}"
                  variant="outlined"
                  rows="4"
                  :hint="$t('connectors.apiEndpointConfig.responseSchemaHint')"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="endpoint.responseDataPath"
                  :label="$t('connectors.apiEndpointConfig.responseDataPath')"
                  placeholder="data.customer or data.customers"
                  variant="outlined"
                  density="compact"
                  :hint="$t('connectors.apiEndpointConfig.responseDataPathHint')"
                  persistent-hint
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="endpoint.errorPath"
                  :label="$t('connectors.apiEndpointConfig.errorPath')"
                  placeholder="error.message"
                  variant="outlined"
                  density="compact"
                  :hint="$t('connectors.apiEndpointConfig.errorPathHint')"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-form>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslatedMetadata } from '@/composables/useTranslatedMetadata';

const { t } = useI18n();
const { httpMethods: metadataHttpMethods } = useTranslatedMetadata();

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  direction: {
    type: String,
    default: 'source'
  }
});

const emit = defineEmits(['update:modelValue']);

const localEndpoints = ref([...props.modelValue]);

const endpointDirectionMethodMap = {
  source: ['GET'],
  destination: ['POST', 'PUT'],
  both: ['GET', 'POST', 'PUT']
};

const requestBodyMethods = ['POST', 'PUT'];

// Available methods based on direction and backend metadata
const availableMethods = computed(() => {
  const allowedByDirection = endpointDirectionMethodMap[props.direction] || endpointDirectionMethodMap.source;
  const metadataValues = metadataHttpMethods.value.map(method => method.value);
  return allowedByDirection.filter(method => metadataValues.includes(method));
});

// Watch for changes - emit updates
watch(localEndpoints, (newVal) => {
  emit('update:modelValue', newVal);
}, { deep: true });

// Watch for external changes - only update if different
watch(() => props.modelValue, (newVal) => {
  // Only update if the values are actually different to avoid loops
  if (JSON.stringify(newVal) !== JSON.stringify(localEndpoints.value)) {
    localEndpoints.value = [...newVal];
  }
});

function addEndpoint() {
  const fallbackMethod = props.direction === 'destination' ? 'POST' : 'GET';
  const defaultMethod = availableMethods.value[0] || fallbackMethod;

  localEndpoints.value.push({
    id: `endpoint-${Date.now()}-${Math.random()}`,
    method: defaultMethod,
    path: '',
    description: '',
    requestSchema: '',
    requestDataPath: '',
    responseSchema: '',
    responseDataPath: '',
    errorPath: 'error.message'
  });
}

function removeEndpoint(index) {
  localEndpoints.value.splice(index, 1);
}

function getMethodColor(method) {
  const colors = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red'
  };
  return colors[method] || 'grey';
}

function getRequirementText() {
  if (props.direction === 'source') {
    return t('connectors.apiEndpointConfig.reqSource');
  } else if (props.direction === 'destination') {
    return t('connectors.apiEndpointConfig.reqDestination');
  } else { // both
    return t('connectors.apiEndpointConfig.reqBoth');
  }
}
</script>

<style scoped>
.api-endpoint-editor {
  width: 100%;
}
</style>
