<template>
  <v-app>
    <authenticated-layout v-if="isAuthenticated" />
    <guest-layout v-else />

    <!-- Global Notifications -->
    <div class="notifications-container">
      <TransitionGroup name="notification">
        <v-alert
          v-for="notification in notifications"
          :key="notification.id"
          :type="notification.type"
          variant="tonal"
          closable
          class="notification-alert ma-2"
          @click:close="removeNotification(notification.id)"
        >
          {{ notification.message }}
        </v-alert>
      </TransitionGroup>
    </div>
  </v-app>
</template>

<script setup>
import { computed, ref, onBeforeUnmount, provide } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout.vue';
import GuestLayout from '@/components/layouts/GuestLayout.vue';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const notifications = ref([]);
const notificationTimeout = ref(null);

const showNotification = (message, type = 'info', timeout = 5000) => {
  const id = Date.now();
  notifications.value.push({
    id,
    message,
    type
  });

  if (timeout > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, timeout);
  }
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  showNotification(
    'An unexpected error occurred. Please try again.',
    'error'
  );
};

// Handle unhandled promise rejections
window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showNotification(
    'An unexpected error occurred. Please try again.',
    'error'
  );
};

// Clean up on component unmount
onBeforeUnmount(() => {
  if (notificationTimeout.value) {
    clearTimeout(notificationTimeout.value);
  }
});

// Provide the notification functions to child components
provide('showNotification', showNotification);
provide('removeNotification', removeNotification);
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
  --app-code-bg-light: #F5F5F5;
  --app-code-bg-dark: #212121;
  --app-code-text-light: #1A1A1A;
  --app-code-text-dark: #e0e0e0;
  --app-divider-light: rgba(0, 0, 0, 0.12);
  --app-divider-dark: rgba(255, 255, 255, 0.12);
}

/* Light mode improvements */
.v-theme--light {
  --v-border-color: #E0E0E0;
}

.v-theme--light .v-card {
  border: 1px solid #E0E0E0;
}

.v-theme--light .v-select,
.v-theme--light .v-text-field,
.v-theme--light .v-textarea {
  --v-field-border-opacity: 0.38;
}

.v-theme--light .v-field--variant-outlined .v-field__outline {
  --v-field-border-opacity: 0.38;
}

.v-theme--light .v-alert {
  border: 1px solid currentColor;
  border-opacity: 0.2;
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
  border: 1px solid #E0E0E0;
}

.v-theme--light .app-log-text {
  color: var(--app-code-text-light);
}

/* Light mode card improvements */
.v-theme--light .v-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08) !important;
}

.v-theme--light .v-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08) !important;
}

.v-theme--light .v-card-title {
  color: #1A1A1A;
  font-weight: 600;
}

.v-theme--light .v-card-text {
  color: #424242;
}

.v-theme--light .bg-surface-variant {
  background-color: #F5F5F5 !important;
}

/* Light mode stepper improvements */
.v-theme--light .v-stepper {
  background-color: #FFFFFF;
  border: 1px solid #E0E0E0;
}

.v-theme--light .v-stepper-header {
  box-shadow: none;
  border-bottom: 1px solid #E0E0E0;
}

.v-theme--light .v-stepper-item {
  opacity: 0.6;
}

.v-theme--light .v-stepper-item--selected,
.v-theme--light .v-stepper-item--complete {
  opacity: 1;
}

.v-theme--light .v-stepper-item__avatar {
  border: 2px solid #BDBDBD;
  background-color: #FAFAFA;
  color: #757575;
}

.v-theme--light .v-stepper-item--selected .v-stepper-item__avatar {
  border-color: var(--v-theme-primary);
  background-color: var(--v-theme-primary);
  color: #FFFFFF;
}

.v-theme--light .v-stepper-item--complete .v-stepper-item__avatar {
  border-color: var(--v-theme-success);
  background-color: var(--v-theme-success);
  color: #FFFFFF;
}

.v-theme--light .v-stepper-item__title {
  color: #424242;
}

.v-theme--light .v-stepper-item--selected .v-stepper-item__title {
  color: var(--v-theme-primary);
  font-weight: 600;
}

.v-theme--light .v-stepper-item__subtitle {
  color: #757575;
}

/* Light mode alert improvements */
.v-theme--light .v-alert--variant-tonal {
  border-width: 1px;
  border-style: solid;
}

.v-theme--light .v-alert--variant-tonal.v-alert--type-error {
  background-color: #FFEBEE !important;
  border-color: #EF5350 !important;
  color: #C62828 !important;
}

.v-theme--light .v-alert--variant-tonal.v-alert--type-warning {
  background-color: #FFF3E0 !important;
  border-color: #FFA726 !important;
  color: #E65100 !important;
}

.v-theme--light .v-alert--variant-tonal.v-alert--type-success {
  background-color: #E8F5E9 !important;
  border-color: #66BB6A !important;
  color: #2E7D32 !important;
}

.v-theme--light .v-alert--variant-tonal.v-alert--type-info {
  background-color: #E3F2FD !important;
  border-color: #42A5F5 !important;
  color: #1565C0 !important;
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

/* Light mode form field improvements */
.v-theme--light .v-field--variant-outlined {
  background-color: #FFFFFF;
}

.v-theme--light .v-field--variant-outlined:hover .v-field__outline {
  --v-field-border-opacity: 0.6;
}

.v-theme--light .v-field--variant-outlined.v-field--focused .v-field__outline {
  --v-field-border-opacity: 1;
}

.v-theme--light .v-field--error .v-field__outline {
  color: #D32F2F !important;
}

/* Light mode expansion panel improvements */
.v-theme--light .v-expansion-panel {
  background-color: #FFFFFF;
  border: 1px solid #E0E0E0;
  margin-bottom: 8px;
}

.v-theme--light .v-expansion-panel-title {
  background-color: #FAFAFA;
}

.v-theme--light .v-expansion-panel-title:hover {
  background-color: #F5F5F5;
}

/* Light mode chip improvements */
.v-theme--light .v-chip {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

/* Light mode divider improvements */
.v-theme--light .v-divider {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}

/* Light mode list improvements */
.v-theme--light .v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.v-theme--light .v-list-item--active {
  background-color: rgba(21, 101, 192, 0.08);
}

.v-theme--light .v-list-item-title {
  color: #424242;
  font-weight: 500;
}

.v-theme--light .v-list-item-subtitle {
  color: #1A1A1A !important;
  opacity: 0.87;
  font-weight: 400;
}

/* Light mode table improvements */
.v-theme--light .v-table {
  background-color: #FFFFFF;
  border: 1px solid #E0E0E0;
}

.v-theme--light .v-table > .v-table__wrapper > table > thead > tr > th {
  background-color: #FAFAFA;
  color: #424242;
  font-weight: 600;
  border-bottom: 2px solid #E0E0E0;
}

.v-theme--light .v-table > .v-table__wrapper > table > tbody > tr:hover {
  background-color: #F5F5F5;
}

.v-theme--light .v-table > .v-table__wrapper > table > tbody > tr > td {
  border-bottom: 1px solid #F0F0F0;
}

/* Light mode button improvements */
.v-theme--light .v-btn--variant-outlined {
  border-color: rgba(0, 0, 0, 0.23);
}

.v-theme--light .v-btn--variant-outlined:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.v-theme--light .v-btn--variant-text:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* Light mode navigation drawer improvements */
.v-theme--light .v-navigation-drawer {
  background-color: #FFFFFF;
  border-right: 1px solid #E0E0E0;
}

.v-theme--light .v-navigation-drawer .v-list {
  background-color: transparent;
}

.v-theme--light .v-navigation-drawer .v-list-item {
  color: #424242;
}

.v-theme--light .v-navigation-drawer .v-list-item-title {
  color: #424242 !important;
}

.v-theme--light .v-navigation-drawer .v-list-item-subtitle {
  color: #757575 !important;
}

.v-theme--light .v-navigation-drawer .v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.v-theme--light .v-navigation-drawer .v-list-item--active {
  background-color: rgba(21, 101, 192, 0.08);
  color: var(--v-theme-primary);
}

.v-theme--light .v-navigation-drawer .v-list-item--active .v-list-item-title {
  color: var(--v-theme-primary) !important;
}

.v-theme--light .v-navigation-drawer .v-list-subheader {
  color: #757575 !important;
  opacity: 1;
}

.v-theme--light .v-navigation-drawer .text-disabled {
  color: #9E9E9E !important;
}

/* Light mode app bar improvements */
.v-theme--light .v-app-bar {
  background-color: #FFFFFF !important;
  border-bottom: 1px solid #E0E0E0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
}

/* Light mode dialog improvements */
.v-theme--light .v-dialog > .v-overlay__content > .v-card {
  box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2),
              0 24px 38px 3px rgba(0, 0, 0, 0.14),
              0 9px 46px 8px rgba(0, 0, 0, 0.12) !important;
}

/* Light mode text utilities */
.v-theme--light .text-grey,
.v-theme--light .text-grey-darken-1 {
  color: #616161 !important;
}

.v-theme--light .text-grey-darken-2 {
  color: #424242 !important;
}

.v-theme--light .text-grey-lighten-1 {
  color: #757575 !important;
}

/* Light mode heading improvements */
.v-theme--light .text-h5,
.v-theme--light .text-h6,
.v-theme--light .text-subtitle-1,
.v-theme--light .text-subtitle-2 {
  color: #1A1A1A !important;
}

/* Light mode table text in summary */
.v-theme--light .v-table tbody td {
  color: #424242 !important;
}

.v-theme--light .v-table thead th {
  color: #1A1A1A !important;
}

/* Light mode icon color improvements */
.v-theme--light .v-icon.text-blue,
.v-theme--light .v-icon[color="blue"] {
  color: #1565C0 !important;
  opacity: 1 !important;
}

.v-theme--light .v-icon.text-green,
.v-theme--light .v-icon[color="green"] {
  color: #2E7D32 !important;
  opacity: 1 !important;
}

.v-theme--light .v-icon.text-red,
.v-theme--light .v-icon[color="red"] {
  color: #C62828 !important;
  opacity: 1 !important;
}

.v-theme--light .v-icon.text-orange,
.v-theme--light .v-icon[color="orange"] {
  color: #E65100 !important;
  opacity: 1 !important;
}

.v-theme--light .v-icon.text-purple,
.v-theme--light .v-icon[color="purple"] {
  color: #6A1B9A !important;
  opacity: 1 !important;
}

.v-theme--light .v-icon.text-cyan,
.v-theme--light .v-icon[color="cyan"] {
  color: #00838F !important;
  opacity: 1 !important;
}

/* Ensure list item prepend icons are fully opaque */
.v-theme--light .v-list-item__prepend .v-icon {
  opacity: 1 !important;
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

.notifications-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  max-width: 400px;
}

.notification-alert {
  margin-bottom: 8px;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
