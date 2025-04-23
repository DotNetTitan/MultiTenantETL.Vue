<template>
  <v-form @submit.prevent="handleSubmit">
    <v-row>
      <v-col cols="12">
        <FormInput
          v-model="form.name"
          label="Tenant Name"
          prepend-icon="mdi-domain"
          @update:model-value="validateField('name', $event, [required])"
          :error-messages="errors.name"
        />
      </v-col>
      <v-col cols="12">
        <FormInput
          v-model="form.identifier"
          label="Identifier"
          prepend-icon="mdi-identifier"
          @update:model-value="validateField('identifier', $event, [required, identifierRule])"
          :error-messages="errors.identifier"
          hint="Used as subdomain and in API requests"
          persistent-hint
        />
      </v-col>
      <v-col cols="12">
        <FormInput
          v-model="form.description"
          label="Description"
          type="textarea"
          rows="2"
          prepend-icon="mdi-text"
        />
      </v-col>
      <v-col cols="12" md="6">
        <FormInput
          v-model="form.contactName"
          label="Contact Name"
          prepend-icon="mdi-account"
        />
      </v-col>
      <v-col cols="12" md="6">
        <FormInput
          v-model="form.contactEmail"
          label="Contact Email"
          prepend-icon="mdi-email"
          @update:model-value="validateField('contactEmail', $event, [emailRule])"
          :error-messages="errors.contactEmail"
        />
      </v-col>
      <v-col cols="12">
        <v-switch
          v-model="form.isActive"
          label="Active"
          color="success"
          hide-details
        />
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup>
import { ref, watch } from 'vue';
import FormInput from '@/components/form/FormInput.vue';
import { useFormValidation, required } from '@/composables/useFormValidation';

const props = defineProps({
  tenant: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      identifier: '',
      description: '',
      contactName: '',
      contactEmail: '',
      isActive: true
    })
  }
});

const emit = defineEmits(['update:tenant', 'submit']);

const { errors, validateField, validateForm } = useFormValidation();

const form = ref({ ...props.tenant });

// Custom validation rules
const identifierRule = (value) => {
  return /^[a-z0-9-]+$/.test(value) || 'Identifier can only contain lowercase letters, numbers, and hyphens';
};

const emailRule = (value) => {
  if (!value) return true; // Email is optional
  return /.+@.+\..+/.test(value) || 'Email must be valid';
};

// Watch for external changes
watch(() => props.tenant, (newValue) => {
  form.value = { ...newValue };
}, { deep: true });

// Watch for form changes
watch(form, (newValue) => {
  emit('update:tenant', { ...newValue });
}, { deep: true });

const handleSubmit = () => {
  const isValid = validateForm({
    name: { value: form.value.name, rules: [required] },
    identifier: { value: form.value.identifier, rules: [required, identifierRule] },
    contactEmail: { value: form.value.contactEmail, rules: [emailRule] }
  });

  if (isValid) {
    emit('submit', form.value);
  }
};
</script>