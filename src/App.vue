<template>
  <v-app>
    <authenticated-layout v-if="isAuthenticated" />
    <guest-layout v-else />
  </v-app>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout.vue';
import GuestLayout from '@/components/layouts/GuestLayout.vue';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
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
  --app-border-radius: 8px;
  --app-surface-light: #ffffff;
  --app-surface-dark: #1e1e1e;
  --app-code-bg-light: #f5f5f5;
  --app-code-bg-dark: #212121;
  --app-code-text-light: #333333;
  --app-code-text-dark: #e0e0e0;
  --app-divider-light: rgba(0, 0, 0, 0.12);
  --app-divider-dark: rgba(255, 255, 255, 0.12);
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
  border-radius: var(--app-border-radius);
  padding: 12px;
  max-height: 450px;
  overflow-y: auto;
}

.app-log-text {
  color: var(--v-theme-on-surface);
  line-height: 1.5;
}

/* Dark mode specific overrides */
.v-theme--dark .app-log-container {
  background-color: var(--app-code-bg-dark);
}

.v-theme--dark .app-log-text {
  color: var(--app-code-text-dark);
}

.v-theme--light .app-log-container {
  background-color: var(--app-code-bg-light);
}

.v-theme--light .app-log-text {
  color: var(--app-code-text-light);
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
  border-radius: var(--app-border-radius) !important;
}

/* Theme transition */
.v-application {
  transition: background-color var(--app-transition-speed) ease;
}

/* Timeline consistency */
.app-timeline-item {
  margin-bottom: 0 !important;
}

.app-timeline-card {
  border-radius: var(--app-border-radius);
  transition: transform var(--app-transition-speed) ease;
}

.app-timeline-card:hover {
  transform: translateX(4px);
}

/* Banner and header consistency */
.app-banner {
  position: relative;
  overflow: hidden;
  border-radius: var(--app-border-radius) var(--app-border-radius) 0 0;
}

.app-banner::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(0,0,0,0.3), rgba(0,0,0,0));
  pointer-events: none;
}
</style>
