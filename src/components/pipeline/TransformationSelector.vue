<template>
  <v-dialog v-model="show" max-width="800px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Select Transformation</span>
        <v-spacer />
        <v-btn icon variant="text" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Search and Filter -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              label="Search transformations"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="typeFilter"
              label="Type"
              :items="typeOptions"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <p class="mt-4">Loading transformations...</p>
        </div>

        <!-- Transformation List -->
        <v-list v-else-if="filteredTransformations.length > 0" lines="two">
          <v-list-item
            v-for="transformation in filteredTransformations"
            :key="transformation.id"
            :value="transformation.id"
            @click="selectTransformation(transformation)"
            class="transformation-item"
          >
            <template v-slot:prepend>
              <v-avatar :color="getTypeColor(transformation.type)">
                <v-icon color="white">{{ getTypeIcon(transformation.type) }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title>{{ transformation.name }}</v-list-item-title>
            <v-list-item-subtitle>
              <v-chip size="x-small" class="mr-2">{{ transformation.type }}</v-chip>
              {{ transformation.description }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click.stop="selectTransformation(transformation)"
              >
                <v-icon>mdi-plus-circle</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>

        <!-- Empty State -->
        <div v-else class="text-center py-8">
          <v-icon size="64" color="grey">mdi-package-variant</v-icon>
          <p class="mt-4 text-grey">No transformations found</p>
          <p class="text-caption text-grey">
            Go to the Transformations page to create new transformations
          </p>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('close')">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchTransformations } from '@/services/transformationService';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  excludeIds: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'select']);

const show = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (!value) emit('close');
  }
});

const loading = ref(false);
const transformations = ref([]);
const search = ref('');
const typeFilter = ref('All');

const typeOptions = [
  { title: 'All Types', value: 'All' },
  { title: 'Filter', value: 'Filter' },
  { title: 'Map', value: 'Map' },
  { title: 'Aggregation', value: 'Aggregation' },
  { title: 'Script', value: 'Script' },
  { title: 'Join', value: 'Join' }
];

const filteredTransformations = computed(() => {
  let filtered = transformations.value.filter(
    t => !props.excludeIds.includes(t.id)
  );

  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower)
    );
  }

  if (typeFilter.value !== 'All') {
    filtered = filtered.filter(t => t.type === typeFilter.value);
  }

  return filtered;
});

const loadTransformations = async () => {
  try {
    loading.value = true;
    transformations.value = await fetchTransformations();
  } catch (error) {
    console.error('Error loading transformations:', error);
  } finally {
    loading.value = false;
  }
};

const selectTransformation = (transformation) => {
  emit('select', transformation);
  emit('close');
};

const getTypeColor = (type) => {
  const colors = {
    'Filter': 'blue',
    'Map': 'green',
    'Aggregation': 'orange',
    'Script': 'purple',
    'Join': 'teal'
  };
  return colors[type] || 'grey';
};

const getTypeIcon = (type) => {
  const icons = {
    'Filter': 'mdi-filter',
    'Map': 'mdi-map',
    'Aggregation': 'mdi-chart-bar',
    'Script': 'mdi-code-braces',
    'Join': 'mdi-link-variant'
  };
  return icons[type] || 'mdi-cog';
};

onMounted(() => {
  loadTransformations();
});
</script>

<style scoped>
.transformation-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.transformation-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.v-theme--dark .transformation-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}
</style>
