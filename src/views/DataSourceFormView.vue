<template>
  <div class="data-source-form-view">
    <!-- Header -->
    <div class="page-header mb-4">
      <v-btn
        icon
        variant="text"
        class="mr-2"
        @click="handleCancel"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h1 class="text-h4">{{ isEdit ? t('dataSources.editDataSource') : t('dataSources.createNewDataSource') }}</h1>
        <p class="text-caption text-grey">{{ isEdit ? t('dataSources.updateDataSourceConfiguration') : t('dataSources.configureNewDataSource') }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4">{{ t('dataSources.loadingDataSource') }}</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
      <v-btn variant="text" @click="loadDataSource">{{ t('common.retry') }}</v-btn>
    </v-alert>

    <!-- Wizard -->
    <DataSourceWizard
      v-else
      :data-source="dataSource"
      :data-sources="[]"
      @save="handleSave"
      @close="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import DataSourceWizard from '@/components/datasource/DataSourceWizard.vue';
import { fetchDataSourceById, saveDataSource } from '@/services/dataSourceService';

const { t } = useI18n();

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const error = ref(null);
const dataSource = ref({
  id: null,
  name: '',
  description: '',
  type: '',
  provider: '',
  direction: 'source',
  config: {},
  schema: { fields: [] }
});

const isEdit = computed(() => !!route.params.id);

onMounted(() => {
  if (isEdit.value) {
    loadDataSource();
  }
});

async function loadDataSource() {
  try {
    loading.value = true;
    error.value = null;
    const data = await fetchDataSourceById(route.params.id);
    // Ensure schema property exists
    dataSource.value = {
      ...data,
      schema: data.schema || { fields: [] }
    };
  } catch (err) {
    error.value = `Failed to load data source: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

async function handleSave(savedDataSource) {
  try {
    await saveDataSource(savedDataSource);
    router.push('/data-sources');
  } catch (err) {
    error.value = `Failed to save data source: ${err.message}`;
  }
}

function handleCancel() {
  router.push('/data-sources');
}
</script>

<style scoped>
.data-source-form-view {
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
