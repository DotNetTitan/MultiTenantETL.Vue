<template>
  <div class="pipeline-form-view">
    <!-- Header -->
    <div class="page-header mb-4">
      <v-btn
        icon
        variant="text"
        @click="handleCancel"
        class="mr-2"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h1 class="text-h4">{{ isEdit ? 'Edit Pipeline' : 'Create New Pipeline' }}</h1>
        <p class="text-caption text-grey">{{ isEdit ? 'Update pipeline configuration' : 'Configure a new ETL pipeline' }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4">Loading pipeline...</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
      <v-btn variant="text" @click="loadPipeline">Retry</v-btn>
    </v-alert>

    <!-- Wizard -->
    <PipelineWizard
      v-else
      :pipeline="pipeline"
      :data-sources="dataSources"
      @save="handleSave"
      @close="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PipelineWizard from '@/components/pipeline/PipelineWizard.vue';
import { fetchPipelineById, savePipeline } from '@/services/pipelineService';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const error = ref(null);
const dataSources = ref([]);
const pipeline = ref({
  id: null,
  name: '',
  description: '',
  sourceId: null,
  destinationId: null,
  transformations: [],
  fieldMappings: [],
  schedule: {
    enabled: false,
    frequency: 'daily',
    time: '00:00',
    timezone: 'UTC'
  }
});

const isEdit = computed(() => !!route.params.id);

onMounted(async () => {
  await loadDataSources();
  if (isEdit.value) {
    loadPipeline();
  }
});

async function loadDataSources() {
  try {
    const { fetchDataSources } = await import('@/services/dataSourceService');
    dataSources.value = await fetchDataSources();
  } catch (err) {
    console.error('Error loading data sources:', err);
    error.value = `Failed to load data sources: ${err.message}`;
  }
}

async function loadPipeline() {
  try {
    loading.value = true;
    error.value = null;
    const data = await fetchPipelineById(route.params.id);
    pipeline.value = data;
  } catch (err) {
    error.value = `Failed to load pipeline: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

async function handleSave(savedPipeline) {
  try {
    await savePipeline(savedPipeline);
    router.push('/pipelines');
  } catch (err) {
    error.value = `Failed to save pipeline: ${err.message}`;
  }
}

function handleCancel() {
  router.push('/pipelines');
}
</script>

<style scoped>
.pipeline-form-view {
  padding: 24px;
  background: rgb(var(--v-theme-background));
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
</style>
