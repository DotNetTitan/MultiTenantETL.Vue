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
              @click="openEditPipelineDialog(item)"
              title="Edit pipeline"
            >
              <v-icon>mdi-pencil</v-icon>
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
const pipelineToDelete = ref(null);
const isDialogFullscreen = ref(false);

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
