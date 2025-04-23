import { ref } from 'vue';

export function useFormValidation() {
  const errors = ref({});

  const validateField = (fieldName, value, rules) => {
    const fieldErrors = [];
    
    rules.forEach(rule => {
      const error = rule(value);
      if (error) fieldErrors.push(error);
    });

    errors.value[fieldName] = fieldErrors;
    return fieldErrors.length === 0;
  };

  const validateForm = (fields) => {
    let isValid = true;
    
    Object.entries(fields).forEach(([fieldName, { value, rules }]) => {
      if (!validateField(fieldName, value, rules)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const clearErrors = () => {
    errors.value = {};
  };

  return {
    errors,
    validateField,
    validateForm,
    clearErrors
  };
}

// Common validation rules
export const required = (value) => {
  return !value && !value?.length ? 'This field is required' : null;
};

export const minLength = (min) => (value) => {
  return value?.length < min ? `Must be at least ${min} characters` : null;
};

export const email = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return value && !emailRegex.test(value) ? 'Invalid email format' : null;
};