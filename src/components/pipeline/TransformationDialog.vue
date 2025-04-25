<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
        <div class="absolute top-0 right-0 pt-4 pr-4">
          <button
            type="button"
            class="bg-white rounded-md text-gray-400 hover:text-gray-500"
            @click="$emit('close')"
          >
            <span class="sr-only">Close</span>
            <span class="h-6 w-6 text-2xl" aria-hidden="true">&times;</span>
          </button>
        </div>

        <div class="sm:flex sm:items-start">
          <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              {{ isEditing ? 'Edit' : 'Add' }} Transformation
            </h3>
            
            <div class="mt-4">
              <TransformationForm
                v-model="form"
                :input-schema="inputSchema"
                :errors="errors"
                @update:valid="isValid = $event"
              />
            </div>
          </div>
        </div>

        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            class="btn btn-primary ml-3"
            :disabled="!isValid || saving"
            @click="handleSave"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button
            type="button"
            class="btn btn-outline"
            @click="$emit('close')"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTransformation } from '@/composables/useTransformation';
import TransformationForm from '@/components/transformation/TransformationForm.vue';

const props = defineProps({
  transformation: {
    type: Object,
    default: null
  },
  inputSchema: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['save', 'close']);

const { validateTransformation } = useTransformation();

const isEditing = computed(() => !!props.transformation);

const form = ref(props.transformation ? { ...props.transformation } : {
  name: '',
  type: 'Filter',
  errorHandling: 'Stop',
  config: {}
});

const errors = ref({});
const isValid = ref(false);
const saving = ref(false);

const handleSave = async () => {
  saving.value = true;
  errors.value = {};

  try {
    const validationResult = await validateTransformation(form.value, props.inputSchema);
    
    if (validationResult.isValid) {
      emit('save', {
        ...form.value,
        id: props.transformation?.id || Date.now().toString()
      });
    } else {
      errors.value = validationResult.errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {});
    }
  } catch (err) {
    errors.value.general = err.message;
  } finally {
    saving.value = false;
  }
};
</script>