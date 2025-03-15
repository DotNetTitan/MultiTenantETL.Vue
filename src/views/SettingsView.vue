<template>
  <div>
    <h1 class="text-h4 mb-6">Settings</h1>

    <v-tabs v-model="activeTab" class="mb-6">
      <v-tab value="profile">User Profile</v-tab>
      <v-tab value="preferences">Preferences</v-tab>
      <v-tab value="apiKeys">API Keys</v-tab>
      <v-tab value="notifications">Notifications</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- User Profile Tab -->
      <v-window-item value="profile">
        <v-card>
          <v-card-title>User Profile</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="saveProfile">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.firstName"
                    label="First Name"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.lastName"
                    label="Last Name"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.email"
                    label="Email"
                    type="email"
                    required
                    :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.phone"
                    label="Phone Number"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="profile.jobTitle"
                    label="Job Title"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="profile.bio"
                    label="Bio"
                    rows="3"
                  />
                </v-col>
              </v-row>
              <v-divider class="my-4" />
              <h3 class="text-h6 mb-4">Change Password</h3>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="passwordChange.current"
                    label="Current Password"
                    type="password"
                    autocomplete="current-password"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="passwordChange.new"
                    label="New Password"
                    type="password"
                    autocomplete="new-password"
                    :rules="[
                      v => !v || v.length >= 8 || 'Password must be at least 8 characters',
                      v => !v || /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
                      v => !v || /[0-9]/.test(v) || 'Password must contain at least one number'
                    ]"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="passwordChange.confirm"
                    label="Confirm New Password"
                    type="password"
                    autocomplete="new-password"
                    :rules="[v => v === passwordChange.new || 'Passwords do not match']"
                  />
                </v-col>
              </v-row>
              <v-btn 
                color="primary" 
                type="submit" 
                class="mt-4"
                :loading="savingProfile"
              >
                Save Changes
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Preferences Tab -->
      <v-window-item value="preferences">
        <v-card>
          <v-card-title>Preferences</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="savePreferences">
              <h3 class="text-h6 mb-4">Theme</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="preferences.darkMode"
                    label="Dark Mode"
                    color="primary"
                    hide-details
                    @change="updateTheme"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="preferences.highContrast"
                    label="High Contrast"
                    color="primary"
                    hide-details
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />
              
              <h3 class="text-h6 mb-4">Dashboard</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="preferences.defaultDashboardView"
                    label="Default Dashboard View"
                    :items="[
                      { title: 'Pipeline Stats', value: 'pipeline-stats' },
                      { title: 'Recent Executions', value: 'recent-executions' },
                      { title: 'Data Source Health', value: 'data-source-health' }
                    ]"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="preferences.dashboardRefreshInterval"
                    label="Dashboard Refresh Interval"
                    :items="[
                      { title: 'Never', value: 0 },
                      { title: '30 seconds', value: 30 },
                      { title: '1 minute', value: 60 },
                      { title: '5 minutes', value: 300 },
                      { title: '15 minutes', value: 900 }
                    ]"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />
              
              <h3 class="text-h6 mb-4">Data View</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="preferences.defaultItemsPerPage"
                    label="Default Items Per Page"
                    :items="[
                      { title: '10 items', value: 10 },
                      { title: '25 items', value: 25 },
                      { title: '50 items', value: 50 },
                      { title: '100 items', value: 100 }
                    ]"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="preferences.dateFormat"
                    label="Date Format"
                    :items="[
                      { title: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                      { title: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
                      { title: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
                    ]"
                  />
                </v-col>
              </v-row>

              <v-btn 
                color="primary" 
                type="submit" 
                class="mt-4"
                :loading="savingPreferences"
              >
                Save Preferences
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- API Keys Tab -->
      <v-window-item value="apiKeys">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span>API Keys</span>
            <v-spacer />
            <v-btn 
              color="primary" 
              prepend-icon="mdi-plus" 
              @click="createApiKey"
              :loading="creatingApiKey"
            >
              Create API Key
            </v-btn>
          </v-card-title>
          <v-card-text>
            <p class="mb-4">
              API keys allow you to authenticate requests to the ETL Platform API. Keep your API keys secure; anyone with your API key can make API calls on your behalf.
            </p>
            
            <v-alert
              v-if="newApiKey"
              type="info"
              variant="outlined"
              class="mb-4"
            >
              <p><strong>Your new API key has been created.</strong></p>
              <p>This is the only time the API key will be displayed. Please copy it now:</p>
              <v-text-field
                v-model="newApiKey"
                readonly
                class="mt-2"
                append-inner-icon="mdi-content-copy"
                @click:append-inner="copyToClipboard(newApiKey)"
              />
            </v-alert>
            
            <v-data-table
              :headers="apiKeyHeaders"
              :items="apiKeys"
              :loading="loadingApiKeys"
            >
              <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>
              <template v-slot:item.lastUsed="{ item }">
                {{ item.lastUsed ? formatDate(item.lastUsed) : 'Never' }}
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  @click="revokeApiKey(item)"
                  title="Revoke key"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Notifications Tab -->
      <v-window-item value="notifications">
        <v-card>
          <v-card-title>Notification Settings</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="saveNotificationSettings">
              <h3 class="text-h6 mb-4">Email Notifications</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="notificationSettings.emailEnabled"
                    label="Enable Email Notifications"
                    color="primary"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="notificationSettings.emailAddress"
                    label="Notification Email"
                    type="email"
                    :disabled="!notificationSettings.emailEnabled"
                    :rules="[v => !notificationSettings.emailEnabled || !!v || 'Email is required']"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />
              
              <h3 class="text-h6 mb-4">Webhook Notifications</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="notificationSettings.webhookEnabled"
                    label="Enable Webhook Notifications"
                    color="primary"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="notificationSettings.webhookUrl"
                    label="Webhook URL"
                    :disabled="!notificationSettings.webhookEnabled"
                    :rules="[v => !notificationSettings.webhookEnabled || !!v || 'Webhook URL is required']"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />
              
              <h3 class="text-h6 mb-4">Notification Events</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.pipelineSuccess"
                    label="Pipeline Execution Success"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.pipelineFailure"
                    label="Pipeline Execution Failure"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.dataSourceDown"
                    label="Data Source Connection Issues"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.quotaExceeded"
                    label="Quota Exceeded"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.systemUpdates"
                    label="System Updates"
                    hide-details
                  />
                </v-col>
              </v-row>

              <v-btn 
                color="primary" 
                type="submit" 
                class="mt-4"
                :loading="savingNotifications"
              >
                Save Notification Settings
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Revoke API Key Confirmation Dialog -->
    <v-dialog
      v-model="showRevokeDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="text-h5">
          Revoke API Key
        </v-card-title>
        <v-card-text>
          Are you sure you want to revoke this API key? Any applications using this key will no longer be able to access the API.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showRevokeDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="confirmRevokeApiKey"
            :loading="revokingApiKey"
          >
            Revoke
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const theme = useTheme();

// Tabs
const activeTab = ref('profile');

// Profile
const profile = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  bio: ''
});
const savingProfile = ref(false);
const passwordChange = ref({
  current: '',
  new: '',
  confirm: ''
});

// Preferences
const preferences = ref({
  darkMode: false,
  highContrast: false,
  defaultDashboardView: 'pipeline-stats',
  dashboardRefreshInterval: 60,
  defaultItemsPerPage: 25,
  dateFormat: 'MM/DD/YYYY'
});
const savingPreferences = ref(false);

// API Keys
const apiKeys = ref([]);
const loadingApiKeys = ref(false);
const creatingApiKey = ref(false);
const revokingApiKey = ref(false);
const showRevokeDialog = ref(false);
const apiKeyToRevoke = ref(null);
const newApiKey = ref(null);
const apiKeyHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Last Used', key: 'lastUsed' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

// Notifications
const notificationSettings = ref({
  emailEnabled: false,
  emailAddress: '',
  webhookEnabled: false,
  webhookUrl: '',
  events: {
    pipelineSuccess: false,
    pipelineFailure: true,
    dataSourceDown: true,
    quotaExceeded: true,
    systemUpdates: false
  }
});
const savingNotifications = ref(false);

// Helpers
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
}

function updateTheme() {
  theme.global.name.value = preferences.value.darkMode ? 'dark' : 'light';
}

// Load user data
async function loadUserData() {
  try {
    // In a real app, these would be actual API calls
    // const profileResponse = await axios.get('/api/user/profile');
    // const preferencesResponse = await axios.get('/api/user/preferences');
    // const notificationsResponse = await axios.get('/api/user/notifications');
    
    // profile.value = profileResponse.data;
    // preferences.value = preferencesResponse.data;
    // notificationSettings.value = notificationsResponse.data;
    
    // For now, using simulated data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock profile data
    profile.value = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      jobTitle: 'Data Engineer',
      bio: 'Experienced data engineer with a focus on ETL processes and data integration.'
    };
    
    // Mock preferences data
    preferences.value = {
      darkMode: theme.global.current.value.dark,
      highContrast: false,
      defaultDashboardView: 'pipeline-stats',
      dashboardRefreshInterval: 60,
      defaultItemsPerPage: 25,
      dateFormat: 'MM/DD/YYYY'
    };
    
    // Mock notification settings
    notificationSettings.value = {
      emailEnabled: true,
      emailAddress: 'john.doe@example.com',
      webhookEnabled: false,
      webhookUrl: '',
      events: {
        pipelineSuccess: false,
        pipelineFailure: true,
        dataSourceDown: true,
        quotaExceeded: true,
        systemUpdates: false
      }
    };
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Load API keys
async function loadApiKeys() {
  try {
    loadingApiKeys.value = true;
    
    // In a real app, this would be an actual API call
    // const response = await axios.get('/api/user/api-keys');
    
    // For now, using simulated data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock API keys
    apiKeys.value = [
      {
        id: '1',
        name: 'Development Key',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Production Key',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  } catch (error) {
    console.error('Error loading API keys:', error);
  } finally {
    loadingApiKeys.value = false;
  }
}

// Save profile
async function saveProfile() {
  try {
    savingProfile.value = true;
    
    // In a real app, this would be an actual API call
    // await axios.put('/api/user/profile', profile.value);
    
    // If password is being changed
    if (passwordChange.value.current && passwordChange.value.new) {
      // await axios.put('/api/user/change-password', {
      //   currentPassword: passwordChange.value.current,
      //   newPassword: passwordChange.value.new
      // });
      
      // Clear password fields
      passwordChange.value = {
        current: '',
        new: '',
        confirm: ''
      };
    }
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, we would update the auth store with the new user info
    // authStore.updateUser({ firstName: profile.value.firstName, lastName: profile.value.lastName });
  } catch (error) {
    console.error('Error saving profile:', error);
  } finally {
    savingProfile.value = false;
  }
}

// Save preferences
async function savePreferences() {
  try {
    savingPreferences.value = true;
    
    // In a real app, this would be an actual API call
    // await axios.put('/api/user/preferences', preferences.value);
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update theme
    updateTheme();
  } catch (error) {
    console.error('Error saving preferences:', error);
  } finally {
    savingPreferences.value = false;
  }
}

// Save notification settings
async function saveNotificationSettings() {
  try {
    savingNotifications.value = true;
    
    // In a real app, this would be an actual API call
    // await axios.put('/api/user/notifications', notificationSettings.value);
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  } finally {
    savingNotifications.value = false;
  }
}

// Create API key
async function createApiKey() {
  try {
    creatingApiKey.value = true;
    
    // In a real app, this would be an actual API call
    // const response = await axios.post('/api/user/api-keys', {
    //   name: `API Key ${apiKeys.value.length + 1}`
    // });
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newKeyName = `API Key ${apiKeys.value.length + 1}`;
    
    // Generate a mock API key
    newApiKey.value = `etl_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to the list
    apiKeys.value.push({
      id: Math.random().toString(36).substr(2, 9),
      name: newKeyName,
      createdAt: new Date().toISOString(),
      lastUsed: null
    });
  } catch (error) {
    console.error('Error creating API key:', error);
  } finally {
    creatingApiKey.value = false;
  }
}

// Revoke API key
function revokeApiKey(apiKey) {
  apiKeyToRevoke.value = apiKey;
  showRevokeDialog.value = true;
}

// Confirm revoke API key
async function confirmRevokeApiKey() {
  try {
    revokingApiKey.value = true;
    
    // In a real app, this would be an actual API call
    // await axios.delete(`/api/user/api-keys/${apiKeyToRevoke.value.id}`);
    
    // For now, using simulated response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove from the list
    const index = apiKeys.value.findIndex(k => k.id === apiKeyToRevoke.value.id);
    if (index !== -1) {
      apiKeys.value.splice(index, 1);
    }
    
    showRevokeDialog.value = false;
    apiKeyToRevoke.value = null;
  } catch (error) {
    console.error('Error revoking API key:', error);
  } finally {
    revokingApiKey.value = false;
  }
}

onMounted(async () => {
  await loadUserData();
  await loadApiKeys();
});
</script>
