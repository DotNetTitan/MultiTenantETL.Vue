<template>
  <v-form @submit.prevent="handleSubmit">
    <v-row>
      <v-col cols="12" md="6">
        <FormInput
          v-model="form.firstName"
          label="First Name"
          prepend-icon="mdi-account"
          :error-messages="errors.firstName"
          @update:model-value="updateField('firstName', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <FormInput
          v-model="form.lastName"
          label="Last Name"
          prepend-icon="mdi-account"
          :error-messages="errors.lastName"
          @update:model-value="updateField('lastName', $event)"
        />
      </v-col>
      <v-col cols="12">
        <FormInput
          v-model="form.email"
          label="Email"
          type="email"
          prepend-icon="mdi-email"
          :error-messages="errors.email"
          @update:model-value="updateField('email', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="form.role"
          :items="roles"
          label="Role"
          prepend-icon="mdi-shield-account"
          variant="outlined"
          :error-messages="errors.role"
          @update:model-value="updateField('role', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-switch
          v-model="form.isActive"
          label="Active"
          color="success"
          hide-details
          @update:model-value="updateField('isActive', $event)"
        />
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup>
import { ref, watch } from 'vue';
import FormInput from '@/components/form/FormInput.vue';
import { useFormValidation } from '@/composables/useFormValidation';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  roles: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update:user', 'submit']);
const { errors, validateField, validateForm, clearErrors } = useFormValidation();
const form = ref({ ...props.user });

// Clear errors when form changes
watch(() => form.value, () => {
  clearErrors();
}, { deep: true });

// Watch for prop changes
watch(() => props.user, (newValue) => {
  form.value = { ...newValue };
}, { deep: true });

const required = v => !!v || 'This field is required';
const emailRule = v => {
  if (!v) return 'Email is required';
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(v) || 'Please enter a valid email address';
};

const updateField = (field, value) => {
  form.value[field] = value;
  emit('update:user', { ...form.value });
  
  switch (field) {
    case 'firstName':
    case 'lastName':
      validateField(field, value, [required]);
      break;
    case 'email':
      validateField(field, value, [required, emailRule]);
      break;
    case 'role':
      validateField(field, value, [required]);
      break;
  }
};

const handleSubmit = async () => {
  const isValid = validateForm({
    firstName: { value: form.value.firstName, rules: [required] },
    lastName: { value: form.value.lastName, rules: [required] },
    email: { value: form.value.email, rules: [required, emailRule] },
    role: { value: form.value.role, rules: [required] }
  });

  if (isValid) {
    emit('submit', { ...form.value });
  }
};
</script>