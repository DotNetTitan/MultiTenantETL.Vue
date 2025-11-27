<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">{{ $t('pipelines.title') }}</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        @click="openCreatePipelineDialog"
      >
        <v-icon v-if="$vuetify.display.smAndUp" class="mr-2">mdi-plus</v-icon>
        <span v-if="$vuetify.display.xs">{{ $t('common.create') }}</span>
        <span v-else>{{ $t('pipelines.createPipeline') }}</span>
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              :label="$t('pipelines.searchPipelines')"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="loadPipelines"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :label="$t('common.status')"
              :items="statusOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="loadPipelines"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="sortBy"
              :label="$t('filters.sortBy')"
              :items="sortOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="loadPipelines"
            />
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="pipelines"
          :loading="loading"
          :items-per-page="10"
          class="mt-2"
        >
          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              text-color="white"
              size="small"
            >
              {{ getStatusLabel(item.status) }}
            </v-chip>
          </template>
          <template #item.lastRunAt="{ item }">
            {{ item.lastRunAt ? formatDate(item.lastRunAt) : 'Never' }}
          </template>
          <template #item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              :to="`/pipelines/${item.id}`"
              :title="$t('pipelines.viewDetails')"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              :title="$t('common.edit')"
              @click="openEditDialog(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="info"
              :title="$t('pipelines.viewMappings')"
              @click="viewMappings(item)"
            >
              <v-icon>mdi-map-marker-path</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="success"
              :disabled="item.status === 'Running'"
              :title="$t('pipelines.executePipeline')"
              @click="handleExecutePipeline(item)"
            >
              <v-icon>mdi-play</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              :title="$t('common.delete')"
              @click="confirmDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Pipeline Dialog -->
    <v-dialog
      v-model="showCreateDialog"
      :fullscreen="isDialogFullscreen || $vuetify.display.mobile"
      :max-width="isDialogFullscreen ? undefined : '1400px'"
      persistent
      scrollable
    >
      <PipelineWizard
        :pipeline="editedPipeline"
        :connectors="connectors"
        :transformations="availableTransformations"
        :timezones="timezones"
        @save="handleSavePipeline"
        @close="showCreateDialog = false"
        @create-connector="goToCreateConnector"
        @add-transformation="addTransformation"
        @toggle-fullscreen="isDialogFullscreen = $event"
      />
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="text-h5">
          {{ $t('pipelines.deletePipeline') }}
        </v-card-title>
        <v-card-text>
          {{ $t('pipelines.deleteConfirm', { name: pipelineToDelete?.name }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deletingPipeline"
            @click="handleDeletePipeline"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Transformation Selector Dialog -->
    <TransformationSelector
      v-model="showTransformationSelector"
      :exclude-ids="editedPipeline.transformations.map(t => t.id).filter(Boolean)"
      @select="selectExistingTransformation"
      @close="showTransformationSelector = false"
    />

    <!-- Field Mappings Viewer Dialog -->
    <v-dialog
      v-model="showMappingsDialog"
      max-width="1200px"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-map-marker-path</v-icon>
          {{ selectedPipeline?.name }} - {{ $t('pipelines.fieldMappings') }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="showMappingsDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <div v-if="loadingMappings" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <div class="mt-4">{{ $t('pipelines.loadingMappings') }}</div>
          </div>
          
          <div v-else-if="mappingsError" class="text-center py-8">
            <v-icon size="64" color="error">mdi-alert-circle</v-icon>
            <div class="mt-4 text-error">{{ mappingsError }}</div>
          </div>
          
          <div v-else-if="pipelineMappings">
            <!-- Pipeline Info -->
            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <v-row dense>
                  <v-col cols="6">
                    <div class="text-caption text-grey">{{ $t('pipelines.source') }}</div>
                    <div class="text-body-1">
                      <v-icon size="small" class="mr-1">mdi-database</v-icon>
                      {{ selectedPipeline?.sourceName }}
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-caption text-grey">{{ $t('pipelines.destination') }}</div>
                    <div class="text-body-1">
                      <v-icon size="small" class="mr-1">mdi-database</v-icon>
                      {{ selectedPipeline?.destinationName }}
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-caption text-grey">{{ $t('pipelines.totalMappings') }}</div>
                    <div class="text-h6">{{ pipelineMappings.length }}</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Mappings List -->
            <div v-if="pipelineMappings.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey">mdi-map-marker-off</v-icon>
              <div class="mt-4 text-grey">{{ $t('pipelines.noMappingsDefine') }}</div>
            </div>
            
            <v-expansion-panels v-else>
              <v-expansion-panel
                v-for="(mapping, index) in pipelineMappings"
                :key="index"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center w-100">
                    <v-chip size="small" class="mr-2">{{ index + 1 }}</v-chip>
                    <div class="flex-grow-1">
                      <strong>{{ mapping.sourceField }}</strong>
                      <v-icon class="mx-2">mdi-arrow-right</v-icon>
                      <strong>{{ mapping.destinationField }}</strong>
                    </div>
                    <v-chip
                      v-if="mapping.transformation"
                      size="small"
                      :color="getTransformationColor(mapping.transformation.type)"
                      class="ml-2"
                    >
                      <v-icon start size="small">{{ getTransformationIcon(mapping.transformation.type) }}</v-icon>
                      {{ mapping.transformation.type }}
                    </v-chip>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense>
                    <v-col cols="12" md="5">
                      <v-card variant="outlined">
                        <v-card-subtitle>{{ $t('pipelines.sourceField') }}</v-card-subtitle>
                        <v-card-text>
                          <div class="mb-2">
                            <strong>{{ mapping.sourceField }}</strong>
                          </div>
                          <div v-if="mapping.sourceFieldType" class="text-caption">
                            Type: <v-chip size="x-small" variant="tonal">{{ mapping.sourceFieldType }}</v-chip>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    
                    <v-col cols="12" md="2" class="d-flex align-center justify-center">
                      <v-icon size="large" color="primary">mdi-arrow-right-thick</v-icon>
                    </v-col>
                    
                    <v-col cols="12" md="5">
                      <v-card variant="outlined">
                        <v-card-subtitle>{{ $t('pipelines.destinationField') }}</v-card-subtitle>
                        <v-card-text>
                          <div class="mb-2">
                            <strong>{{ mapping.destinationField }}</strong>
                          </div>
                          <div v-if="mapping.destinationFieldType" class="text-caption">
                            Type: <v-chip size="x-small" variant="tonal">{{ mapping.destinationFieldType }}</v-chip>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    
                    <v-col v-if="mapping.transformation" cols="12" class="mt-3">
                      <v-card variant="outlined" color="info">
                        <v-card-subtitle>
                          <v-icon start>{{ getTransformationIcon(mapping.transformation.type) }}</v-icon>
                          {{ $t('pipelines.transformationApplied') }}
                        </v-card-subtitle>
                        <v-card-text>
                          <div class="mb-2">
                            <strong>{{ mapping.transformation.name }}</strong>
                          </div>
                          <div class="text-caption">{{ mapping.transformation.description }}</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="showMappingsDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import TransformationSelector from '@/components/pipeline/TransformationSelector.vue';
import PipelineWizard from '@/components/pipeline/PipelineWizard.vue';
import FieldMappingEditor from '@/components/pipeline/FieldMappingEditor.vue';
import { fetchTransformations } from '@/services/transformationService';
import { fetchPipelineById } from '@/services/pipelineService';
import { usePipeline } from '@/composables/usePipeline';
import { usePipelineForm } from '@/composables/usePipelineForm';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

// Get functionality from main pipeline composable
const {
  pipelines,
  loading,
  savingPipeline,
  deletingPipeline,
  search,
  statusFilter,
  sortBy,
  statusOptions,
  sortOptions,
  loadPipelines,
  savePipeline,
  deletePipeline,
  executePipeline,
  getStatusColor,
  formatDate,
  setupTenantSubscription
} = usePipeline();

// Get functionality from the form composable
const {
  form,
  editedPipeline,
  connectors,
  showTransformationSelector,
  fetchConnectors,
  prepareEditPipeline,
  resetForm,
  addTransformation,
  selectExistingTransformation,
  removeTransformation,
  timezones
} = usePipelineForm();

// Field mapping state
const availableTransformations = ref([]);
const mappingValidation = ref({ isValid: true, errors: [], unmappedRequiredFields: [] });

// Load transformations for field mapping
onMounted(async () => {
  try {
    availableTransformations.value = await fetchTransformations();
  } catch (error) {
    console.error('Error loading transformations:', error);
  }
});

// Field mapping methods
function handleMappingValidation(result) {
  mappingValidation.value = result;
}

function getConnectorId(sourceIdOrObject) {
  return typeof sourceIdOrObject === 'string' ? sourceIdOrObject : sourceIdOrObject?.id;
}

// Data table headers
const headers = computed(() => [
  { title: t('common.name'), key: 'name' },
  { title: t('pipelines.source'), key: 'sourceName' },
  { title: t('pipelines.destination'), key: 'destinationName' },
  { title: t('common.status'), key: 'status', width: '120px' },
  { title: t('pipelines.lastRun'), key: 'lastRunAt', width: '150px' },
  { title: t('pipelines.scheduled'), key: 'isScheduled', width: '100px' },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '120px', align: 'end' }
]);

// Dialog controls
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const showMappingsDialog = ref(false);
const pipelineToDelete = ref(null);
const selectedPipeline = ref(null);
const isDialogFullscreen = ref(false);
const loadingMappings = ref(false);
const pipelineMappings = ref(null);
const mappingsError = ref(null);

function openEditDialog(pipeline) {
  router.push(`/pipelines/${pipeline.id}/edit`);
}

function openCreatePipelineDialog() {
  router.push('/pipelines/new');
}

function confirmDelete(pipeline) {
  pipelineToDelete.value = pipeline;
  showDeleteDialog.value = true;
}

async function handleDeletePipeline() {
  try {
    await deletePipeline(pipelineToDelete.value.id);
    showDeleteDialog.value = false;
    pipelineToDelete.value = null;
  } catch (error) {
    console.error('Error deleting pipeline:', error);
  }
}

async function handleSavePipeline() {
  if (!mappingValidation.value.isValid) {
    alert('Please fix field mapping errors before saving');
    return;
  }
  
  try {
    const pipelineToSave = { 
      ...editedPipeline.value, 
      sourceId: editedPipeline.value.sourceId?.id || editedPipeline.value.sourceId,
      destinationId: editedPipeline.value.destinationId?.id || editedPipeline.value.destinationId
    };
    await savePipeline(pipelineToSave);
    showCreateDialog.value = false;
    await loadPipelines();
  } catch (error) {
    console.error('Error saving pipeline:', error);
  }
}

async function handleExecutePipeline(pipeline) {
  try {
    await executePipeline(pipeline.id);
  } catch (error) {
    console.error('Error executing pipeline:', error);
  }
}

function goToCreateConnector() {
  showCreateDialog.value = false;
  router.push('/connectors?action=create');
}

function getStatusLabel(status) {
  const statusMap = {
    'Running': t('executions.running'),
    'Completed': t('executions.completed'),
    'Failed': t('executions.failed'),
    'Cancelled': t('executions.cancelled'),
    'Idle': t('executions.idle')
  };
  return statusMap[status] || status;
}

function getTransformationColor(type) {
  const colors = {
    'Filter': 'blue',
    'Map': 'green',
    'Aggregation': 'orange',
    'Script': 'purple',
    'Join': 'teal'
  };
  return colors[type] || 'grey';
}

function getTransformationIcon(type) {
  const icons = {
    'Filter': 'mdi-filter',
    'Map': 'mdi-map',
    'Aggregation': 'mdi-chart-bar',
    'Script': 'mdi-code-braces',
    'Join': 'mdi-link-variant'
  };
  return icons[type] || 'mdi-cog';
}

async function viewMappings(pipeline) {
  try {
    selectedPipeline.value = pipeline;
    showMappingsDialog.value = true;
    loadingMappings.value = true;
    pipelineMappings.value = null;
    mappingsError.value = null;
    
    // Fetch the full pipeline details including mappings
    const fullPipeline = await fetchPipelineById(pipeline.id);
    
    // Fetch source and destination connectors to get schemas
    const { fetchConnectorById } = await import('@/services/connectorService');
    const [sourceConnector, destinationConnector] = await Promise.all([
      fetchConnectorById(fullPipeline.sourceConnectorId),
      fetchConnectorById(fullPipeline.destinationConnectorId)
    ]);
    
    // Fetch all transformations used in mappings
    const transformationIds = new Set();
    (fullPipeline.fieldMappings || []).forEach(mapping => {
      (mapping.transformations || []).forEach(t => {
        if (t.transformationId) {
          transformationIds.add(t.transformationId);
        }
      });
    });
    
    // Fetch transformation details
    const transformationsMap = new Map();
    if (transformationIds.size > 0) {
      const { fetchTransformationById } = await import('@/services/transformationService');
      await Promise.all(
        Array.from(transformationIds).map(async (id) => {
          try {
            const transformation = await fetchTransformationById(id);
            transformationsMap.set(id, transformation);
          } catch (err) {
            console.warn(`Failed to fetch transformation ${id}:`, err);
          }
        })
      );
    }
    
    // Helper to get field type from schema
    const getFieldType = (fieldName, schema) => {
      if (!schema || !schema.fields) return null;
      const field = schema.fields.find(f => f.name === fieldName);
      return field ? field.type : null;
    };
    
    // Transform field mappings to match dialog format
    pipelineMappings.value = (fullPipeline.fieldMappings || []).map(mapping => {
      const sourceField = mapping.sourceFields && mapping.sourceFields.length > 0 
        ? mapping.sourceFields.join(', ') 
        : '';
      
      const sourceFieldType = mapping.sourceFields && mapping.sourceFields.length === 1
        ? getFieldType(mapping.sourceFields[0], sourceConnector.schema)
        : null;
      
      const destinationFieldType = getFieldType(mapping.destinationField, destinationConnector.schema);
      
      // Get first transformation details (if any)
      let transformation = null;
      if (mapping.transformations && mapping.transformations.length > 0) {
        const firstTransformationId = mapping.transformations[0].transformationId;
        const transformationData = transformationsMap.get(firstTransformationId);
        
        if (transformationData) {
          transformation = {
            type: transformationData.type,
            name: transformationData.name,
            description: transformationData.description || `${mapping.transformations.length} transformation(s) applied`
          };
        } else {
          transformation = {
            type: 'Transformation',
            name: `${mapping.transformations.length} transformation(s)`,
            description: 'Applied transformations'
          };
        }
      }
      
      return {
        sourceField,
        destinationField: mapping.destinationField || '',
        sourceFieldType,
        destinationFieldType,
        transformation
      };
    });
  } catch (error) {
    console.error('Error loading mappings:', error);
    mappingsError.value = error.message || 'Failed to load mappings';
  } finally {
    loadingMappings.value = false;
  }
}

onMounted(async () => {
  // Check if there's a status filter in the URL query parameter
  if (route.query.status) {
    const statusFromUrl = route.query.status.toLowerCase();
    // Map URL status to internal status values
    const statusMap = {
      'active': 'Running',
      'running': 'Running',
      'idle': 'Idle',
      'failed': 'Failed',
      'completed': 'Completed'
    };
    
    if (statusMap[statusFromUrl]) {
      statusFilter.value = statusMap[statusFromUrl];
    }
  }
  
  loadPipelines();
  setupTenantSubscription();
});

watch(showCreateDialog, (newValue) => {
  if (!newValue) {
    // Optionally reset form state when dialog is closed
  }
});

</script>

<style scoped>
/* Add any custom styles here */
</style>
