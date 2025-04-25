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
import { ref, onMounted, watch } from 'vue';
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
const { errors, validateField, validateForm, clearErrors } = useFormValidation();
const form = ref({ ...props.tenant });

// Custom validation rules
const identifierRule = (value) => {
  if (!value) return null;
  return /^[a-z0-9-]+$/.test(value) || 'Identifier can only contain lowercase letters, numbers, and hyphens';
};

const emailRule = (value) => {
  if (!value) return null; // Email is optional
  return /.+@.+\..+/.test(value) || 'Email must be valid';
};

// Clear errors when form changes
watch(() => form.value, () => {
  clearErrors();
}, { deep: true });

onMounted(() => {
  form.value = { ...props.tenant };
});

const updateField = (field, value) => {
  form.value[field] = value;
  
  switch (field) {
    case 'name':
      validateField(field, value, [required]);
      break;
    case 'identifier':
      validateField(field, value, [required, identifierRule]);
      // Also check for uniqueness through API (mock for now)
      checkIdentifierUniqueness(value);
      break;
    case 'contactEmail':
      validateField(field, value, [emailRule]);
      break;
  }
  
  emit('update:tenant', { ...form.value });
};

// Mock function to check identifier uniqueness
const checkIdentifierUniqueness = async (identifier) => {
  if (!identifier) return;
  
  try {
    // In real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock check - consider existing tenants
    const existingTenant = props.existingTenants?.find(
      t => t.identifier === identifier && t.id !== form.value.id
    );
    
    if (existingTenant) {
      errors.value.identifier = 'This identifier is already in use';
    }
  } catch (err) {
    console.error('Error checking identifier uniqueness:', err);
  }
};

const handleSubmit = async () => {
  const validationConfig = {
    name: { value: form.value.name, rules: [required] },
    identifier: { value: form.value.identifier, rules: [required, identifierRule] }
  };

  if (form.value.contactEmail) {
    validationConfig.contactEmail = { value: form.value.contactEmail, rules: [emailRule] };
  }

  const isValid = validateForm(validationConfig);

  if (isValid) {
    try {
      // Check identifier uniqueness one final time before submit
      await checkIdentifierUniqueness(form.value.identifier);
      
      if (!errors.value.identifier) {
        emit('submit', { ...form.value });
      }
    } catch (err) {
      errors.value.submit = err.message;
    }
  }
};
</script>