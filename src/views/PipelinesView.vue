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
      max-width="800px"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ editedPipeline.id ? 'Edit Pipeline' : 'Create Pipeline' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="handleSavePipeline">
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
                  color="primary"
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
                          hint="24-hour format (HH:MM)"
                          persistent-hint
                        />
                      </v-col>
                      <v-col cols="12" md="6" v-if="editedPipeline.schedule.frequency === 'Weekly'">
                        <v-select
                          v-model="editedPipeline.schedule.dayOfWeek"
                          label="Day of Week"
                          :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']"
                        />
                      </v-col>
                      <v-col cols="12" md="6" v-if="editedPipeline.schedule.frequency === 'Monthly'">
                        <v-select
                          v-model="editedPipeline.schedule.dayOfMonth"
                          label="Day of Month"
                          :items="Array.from({length: 31}, (_, i) => i + 1)"
                        />
                      </v-col>
                      <v-col cols="12" v-if="editedPipeline.schedule.frequency === 'Custom'">
                        <v-text-field
                          v-model="editedPipeline.schedule.cronExpression"
                          label="Cron Expression"
                          hint="e.g. 0 0 * * * (runs at midnight every day)"
                          persistent-hint
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editedPipeline.schedule.timezone"
                          label="Timezone"
                          :items="timezones"
                          item-title="name"
                          item-value="value"
                          hint="All schedules are stored in the selected timezone"
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
            @click="handleSavePipeline"
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
            @click="handleDeletePipeline"
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
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePipeline } from '@/composables/usePipeline';
import { usePipelineForm } from '@/composables/usePipelineForm'; // Import the new composable

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
  savePipeline, // Keep savePipeline from usePipeline
  deletePipeline,
  executePipeline,
  // createEmptyPipeline, // Now handled by usePipelineForm
  getStatusColor,
  formatDate,
  setupTenantSubscription
} = usePipeline();

// Get functionality from the form composable
const {
  form, // Main form ref
  editedPipeline,
  dataSources,
  transformationTypes,
  showTransformationDialog,
  transformationForm, // Transformation dialog form ref
  editedTransformation,
  editedTransformationIndex,
  fetchDataSources,
  prepareEditPipeline,
  resetForm,
  addTransformation,
  editTransformation,
  removeTransformation,
  saveTransformation,
  timezones // Add timezones from the composable
} = usePipelineForm();

// Data table headers (remain the same)
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Source', key: 'sourceName' },
  { title: 'Destination', key: 'destinationName' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Last Run', key: 'lastRunAt', width: '150px' },
  { title: 'Scheduled', key: 'isScheduled', width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px', align: 'end' }
];

// Dialog controls (main dialogs remain here)
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const pipelineToDelete = ref(null);

// Function to open the edit dialog
function openEditPipelineDialog(pipeline) {
  fetchDataSources(); // Ensure datasources are loaded before preparing
  prepareEditPipeline(pipeline); // Use the function from the composable
  showCreateDialog.value = true;
}

// Function to open the create dialog
function openCreatePipelineDialog() {
  fetchDataSources(); // Ensure datasources are loaded
  resetForm(); // Use the function from the composable
  
  // Ensure UTC timezone is selected by default
  if (editedPipeline.value.schedule) {
    editedPipeline.value.schedule.timezone = 'UTC';
  } else {
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
    await deletePipeline(pipelineToDelete.value.id); // Call composable
    showDeleteDialog.value = false;
    pipelineToDelete.value = null;
  } catch (error) {
    console.error('Error deleting pipeline:', error);
  }
}

async function handleSavePipeline() {
  // Validate the main form using the ref from the composable
  if (form.value) {
    const { valid } = await form.value.validate();
    if (!valid) return;
  }
  
  try {
    // Pass the editedPipeline object from the form composable
    // Need to map sourceId/destinationId back to just IDs if they are objects
    const pipelineToSave = { 
      ...editedPipeline.value, 
      sourceId: editedPipeline.value.sourceId?.id || editedPipeline.value.sourceId,
      destinationId: editedPipeline.value.destinationId?.id || editedPipeline.value.destinationId
    };
    await savePipeline(pipelineToSave); // Call main composable's save function
    showCreateDialog.value = false;
    await loadPipelines(); // Refresh the list
  } catch (error) {
    console.error('Error saving pipeline:', error);
    // Show error notification
  }
}

async function handleExecutePipeline(pipeline) {
  try {
    await executePipeline(pipeline.id); // Call composable
    // Show success notification
  } catch (error) {
    console.error('Error executing pipeline:', error);
    // Show error notification
  }
}

function goToCreateDataSource() {
  showCreateDialog.value = false;
  router.push('/data-sources?action=create');
}

// --- Lifecycle Hook ---
onMounted(async () => {
  // fetchDataSources(); // Moved to dialog open functions
  loadPipelines();
  setupTenantSubscription();
});

// Watcher to reset form when dialog closes (optional, good practice)
watch(showCreateDialog, (newValue) => {
  if (!newValue) {
    // Optionally reset form state when dialog is closed
    // resetForm(); // Or just let it keep state until next open
  }
});

</script>
