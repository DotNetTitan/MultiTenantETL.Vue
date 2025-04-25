<!-- Move the existing authenticated layout here -->
<template>
  <v-layout>
    <v-app-bar :color="appBarColor" density="compact" elevation="1">
      <div class="d-flex align-center">
        <v-app-bar-nav-icon @click="drawer = !drawer" />
        <v-app-bar-title class="text-truncate font-weight-medium">
          ETL Portal
        </v-app-bar-title>
      </div>
      
      <v-spacer />
      
      <div class="d-flex align-center">
        <tenant-selector class="mr-2" />
        
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
      <!-- User profile section -->
      <v-list>
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
        <v-list-item to="/" prepend-icon="mdi-view-dashboard" title="Dashboard" rounded="lg" />
        
        <v-list-subheader>DATA</v-list-subheader>
        
        <v-list-item to="/pipelines" prepend-icon="mdi-pipe" title="Pipelines" rounded="lg" />
        <v-list-item to="/data-sources" prepend-icon="mdi-database" title="Data Sources" rounded="lg" />
        <v-list-item to="/executions" prepend-icon="mdi-history" title="Executions" rounded="lg" />
        <v-list-item to="/transformations" prepend-icon="mdi-transfer" title="Transformations" rounded="lg" />
        
        <template v-if="isAdmin">
          <v-list-subheader>ADMINISTRATION</v-list-subheader>
          
          <v-list-item to="/tenants" prepend-icon="mdi-office-building" title="Tenants" rounded="lg" />
          <v-list-item to="/users" prepend-icon="mdi-account-group" title="Users" rounded="lg" />
          <v-list-item to="/settings" prepend-icon="mdi-cog" title="Settings" rounded="lg" />
        </template>
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
          v1.2.0 • © 2025 ETL Portal
        </div>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
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