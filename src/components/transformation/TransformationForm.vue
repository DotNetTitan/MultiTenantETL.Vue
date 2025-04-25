<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <FormInput
      v-model="form.name"
      label="Name"
      :error="errors.name"
      required
    />

    <div class="grid grid-cols-2 gap-4">
      <FormInput
        v-model="form.type"
        label="Type"
        type="select"
        :options="transformationTypes"
        :error="errors.type"
        required
        @change="handleTypeChange"
      />

      <FormInput
        v-model="form.errorHandling"
        label="Error Handling"
        type="select"
        :options="errorHandlingOptions"
        :error="errors.errorHandling"
        required
      />
    </div>

    <!-- Filter Transformation -->
    <div v-if="form.type === 'Filter'" class="space-y-4">
      <FormInput
        v-model="form.config.filterColumn"
        label="Filter Column"
        type="select"
        :options="availableColumns"
        :error="errors.filterColumn"
        required
      />

      <div class="grid grid-cols-2 gap-4">
        <FormInput
          v-model="form.config.operator"
          label="Operator"
          type="select"
          :options="filterOperators"
          :error="errors.operator"
          required
        />

        <FormInput
          v-if="!['isEmpty', 'isNotEmpty'].includes(form.config.operator)"
          v-model="form.config.value"
          label="Value"
          :error="errors.value"
          required
        />
      </div>
    </div>

    <!-- Map Transformation -->
    <div v-else-if="form.type === 'Map'" class="space-y-4">
      <FormInput
        v-model="form.config.sourceColumn"
        label="Source Column"
        type="select"
        :options="availableColumns"
        :error="errors.sourceColumn"
        required
      />

      <FormInput
        v-model="form.config.targetColumn"
        label="Target Column"
        :error="errors.targetColumn"
        required
      />

      <div class="border rounded p-4 space-y-4">
        <h4 class="font-medium">Value Mappings</h4>
        <div v-for="(mapping, index) in form.config.mappings" :key="index" class="grid grid-cols-3 gap-4">
          <FormInput
            v-model="mapping.from"
            label="From"
            :error="errors[`mapping${index}From`]"
          />
          <FormInput
            v-model="mapping.to"
            label="To"
            :error="errors[`mapping${index}To`]"
          />
          <button
            type="button"
            class="btn btn-danger mt-6"
            @click="removeMappingRow(index)"
          >
            Remove
          </button>
        </div>
        <button
          type="button"
          class="btn btn-secondary"
          @click="addMappingRow"
        >
          Add Mapping
        </button>
      </div>
    </div>

    <!-- Aggregation Transformation -->
    <div v-else-if="form.type === 'Aggregation'" class="space-y-4">
      <FormInput
        v-model="form.config.groupByColumns"
        label="Group By Columns"
        type="multiselect"
        :options="availableColumns"
        :error="errors.groupByColumns"
        required
      />

      <div class="grid grid-cols-2 gap-4">
        <FormInput
          v-model="form.config.aggregationType"
          label="Aggregation Type"
          type="select"
          :options="aggregationTypes"
          :error="errors.aggregationType"
          required
        />

        <FormInput
          v-if="form.config.aggregationType !== 'count'"
          v-model="form.config.aggregationColumn"
          label="Aggregation Column"
          type="select"
          :options="availableColumns"
          :error="errors.aggregationColumn"
          required
        />
      </div>

      <FormInput
        v-model="form.config.resultColumn"
        label="Result Column"
        :error="errors.resultColumn"
        required
      />
    </div>

    <!-- Script Transformation -->
    <div v-else-if="form.type === 'Script'" class="space-y-4">
      <FormInput
        v-model="form.config.script"
        label="JavaScript Transformation"
        type="textarea"
        :error="errors.script"
        required
        class="font-mono"
        placeholder="// Example:
row => ({
  ...row,
  fullName: `${row.firstName} ${row.lastName}`
})"
      />

      <div class="bg-gray-100 p-4 rounded">
        <h4 class="font-medium mb-2">Available Variables:</h4>
        <ul class="list-disc list-inside text-sm">
          <li>row: Current data row</li>
          <li>context: Transformation context</li>
          <li>utils: Helper functions</li>
        </ul>
      </div>
    </div>

    <div class="flex justify-between mt-6">
      <button
        type="button"
        class="btn btn-secondary"
        @click="handleValidateTransformation"
        :disabled="!isFormValid || validating"
      >
        {{ validating ? 'Validating...' : 'Validate' }}
      </button>

      <div class="space-x-2">
        <button
          type="button"
          class="btn btn-outline"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid || saving"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useTransformation } from '@/composables/useTransformation';
import FormInput from '@/components/form/FormInput.vue';
import { useFormValidation, required, maxLength } from '@/composables/useFormValidation';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  inputSchema: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['save', 'cancel', 'notify']);

const { validateTransformation } = useTransformation();
const { errors, validateField, validateForm, clearErrors } = useFormValidation();

const transformationTypes = ['Filter', 'Map', 'Aggregation', 'Script'];
const errorHandlingOptions = ['Stop', 'Skip', 'Retry'];
const filterOperators = ['equals', 'notEquals', 'contains', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty'];
const aggregationTypes = ['sum', 'avg', 'min', 'max', 'count'];

const availableColumns = computed(() => 
  props.inputSchema?.columns?.map(col => col.name) || []
);

const form = ref({
  name: '',
  type: 'Filter',
  errorHandling: 'Stop',
  config: {
    // Filter config
    filterColumn: '',
    operator: '',
    value: '',

    // Map config
    sourceColumn: '',
    targetColumn: '',
    mappings: [],

    // Aggregation config
    groupByColumns: [],
    aggregationType: '',
    aggregationColumn: '',
    resultColumn: '',

    // Script config
    script: ''
  },
  ...props.initialData
});

const transformationRules = {
  name: [required, maxLength(100)],
  type: [required],
  errorHandling: [required],
  config: {
    Filter: {
      filterColumn: [required],
      operator: [required],
      value: (value, { operator }) => operator && !['isEmpty', 'isNotEmpty'].includes(operator) && !value ? 'Value is required for this operator' : null
    },
    Map: {
      sourceColumn: [required],
      targetColumn: [required],
      mappings: (value) => (!Array.isArray(value) || value.length === 0) ? 'At least one mapping is required' : null
    },
    Aggregation: {
      groupByColumns: (value) => (!Array.isArray(value) || value.length === 0) ? 'At least one group by column is required' : null,
      aggregationType: [required],
      resultColumn: [required],
      aggregationColumn: (value, { aggregationType }) => 
        aggregationType && aggregationType !== 'count' && !value ? 'Aggregation column is required for this type' : null
    },
    Script: {
      script: [(value) => {
        if (!value?.trim()) return 'Script is required';
        try {
          new Function('row', value);
          return null;
        } catch (e) {
          return `Script syntax error: ${e.message}`;
        }
      }]
    }
  }
};

const errors = ref({});
const validating = ref(false);
const saving = ref(false);

const isFormValid = computed(() => {
  const baseFields = ['name', 'type', 'errorHandling'];
  
  if (!baseFields.every(field => form.value[field])) return false;

  switch (form.value.type) {
    case 'Filter':
      return form.value.config.filterColumn && form.value.config.operator &&
        (!['isEmpty', 'isNotEmpty'].includes(form.value.config.operator) ? form.value.config.value : true);
    
    case 'Map':
      return form.value.config.sourceColumn && form.value.config.targetColumn;
    
    case 'Aggregation':
      return form.value.config.groupByColumns?.length > 0 &&
        form.value.config.aggregationType &&
        (form.value.config.aggregationType === 'count' || form.value.config.aggregationColumn) &&
        form.value.config.resultColumn;
    
    case 'Script':
      return !!form.value.config.script;
    
    default:
      return false;
  }
});

watch(() => form.value.type, (newType) => {
  form.value.config = getDefaultConfig(newType);
  errors.value = {};
});

const getDefaultConfig = (type) => {
  switch (type) {
    case 'Filter':
      return {
        filterColumn: '',
        operator: '',
        value: ''
      };
    case 'Map':
      return {
        sourceColumn: '',
        targetColumn: '',
        mappings: []
      };
    case 'Aggregation':
      return {
        groupByColumns: [],
        aggregationType: '',
        aggregationColumn: '',
        resultColumn: ''
      };
    case 'Script':
      return {
        script: ''
      };
    default:
      return {};
  }
};

const handleTypeChange = () => {
  form.value.config = getDefaultConfig(form.value.type);
  errors.value = {};
};

const addMappingRow = () => {
  form.value.config.mappings.push({ from: '', to: '' });
};

const removeMappingRow = (index) => {
  form.value.config.mappings.splice(index, 1);
};

const handleValidateTransformation = async () => {
  if (!isFormValid.value) return;
  
  validating.value = true;
  errors.value = {};

  try {
    const result = await validateTransformation(form.value, props.inputSchema);
    if (result.isValid) {
      emit('notify', {
        type: 'success',
        message: 'Transformation validation successful!'
      });
    } else {
      errors.value = result.errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {});
      emit('notify', {
        type: 'error',
        message: 'Validation failed. Please check the errors.'
      });
    }
  } catch (err) {
    errors.value.validation = err.message;
  } finally {
    validating.value = false;
  }
};

const validateTransformationField = async (field, value) => {
  let rules = [];
  
  if (field === 'name' || field === 'type' || field === 'errorHandling') {
    rules = transformationRules[field];
  } else if (field.startsWith('config.')) {
    const [_, configField] = field.split('.');
    rules = transformationRules.config[form.value.type]?.[configField] || [];
  }

  await validateField(field, value, Array.isArray(rules) ? rules : [rules], {
    operator: form.value.config.operator,
    aggregationType: form.value.config.aggregationType
  });
};

const handleFieldUpdate = async (field, value) => {
  if (field === 'type') {
    form.value.config = getDefaultConfig(value);
    clearErrors();
  } else {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      form.value[parent][child] = value;
    } else {
      form.value[field] = value;
    }
    await validateTransformationField(field, value);
  }
};

const handleSubmit = async () => {
  const configRules = transformationRules.config[form.value.type];
  const validationFields = {
    name: { value: form.value.name, rules: transformationRules.name },
    type: { value: form.value.type, rules: transformationRules.type },
    errorHandling: { value: form.value.errorHandling, rules: transformationRules.errorHandling }
  };

  // Add config field validations
  Object.entries(configRules).forEach(([field, rules]) => {
    validationFields[`config.${field}`] = {
      value: form.value.config[field],
      rules,
      options: {
        operator: form.value.config.operator,
        aggregationType: form.value.config.aggregationType
      }
    };
  });

  const isValid = await validateForm(validationFields);

  if (isValid) {
    emit('save', { ...form.value });
  }
};
</script>