<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">Pipelines</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus" 
        @click="showCreateDialog = true"
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
              @update:model-value="fetchPipelines"
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
              @update:model-value="fetchPipelines"
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
              @update:model-value="fetchPipelines"
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
              @click="editPipeline(item)"
              title="Edit pipeline"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="success"
              @click="executePipeline(item)"
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
      max-width="800px"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ editedPipeline.id ? 'Edit Pipeline' : 'Create Pipeline' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="savePipeline">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedPipeline.name"
                  label="Pipeline Name"
                  required
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedPipeline.description"
                  label="Description"
                  rows="2"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedPipeline.sourceId"
                  label="Source"
                  :items="dataSources"
                  item-title="name"
                  item-value="id"
                  :rules="[v => !!v || 'Source is required']"
                  return-object
                >
                  <template v-slot:prepend-item>
                    <v-list-item
                      title="Create New Source..."
                      prepend-icon="mdi-plus"
                      @click="goToCreateDataSource"
                    />
                    <v-divider class="mt-2" />
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedPipeline.destinationId"
                  label="Destination"
                  :items="dataSources"
                  item-title="name"
                  item-value="id"
                  :rules="[v => !!v || 'Destination is required']"
                  return-object
                >
                  <template v-slot:prepend-item>
                    <v-list-item
                      title="Create New Destination..."
                      prepend-icon="mdi-plus"
                      @click="goToCreateDataSource"
                    />
                    <v-divider class="mt-2" />
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">Transformations</div>
                <v-card variant="outlined" class="mb-4 pa-2">
                  <div v-if="editedPipeline.transformations.length === 0" class="text-center pa-4">
                    No transformations added yet
                  </div>
                  <v-list v-else>
                    <v-list-item
                      v-for="(transformation, index) in editedPipeline.transformations"
                      :key="index"
                      :title="transformation.name"
                      :subtitle="`Type: ${transformation.type}`"
                    >
                      <template v-slot:append>
                        <v-btn
                          icon
                          variant="text"
                          size="small"
                          @click="editTransformation(index)"
                        >
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          variant="text"
                          size="small"
                          color="error"
                          @click="removeTransformation(index)"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                  <v-btn
                    block
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    class="mt-2"
                    @click="addTransformation"
                  >
                    Add Transformation
                  </v-btn>
                </v-card>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="editedPipeline.isScheduled"
                  label="Schedule this pipeline"
                  hide-details
                  class="mb-2"
                />
                
                <v-expand-transition>
                  <div v-if="editedPipeline.isScheduled">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editedPipeline.schedule.frequency"
                          label="Frequency"
                          :items="['Daily', 'Weekly', 'Monthly', 'Custom']"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editedPipeline.schedule.time"
                          label="Time"
                          type="time"
                        />
                      </v-col>
                      <v-col cols="12" v-if="editedPipeline.schedule.frequency === 'Custom'">
                        <v-text-field
                          v-model="editedPipeline.schedule.cronExpression"
                          label="Cron Expression"
                          hint="e.g. 0 0 * * *"
                          persistent-hint
                        />
                      </v-col>
                    </v-row>
                  </div>
                </v-expand-transition>
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
            @click="savePipeline"
            :loading="savingPipeline"
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
            @click="deletePipeline"
            :loading="deletingPipeline"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Transformation Dialog -->
    <v-dialog
      v-model="showTransformationDialog"
      max-width="600px"
    >
      <v-card>
        <v-card-title>
          {{ editedTransformationIndex === -1 ? 'Add Transformation' : 'Edit Transformation' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="transformationForm">
            <v-text-field
              v-model="editedTransformation.name"
              label="Name"
              :rules="[v => !!v || 'Name is required']"
            />
            <v-select
              v-model="editedTransformation.type"
              label="Type"
              :items="transformationTypes"
              :rules="[v => !!v || 'Type is required']"
            />
            <v-text-field
              v-model="editedTransformation.executionOrder"
              label="Execution Order"
              type="number"
              min="1"
            />
            <v-textarea
              v-model="editedTransformation.configuration"
              label="Configuration"
              rows="5"
              hint="Enter JSON configuration for the transformation"
              persistent-hint
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showTransformationDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveTransformation"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useTenantStore } from '@/stores/tenant';

const router = useRouter();
const tenantStore = useTenantStore();

// Data table
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Source', key: 'sourceName' },
  { title: 'Destination', key: 'destinationName' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Last Run', key: 'lastRunAt', width: '150px' },
  { title: 'Scheduled', key: 'isScheduled', width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px', align: 'end' }
];

// Filters and sorting
const search = ref('');
const statusFilter = ref('All');
const sortBy = ref('name_asc');
const statusOptions = ref([
  { title: 'All Statuses', value: 'All' },
  { title: 'Idle', value: 'Idle' },
  { title: 'Running', value: 'Running' },
  { title: 'Failed', value: 'Failed' }
]);
const sortOptions = ref([
  { title: 'Name (A-Z)', value: 'name_asc' },
  { title: 'Name (Z-A)', value: 'name_desc' },
  { title: 'Last Run (Newest)', value: 'lastRun_desc' },
  { title: 'Last Run (Oldest)', value: 'lastRun_asc' }
]);

// Pipeline data
const pipelines = ref([]);
const dataSources = ref([]);
const transformationTypes = ref(['Filter', 'Map', 'Join', 'Aggregate', 'Enrich', 'Custom']);
const loading = ref(false);
const savingPipeline = ref(false);
const deletingPipeline = ref(false);

// Dialog controls
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const showTransformationDialog = ref(false);
const pipelineToDelete = ref(null);

// Form data
const form = ref(null);
const transformationForm = ref(null);
const editedPipeline = ref(createEmptyPipeline());
const editedTransformation = ref({
  name: '',
  type: 'Filter',
  executionOrder: 1,
  configuration: '{}'
});
const editedTransformationIndex = ref(-1);

function createEmptyPipeline() {
  return {
    id: null,
    name: '',
    description: '',
    sourceId: null,
    destinationId: null,
    transformations: [],
    isScheduled: false,
    schedule: {
      frequency: 'Daily',
      time: '00:00',
      cronExpression: '0 0 * * *'
    }
  };
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'running':
      return 'info';
    case 'failed':
      return 'error';
    case 'idle':
      return 'grey';
    default:
      return 'grey';
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

async function fetchPipelines() {
  try {
    loading.value = true;
    
    // In a real app, these would be actual API calls
    // For now, using simulated data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    pipelines.value = [
      {
        id: '1',
        name: 'Sales Data ETL',
        description: 'Extract sales data from SQL Server, transform, and load to data warehouse',
        sourceName: 'SQL Server - Sales',
        destinationName: 'Data Warehouse',
        status: 'Idle',
        lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isScheduled: true
      },
      {
        id: '2',
        name: 'Customer Import',
        description: 'Import customer data from CSV files',
        sourceName: 'SFTP - Customer Files',
        destinationName: 'Customer Database',
        status: 'Idle',
        lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isScheduled: true
      },
      {
        id: '3',
        name: 'Product Sync',
        description: 'Sync product data between systems',
        sourceName: 'ERP API',
        destinationName: 'E-commerce Platform',
        status: 'Running',
        lastRunAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        isScheduled: false
      },
      {
        id: '4',
        name: 'Analytics Export',
        description: 'Export analytics data to reporting system',
        sourceName: 'Analytics DB',
        destinationName: 'Reporting System',
        status: 'Failed',
        lastRunAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        isScheduled: true
      }
    ];
    
    // Apply filters
    if (search.value) {
      const searchLower = search.value.toLowerCase();
      pipelines.value = pipelines.value.filter(p => 
        p.name.toLowerCase().includes(searchLower) || 
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (statusFilter.value !== 'All') {
      pipelines.value = pipelines.value.filter(p => p.status === statusFilter.value);
    }
    
    // Apply sorting
    const [field, direction] = sortBy.value.split('_');
    pipelines.value.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      if (field === 'lastRun') {
        aVal = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0;
        bVal = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0;
      }
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchDataSources() {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock data
    dataSources.value = [
      { id: '1', name: 'SQL Server - Sales', type: 'Database' },
      { id: '2', name: 'SFTP - Customer Files', type: 'File' },
      { id: '3', name: 'ERP API', type: 'API' },
      { id: '4', name: 'Analytics DB', type: 'Database' },
      { id: '5', name: 'Data Warehouse', type: 'Database' },
      { id: '6', name: 'Customer Database', type: 'Database' },
      { id: '7', name: 'E-commerce Platform', type: 'API' },
      { id: '8', name: 'Reporting System', type: 'API' }
    ];
  } catch (error) {
    console.error('Error fetching data sources:', error);
  }
}

function editPipeline(pipeline) {
  // Clone the pipeline to avoid modifying the original directly
  editedPipeline.value = {
    id: pipeline.id,
    name: pipeline.name,
    description: pipeline.description,
    sourceId: dataSources.value.find(ds => ds.name === pipeline.sourceName) || null,
    destinationId: dataSources.value.find(ds => ds.name === pipeline.destinationName) || null,
    transformations: pipeline.transformations || [],
    isScheduled: pipeline.isScheduled,
    schedule: pipeline.schedule || {
      frequency: 'Daily',
      time: '00:00',
      cronExpression: '0 0 * * *'
    }
  };
  
  showCreateDialog.value = true;
}

function confirmDelete(pipeline) {
  pipelineToDelete.value = pipeline;
  showDeleteDialog.value = true;
}

async function deletePipeline() {
  try {
    deletingPipeline.value = true;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove from local array
    const index = pipelines.value.findIndex(p => p.id === pipelineToDelete.value.id);
    if (index !== -1) {
      pipelines.value.splice(index, 1);
    }
    
    showDeleteDialog.value = false;
    pipelineToDelete.value = null;
  } catch (error) {
    console.error('Error deleting pipeline:', error);
  } finally {
    deletingPipeline.value = false;
  }
}

function addTransformation() {
  editedTransformation.value = {
    name: '',
    type: 'Filter',
    executionOrder: editedPipeline.value.transformations.length + 1,
    configuration: '{}'
  };
  editedTransformationIndex.value = -1;
  showTransformationDialog.value = true;
}

function editTransformation(index) {
  const transformation = editedPipeline.value.transformations[index];
  editedTransformation.value = { ...transformation };
  editedTransformationIndex.value = index;
  showTransformationDialog.value = true;
}

function removeTransformation(index) {
  editedPipeline.value.transformations.splice(index, 1);
  
  // Update execution order
  editedPipeline.value.transformations.forEach((t, i) => {
    t.executionOrder = i + 1;
  });
}

function saveTransformation() {
  if (editedTransformationIndex.value === -1) {
    // Add new transformation
    editedPipeline.value.transformations.push({ ...editedTransformation.value });
  } else {
    // Update existing transformation
    editedPipeline.value.transformations[editedTransformationIndex.value] = { ...editedTransformation.value };
  }
  
  // Sort transformations by execution order
  editedPipeline.value.transformations.sort((a, b) => a.executionOrder - b.executionOrder);
  
  showTransformationDialog.value = false;
}

async function savePipeline() {
  try {
    savingPipeline.value = true;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showCreateDialog.value = false;
    
    // Refresh the list
    await fetchPipelines();
  } catch (error) {
    console.error('Error saving pipeline:', error);
  } finally {
    savingPipeline.value = false;
  }
}

function executePipeline(pipeline) {
  // Simulate pipeline execution
  pipeline.status = 'Running';
  pipeline.lastRunAt = new Date().toISOString();
  
  // In a real app, this would call the API endpoint to execute the pipeline
  // For now, just simulate the execution process
  setTimeout(() => {
    pipeline.status = Math.random() > 0.2 ? 'Completed' : 'Failed';
  }, 5000);
}

function goToCreateDataSource() {
  showCreateDialog.value = false;
  router.push('/data-sources?action=create');
}

onMounted(async () => {
  await fetchDataSources();
  await fetchPipelines();
  
  // Refetch if tenant changes
  tenantStore.$subscribe(() => {
    if (tenantStore.currentTenantId) {
      fetchDataSources();
      fetchPipelines();
    }
  });
});
</script>
