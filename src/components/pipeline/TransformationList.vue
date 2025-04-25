<template>
  <div class="space-y-4">
    <div v-if="modelValue.length === 0" class="text-gray-500 text-center py-4">
      No transformations added yet
    </div>
    
    <TransitionGroup name="list" tag="div" class="space-y-4">
      <div
        v-for="(transformation, index) in modelValue"
        :key="transformation.id"
        class="bg-gray-50 rounded-lg p-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="text-lg font-medium">{{ transformation.name }}</div>
            <div class="px-2 py-1 rounded text-sm" :class="getTypeClass(transformation.type)">
              {{ transformation.type }}
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <button
              type="button"
              class="btn btn-icon"
              :disabled="index === 0"
              @click="moveTransformation(index, 'up')"
              title="Move Up"
            >
              ↑
            </button>
            <button
              type="button"
              class="btn btn-icon"
              :disabled="index === modelValue.length - 1"
              @click="moveTransformation(index, 'down')"
              title="Move Down"
            >
              ↓
            </button>
            <button
              type="button"
              class="btn btn-icon"
              @click="editTransformation(index)"
              title="Edit"
            >
              ✎
            </button>
            <button
              type="button"
              class="btn btn-icon btn-danger"
              @click="removeTransformation(index)"
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>

        <div class="mt-4 text-sm text-gray-600">
          <div class="grid grid-cols-2 gap-4">
            <template v-if="transformation.type === 'Filter'">
              <div>
                <span class="font-medium">Column:</span>
                {{ transformation.config.filterColumn }}
              </div>
              <div>
                <span class="font-medium">Condition:</span>
                {{ transformation.config.operator }} {{ transformation.config.value }}
              </div>
            </template>

            <template v-else-if="transformation.type === 'Map'">
              <div>
                <span class="font-medium">From:</span>
                {{ transformation.config.sourceColumn }}
              </div>
              <div>
                <span class="font-medium">To:</span>
                {{ transformation.config.targetColumn }}
              </div>
            </template>

            <template v-else-if="transformation.type === 'Aggregation'">
              <div>
                <span class="font-medium">Group By:</span>
                {{ transformation.config.groupByColumns.join(', ') }}
              </div>
              <div>
                <span class="font-medium">{{ transformation.config.aggregationType }}:</span>
                {{ transformation.config.aggregationColumn }}
              </div>
            </template>

            <template v-else-if="transformation.type === 'Script'">
              <div class="col-span-2">
                <span class="font-medium">Custom Script</span>
                <pre class="mt-2 bg-gray-100 p-2 rounded">{{ transformation.config.script }}</pre>
              </div>
            </template>
          </div>

          <div class="mt-2">
            <span class="font-medium">Error Handling:</span>
            {{ transformation.errorHandling }}
          </div>
        </div>

        <div v-if="transformation.validationWarnings?.length" class="mt-4">
          <div v-for="warning in transformation.validationWarnings" :key="warning" class="text-yellow-600">
            ⚠️ {{ warning }}
          </div>
        </div>
      </div>
    </TransitionGroup>

    <TransformationDialog
      v-if="showEditDialog"
      :transformation="editingTransformation"
      :input-schema="getInputSchemaForIndex(editingIndex)"
      @save="handleEditSave"
      @close="closeEditDialog"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTransformation } from '@/composables/useTransformation';
import TransformationDialog from './TransformationDialog.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  inputSchema: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'update:schema']);

const { getOutputSchema } = useTransformation();

const showEditDialog = ref(false);
const editingTransformation = ref(null);
const editingIndex = ref(-1);

const typeClasses = {
  Filter: 'bg-blue-100 text-blue-800',
  Map: 'bg-green-100 text-green-800',
  Aggregation: 'bg-purple-100 text-purple-800',
  Script: 'bg-yellow-100 text-yellow-800'
};

const getTypeClass = (type) => typeClasses[type] || 'bg-gray-100 text-gray-800';

const moveTransformation = (index, direction) => {
  const newTransformations = [...props.modelValue];
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  
  [newTransformations[index], newTransformations[newIndex]] = 
    [newTransformations[newIndex], newTransformations[index]];
  
  emit('update:modelValue', newTransformations);
  updateSchemas();
};

const removeTransformation = (index) => {
  const newTransformations = props.modelValue.filter((_, i) => i !== index);
  emit('update:modelValue', newTransformations);
  updateSchemas();
};

const editTransformation = (index) => {
  editingTransformation.value = { ...props.modelValue[index] };
  editingIndex.value = index;
  showEditDialog.value = true;
};

const closeEditDialog = () => {
  showEditDialog.value = false;
  editingTransformation.value = null;
  editingIndex.value = -1;
};

const handleEditSave = (updatedTransformation) => {
  const newTransformations = [...props.modelValue];
  newTransformations[editingIndex.value] = updatedTransformation;
  emit('update:modelValue', newTransformations);
  closeEditDialog();
  updateSchemas();
};

const getInputSchemaForIndex = (index) => {
  let schema = props.inputSchema;
  
  for (let i = 0; i < index; i++) {
    schema = getOutputSchema(props.modelValue[i], schema);
  }
  
  return schema;
};

const updateSchemas = () => {
  let currentSchema = props.inputSchema;
  
  props.modelValue.forEach(transformation => {
    currentSchema = getOutputSchema(transformation, currentSchema);
  });

  emit('update:schema', currentSchema);
};
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style>