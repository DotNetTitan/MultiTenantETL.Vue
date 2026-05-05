<template>
  <v-form @submit.prevent="handleSubmit">
    <v-row>
      <v-col cols="12">
        <FormInput
          v-model="form.name"
          :label="$t('forms.tenantName')"
          prepend-icon="mdi-domain"
          :error-messages="errors.name"
          @update:model-value="updateField('name', $event)"
        />
      </v-col>
      <v-col cols="12">
        <FormInput
          v-model="form.slug"
          :label="$t('forms.slug')"
          prepend-icon="mdi-identifier"
          :error-messages="errors.slug"
          :hint="$t('forms.slugHint')"
          persistent-hint
          @update:model-value="updateField('slug', $event)"
        />
      </v-col>
      <v-col cols="12">
        <FormInput
          v-model="form.description"
          :label="$t('common.description')"
          type="textarea"
          rows="2"
          prepend-icon="mdi-text"
          @update:model-value="updateField('description', $event)"
        />
      </v-col>
      <v-col v-if="form.id" cols="12">
        <v-select
          v-model="form.status"
          :items="statusOptions"
          :label="$t('common.status')"
          prepend-icon="mdi-check-circle"
          variant="outlined"
          hide-details
          @update:model-value="updateField('status', $event)"
        />
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FormInput from '@/components/form/FormInput.vue';
import { useFormValidation, required } from '@/composables/useFormValidation';

const { t } = useI18n();

const props = defineProps({
  tenant: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:tenant', 'submit']);
const { errors, validateField, validateForm, clearErrors } = useFormValidation();

const statusOptions = [
  { title: t('common.active'), value: 1 },
  { title: t('common.inactive'), value: 2 }
];

const form = ref({ ...props.tenant });

// Clear errors when form changes
watch(() => form.value, () => {
  clearErrors();
}, { deep: true });

// Watch for prop changes
watch(() => props.tenant, (newValue) => {
  form.value = { ...newValue };
}, { deep: true });

const updateField = (field, value) => {
  form.value[field] = value;
  
  switch (field) {
    case 'name':
      validateField(field, value, [required]);
      break;
    case 'slug':
      validateField(field, value, [required, slugRule]);
      break;
  }
  
  emit('update:tenant', { ...form.value });
};

// Custom validation rules
const slugRule = (value) => {
  if (!value) return null;
  return /^[a-z0-9-]+$/.test(value) || 'Slug can only contain lowercase letters, numbers, and hyphens';
};

const handleSubmit = async () => {
  const validationConfig = {
    name: { value: form.value.name, rules: [required] },
    slug: { value: form.value.slug, rules: [required, slugRule] }
  };

  const isValid = validateForm(validationConfig);

  if (isValid) {
    emit('submit', { ...form.value });
  }
};
</script>