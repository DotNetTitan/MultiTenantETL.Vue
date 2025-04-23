<template>
  <v-row class="fill-height" align="center" justify="center">
    <v-col cols="12" sm="8" md="6" lg="4">
      <v-card class="elevation-12">
        <v-card-title class="text-center text-h5 py-4">
          Multi-Tenant ETL Platform
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleLogin" :disabled="authStore.loading">
            <FormInput
              v-model="username"
              label="Username"
              prepend-icon="mdi-account"
              :error-messages="errors.username"
              @update:model-value="validateField('username', $event, [required])"
            />
            <FormInput
              v-model="password"
              label="Password"
              type="password"
              prepend-icon="mdi-lock"
              :error-messages="errors.password"
              @update:model-value="validateField('password', $event, [required, minLength(6)])"
            />
            <v-checkbox
              v-model="rememberMe"
              label="Remember me"
              class="mt-2"
              hide-details
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
            :disabled="authStore.loading"
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
import { useFormValidation, required, minLength } from '@/composables/useFormValidation';
import FormInput from '@/components/form/FormInput.vue';

const authStore = useAuthStore();
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const { errors, validateField, validateForm, clearErrors } = useFormValidation();

async function handleLogin() {
  const isValid = validateForm({
    username: { value: username.value, rules: [required] },
    password: { value: password.value, rules: [required, minLength(6)] }
  });

  if (!isValid) return;

  await authStore.login({
    username: username.value,
    password: password.value,
    rememberMe: rememberMe.value
  });
}
</script>
