<template>
  <div class="login-container">
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <v-card class="login-card" elevation="24">
          <!-- Header Section with Icon -->
          <div class="login-header">
            <v-avatar size="64" class="mb-4" color="primary">
              <v-icon size="40" color="white">mdi-database-sync</v-icon>
            </v-avatar>
            <h1 class="text-h4 font-weight-bold mb-2 text-primary">ETL Portal</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Multi-Tenant ETL Platform</p>
          </div>

          <v-divider class="my-6" />

          <!-- Form Section -->
          <v-card-text class="px-8 pb-8">
            <v-form :disabled="authStore.loading" @submit.prevent="handleLogin">
              <FormInput
                v-model="email"
                label="Email"
                type="email"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                :error="errors.email"
                class="mb-4"
              />
              <FormInput
                v-model="password"
                :label="$t('auth.password')"
                type="password"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                :error="errors.password"
                class="mb-2"
              />
              <v-checkbox
                v-model="rememberMe"
                :label="$t('auth.rememberMe')"
                color="primary"
                hide-details
                class="mb-4"
              />
            
              <!-- Regular error alert -->
              <v-alert
                v-if="authStore.error && !authStore.apiOffline"
                type="error"
                variant="tonal"
                class="mb-4"
                density="compact"
              >
                {{ authStore.error }}
              </v-alert>
            
              <!-- Enhanced error alert for API server offline -->
              <v-alert
                v-if="authStore.apiOffline"
                type="warning"
                variant="tonal"
                icon="mdi-connection"
                :title="$t('auth.connectionError')"
                class="mb-4"
              >
                <p>{{ $t('auth.apiOfflineMessage') }}</p>
                <ul class="ml-4 mt-2">
                  <li>{{ $t('auth.apiOfflineReason1') }}</li>
                  <li>{{ $t('auth.apiOfflineReason2') }}</li>
                  <li>{{ $t('auth.apiOfflineReason3') }}</li>
                </ul>
                <p class="mt-2 text-caption">
                  {{ $t('auth.currentApiUrl') }}: {{ apiUrl }}
                </p>
              </v-alert>

              <v-btn
                color="primary"
                size="large"
                block
                :loading="authStore.loading"
                :disabled="authStore.loading || !email || !password || !!errors.email || !!errors.password"
                class="text-none font-weight-bold"
                elevation="2"
                @click="handleLogin"
              >
                {{ $t('auth.login') }}
              </v-btn>

              <div class="mt-4 text-center">
                <router-link to="/forgot-password" class="text-primary text-decoration-none">
                  Forgot password?
                </router-link>
              </div>
              <div class="text-center mt-2">
                <span class="text-medium-emphasis">Don't have an account?</span>
                <router-link to="/register" class="text-primary text-decoration-none ml-1">
                  Sign up
                </router-link>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Footer Info -->
        <div class="text-center mt-6">
          <p class="text-caption text-medium-emphasis">
            {{ $t('auth.secureMessage') }}
          </p>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useFormValidation, required, minLength } from '@/composables/useFormValidation';
import FormInput from '@/components/form/FormInput.vue';
import { API_CONFIG } from '@/config/api';

const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const { errors, validateField, validateForm, clearErrors } = useFormValidation();

// Reset state on mount
import { onMounted } from 'vue';
onMounted(() => {
  authStore.resetState();
});

// Watch for changes to trigger validation
watch(email, (newValue) => {
  if (newValue) validateField('email', newValue, [required]);
});

watch(password, (newValue) => {
  if (newValue) validateField('password', newValue, [required, minLength(6)]);
});

// Get the API URL for display in error message
const apiUrl = computed(() => {
  return API_CONFIG.baseURL;
});

async function handleLogin() {
  const isValid = validateForm({
    email: { value: email.value, rules: [required] },
    password: { value: password.value, rules: [required, minLength(6)] }
  });

  if (!isValid) return;

  try {
    await authStore.login({
      email: email.value,
      password: password.value
    });
    // Navigation is handled in auth store
  } catch (error) {
    // Error is already handled in the store
    console.warn('Login failed:', error.message);
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-primary), 0.03) 0%, 
    rgba(var(--v-theme-primary), 0.08) 100%);
}

.login-card {
  border-radius: 16px !important;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background: rgba(var(--v-theme-surface), 0.95) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.login-header {
  text-align: center;
  padding: 48px 32px 0;
}
</style>
