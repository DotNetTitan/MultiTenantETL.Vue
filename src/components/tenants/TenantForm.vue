<template>
  <v-form @submit.prevent="handleSubmit">
    <v-row>
      <v-col cols="12">
        <FormInput
          :model-value="form.name"
          label="Tenant Name"
          prepend-icon="mdi-domain"
          @update:model-value="updateField('name', $event)"
          :error-messages="errors.name"
        />
      </v-col>
      <v-col cols="12">
        <FormInput
          :model-value="form.identifier"
          label="Identifier"
          prepend-icon="mdi-identifier"
          @update:model-value="updateField('identifier', $event)"
          :error-messages="errors.identifier"
          hint="Used as subdomain and in API requests"
          persistent-hint
        />
      </v-col>
      <v-col cols="12">
        <FormInput
          :model-value="form.description"
          label="Description"
          type="textarea"
          rows="2"
          prepend-icon="mdi-text"
          @update:model-value="updateField('description', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <FormInput
          :model-value="form.contactName"
          label="Contact Name"
          prepend-icon="mdi-account"
          @update:model-value="updateField('contactName', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <FormInput
          :model-value="form.contactEmail"
          label="Contact Email"
          prepend-icon="mdi-email"
          @update:model-value="updateField('contactEmail', $event)"
          :error-messages="errors.contactEmail"
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

onMounted(() => {
  form.value = { ...props.tenant };
});

const updateField = (field, value) => {
  form.value[field] = value;
  
  // Validate the field if it has validation rules
  if (field === 'name') {
    validateField(field, value, [required]);
  } else if (field === 'identifier') {
    validateField(field, value, [required, identifierRule]);
  } else if (field === 'contactEmail') {
    validateField(field, value, [emailRule]);
  }
  
  emit('update:tenant', { ...form.value });
};

const handleSubmit = () => {
  const isValid = validateForm({
    name: { value: form.value.name, rules: [required] },
    identifier: { value: form.value.identifier, rules: [required, identifierRule] },
    contactEmail: { value: form.value.contactEmail, rules: [emailRule] }
  });

  if (isValid) {
    emit('submit', { ...form.value });
  }
};
</script>