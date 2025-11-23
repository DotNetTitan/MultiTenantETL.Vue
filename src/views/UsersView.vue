<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">{{ $t('users.title') }}</h1>
      <v-spacer />
      <!-- Note: Users are created via registration endpoint, not directly -->
    </div>

    <v-card>
      <v-card-text>
        <TableFilters
          v-model:search="search"
          :search-label="$t('users.searchUsers')"
          :filters="[{
            key: 'status',
            label: $t('common.status'),
            items: statusOptions,
            cols: 3
          }]"
          :sort-options="sortOptions"
          @filter="handleFilter"
          @sort="handleSort"
        />

        <v-data-table
          :headers="headers"
          :items="users"
          :loading="loading"
          :items-per-page="10"
          class="mt-2"
        >
          <template #item.status="{ item }">
            <v-chip
              :color="item.isActive ? 'success' : 'error'"
              text-color="white"
              size="small"
            >
              {{ item.isActive ? $t('common.active') : $t('common.inactive') }}
            </v-chip>
          </template>
          <template #item.name="{ item }">
            {{ item.firstName }} {{ item.lastName }}
          </template>
          <template #item.roles="{ item }">
            <v-chip
              v-for="role in item.roles"
              :key="role"
              :color="getRoleColor(role)"
              text-color="white"
              size="small"
              class="mr-1"
            >
              {{ role }}
            </v-chip>
          </template>
          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template #item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              :title="$t('users.editUser')"
              @click="editUser(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              v-if="!item.isActive"
              icon
              variant="text"
              size="small"
              color="success"
              :title="$t('users.activateUser')"
              @click="toggleUserStatus(item)"
            >
              <v-icon>mdi-check</v-icon>
            </v-btn>
            <v-btn
              v-else
              icon
              variant="text"
              size="small"
              color="warning"
              :title="$t('users.deactivateUser')"
              @click="toggleUserStatus(item)"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              :title="$t('users.deleteUser')"
              :disabled="item.isActive"
              @click="confirmDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit User Dialog -->
    <v-dialog
      v-model="showCreateDialog"
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title class="text-h5 pa-4 d-flex align-center">
          {{ editedUser.id ? $t('users.editUser') : $t('users.createUser') }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            :disabled="savingUser"
            @click="closeCreateDialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <UserForm
            v-model:user="editedUser"
            :roles="roles"
            @submit="saveUser"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            :disabled="savingUser"
            @click="closeCreateDialog"
          >
            {{ $t('common.close') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingUser"
            @click="saveUser"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:show="showDeleteDialog"
      :title="$t('users.deleteUser')"
      :confirm-text="$t('common.delete')"
      confirm-color="error"
      :loading="deletingUser"
      @confirm="deleteUser"
    >
      {{ $t('users.deleteConfirm', { name: `${userToDelete?.firstName} ${userToDelete?.lastName}` }) }}
    </ConfirmationDialog>

    <!-- Notification -->
    <AppNotification ref="notification" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { userService } from '@/services/userService';

// Import required components
import TableFilters from '@/components/table/TableFilters.vue';
import UserForm from '@/components/users/UserForm.vue';
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog.vue';
import AppNotification from '@/components/notifications/AppNotification.vue';

// Destructure methods from service
const {
  getRoleColor,
  formatDate,
  getAvailableRoles,
  createEmpty
} = userService;

const router = useRouter();
const authStore = useAuthStore();

// Import i18n
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// Data table
const headers = computed(() => [
  { title: t('common.name'), key: 'name' },
  { title: t('users.email'), key: 'email' },
  { title: t('users.role'), key: 'roles', width: '120px' },
  { title: t('common.status'), key: 'status', width: '120px' },
  { title: t('common.created'), key: 'createdAt', width: '150px' },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '150px', align: 'end' }
]);

// Get available roles from service
const roles = getAvailableRoles();

// Filters and sorting
const search = ref('');
const statusFilter = ref('All');
const sortBy = ref('name_asc');
const statusOptions = computed(() => [
  { title: t('filters.allStatuses'), value: 'All' },
  { title: t('common.active'), value: 'Active' },
  { title: t('common.inactive'), value: 'Inactive' }
]);
const sortOptions = computed(() => [
  { title: t('filters.nameAsc'), value: 'name_asc' },
  { title: t('filters.nameDesc'), value: 'name_desc' },
  { title: t('filters.createdDesc'), value: 'created_desc' },
  { title: t('filters.createdAsc'), value: 'created_asc' }
]);

// Data
const users = ref([]);
const loading = ref(false);
const savingUser = ref(false);
const deletingUser = ref(false);

// Dialog controls
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const userToDelete = ref(null);
const editedUser = ref(createEmpty());
const notification = ref(null);

async function fetchUsers() {
  try {
    loading.value = true;
    users.value = await userService.getAll({
      search: search.value,
      status: statusFilter.value,
      sort: sortBy.value
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    showError('Failed to load users');
  } finally {
    loading.value = false;
  }
}

function editUser(user) {
  // Convert roles array to single role for the form
  const role = Array.isArray(user.roles) && user.roles.length > 0 
    ? user.roles[0] 
    : 'User';
  
  editedUser.value = { 
    ...user,
    role: role
  };
  showCreateDialog.value = true;
}

function closeCreateDialog() {
  showCreateDialog.value = false;
  editedUser.value = createEmpty();
}

function confirmDelete(user) {
  userToDelete.value = user;
  showDeleteDialog.value = true;
}

async function deleteUser() {
  try {
    deletingUser.value = true;
    await userService.delete(userToDelete.value.id);
    await fetchUsers();
    showDeleteDialog.value = false;
    userToDelete.value = null;
    showMessage('User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    showError('Failed to delete user');
  } finally {
    deletingUser.value = false;
  }
}

async function saveUser() {
  try {
    savingUser.value = true;
    
    if (editedUser.value.id) {
      await userService.update(editedUser.value.id, editedUser.value);
    }
    
    await fetchUsers();
    showCreateDialog.value = false;
    editedUser.value = createEmpty();
    showMessage('User saved successfully');
  } catch (error) {
    console.error('Error saving user:', error);
    showError('Failed to save user');
  } finally {
    savingUser.value = false;
  }
}

async function toggleUserStatus(user) {
  try {
    loading.value = true;
    await userService.toggleStatus(user.id);
    await fetchUsers();
    showMessage(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
  } catch (error) {
    console.error('Error toggling user status:', error);
    showError('Failed to update user status');
  } finally {
    loading.value = false;
  }
}

function handleFilter({ key, value }) {
  if (key === 'status') {
    statusFilter.value = value;
    fetchUsers();
  }
}

function handleSort(value) {
  sortBy.value = value;
  fetchUsers();
}

function showMessage(message) {
  notification.value?.showNotification(message, 'success');
}

function showError(message) {
  notification.value?.showNotification(message, 'error', 5000);
}

onMounted(async () => {
  if (!authStore.isAdmin) {
    router.push('/');
    return;
  }
  
  await fetchUsers();
});

// Log current user info for debugging
console.log('Current user:', authStore.user);
console.log('Is admin:', authStore.isAdmin);
</script>