<template>
  <v-text-field
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :label="label"
    :type="showPassword ? 'text' : type"
    :error-messages="errorMessages"
    :prepend-icon="prependIcon"
    :append-inner-icon="passwordToggleIcon"
    variant="outlined"
    @click:append-inner="togglePasswordVisibility"
    v-bind="$attrs"
  />
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  errorMessages: {
    type: [String, Array],
    default: ''
  },
  prependIcon: {
    type: String,
    default: ''
  }
});

defineEmits(['update:modelValue']);

const showPassword = ref(false);

const passwordToggleIcon = computed(() => {
  if (props.type !== 'password') return '';
  return showPassword.value ? 'mdi-eye-off' : 'mdi-eye';
});

const togglePasswordVisibility = () => {
  if (props.type === 'password') {
    showPassword.value = !showPassword.value;
  }
};
</script>