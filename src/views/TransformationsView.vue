<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">Transformations</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus" 
        @click="showCreateDialog = true"
      >
        Create Transformation
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Search Transformations"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchTransformations"
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
              @update:model-value="fetchTransformations"
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
              @update:model-value="fetchTransformations"
            />
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="transformations"
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
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              @click="editTransformation(item)"
              title="Edit transformation"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="cloneTransformation(item)"
              title="Clone transformation"
            >
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
              title="Delete transformation"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Transformation Dialog -->
    <v-dialog
      v-model="showCreateDialog"
      max-width="800px"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ editedTransformation.id ? 'Edit Transformation' : 'Create Transformation' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveTransformation">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="editedTransformation.name"
                  label="Transformation Name"
                  required
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="editedTransformation.type"
                  label="Type"
                  :items="transformationTypes"
                  required
                  :rules="[v => !!v || 'Type is required']"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedTransformation.description"
                  label="Description"
                  rows="2"
                />
              </v-col>
            </v-row>

            <!-- Type-specific configuration -->
            <div v-if="editedTransformation.type === 'Filter'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">Filter Configuration</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedTransformation.config.filterColumn"
                    label="Column to Filter"
                    :items="mockColumns"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedTransformation.config.operator"
                    label="Operator"
                    :items="[
                      { title: 'Equals', value: 'equals' },
                      { title: 'Not Equals', value: 'notEquals' },
                      { title: 'Greater Than', value: 'greaterThan' },
                      { title: 'Less Than', value: 'lessThan' },
                      { title: 'Contains', value: 'contains' },
                      { title: 'Not Contains', value: 'notContains' },
                      { title: 'Is Empty', value: 'isEmpty' },
                      { title: 'Is Not Empty', value: 'isNotEmpty' }
                    ]"
                    required
                  />
                </v-col>
                <v-col cols="12" v-if="!['isEmpty', 'isNotEmpty'].includes(editedTransformation.config.operator)">
                  <v-text-field
                    v-model="editedTransformation.config.value"
                    label="Value"
                    required
                  />
                </v-col>
              </v-row>
            </div>

            <div v-if="editedTransformation.type === 'Map'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">Mapping Configuration</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedTransformation.config.sourceColumn"
                    label="Source Column"
                    :items="mockColumns"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedTransformation.config.targetColumn"
                    label="Target Column (leave empty to overwrite source)"
                  />
                </v-col>
              </v-row>
              <div v-for="(mapping, index) in editedTransformation.config.mappings" :key="index" class="d-flex align-center mb-2">
                <v-text-field
                  v-model="mapping.from"
                  label="From Value"
                  density="compact"
                  class="mr-2"
                />
                <v-text-field
                  v-model="mapping.to"
                  label="To Value"
                  density="compact"
                  class="mr-2"
                />
                <v-btn
                  icon
                  variant="text"
                  color="error"
                  size="small"
                  @click="removeMapping(index)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
              <v-btn
                prepend-icon="mdi-plus"
                variant="text"
                @click="addMapping"
                size="small"
                class="mt-2"
              >
                Add Mapping
              </v-btn>
            </div>

            <div v-if="editedTransformation.type === 'Aggregation'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">Aggregation Configuration</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedTransformation.config.groupByColumns"
                    label="Group By Columns"
                    :items="mockColumns"
                    multiple
                    chips
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedTransformation.config.aggregationType"
                    label="Aggregation Type"
                    :items="[
                      { title: 'Sum', value: 'sum' },
                      { title: 'Average', value: 'avg' },
                      { title: 'Count', value: 'count' },
                      { title: 'Min', value: 'min' },
                      { title: 'Max', value: 'max' }
                    ]"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6" v-if="editedTransformation.config.aggregationType !== 'count'">
                  <v-select
                    v-model="editedTransformation.config.aggregationColumn"
                    label="Aggregation Column"
                    :items="mockColumns"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedTransformation.config.resultColumn"
                    label="Result Column Name"
                    required
                  />
                </v-col>
              </v-row>
            </div>

            <div v-if="editedTransformation.type === 'Script'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">Script Configuration</h3>
              <v-textarea
                v-model="editedTransformation.config.script"
                label="Script (JS/C#)"
                rows="10"
                class="font-family-monospace"
                placeholder="// Write your transformation script here
// Example:
// data.forEach(row => {
//   row.fullName = row.firstName + ' ' + row.lastName;
// });
// return data;"
              />
            </div>
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
            @click="saveTransformation"
            :loading="savingTransformation"
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
          Delete Transformation
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete the transformation "{{ transformationToDelete?.name }}"? This action cannot be undone.
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
            @click="deleteTransformation"
            :loading="deletingTransformation"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useTenantStore } from '@/stores/tenant';

const tenantStore = useTenantStore();

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
  { title: 'Filter', value: 'Filter' },
  { title: 'Map', value: 'Map' },
  { title: 'Aggregation', value: 'Aggregation' },
  { title: 'Script', value: 'Script' }
]);
const sortOptions = ref([
  { title: 'Name (A-Z)', value: 'name_asc' },
  { title: 'Name (Z-A)', value: 'name_desc' },
  { title: 'Type', value: 'type_asc' },
  { title: 'Created (Newest)', value: 'created_desc' },
  { title: 'Created (Oldest)', value: 'created_asc' }
]);

// Transformation options
const transformationTypes = [
  'Filter',
  'Map',
  'Aggregation',
  'Script'
];

// Transformation data
const transformations = ref([]);
const loading = ref(false);
const savingTransformation = ref(false);
const deletingTransformation = ref(false);

// Dialog controls
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const transformationToDelete = ref(null);

// Form data
const form = ref(null);
const editedTransformation = ref(createEmptyTransformation());

// Mock data for dropdown options
const mockColumns = [
  'id',
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'city',
  'state',
  'zipCode',
  'country',
  'age',
  'income',
  'purchaseAmount',
  'orderDate',
  'productCategory'
];

function createEmptyTransformation() {
  return {
    id: null,
    name: '',
    type: 'Filter',
    description: '',
    config: {
      // Filter config
      filterColumn: '',
      operator: 'equals',
      value: '',
      
      // Map config
      sourceColumn: '',
      targetColumn: '',
      mappings: [],
      
      // Aggregation config
      groupByColumns: [],
      aggregationType: 'sum',
      aggregationColumn: '',
      resultColumn: '',
      
      // Script config
      script: ''
    }
  };
}

function getTypeColor(type) {
  switch (type) {
    case 'Filter':
      return 'info';
    case 'Map':
      return 'success';
    case 'Aggregation':
      return 'warning';
    case 'Script':
      return 'deep-purple';
    default:
      return 'grey';
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

async function fetchTransformations() {
  try {
    loading.value = true;
    
    // In a real app, this would be an actual API call
    // const response = await axios.get('/api/transformations');
    
    // For now, using simulated data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    const mockTransformations = [
      {
        id: '1',
        name: 'Filter Inactive Customers',
        type: 'Filter',
        description: 'Removes inactive customers from the dataset',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        config: {
          filterColumn: 'isActive',
          operator: 'equals',
          value: 'true'
        }
      },
      {
        id: '2',
        name: 'Map Customer Segments',
        type: 'Map',
        description: 'Maps numeric customer segments to readable names',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        config: {
          sourceColumn: 'segmentId',
          targetColumn: 'segmentName',
          mappings: [
            { from: '1', to: 'High Value' },
            { from: '2', to: 'Medium Value' },
            { from: '3', to: 'Low Value' }
          ]
        }
      },
      {
        id: '3',
        name: 'Sales by Region Aggregation',
        type: 'Aggregation',
        description: 'Aggregates sales data by region',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        config: {
          groupByColumns: ['region', 'country'],
          aggregationType: 'sum',
          aggregationColumn: 'salesAmount',
          resultColumn: 'totalSales'
        }
      },
      {
        id: '4',
        name: 'Format Phone Numbers',
        type: 'Script',
        description: 'Formats phone numbers to a consistent pattern',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        config: {
          script: `
// Format phone numbers to (XXX) XXX-XXXX
data.forEach(row => {
  if (row.phone) {
    // Remove any non-digit characters
    let digits = row.phone.replace(/\\D/g, '');
    
    // Check if we have enough digits for a US phone number
    if (digits.length === 10) {
      row.phone = \`(\${digits.substring(0, 3)}) \${digits.substring(3, 6)}-\${digits.substring(6)}\`;
    }
  }
});

return data;
          `
        }
      },
      {
        id: '5',
        name: 'Remove Duplicate Orders',
        type: 'Filter',
        description: 'Removes duplicate orders based on order ID',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        config: {
          filterColumn: 'isDuplicate',
          operator: 'equals',
          value: 'false'
        }
      }
    ];
    
    // Apply filters
    let filteredTransformations = [...mockTransformations];
    
    if (search.value) {
      const searchLower = search.value.toLowerCase();
      filteredTransformations = filteredTransformations.filter(t => 
        t.name.toLowerCase().includes(searchLower) || 
        t.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (typeFilter.value !== 'All') {
      filteredTransformations = filteredTransformations.filter(t => t.type === typeFilter.value);
    }
    
    // Apply sorting
    const [field, direction] = sortBy.value.split('_');
    filteredTransformations.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      if (field === 'created') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    transformations.value = filteredTransformations;
  } catch (error) {
    console.error('Error fetching transformations:', error);
  } finally {
    loading.value = false;
  }
}

function editTransformation(transformation) {
  // Deep clone the transformation to avoid modifying the original directly
  editedTransformation.value = JSON.parse(JSON.stringify(transformation));
  showCreateDialog.value = true;
}

function cloneTransformation(transformation) {
  // Deep clone the transformation to avoid modifying the original directly
  const cloned = JSON.parse(JSON.stringify(transformation));
  cloned.id = null;
  cloned.name = `Copy of ${cloned.name}`;
  editedTransformation.value = cloned;
  showCreateDialog.value = true;
}

function addMapping() {
  if (!editedTransformation.value.config.mappings) {
    editedTransformation.value.config.mappings = [];
  }
  
  editedTransformation.value.config.mappings.push({ from: '', to: '' });
}

function removeMapping(index) {
  editedTransformation.value.config.mappings.splice(index, 1);
}

function confirmDelete(transformation) {
  transformationToDelete.value = transformation;
  showDeleteDialog.value = true;
}

async function deleteTransformation() {
  try {
    deletingTransformation.value = true;
    
    // In a real app, this would be an actual API call
    // await axios.delete(`/api/transformations/${transformationToDelete.value.id}`);
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove from local array
    const index = transformations.value.findIndex(t => t.id === transformationToDelete.value.id);
    if (index !== -1) {
      transformations.value.splice(index, 1);
    }
    
    showDeleteDialog.value = false;
    transformationToDelete.value = null;
  } catch (error) {
    console.error('Error deleting transformation:', error);
  } finally {
    deletingTransformation.value = false;
  }
}

async function saveTransformation() {
  try {
    savingTransformation.value = true;
    
    // In a real app, this would be an actual API call
    // const response = await axios.post('/api/transformations', editedTransformation.value);
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // If it's a new transformation, add an ID and created date
    if (!editedTransformation.value.id) {
      editedTransformation.value.id = Math.random().toString(36).substring(2, 15);
      editedTransformation.value.createdAt = new Date().toISOString();
    }
    
    // Update or add to the local array
    const index = transformations.value.findIndex(t => t.id === editedTransformation.value.id);
    if (index !== -1) {
      transformations.value[index] = { ...editedTransformation.value };
    } else {
      transformations.value.push({ ...editedTransformation.value });
    }
    
    showCreateDialog.value = false;
    editedTransformation.value = createEmptyTransformation();
  } catch (error) {
    console.error('Error saving transformation:', error);
  } finally {
    savingTransformation.value = false;
  }
}

onMounted(() => {
  fetchTransformations();
  
  // Refetch if tenant changes
  tenantStore.$subscribe(() => {
    if (tenantStore.currentTenantId) {
      fetchTransformations();
    }
  });
});
</script>
