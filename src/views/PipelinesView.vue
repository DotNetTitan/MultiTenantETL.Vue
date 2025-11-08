<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">Pipelines</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus" 
        @click="openCreatePipelineDialog"
      >
        Create Pipeline
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Search Pipelines"
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
              label="Status"
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
              label="Sort By"
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
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              text-color="white"
              size="small"
            >
              {{ item.status }}
            </v-chip>
          </template>
          <template v-slot:item.lastRunAt="{ item }">
            {{ item.lastRunAt ? formatDate(item.lastRunAt) : 'Never' }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              :to="`/pipelines/${item.id}`"
              title="View details"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="openEditDialog(item)"
              title="Edit pipeline"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="info"
              @click="viewMappings(item)"
              title="View field mappings"
            >
              <v-icon>mdi-map-marker-path</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="success"
              @click="handleExecutePipeline(item)"
              :disabled="item.status === 'Running'"
              title="Execute pipeline"
            >
              <v-icon>mdi-play</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
              title="Delete pipeline"
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
        :data-sources="dataSources"
        :transformations="availableTransformations"
        :timezones="timezones"
        @save="handleSavePipeline"
        @close="showCreateDialog = false"
        @create-datasource="goToCreateDataSource"
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
          Delete Pipeline
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete the pipeline "{{ pipelineToDelete?.name }}"? This action cannot be undone.
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
            @click="handleDeletePipeline"
            :loading="deletingPipeline"
          >
            Delete
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
          {{ selectedPipeline?.name }} - Field Mappings
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
            <div class="mt-4">Loading mappings...</div>
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
                    <div class="text-caption text-grey">Source</div>
                    <div class="text-body-1">
                      <v-icon size="small" class="mr-1">mdi-database</v-icon>
                      {{ selectedPipeline?.sourceName }}
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-caption text-grey">Destination</div>
                    <div class="text-body-1">
                      <v-icon size="small" class="mr-1">mdi-database</v-icon>
                      {{ selectedPipeline?.destinationName }}
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-caption text-grey">Total Mappings</div>
                    <div class="text-h6">{{ pipelineMappings.length }}</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Mappings List -->
            <div v-if="pipelineMappings.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey">mdi-map-marker-off</v-icon>
              <div class="mt-4 text-grey">No field mappings defined</div>
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
                        <v-card-subtitle>Source Field</v-card-subtitle>
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
                        <v-card-subtitle>Destination Field</v-card-subtitle>
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
                          Transformation Applied
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
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import TransformationSelector from '@/components/pipeline/TransformationSelector.vue';
import PipelineWizard from '@/components/pipeline/PipelineWizard.vue';
import FieldMappingEditor from '@/components/pipeline/FieldMappingEditor.vue';
import { fetchTransformations } from '@/services/transformationService';
import { usePipeline } from '@/composables/usePipeline';
import { usePipelineForm } from '@/composables/usePipelineForm';

const router = useRouter();

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
  dataSources,
  showTransformationSelector,
  fetchDataSources,
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

function getDataSourceId(sourceIdOrObject) {
  return typeof sourceIdOrObject === 'string' ? sourceIdOrObject : sourceIdOrObject?.id;
}

// Data table headers
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Source', key: 'sourceName' },
  { title: 'Destination', key: 'destinationName' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Last Run', key: 'lastRunAt', width: '150px' },
  { title: 'Scheduled', key: 'isScheduled', width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px', align: 'end' }
];

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
  fetchDataSources();
  prepareEditPipeline(pipeline);
  showCreateDialog.value = true;
}

function openCreatePipelineDialog() {
  fetchDataSources();
  resetForm();
  if (!editedPipeline.value.schedule) {
    editedPipeline.value.schedule = {
      frequency: 'Daily',
      time: '00:00',
      cronExpression: '0 0 * * *',
      timezone: 'UTC'
    };
  }
  showCreateDialog.value = true;
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

function goToCreateDataSource() {
  showCreateDialog.value = false;
  router.push('/data-sources?action=create');
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
    // For now, using mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock mappings data
    pipelineMappings.value = [
      {
        sourceField: 'OrderId',
        destinationField: 'order_id',
        sourceFieldType: 'int',
        destinationFieldType: 'integer',
        transformation: null
      },
      {
        sourceField: 'CustomerName',
        destinationField: 'customer_name',
        sourceFieldType: 'varchar(100)',
        destinationFieldType: 'string',
        transformation: {
          type: 'Map',
          name: 'Name Formatter',
          description: 'Formats customer names to title case'
        }
      },
      {
        sourceField: 'OrderDate',
        destinationField: 'created_at',
        sourceFieldType: 'datetime',
        destinationFieldType: 'timestamp',
        transformation: null
      },
      {
        sourceField: 'TotalAmount',
        destinationField: 'total',
        sourceFieldType: 'decimal(18,2)',
        destinationFieldType: 'decimal',
        transformation: {
          type: 'Script',
          name: 'Currency Converter',
          description: 'Converts amount to USD'
        }
      }
    ];
  } catch (error) {
    console.error('Error loading mappings:', error);
    mappingsError.value = error.message || 'Failed to load mappings';
  } finally {
    loadingMappings.value = false;
  }
}

onMounted(async () => {
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
