<template>
  <div>
    <div class="d-flex align-center mb-4">
      <!-- Only SuperAdmin can add users to a tenant -->
      <v-btn
        v-if="isSuperAdmin"
        color="primary"
        size="small"
        @click="showAddUserDialog = true"
      >
        <v-icon class="mr-2">mdi-account-plus</v-icon>
        {{ $t('tenants.addUser') }}
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="users"
      :loading="loading"
      :items-per-page="10"
    >
      <template #item.name="{ item }">
        {{ item.firstName }} {{ item.lastName }}
      </template>
      <template #item.role="{ item }">
        <v-chip
          :color="getRoleColor(item.roleCode || item.role)"
          size="small"
        >
          {{ item.roleCode || item.role }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <!-- Only SuperAdmin can edit roles, and SuperAdmin rows cannot be modified -->
        <template v-if="isSuperAdmin && !isSuperAdminRow(item)">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditRole(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmRemove(item)"
          />
        </template>
        <!-- Show a lock icon for SuperAdmin rows to make it clear they are protected -->
        <v-tooltip v-else-if="isSuperAdminRow(item)" location="left">
          <template #activator="{ props: tooltipProps }">
            <v-icon v-bind="tooltipProps" color="grey" size="small">mdi-lock</v-icon>
          </template>
          {{ $t('tenants.superAdminProtected') }}
        </v-tooltip>
      </template>
    </v-data-table>

    <!-- Add User Dialog -->
    <v-dialog v-model="showAddUserDialog" max-width="500">
      <v-card>
        <v-card-title>{{ $t('tenants.addUser') }}</v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="selectedUserId"
            :items="availableUsers"
            :loading="loadingUsers"
            item-title="email"
            item-value="id"
            :label="$t('users.selectUser')"
            class="mb-4"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #title>
                  {{ item.raw.firstName }} {{ item.raw.lastName }}
                </template>
                <template #subtitle>
                  {{ item.raw.email }}
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>

          <v-select
            v-model="selectedRole"
            :items="roles"
            :label="$t('users.role')"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showAddUserDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!selectedUserId"
            @click="addUser"
          >
            {{ $t('common.add') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Role Dialog -->
    <v-dialog v-model="showEditRoleDialog" max-width="400">
      <v-card>
        <v-card-title>{{ $t('tenants.updateRole') }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="editedRole"
            :items="roles"
            :label="$t('users.role')"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showEditRoleDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="updateRole"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmation Dialog -->
    <confirmation-dialog
      v-model:show="showRemoveDialog"
      :title="$t('tenants.removeUser')"
      :message="$t('tenants.removeUserConfirm')"
      @confirm="removeUser"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { tenantService } from '@/services/tenantService'
import { userService } from '@/services/userService'
import { useAuthStore } from '@/stores/auth'
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog.vue'

const { t } = useI18n()
const authStore = useAuthStore()

// Only the global SuperAdmin role can manage tenant membership and roles
const isSuperAdmin = computed(() => authStore.user?.role === 'SuperAdmin')

// Returns true if the given tenant user row belongs to a SuperAdmin (must not be editable)
function isSuperAdminRow(item) {
  const role = item.roleCode || item.role || ''
  return role.toLowerCase() === 'superadmin'
}

const props = defineProps({
  tenantId: {
    type: String,
    required: true
  }
})

const loading = ref(false)
const loadingUsers = ref(false)
const saving = ref(false)
const users = ref([])
const availableUsers = ref([])
const showAddUserDialog = ref(false)
const showEditRoleDialog = ref(false)
const showRemoveDialog = ref(false)
const selectedUserId = ref(null)
const selectedRole = ref('User')
const editedRole = ref('User')
const selectedUser = ref(null)

const roles = ['TenantAdmin', 'User']

const headers = computed(() => {
  const baseHeaders = [
    { title: t('common.name'), key: 'name' },
    { title: t('users.email'), key: 'email' },
    { title: t('users.role'), key: 'role', width: '150px' }
  ]
  
  if (isSuperAdmin.value) {
    baseHeaders.push({ title: t('common.actions'), key: 'actions', sortable: false, width: '100px', align: 'end' })
  }
  
  return baseHeaders
})

function getRoleColor(role) {
  return userService.getRoleColor(role)
}

async function fetchUsers() {
  try {
    loading.value = true
    users.value = await tenantService.getTenantUsers(props.tenantId)
  } catch (error) {
    console.error('Error fetching tenant users:', error)
  } finally {
    loading.value = false
  }
}

async function fetchAvailableUsers() {
  try {
    loadingUsers.value = true
    const allUsers = await userService.getAll()
    // Filter out users already in tenant
    const userIds = users.value.map(u => u.id)
    availableUsers.value = allUsers.filter(u => !userIds.includes(u.id))
  } catch (error) {
    console.error('Error fetching available users:', error)
  } finally {
    loadingUsers.value = false
  }
}

async function addUser() {
  try {
    saving.value = true
    // Note: Backend expects userId, tenantId, roleCode in that order
    await userService.addUserToTenant(selectedUserId.value, props.tenantId, selectedRole.value)
    await fetchUsers()
    await fetchAvailableUsers()
    showAddUserDialog.value = false
    selectedUserId.value = null
    selectedRole.value = 'User'
  } catch (error) {
    console.error('Error adding user to tenant:', error)
  } finally {
    saving.value = false
  }
}

function openEditRole(user) {
  selectedUser.value = user
  editedRole.value = user.roleCode || user.role
  showEditRoleDialog.value = true
}

async function updateRole() {
  try {
    saving.value = true
    // Use userService for consistency with backend API
    await userService.updateUserTenantRole(selectedUser.value.userId || selectedUser.value.id, props.tenantId, editedRole.value)
    await fetchUsers()
    showEditRoleDialog.value = false
  } catch (error) {
    console.error('Error updating user role:', error)
  } finally {
    saving.value = false
  }
}

function confirmRemove(user) {
  selectedUser.value = user
  showRemoveDialog.value = true
}

async function removeUser() {
  try {
    saving.value = true
    // Use userService for consistency with backend API
    await userService.removeUserFromTenant(selectedUser.value.userId || selectedUser.value.id, props.tenantId)
    await fetchUsers()
    showRemoveDialog.value = false
  } catch (error) {
    console.error('Error removing user from tenant:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchUsers()
  fetchAvailableUsers()
})
</script>
