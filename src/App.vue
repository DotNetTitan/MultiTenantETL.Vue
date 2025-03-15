<template>
  <v-app>
    <v-layout>
      <!-- Improved app bar with better icon and title alignment -->
      <v-app-bar :color="appBarColor" density="compact" elevation="1">
        <div class="d-flex align-center">
          <v-app-bar-nav-icon @click="drawer = !drawer" />
          <v-app-bar-title class="text-truncate font-weight-medium">
            ETL Portal
          </v-app-bar-title>
        </div>
        
        <v-spacer />
        
        <div class="d-flex align-center">
          <tenant-selector v-if="isAuthenticated" class="mr-2" />
          
          <v-switch
            v-model="isDarkMode"
            hide-details
            inset
            density="compact"
            color="purple"
            class="mt-1 mr-3"
            true-icon="mdi-weather-night"
            false-icon="mdi-weather-sunny"
            @update:model-value="toggleTheme"
          />
          
          <v-btn 
            v-if="isAuthenticated" 
            icon 
            class="mr-1" 
            @click="logout"
          >
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </div>
      </v-app-bar>

      <v-navigation-drawer
        v-model="drawer"
        permanent
        :theme="theme.global.name.value"
        class="sidebar-drawer"
      >
        <!-- Top content -->
        <v-list>
          <!-- User profile section -->
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar color="primary">
                <span class="text-h6 text-white">{{ userInitials }}</span>
              </v-avatar>
            </template>
            <v-list-item-title>{{ userName }}</v-list-item-title>
            <v-list-item-subtitle>{{ userRole }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider class="my-2"></v-divider>

        <!-- Navigation Items -->
        <v-list density="compact" nav>
          <!-- Main Navigation -->
          <v-list-item to="/" prepend-icon="mdi-view-dashboard" title="Dashboard" rounded="lg" />
          
          <!-- DATA section -->
          <v-list-subheader>DATA</v-list-subheader>
          
          <v-list-item to="/pipelines" prepend-icon="mdi-pipe" title="Pipelines" rounded="lg" />
          <v-list-item to="/data-sources" prepend-icon="mdi-database" title="Data Sources" rounded="lg" />
          <v-list-item to="/executions" prepend-icon="mdi-history" title="Executions" rounded="lg" />
          <v-list-item to="/transformations" prepend-icon="mdi-transfer" title="Transformations" rounded="lg" />
          
          <!-- ADMIN section -->
          <template v-if="isAdmin">
            <v-list-subheader>ADMINISTRATION</v-list-subheader>
            
            <v-list-item to="/tenants" prepend-icon="mdi-office-building" title="Tenants" rounded="lg" />
            <v-list-item to="/users" prepend-icon="mdi-account-group" title="Users" rounded="lg" />
            <v-list-item to="/settings" prepend-icon="mdi-cog" title="Settings" rounded="lg" />
          </template>
          
          <!-- TOOLS section -->
          <v-list-subheader>TOOLS</v-list-subheader>
          
          <v-list-item to="/reports" prepend-icon="mdi-chart-bar" title="Reports" rounded="lg" />
          <v-list-item to="/logs" prepend-icon="mdi-text-box-search" title="Logs" rounded="lg" />
          <v-list-item to="/scheduler" prepend-icon="mdi-calendar-clock" title="Scheduler" rounded="lg" />
        </v-list>
        
        <template v-slot:append>
          <v-divider></v-divider>
          <div class="pa-2">
            <v-btn 
              variant="tonal" 
              color="primary" 
              block 
              prepend-icon="mdi-plus" 
              to="/pipelines/create"
            >
              New Pipeline
            </v-btn>
          </div>
          <div class="px-2 py-1 text-center text-caption text-disabled">
            v1.2.0 • © 2025 Cascade ETL
          </div>
        </template>
      </v-navigation-drawer>

      <v-main>
        <v-container fluid>
          <router-view />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import TenantSelector from '@/components/TenantSelector.vue';

const theme = useTheme();
const drawer = ref(true);
const authStore = useAuthStore();

const isDarkTheme = computed(() => theme.global.current.value.dark);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.isAdmin);
const isDarkMode = computed({
  get: () => isDarkTheme.value,
  set: () => {} // Toggle is handled by toggleTheme function
});

// Compute app bar color based on theme
const appBarColor = computed(() => 
  isDarkTheme.value ? 'grey-darken-3' : 'primary'
);

// User data computed properties
const userName = computed(() => authStore.user?.name || 'User');
const userRole = computed(() => authStore.isAdmin ? 'Administrator' : 'User');
const userInitials = computed(() => {
  const name = userName.value;
  if (!name) return 'U';
  
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
});

function toggleTheme() {
  theme.global.name.value = isDarkTheme.value ? 'light' : 'dark';
}

function logout() {
  authStore.logout();
}
</script>

<style>
.v-container {
  padding: 16px;
}

/* Navigation drawer styling */
.sidebar-drawer .v-list-item--active {
  position: relative;
  font-weight: 600;
}

.sidebar-drawer .v-list-item--active::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  background-color: rgb(var(--v-theme-primary));
  border-radius: 0 3px 3px 0;
}

.sidebar-drawer .v-list-item {
  margin: 4px 8px;
  min-height: 40px;
}

/* Theme consistency variables */
:root {
  --app-card-hover-transform: translateY(-5px);
  --app-transition-speed: 0.3s;
}

/* Card hover effect used across the app */
.app-card-hover {
  transition: all var(--app-transition-speed) ease-in-out;
}

.app-card-hover:hover {
  transform: var(--app-card-hover-transform);
}

/* Consistent log containers across the app */
.app-log-container {
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  font-size: 13px;
  background-color: var(--v-theme-surface-variant);
  border-radius: 8px;
  padding: 12px;
  max-height: 450px;
  overflow-y: auto;
}

.app-log-text {
  color: var(--v-theme-on-surface);
}

/* Status chip consistency */
.app-status-chip {
  font-weight: 500;
}

/* Theme-aware scrollbars */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-on-surface-variant), 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: rgba(var(--v-theme-on-surface-variant), 0.1);
}

/* Card and container consistency */
.theme-card {
  background-color: var(--v-theme-surface) !important;
  border: 1px solid var(--v-theme-outline-variant) !important;
}

/* Theme transition */
.v-application {
  transition: background-color var(--app-transition-speed) ease;
}
</style>
