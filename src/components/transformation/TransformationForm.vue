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

const handleSubmit = () => {
  if (!isFormValid.value) return;
  
  saving.value = true;
  errors.value = {};

  try {
    emit('save', form.value);
  } catch (err) {
    errors.value.submit = err.message;
  } finally {
    saving.value = false;
  }
};
</script>