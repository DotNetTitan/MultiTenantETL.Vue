<template>
  <v-row class="fill-height" align="center" justify="center">
    <v-col cols="12" sm="8" md="6" lg="4">
      <v-card class="elevation-12">
        <v-card-title class="text-center text-h5 py-4">
          Multi-Tenant ETL Platform
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleLogin">
            <v-text-field
              v-model="username"
              label="Username"
              prepend-icon="mdi-account"
              variant="outlined"
              :error-messages="usernameError"
            />
            <v-text-field
              v-model="password"
              label="Password"
              prepend-icon="mdi-lock"
              type="password"
              variant="outlined"
              :error-messages="passwordError"
            />
            <v-alert
              v-if="authStore.error"
              type="error"
              class="mt-4"
              density="compact"
            >
              {{ authStore.error }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn
            color="primary"
            block
            @click="handleLogin"
            :loading="authStore.loading"
          >
            Login
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const username = ref('');
const password = ref('');
const usernameError = ref('');
const passwordError = ref('');

function validateForm() {
  let isValid = true;
  
  // Reset errors
  usernameError.value = '';
  passwordError.value = '';
  
  if (!username.value) {
    usernameError.value = 'Username is required';
    isValid = false;
  }
  
  if (!password.value) {
    passwordError.value = 'Password is required';
    isValid = false;
  }
  
  return isValid;
}

async function handleLogin() {
  if (!validateForm()) return;
  
  await authStore.login({
    username: username.value,
    password: password.value
  });
}
</script>
