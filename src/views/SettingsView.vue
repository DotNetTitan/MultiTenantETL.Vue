<template>
  <div>
    <h1 class="text-h4 mb-6">{{ $t('settings.title') }}</h1>

    <v-tabs v-model="activeTab" class="mb-6" :show-arrows="$vuetify.display.xs">
      <v-tab value="profile">
        <v-icon v-if="$vuetify.display.xs" start>mdi-account</v-icon>
        <span :class="{ 'd-none d-sm-inline': $vuetify.display.xs }">{{ $t('settings.userProfile') }}</span>
      </v-tab>
      <v-tab value="preferences">
        <v-icon v-if="$vuetify.display.xs" start>mdi-cog</v-icon>
        <span :class="{ 'd-none d-sm-inline': $vuetify.display.xs }">{{ $t('settings.preferences') }}</span>
      </v-tab>
      <v-tab value="apiKeys">
        <v-icon v-if="$vuetify.display.xs" start>mdi-key</v-icon>
        <span :class="{ 'd-none d-sm-inline': $vuetify.display.xs }">{{ $t('settings.apiKeys') }}</span>
      </v-tab>
      <v-tab value="notifications">
        <v-icon v-if="$vuetify.display.xs" start>mdi-bell</v-icon>
        <span :class="{ 'd-none d-sm-inline': $vuetify.display.xs }">{{ $t('settings.notifications') }}</span>
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- User Profile Tab -->
      <v-window-item value="profile">
        <v-card>
          <v-card-title>{{ $t('settings.userProfile') }}</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="saveProfile">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.firstName"
                    :label="$t('users.firstName')"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.lastName"
                    :label="$t('users.lastName')"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.email"
                    :label="$t('users.email')"
                    type="email"
                    required
                    :rules="[v => !!v || t('validation.required', { field: t('users.email') }), v => /.+@.+\..+/.test(v) || t('validation.email')]"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.phone"
                    :label="$t('settings.phone')"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="profile.jobTitle"
                    :label="$t('settings.jobTitle')"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="profile.bio"
                    :label="$t('settings.bio')"
                    rows="3"
                  />
                </v-col>
              </v-row>
              <v-divider class="my-4" />
              <h3 class="text-h6 mb-4">{{ $t('settings.changePassword') }}</h3>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="passwordChange.current"
                    :label="$t('settings.currentPassword')"
                    type="password"
                    autocomplete="current-password"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="passwordChange.new"
                    :label="$t('settings.newPassword')"
                    type="password"
                    autocomplete="new-password"
                    :rules="[
                      v => !v || v.length >= 8 || t('validation.minLength', { field: t('settings.newPassword'), length: 8 }),
                      v => !v || /[A-Z]/.test(v) || t('validation.passwordRequirements'),
                      v => !v || /[0-9]/.test(v) || t('validation.passwordRequirements')
                    ]"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="passwordChange.confirm"
                    :label="$t('settings.confirmNewPassword')"
                    type="password"
                    autocomplete="new-password"
                    :rules="[v => v === passwordChange.new || t('validation.passwordMatch')]"
                  />
                </v-col>
              </v-row>
              <v-btn 
                color="primary" 
                type="submit" 
                class="mt-4"
                :loading="savingProfile"
              >
                {{ $t('settings.saveChanges') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Preferences Tab -->
      <v-window-item value="preferences">
        <v-card>
          <v-card-title>{{ $t('settings.preferences') }}</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="savePreferences">
              <h3 class="text-h6 mb-4">{{ $t('settings.theme') }}</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="preferences.darkMode"
                    :label="$t('settings.darkMode')"
                    color="primary"
                    hide-details
                    @change="updateTheme"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="preferences.highContrast"
                    :label="$t('settings.highContrast')"
                    color="primary"
                    hide-details
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />
              
              <h3 class="text-h6 mb-4">{{ $t('dashboard.title') }}</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="preferences.defaultDashboardView"
                    :label="$t('settings.defaultDashboardView')"
                    :items="dashboardViewOptions"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="preferences.dashboardRefreshInterval"
                    :label="$t('settings.dashboardRefreshInterval')"
                    :items="refreshIntervalOptions"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />
              
              <h3 class="text-h6 mb-4">{{ $t('common.data') }}</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="preferences.defaultItemsPerPage"
                    :label="$t('settings.defaultItemsPerPage')"
                    :items="itemsPerPageOptions"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="preferences.dateFormat"
                    :label="$t('settings.dateFormat')"
                    :items="dateFormatOptions"
                  />
                </v-col>
              </v-row>

              <v-btn 
                color="primary" 
                type="submit" 
                class="mt-4"
                :loading="savingPreferences"
              >
                {{ $t('settings.savePreferences') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- API Keys Tab -->
      <v-window-item value="apiKeys">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span>{{ $t('settings.apiKeys') }}</span>
            <v-spacer />
            <v-btn 
              color="primary" 
              prepend-icon="mdi-plus" 
              :loading="creatingApiKey"
              @click="createApiKey"
            >
              {{ $t('settings.createApiKey') }}
            </v-btn>
          </v-card-title>
          <v-card-text>
            <p class="mb-4">
              {{ $t('settings.apiKeyDescription') }}
            </p>
            
            <v-alert
              v-if="newApiKey"
              type="info"
              variant="outlined"
              class="mb-4"
            >
              <p><strong>{{ $t('settings.apiKeyCreated') }}</strong></p>
              <p>{{ $t('settings.apiKeyWarning') }}</p>
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
              <template #item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>
              <template #item.lastUsed="{ item }">
                {{ item.lastUsed ? formatDate(item.lastUsed) : $t('common.none') }}
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  :title="$t('settings.revokeKey')"
                  @click="revokeApiKey(item)"
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
          <v-card-title>{{ $t('settings.notificationSettings') }}</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="saveNotificationSettings">
              <h3 class="text-h6 mb-4">{{ $t('settings.emailNotifications') }}</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="notificationSettings.emailEnabled"
                    :label="$t('settings.enableEmailNotifications')"
                    color="primary"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="notificationSettings.emailAddress"
                    :label="$t('settings.notificationEmail')"
                    type="email"
                    :disabled="!notificationSettings.emailEnabled"
                    :rules="[v => !notificationSettings.emailEnabled || !!v || t('validation.required', { field: t('users.email') })]"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />
              
              <h3 class="text-h6 mb-4">{{ $t('settings.webhookNotifications') }}</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="notificationSettings.webhookEnabled"
                    :label="$t('settings.enableWebhookNotifications')"
                    color="primary"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="notificationSettings.webhookUrl"
                    :label="$t('settings.webhookUrl')"
                    :disabled="!notificationSettings.webhookEnabled"
                    :rules="[v => !notificationSettings.webhookEnabled || !!v || t('validation.required', { field: t('settings.webhookUrl') })]"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />
              
              <h3 class="text-h6 mb-4">{{ $t('settings.notificationEvents') }}</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.pipelineSuccess"
                    :label="$t('settings.pipelineSuccess')"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.pipelineFailure"
                    :label="$t('settings.pipelineFailure')"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.dataSourceDown"
                    :label="$t('settings.dataSourceDown')"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.quotaExceeded"
                    :label="$t('settings.quotaExceeded')"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="notificationSettings.events.systemUpdates"
                    :label="$t('settings.systemUpdates')"
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
                {{ $t('settings.saveNotificationSettings') }}
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
          {{ $t('settings.revokeApiKey') }}
        </v-card-title>
        <v-card-text>
          {{ $t('settings.revokeApiKeyConfirm') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showRevokeDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="revokingApiKey"
            @click="confirmRevokeApiKey"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

const { t } = useI18n();
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
  darkMode: true,
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
const apiKeyHeaders = computed(() => [
  { title: t('common.name'), key: 'name' },
  { title: t('common.created'), key: 'createdAt' },
  { title: t('settings.lastUsed'), key: 'lastUsed' },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'end' }
]);

// Computed options for dropdowns
const dashboardViewOptions = computed(() => [
  { title: t('dashboard.totalPipelines'), value: 'pipeline-stats' },
  { title: t('dashboard.recentExecutions'), value: 'recent-executions' },
  { title: t('dataSources.title'), value: 'data-source-health' }
]);

const refreshIntervalOptions = computed(() => [
  { title: t('common.none'), value: 0 },
  { title: '30 ' + t('common.seconds'), value: 30 },
  { title: '1 ' + t('common.minute'), value: 60 },
  { title: '5 ' + t('common.minutes'), value: 300 },
  { title: '15 ' + t('common.minutes'), value: 900 }
]);

const itemsPerPageOptions = computed(() => [
  { title: '10 ' + t('common.items'), value: 10 },
  { title: '25 ' + t('common.items'), value: 25 },
  { title: '50 ' + t('common.items'), value: 50 },
  { title: '100 ' + t('common.items'), value: 100 }
]);

const dateFormatOptions = [
  { title: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { title: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { title: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
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
