<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">Tenants</h1>
      <v-spacer />
      <v-btn
        color="primary"
        @click="openCreateDialog"
      >
        <v-icon v-if="$vuetify.display.smAndUp" class="mr-2">mdi-plus</v-icon>
        <span v-if="$vuetify.display.xs">Add</span>
        <span v-else>Add Tenant</span>
      </v-btn>
    </div>

        <v-card>
          <v-card-text>
            <table-filters
              :filters="availableFilters"
              :sort-options="sortOptions"
              @filter="handleFilter"
              @sort="handleSort"
            />

            <v-table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Identifier</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading" class="text-center">
                  <td colspan="6">
                    <v-progress-circular indeterminate class="ma-4" />
                  </td>
                </tr>
                <tr v-else-if="!tenants.length">
                  <td colspan="6" class="text-center">No tenants found</td>
                </tr>
                <tr v-for="tenant in tenants" :key="tenant.id">
                  <td>{{ tenant.name }}</td>
                  <td>{{ tenant.identifier }}</td>
                  <td>
                    <div>{{ tenant.contactName }}</div>
                    <div class="text-caption">{{ tenant.contactEmail }}</div>
                  </td>
                  <td>
                    <v-chip
                      :color="tenant.isActive ? 'success' : 'error'"
                      size="small"
                    >
                      {{ tenant.isActive ? 'Active' : 'Inactive' }}
                    </v-chip>
                  </td>
                  <td>{{ tenantService.formatDate(tenant.createdAt) }}</td>
                  <td>
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      @click="openEditDialog(tenant)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="confirmDelete(tenant)"
                    />
                    <v-btn
                      :icon="tenant.isActive ? 'mdi-close' : 'mdi-check'"
                      size="small"
                      variant="text"
                      :color="tenant.isActive ? 'error' : 'success'"
                      @click="toggleTenantStatus(tenant)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

    <!-- Tenant Form Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          {{ isEditing ? 'Edit' : 'Create' }} Tenant
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="closeDialog"
            :disabled="loading"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <tenant-form
            :tenant="editedTenant"
            @update:tenant="editedTenant = $event"
            :loading="loading"
            :error="error"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            @click="closeDialog"
            :disabled="loading"
          >
            Close
          </v-btn>
          <v-btn
            color="primary"
            :loading="loading"
            @click="saveTenant"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmation Dialog -->
    <confirmation-dialog
      v-model:show="showDeleteDialog"
      :title="'Delete Tenant'"
      :message="'Are you sure you want to delete this tenant? This action cannot be undone.'"
      @confirm="deleteTenant"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { tenantService } from '@/services/tenantService';
import TableFilters from '@/components/table/TableFilters.vue';
import TenantForm from '@/components/tenants/TenantForm.vue';
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog.vue';

const loading = ref(false);
const error = ref(null);
const tenants = ref([]);
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedTenant = ref(null);
const statusFilter = ref('all');
const sortBy = ref('name');

const editedTenant = ref(createEmptyTenant());
const isEditing = computed(() => !!editedTenant.value.id);

const availableFilters = [{
  key: 'status',
  label: 'Status',
  cols: 3,
  items: [
    { title: 'All', value: 'all' },
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' }
  ],
  default: 'all'
}];

const sortOptions = [
  { title: 'Name', value: 'name_asc' },
  { title: 'Created Date', value: 'createdAt_asc' }
];

function createEmptyTenant() {
  return {
    name: '',
    identifier: '',
    description: '',
    contactName: '',
    contactEmail: '',
    isActive: true
  };
}

// UI-specific methods
function openCreateDialog() {
  editedTenant.value = createEmptyTenant();
  showCreateDialog.value = true;
}

function openEditDialog(tenant) {
  editedTenant.value = { ...tenant };
  showCreateDialog.value = true;
}

function closeDialog() {
  showCreateDialog.value = false;
  editedTenant.value = createEmptyTenant();
}

function confirmDelete(tenant) {
  selectedTenant.value = tenant;
  showDeleteDialog.value = true;
}

// Data operations with error handling
async function fetchTenants() {
  try {
    loading.value = true;
    error.value = null;
    const allTenants = await tenantService.getAll();
    tenants.value = tenantService.applyFilters(allTenants, {
      status: statusFilter.value,
      sort: sortBy.value
    });
  } catch (err) {
    console.error('Error fetching tenants:', err);
    error.value = 'Failed to load tenants';
  } finally {
    loading.value = false;
  }
}

async function saveTenant() {
  try {
    loading.value = true;
    error.value = null;

    if (isEditing.value) {
      await tenantService.update(editedTenant.value.id, editedTenant.value);
    } else {
      await tenantService.create(editedTenant.value);
    }

    await fetchTenants();
    closeDialog();
  } catch (err) {
    console.error('Error saving tenant:', err);
    error.value = 'Failed to save tenant';
  } finally {
    loading.value = false;
  }
}

async function deleteTenant() {
  if (!selectedTenant.value) return;

  try {
    loading.value = true;
    error.value = null;
    await tenantService.delete(selectedTenant.value.id);
    await fetchTenants();
    showDeleteDialog.value = false;
  } catch (err) {
    console.error('Error deleting tenant:', err);
    error.value = 'Failed to delete tenant';
  } finally {
    loading.value = false;
  }
}

async function toggleTenantStatus(tenant) {
  try {
    loading.value = true;
    error.value = null;
    await tenantService.toggleStatus(tenant.id);
    await fetchTenants();
  } catch (err) {
    console.error('Error toggling tenant status:', err);
    error.value = 'Failed to update tenant status';
  } finally {
    loading.value = false;
  }
}

// Event handlers
function handleFilter({ key, value }) {
  if (key === 'status') {
    statusFilter.value = value;
    fetchTenants();
  }
}

function handleSort(value) {
  sortBy.value = value;
  fetchTenants();
}

onMounted(() => {
  fetchTenants();
});
</script>
