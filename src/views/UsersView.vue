<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">Users</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus" 
        @click="showCreateDialog = true"
      >
        Create User
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <TableFilters
          search-label="Search Users"
          v-model:search="search"
          :filters="[{
            key: 'status',
            label: 'Status',
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
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="item.isActive ? 'success' : 'error'"
              text-color="white"
              size="small"
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </v-chip>
          </template>
          <template v-slot:item.role="{ item }">
            <v-chip
              :color="getRoleColor(item.role)"
              text-color="white"
              size="small"
            >
              {{ item.role }}
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
              @click="editUser(item)"
              title="Edit user"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              v-if="!item.isActive"
              icon
              variant="text"
              size="small"
              color="success"
              @click="toggleUserStatus(item)"
              title="Activate user"
            >
              <v-icon>mdi-check</v-icon>
            </v-btn>
            <v-btn
              v-else
              icon
              variant="text"
              size="small"
              color="warning"
              @click="toggleUserStatus(item)"
              title="Deactivate user"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
              title="Delete user"
              :disabled="item.isActive"
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
          {{ editedUser.id ? 'Edit User' : 'Create User' }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="closeCreateDialog"
            :disabled="savingUser"
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
            @click="closeCreateDialog"
            :disabled="savingUser"
          >
            Close
          </v-btn>
          <v-btn
            color="primary"
            @click="saveUser"
            :loading="savingUser"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:show="showDeleteDialog"
      title="Delete User"
      confirm-text="Delete"
      confirm-color="error"
      :loading="deletingUser"
      @confirm="deleteUser"
    >
      Are you sure you want to delete the user "{{ userToDelete?.firstName }} {{ userToDelete?.lastName }}"? This action cannot be undone.
    </ConfirmationDialog>

    <!-- Notification -->
    <AppNotification ref="notification" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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

// Data table
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role', width: '120px' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Created', key: 'createdAt', width: '150px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px', align: 'end' }
];

// Get available roles from service
const roles = getAvailableRoles();

// Filters and sorting
const search = ref('');
const statusFilter = ref('All');
const sortBy = ref('name_asc');
const statusOptions = [
  { title: 'All Statuses', value: 'All' },
  { title: 'Active', value: 'Active' },
  { title: 'Inactive', value: 'Inactive' }
];
const sortOptions = [
  { title: 'Name (A-Z)', value: 'name_asc' },
  { title: 'Name (Z-A)', value: 'name_desc' },
  { title: 'Created (Newest)', value: 'created_desc' },
  { title: 'Created (Oldest)', value: 'created_asc' }
];

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
    const allUsers = await userService.getAll();
    users.value = userService.applyFilters(allUsers, {
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
  editedUser.value = { ...user };
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
    
    const index = users.value.findIndex(u => u.id === userToDelete.value.id);
    if (index !== -1) {
      users.value.splice(index, 1);
    }
    
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
    
    let savedUser;
    if (editedUser.value.id) {
      savedUser = await userService.update(editedUser.value.id, editedUser.value);
    } else {
      savedUser = await userService.create(editedUser.value);
    }
    
    const index = users.value.findIndex(u => u.id === savedUser.id);
    if (index !== -1) {
      users.value[index] = savedUser;
    } else {
      users.value.push(savedUser);
    }
    
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
    const updatedUser = await userService.toggleStatus(user.id);
    const index = users.value.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users.value[index] = updatedUser;
    }
    showMessage(`User ${updatedUser.name} ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`);
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
</script>