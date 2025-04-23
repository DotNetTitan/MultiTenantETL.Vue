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
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Search Users"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchUsers"
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
              @update:model-value="fetchUsers"
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
              @update:model-value="fetchUsers"
            />
          </v-col>
        </v-row>

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
        <v-card-title>
          {{ editedUser.id ? 'Edit User' : 'Create User' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveUser">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUser.firstName"
                  label="First Name"
                  required
                  :rules="[v => !!v || 'First name is required']"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUser.lastName"
                  label="Last Name"
                  required
                  :rules="[v => !!v || 'Last name is required']"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedUser.email"
                  label="Email"
                  type="email"
                  required
                  :rules="[
                    v => !!v || 'Email is required',
                    v => /.+@.+\..+/.test(v) || 'Email must be valid'
                  ]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedUser.role"
                  label="Role"
                  :items="roles"
                  required
                  :rules="[v => !!v || 'Role is required']"
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editedUser.isActive"
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
            @click="saveUser"
            :loading="savingUser"
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
          Delete User
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete the user "{{ userToDelete?.firstName }} {{ userToDelete?.lastName }}"? This action cannot be undone.
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
            @click="deleteUser"
            :loading="deletingUser"
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
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

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

// User data
const users = ref([]);
const roles = ['Admin', 'Manager', 'User'];
const loading = ref(false);
const savingUser = ref(false);
const deletingUser = ref(false);

// Dialog controls
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const userToDelete = ref(null);

// Form data
const form = ref(null);
const editedUser = ref(createEmptyUser());

function createEmptyUser() {
  return {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    role: 'User',
    isActive: true
  };
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

function getRoleColor(role) {
  switch (role) {
    case 'Admin':
      return 'deep-purple';
    case 'Manager':
      return 'indigo';
    default:
      return 'blue';
  }
}

async function fetchUsers() {
  try {
    loading.value = true;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    users.value = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'Admin',
        isActive: true,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        role: 'Manager',
        isActive: true,
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        role: 'User',
        isActive: false,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@example.com',
        role: 'User',
        isActive: true,
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        firstName: 'Mike',
        lastName: 'Brown',
        email: 'mike.brown@example.com',
        role: 'Manager',
        isActive: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    ].map(user => ({
      ...user,
      name: `${user.firstName} ${user.lastName}`
    }));
    
    // Apply filters
    if (search.value) {
      const searchLower = search.value.toLowerCase();
      users.value = users.value.filter(u => 
        u.name.toLowerCase().includes(searchLower) || 
        u.email.toLowerCase().includes(searchLower) ||
        u.role.toLowerCase().includes(searchLower)
      );
    }
    
    if (statusFilter.value !== 'All') {
      const isActive = statusFilter.value === 'Active';
      users.value = users.value.filter(u => u.isActive === isActive);
    }
    
    // Apply sorting
    const [field, direction] = sortBy.value.split('_');
    users.value.sort((a, b) => {
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
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
}

function editUser(user) {
  editedUser.value = {
    ...user,
    firstName: user.firstName,
    lastName: user.lastName
  };
  showCreateDialog.value = true;
}

async function toggleUserStatus(user) {
  try {
    loading.value = true;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state
    user.isActive = !user.isActive;
  } catch (error) {
    console.error('Error toggling user status:', error);
  } finally {
    loading.value = false;
  }
}

function confirmDelete(user) {
  userToDelete.value = user;
  showDeleteDialog.value = true;
}

async function deleteUser() {
  try {
    deletingUser.value = true;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove from local array
    const index = users.value.findIndex(u => u.id === userToDelete.value.id);
    if (index !== -1) {
      users.value.splice(index, 1);
    }
    
    showDeleteDialog.value = false;
    userToDelete.value = null;
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    deletingUser.value = false;
  }
}

async function saveUser() {
  try {
    savingUser.value = true;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // If it's a new user, add an ID and created date
    if (!editedUser.value.id) {
      editedUser.value.id = Math.random().toString(36).substring(2, 15);
      editedUser.value.createdAt = new Date().toISOString();
    }
    
    // Add computed name field
    const userData = {
      ...editedUser.value,
      name: `${editedUser.value.firstName} ${editedUser.value.lastName}`
    };
    
    // Update or add to the local array
    const index = users.value.findIndex(u => u.id === userData.id);
    if (index !== -1) {
      users.value[index] = userData;
    } else {
      users.value.push(userData);
    }
    
    showCreateDialog.value = false;
    editedUser.value = createEmptyUser();
  } catch (error) {
    console.error('Error saving user:', error);
  } finally {
    savingUser.value = false;
  }
}

onMounted(async () => {
  // Only allow access if user is admin
  if (!authStore.isAdmin) {
    router.push('/');
    return;
  }
  
  await fetchUsers();
});
</script>