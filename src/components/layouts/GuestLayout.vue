<template>
  <v-layout>
    <v-main>
      <v-container fluid class="fill-height pa-0">
        <router-view v-if="!route.meta.requiresAuth" />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useRoute } from 'vue-router';

const theme = useTheme();
const route = useRoute();

const isDarkTheme = computed(() => theme.global.current.value.dark);

const guestPages = ['/login', '/register', '/forgot-password', '/confirm-email', '/reset-password'];
const isLoginRoute = computed(() => guestPages.includes(route.path));
const showThemeToggle = computed(() => false);

onMounted(() => {
  theme.global.name.value = 'dark';
});
</script>

<style>
/* Override global app bar styles for guest layout - needs to be unscoped to override App.vue */
.v-theme--light .v-layout .v-app-bar {
  background-color: rgb(var(--v-theme-primary)) !important;
}

.v-theme--dark .v-layout .v-app-bar {
  background-color: #424242 !important;
}

/* Ensure app bar title is visible in both themes */
.v-layout .v-app-bar .v-app-bar-title {
  color: white !important;
}

/* Make sun icon orange/yellow in light mode */
.v-theme--light .v-layout .v-app-bar .v-switch .v-icon {
  color: #FFA726 !important;
  opacity: 1 !important;
}
</style>
