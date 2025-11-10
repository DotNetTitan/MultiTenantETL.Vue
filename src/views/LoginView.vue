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
            <v-form @submit.prevent="handleLogin" :disabled="authStore.loading">
              <FormInput
                v-model="username"
                label="Username"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                :error-messages="errors.username"
                @update:model-value="validateField('username', $event, [required])"
                class="mb-4"
              />
              <FormInput
                v-model="password"
                label="Password"
                type="password"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                :error-messages="errors.password"
                @update:model-value="validateField('password', $event, [required, minLength(6)])"
                class="mb-2"
              />
              <v-checkbox
                v-model="rememberMe"
                label="Remember me"
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
                title="Connection Error"
                class="mb-4"
              >
                <p>Unable to connect to the API server. Please ensure that:</p>
                <ul class="ml-4 mt-2">
                  <li>The backend server is running</li>
                  <li>The API URL is configured correctly</li>
                  <li>Your network connection is working</li>
                </ul>
                <p class="mt-2 text-caption">
                  Current API URL: {{ apiUrl }}
                </p>
              </v-alert>

              <v-btn
                color="primary"
                size="large"
                block
                @click="handleLogin"
                :loading="authStore.loading"
                :disabled="authStore.loading"
                class="text-none font-weight-bold"
                elevation="2"
              >
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Footer Info -->
        <div class="text-center mt-6">
          <p class="text-caption text-medium-emphasis">
            Secure multi-tenant data pipeline management
          </p>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useFormValidation, required, minLength } from '@/composables/useFormValidation';
import FormInput from '@/components/form/FormInput.vue';
import { API_CONFIG } from '@/config/api';

const authStore = useAuthStore();
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const { errors, validateField, validateForm, clearErrors } = useFormValidation();

// Get the API URL for display in error message
const apiUrl = computed(() => {
  return API_CONFIG.baseURL;
});

async function handleLogin() {
  const isValid = validateForm({
    username: { value: username.value, rules: [required] },
    password: { value: password.value, rules: [required, minLength(6)] }
  });

  if (!isValid) return;

  try {
    await authStore.login({
      username: username.value,
      password: password.value,
      rememberMe: rememberMe.value
    });
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
    rgba(33, 150, 243, 0.03) 0%, 
    rgba(33, 150, 243, 0.08) 100%);
}

.v-theme--dark .login-container {
  background: linear-gradient(135deg, 
    rgba(33, 150, 243, 0.02) 0%, 
    rgba(33, 150, 243, 0.05) 100%);
}

.login-card {
  border-radius: 16px !important;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.v-theme--dark .login-card {
  background: rgba(33, 33, 33, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.v-theme--light .login-card {
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.login-header {
  text-align: center;
  padding: 48px 32px 0;
}
</style>
