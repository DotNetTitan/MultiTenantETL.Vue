<template>
  <v-form @submit.prevent="handleSubmit">
    <v-row>
      <v-col cols="12" md="6">
        <FormInput
          v-model="form.appName"
          label="Application Name"
          prepend-icon="mdi-application"
          @update:model-value="updateField('appName', $event)"
          :error-messages="errors.appName"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="form.defaultTheme"
          :items="themeOptions"
          label="Default Theme"
          prepend-icon="mdi-theme-light-dark"
          variant="outlined"
          @update:model-value="updateField('defaultTheme', $event)"
        />
      </v-col>
      <v-col cols="12">
        <v-switch
          v-model="form.enableNotifications"
          label="Enable Notifications"
          color="primary"
          inset
          density="compact"
          hide-details
          @update:model-value="updateField('enableNotifications', $event)"
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
  settings: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:settings', 'submit']);
const { errors, validateField, validateForm, clearErrors } = useFormValidation();
const form = ref({ ...props.settings });

const themeOptions = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
  { title: 'System', value: 'system' }
];

// Clear errors when form changes
watch(() => form.value, () => {
  clearErrors();
}, { deep: true });

// Watch for prop changes
watch(() => props.settings, (newValue) => {
  form.value = { ...newValue };
}, { deep: true });

const required = v => !!v || 'This field is required';

const updateField = (field, value) => {
  form.value[field] = value;
  emit('update:settings', { ...form.value });
  
  if (field === 'appName') {
    validateField(field, value, [required]);
  }
};

const handleSubmit = async () => {
  const isValid = validateForm({
    appName: { value: form.value.appName, rules: [required] }
  });

  if (isValid) {
    emit('submit', { ...form.value });
  }
};
</script>