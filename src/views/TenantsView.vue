<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">{{ $t('tenants.title') }}</h1>
      <v-spacer />
      <v-btn
        color="primary"
        @click="openCreateDialog"
      >
        <v-icon v-if="$vuetify.display.smAndUp" class="mr-2">mdi-plus</v-icon>
        <span v-if="$vuetify.display.xs">{{ $t('common.add') }}</span>
        <span v-else>{{ $t('tenants.addTenant') }}</span>
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
              <th>{{ $t('common.name') }}</th>
              <th>{{ $t('tenants.identifier') }}</th>
              <th>{{ $t('tenants.contact') }}</th>
              <th>{{ $t('common.status') }}</th>
              <th>{{ $t('common.created') }}</th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-center">
              <td colspan="6">
                <v-progress-circular indeterminate class="ma-4" />
              </td>
            </tr>
            <tr v-else-if="!tenants.length">
              <td colspan="6" class="text-center">{{ $t('tenants.noTenantsFound') }}</td>
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
                  {{ tenant.isActive ? $t('common.active') : $t('common.inactive') }}
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
          {{ isEditing ? $t('tenants.editTenant') : $t('tenants.createTenant') }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            :disabled="loading"
            @click="closeDialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <tenant-form
            :tenant="editedTenant"
            :loading="loading"
            :error="error"
            @update:tenant="editedTenant = $event"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="loading"
            @click="closeDialog"
          >
            {{ $t('common.close') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="loading"
            @click="saveTenant"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmation Dialog -->
    <confirmation-dialog
      v-model:show="showDeleteDialog"
      :title="$t('tenants.deleteTenant')"
      :message="$t('tenants.deleteConfirm')"
      @confirm="deleteTenant"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
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

const availableFilters = computed(() => [{
  key: 'status',
  label: t('common.status'),
  cols: 3,
  items: [
    { title: t('common.all'), value: 'all' },
    { title: t('common.active'), value: 'active' },
    { title: t('common.inactive'), value: 'inactive' }
  ],
  default: 'all'
}]);

const sortOptions = computed(() => [
  { title: t('common.name'), value: 'name_asc' },
  { title: t('common.created'), value: 'createdAt_asc' }
]);

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
