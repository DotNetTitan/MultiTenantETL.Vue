<template>
  <v-form @submit.prevent="handleSubmit">
    <v-row>
      <v-col cols="12" md="6">
        <FormInput
          :model-value="form.firstName"
          label="First Name"
          prepend-icon="mdi-account-outline"
          @update:model-value="updateField('firstName', $event)"
          :error-messages="errors.firstName"
        />
      </v-col>
      <v-col cols="12" md="6">
        <FormInput
          :model-value="form.lastName"
          label="Last Name"
          prepend-icon="mdi-account-outline"
          @update:model-value="updateField('lastName', $event)"
          :error-messages="errors.lastName"
        />
      </v-col>
      <v-col cols="12">
        <FormInput
          :model-value="form.email"
          label="Email"
          type="email"
          prepend-icon="mdi-email-outline"
          @update:model-value="updateField('email', $event)"
          :error-messages="errors.email"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          :model-value="form.role"
          label="Role"
          :items="roles"
          prepend-icon="mdi-shield-account-outline"
          @update:model-value="updateField('role', $event)"
          :error-messages="errors.role"
        />
      </v-col>
      <v-col cols="12">
        <v-switch
          :model-value="form.isActive"
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
import { ref, onMounted } from 'vue';
import FormInput from '@/components/form/FormInput.vue';
import { useFormValidation, required } from '@/composables/useFormValidation';

const props = defineProps({
  user: {
    type: Object,
    default: () => ({
      id: null,
      firstName: '',
      lastName: '',
      email: '',
      role: 'User',
      isActive: true
    })
  },
  roles: {
    type: Array,
    default: () => ['Admin', 'Manager', 'User']
  }
});

const emit = defineEmits(['update:user', 'submit']);
const { errors, validateField, validateForm } = useFormValidation();
const form = ref({ ...props.user });

// Custom validation rules
const emailRule = (value) => {
  return /.+@.+\..+/.test(value) || 'Email must be valid';
};

onMounted(() => {
  form.value = { ...props.user };
});

const updateField = (field, value) => {
  form.value[field] = value;
  
  // Validate the field if it has validation rules
  if (field === 'firstName' || field === 'lastName') {
    validateField(field, value, [required]);
  } else if (field === 'email') {
    validateField(field, value, [required, emailRule]);
  } else if (field === 'role') {
    validateField(field, value, [required]);
  }
  
  emit('update:user', { ...form.value });
};

const handleSubmit = () => {
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