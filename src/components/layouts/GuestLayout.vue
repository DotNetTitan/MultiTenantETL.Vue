<template>
  <v-layout>
    <v-app-bar 
      :color="appBarColor" 
      density="compact" 
      elevation="1"
    >
      <v-app-bar-title class="text-truncate font-weight-medium">
        ETL Portal
      </v-app-bar-title>
      
      <v-spacer />
      
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
    </v-app-bar>

    <v-main>
      <v-container fluid class="fill-height">
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed } from 'vue';
import { useTheme } from 'vuetify';

const theme = useTheme();

const isDarkTheme = computed(() => theme.global.current.value.dark);
const isDarkMode = computed({
  get: () => isDarkTheme.value,
  set: () => {} // Toggle is handled by toggleTheme function
});

// Compute app bar color based on theme - matching AuthenticatedLayout
const appBarColor = computed(() => 
  isDarkTheme.value ? 'grey-darken-3' : 'primary'
);

function toggleTheme() {
  theme.global.name.value = isDarkTheme.value ? 'light' : 'dark';
}
</script>