<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">Tenants</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus" 
        @click="showCreateDialog = true"
      >
        Create Tenant
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Search Tenants"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchTenants"
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
              @update:model-value="fetchTenants"
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
              @update:model-value="fetchTenants"
            />
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="tenants"
          :loading="loading"
          :items-per-page="10"
          class="mt-2"
        >
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="item.isActive ? 'success' : 'error'"
              text-color="white"
              size="small"
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
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
              @click="editTenant(item)"
              title="Edit tenant"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              v-if="!item.isActive"
              icon
              variant="text"
              size="small"
              color="success"
              @click="toggleTenantStatus(item)"
              title="Activate tenant"
            >
              <v-icon>mdi-check</v-icon>
            </v-btn>
            <v-btn
              v-else
              icon
              variant="text"
              size="small"
              color="warning"
              @click="toggleTenantStatus(item)"
              title="Deactivate tenant"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
              title="Delete tenant"
              :disabled="item.isActive"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Tenant Dialog -->
    <v-dialog
      v-model="showCreateDialog"
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ editedTenant.id ? 'Edit Tenant' : 'Create Tenant' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveTenant">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedTenant.name"
                  label="Tenant Name"
                  required
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedTenant.identifier"
                  label="Identifier"
                  required
                  :rules="[
                    v => !!v || 'Identifier is required',
                    v => /^[a-z0-9-]+$/.test(v) || 'Identifier can only contain lowercase letters, numbers, and hyphens'
                  ]"
                  hint="Used as subdomain and in API requests"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedTenant.description"
                  label="Description"
                  rows="2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedTenant.contactName"
                  label="Contact Name"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedTenant.contactEmail"
                  label="Contact Email"
                  :rules="[
                    v => !v || /.+@.+\..+/.test(v) || 'Email must be valid'
                  ]"
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editedTenant.isActive"
                  label="Active"
                  color="success"
                  hide-details
                />
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
            @click="saveTenant"
            :loading="savingTenant"
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
          Delete Tenant
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete the tenant "{{ tenantToDelete?.name }}"? This action cannot be undone and all associated data will be permanently deleted.
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
            @click="deleteTenant"
            :loading="deletingTenant"
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
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Data table
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Identifier', key: 'identifier' },
  { title: 'Description', key: 'description' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Created', key: 'createdAt', width: '150px' },
  { title: 'Contact', key: 'contactName' },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px', align: 'end' }
];

// Filters and sorting
const search = ref('');
const statusFilter = ref('All');
const sortBy = ref('name_asc');
const statusOptions = ref([
  { title: 'All Statuses', value: 'All' },
  { title: 'Active', value: 'Active' },
  { title: 'Inactive', value: 'Inactive' }
]);
const sortOptions = ref([
  { title: 'Name (A-Z)', value: 'name_asc' },
  { title: 'Name (Z-A)', value: 'name_desc' },
  { title: 'Created (Newest)', value: 'created_desc' },
  { title: 'Created (Oldest)', value: 'created_asc' }
]);

// Tenant data
const tenants = ref([]);
const loading = ref(false);
const savingTenant = ref(false);
const deletingTenant = ref(false);

// Dialog controls
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const tenantToDelete = ref(null);

// Form data
const form = ref(null);
const editedTenant = ref(createEmptyTenant());

function createEmptyTenant() {
  return {
    id: null,
    name: '',
    identifier: '',
    description: '',
    contactName: '',
    contactEmail: '',
    isActive: true
  };
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

async function fetchTenants() {
  try {
    loading.value = true;
    
    // In a real app, this would be an actual API call
    const response = await axios.get('/api/tenants');
    
    // For now, using simulated data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    tenants.value = [
      {
        id: '1',
        name: 'Acme Corporation',
        identifier: 'acme',
        description: 'A multinational company producing various products',
        contactName: 'John Smith',
        contactEmail: 'john.smith@acme.com',
        isActive: true,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Globex Corporation',
        identifier: 'globex',
        description: 'Electronics manufacturing company',
        contactName: 'Jane Doe',
        contactEmail: 'jane.doe@globex.com',
        isActive: true,
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'Soylent Corp',
        identifier: 'soylent',
        description: 'Food production company',
        contactName: 'Bob Johnson',
        contactEmail: 'bob.johnson@soylent.com',
        isActive: false,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        name: 'Initech',
        identifier: 'initech',
        description: 'Software company specializing in finance',
        contactName: 'Michael Bolton',
        contactEmail: 'michael.bolton@initech.com',
        isActive: true,
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        name: 'Umbrella Corporation',
        identifier: 'umbrella',
        description: 'Pharmaceutical company',
        contactName: 'Albert Wesker',
        contactEmail: 'albert.wesker@umbrella.com',
        isActive: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Apply filters
    if (search.value) {
      const searchLower = search.value.toLowerCase();
      tenants.value = tenants.value.filter(t => 
        t.name.toLowerCase().includes(searchLower) || 
        t.identifier.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        (t.contactName && t.contactName.toLowerCase().includes(searchLower)) ||
        (t.contactEmail && t.contactEmail.toLowerCase().includes(searchLower))
      );
    }
    
    if (statusFilter.value !== 'All') {
      const isActive = statusFilter.value === 'Active';
      tenants.value = tenants.value.filter(t => t.isActive === isActive);
    }
    
    // Apply sorting
    const [field, direction] = sortBy.value.split('_');
    tenants.value.sort((a, b) => {
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
  } catch (error) {
    console.error('Error fetching tenants:', error);
  } finally {
    loading.value = false;
  }
}

function editTenant(tenant) {
  // Clone the tenant to avoid modifying the original directly
  editedTenant.value = JSON.parse(JSON.stringify(tenant));
  showCreateDialog.value = true;
}

async function toggleTenantStatus(tenant) {
  try {
    loading.value = true;
    
    // In a real app, this would be an actual API call
    // await axios.put(`/api/tenants/${tenant.id}/toggle-status`);
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state
    tenant.isActive = !tenant.isActive;
  } catch (error) {
    console.error('Error toggling tenant status:', error);
  } finally {
    loading.value = false;
  }
}

function confirmDelete(tenant) {
  tenantToDelete.value = tenant;
  showDeleteDialog.value = true;
}

async function deleteTenant() {
  try {
    deletingTenant.value = true;
    
    // In a real app, this would be an actual API call
    // await axios.delete(`/api/tenants/${tenantToDelete.value.id}`);
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove from local array
    const index = tenants.value.findIndex(t => t.id === tenantToDelete.value.id);
    if (index !== -1) {
      tenants.value.splice(index, 1);
    }
    
    showDeleteDialog.value = false;
    tenantToDelete.value = null;
  } catch (error) {
    console.error('Error deleting tenant:', error);
  } finally {
    deletingTenant.value = false;
  }
}

async function saveTenant() {
  try {
    savingTenant.value = true;
    
    // In a real app, this would be an actual API call
    // const response = await axios.post('/api/tenants', editedTenant.value);
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // If it's a new tenant, add an ID and created date
    if (!editedTenant.value.id) {
      editedTenant.value.id = Math.random().toString(36).substring(2, 15);
      editedTenant.value.createdAt = new Date().toISOString();
    }
    
    // Update or add to the local array
    const index = tenants.value.findIndex(t => t.id === editedTenant.value.id);
    if (index !== -1) {
      tenants.value[index] = { ...editedTenant.value };
    } else {
      tenants.value.push({ ...editedTenant.value });
    }
    
    showCreateDialog.value = false;
    editedTenant.value = createEmptyTenant();
  } catch (error) {
    console.error('Error saving tenant:', error);
  } finally {
    savingTenant.value = false;
  }
}

onMounted(async () => {
  // Only allow access if user is admin
  if (!authStore.isAdmin) {
    router.push('/');
    return;
  }
  
  await fetchTenants();
});
</script>
