<template>
  <v-row>
    <v-col :cols="searchCols">
      <FormInput
        v-model="search"
        :label="searchLabel"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        class="mb-4"
        @update:model-value="$emit('update:search', $event)"
      />
    </v-col>
    <template v-for="(filter, index) in filters" :key="index">
      <v-col :cols="filter.cols">
        <v-select
          v-model="selectedFilters[filter.key]"
          :label="filter.label"
          :items="filter.items"
          density="compact"
          hide-details
          class="mb-4"
          @update:model-value="$emit('filter', { key: filter.key, value: $event })"
        />
      </v-col>
    </template>
    <v-col :cols="sortCols">
      <v-select
        v-model="selectedSort"
        :label="sortLabel"
        :items="sortOptions"
        density="compact"
        hide-details
        class="mb-4"
        @update:model-value="$emit('sort', $event)"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, watch } from 'vue';
import FormInput from '@/components/form/FormInput.vue';

const props = defineProps({
  searchLabel: {
    type: String,
    default: 'Search'
  },
  searchCols: {
    type: [Number, String],
    default: 4
  },
  filters: {
    type: Array,
    default: () => []
  },
  sortLabel: {
    type: String,
    default: 'Sort By'
  },
  sortOptions: {
    type: Array,
    default: () => []
  },
  sortCols: {
    type: [Number, String],
    default: 3
  }
});

const emit = defineEmits(['update:search', 'filter', 'sort']);

const search = ref('');
const selectedFilters = ref({});
const selectedSort = ref('');

// Initialize selected filters
watch(() => props.filters, (newFilters) => {
  if (!newFilters) return;
  
  newFilters.forEach(filter => {
    if (!filter?.key || !(filter.key in selectedFilters.value)) {
      selectedFilters.value[filter.key] = filter.default ?? (filter.items?.[0]?.value ?? null);
    }
  });
}, { immediate: true });

// Initialize sort
watch(() => props.sortOptions, (newOptions) => {
  if (!newOptions?.length) return;
  
  if (!selectedSort.value) {
    selectedSort.value = newOptions[0].value;
  }
}, { immediate: true });
</script>