<template>
  <v-text-field
    :model-value="modelValue"
    @update:model-value="handleInput"
    @blur="handleBlur"
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
import { computed, ref, onBeforeUnmount, watch } from 'vue';
import { useFormValidation, createAsyncValidator } from 'path-to-validation-utils';

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Array],
    default: null
  },
  type: {
    type: String,
    default: 'text'
  },
  label: {
    type: String,
    default: ''
  },
  rules: {
    type: Array,
    default: () => []
  },
  error: {
    type: [String, Array],
    default: null
  },
  hint: {
    type: String,
    default: ''
  },
  persistentHint: {
    type: Boolean,
    default: false
  },
  validateOnBlur: {
    type: Boolean,
    default: false
  },
  validateOnChange: {
    type: Boolean,
    default: true
  },
  hideDetails: {
    type: Boolean,
    default: false
  },
  dense: {
    type: Boolean,
    default: false
  },
  debounce: {
    type: Number,
    default: 300
  },
  required: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'validation']);
const localErrors = ref([]);
let debounceTimeout = null;

// Clear debounce timeout on component unmount
onBeforeUnmount(() => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
});

const errors = computed(() => {
  if (Array.isArray(props.error)) {
    return props.error;
  }
  if (props.error) {
    return [props.error];
  }
  return localErrors.value;
});

const hasError = computed(() => errors.value.length > 0);

const validateInput = async (value) => {
  localErrors.value = [];

  for (const rule of props.rules) {
    try {
      const result = await rule(value);
      if (result !== true && result !== null && result !== undefined) {
        localErrors.value.push(result);
      }
    } catch (err) {
      console.error('Validation error:', err);
      localErrors.value.push('Validation failed');
    }
  }

  emit('validation', {
    valid: localErrors.value.length === 0,
    errors: localErrors.value
  });

  return localErrors.value.length === 0;
};

const handleInput = (event) => {
  const value = event?.target?.value ?? event;
  emit('update:modelValue', value);

  if (props.validateOnChange) {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      validateInput(value);
    }, props.debounce);
  }
};

const handleBlur = () => {
  if (props.validateOnBlur) {
    validateInput(props.modelValue);
  }
};

watch(() => props.modelValue, (newValue) => {
  if (props.validateOnChange) {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      validateInput(newValue);
    }, props.debounce);
  }
});

const inputListeners = computed(() => ({
  input: handleInput,
  blur: handleBlur,
  ...$attrs
}));

const showDetails = computed(() => {
  return !props.hideDetails && (hasError.value || (props.hint && (props.persistentHint || !hasError.value)));
});

// Support for select/multiselect options
const normalizedOptions = computed(() => {
  if (!props.options) return [];
  
  if (Array.isArray(props.options)) {
    return props.options.map(opt => 
      typeof opt === 'object' ? opt : { label: String(opt), value: opt }
    );
  }
  
  return Object.entries(props.options).map(([value, label]) => ({
    label: String(label),
    value
  }));
});

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

// For debouncing validation
let validationTimeout = null;

const validateInput = async () => {
  if (!props.rules?.length && !props.asyncValidation) return true;
  
  const rules = [...(props.rules || [])];
  if (props.asyncValidation) {
    rules.push(createAsyncValidator(props.asyncValidation));
  }

  const isValid = await validateField('input', props.modelValue, rules, {
    ...props.validationOptions,
    debounce: props.debounce
  });

  emit(isValid ? 'validation-success' : 'validation-error');
  return isValid;
};

const handleInput = (event) => {
  const value = event?.target?.value ?? event;
  emit('update:modelValue', value);

  if (props.validateOnChange) {
    if (validationTimeout) clearTimeout(validationTimeout);
    validationTimeout = setTimeout(validateInput, props.debounce);
  }
};

const handleBlur = async () => {
  if (props.validateOnBlur) {
    await validateInput();
  }
};

// Clear validation on unmount
onBeforeUnmount(() => {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }
  clearErrors('input');
});

// Handle v-model updates from parent
watch(() => props.modelValue, (newValue) => {
  if (props.validateOnChange && newValue !== undefined) {
    if (validationTimeout) clearTimeout(validationTimeout);
    validationTimeout = setTimeout(validateInput, props.debounce);
  }
});

const errorMessages = computed(() => {
  if (props.error) {
    return Array.isArray(props.error) ? props.error : [props.error];
  }
  return [];
});

const handleInput = (event) => {
  const value = event?.target?.value ?? event;
  emit('update:model-value', value);

  // Clear error on input if validateOnChange is true
  if (props.validateOnChange) {
    emit('update:error', null);
  }
};

const handleBlur = () => {
  if (props.validateOnBlur && props.rules?.length) {
    const fieldErrors = [];
    
    for (const rule of props.rules) {
      const error = rule(props.modelValue);
      if (error) {
        fieldErrors.push(error);
      }
    }
    
    emit('update:error', fieldErrors.length ? fieldErrors : null);
  }
};

// Clear validation state when component is unmounted
onBeforeUnmount(() => {
  emit('update:error', null);
});
</script>