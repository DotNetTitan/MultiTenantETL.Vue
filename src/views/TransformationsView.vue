<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 mr-4">{{ $t('transformations.title') }}</h1>
      <v-spacer />
      <v-btn 
        color="primary" 
        @click="openCreateDialog"
      >
        <v-icon v-if="$vuetify.display.smAndUp" class="mr-2">mdi-plus</v-icon>
        <span v-if="$vuetify.display.xs">{{ $t('common.create') }}</span>
        <span v-else>{{ $t('transformations.createTransformation') }}</span>
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              :label="$t('transformations.searchTransformations')"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchTransformations"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="typeFilter"
              :label="$t('common.type')"
              :items="typeOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchTransformations"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="sortBy"
              :label="$t('filters.sortBy')"
              :items="sortOptions"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="fetchTransformations"
            />
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="transformations"
          :loading="loading"
          :items-per-page="10"
          class="mt-2"
        >
          <template #item.type="{ item }">
            <v-chip
              :color="getTypeColor(item.type)"
              text-color="white"
              size="small"
            >
              {{ item.type }}
            </v-chip>
          </template>
          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex flex-nowrap">
              <v-btn
                icon
                variant="text"
                size="small"
                :title="$t('transformations.viewDetails')"
                @click="viewTransformationDetails(item)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                :title="$t('transformations.editTransformation')"
                @click="editTransformation(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                :title="$t('transformations.cloneTransformation')"
                @click="cloneTransformation(item)"
              >
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                :title="$t('transformations.deleteTransformation')"
                @click="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Transformation Dialog -->
    <v-dialog
      v-model="showCreateDialog"
      max-width="800px"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          {{ editedTransformation.id ? $t('transformations.editTransformation') : $t('transformations.createTransformation') }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="showCreateDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveTransformation">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="editedTransformation.name"
                  :label="$t('transformations.transformationName')"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="editedTransformation.type"
                  :label="$t('common.type')"
                  :items="metadataTransformations"
                  item-title="label"
                  item-value="value"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedTransformation.description"
                  :label="$t('common.description')"
                  rows="2"
                />
              </v-col>
            </v-row>

            <!-- Type-specific configuration -->
            <div v-if="editedTransformation.type === 'Filter'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">{{ $t('transformations.filterConfiguration') }}</h3>
              <v-alert type="info" variant="tonal" class="mb-4">
                {{ $t('transformations.filterConfigDescription') }}
              </v-alert>
              <v-row>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="editedTransformation.config.operator"
                    :label="$t('transformations.operator')"
                    :items="[
                      { title: $t('transformations.equals'), value: 'equals' },
                      { title: $t('transformations.notEquals'), value: 'notEquals' },
                      { title: $t('transformations.greaterThan'), value: 'greaterThan' },
                      { title: $t('transformations.lessThan'), value: 'lessThan' },
                      { title: $t('transformations.greaterOrEqual'), value: 'greaterOrEqual' },
                      { title: $t('transformations.lessOrEqual'), value: 'lessOrEqual' },
                      { title: $t('transformations.contains'), value: 'contains' },
                      { title: $t('transformations.notContains'), value: 'notContains' },
                      { title: $t('transformations.startsWith'), value: 'startsWith' },
                      { title: $t('transformations.endsWith'), value: 'endsWith' },
                      { title: $t('transformations.isEmpty'), value: 'isEmpty' },
                      { title: $t('transformations.isNotEmpty'), value: 'isNotEmpty' }
                    ]"
                    required
                  />
                </v-col>
                <v-col v-if="!['isEmpty', 'isNotEmpty'].includes(editedTransformation.config.operator)" cols="12" md="4">
                  <v-select
                    v-model="editedTransformation.config.valueType"
                    :label="$t('transformations.valueType')"
                    :items="[
                      { title: $t('transformations.string'), value: 'string' },
                      { title: $t('transformations.number'), value: 'number' },
                      { title: $t('transformations.boolean'), value: 'boolean' },
                      { title: $t('transformations.date'), value: 'date' }
                    ]"
                    :hint="$t('transformations.valueTypeHint')"
                    persistent-hint
                    required
                  />
                </v-col>
                <v-col v-if="!['isEmpty', 'isNotEmpty'].includes(editedTransformation.config.operator)" cols="12" md="4">
                  <v-text-field
                    v-if="editedTransformation.config.valueType === 'boolean'"
                    v-model="editedTransformation.config.defaultValue"
                    :label="$t('transformations.filterValue')"
                    hint="Enter: true or false"
                    persistent-hint
                    required
                    :rules="[validateBooleanValue]"
                  />
                  <v-text-field
                    v-else-if="editedTransformation.config.valueType === 'number'"
                    v-model="editedTransformation.config.defaultValue"
                    :label="$t('transformations.filterValue')"
                    type="number"
                    hint="Enter a numeric value"
                    persistent-hint
                    required
                    :rules="[validateNumberValue]"
                  />
                  <v-text-field
                    v-else-if="editedTransformation.config.valueType === 'date'"
                    v-model="editedTransformation.config.defaultValue"
                    :label="$t('transformations.filterValue')"
                    type="date"
                    hint="Select a date"
                    persistent-hint
                    required
                  />
                  <v-text-field
                    v-else
                    v-model="editedTransformation.config.defaultValue"
                    :label="$t('transformations.filterValue')"
                    :hint="$t('transformations.enterTextValue')"
                    persistent-hint
                    required
                  />
                </v-col>
              </v-row>
            </div>

            <div v-if="editedTransformation.type === 'Map'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">{{ $t('transformations.mapConfiguration') }}</h3>
              <v-alert type="info" variant="tonal" class="mb-4">
                {{ $t('transformations.mapConfigDescription') }}
              </v-alert>
              <div class="mb-3">
                <strong>{{ $t('transformations.valueMappings') }}:</strong>
                <span class="text-caption text-grey ml-2">({{ $t('transformations.defineValueMappingsHint') }})</span>
              </div>
              <div v-if="editedTransformation.config.mappings && editedTransformation.config.mappings.length === 0" class="text-center py-4 mb-3">
                <v-icon size="48" color="grey-lighten-1">mdi-map-marker-off</v-icon>
                <p class="text-caption text-grey mt-2">{{ $t('transformations.noValueMappings') }}</p>
              </div>
              <div v-for="(mapping, index) in editedTransformation.config.mappings" :key="index" class="d-flex align-center mb-2">
                <v-text-field
                  v-model="mapping.from"
                  :label="$t('transformations.fromValue')"
                  density="compact"
                  class="mr-2"
                  placeholder="e.g., P, 1, Active"
                />
                <v-icon class="mx-2">mdi-arrow-right</v-icon>
                <v-text-field
                  v-model="mapping.to"
                  :label="$t('transformations.toValue')"
                  density="compact"
                  class="mr-2"
                  placeholder="e.g., Pending, High, Yes"
                />
                <v-btn
                  icon
                  variant="text"
                  color="error"
                  size="small"
                  @click="removeMapping(index)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
              <v-btn
                prepend-icon="mdi-plus"
                variant="text"
                size="small"
                class="mt-2"
                @click="addMapping"
              >
                {{ $t('transformations.addValueMapping') }}
              </v-btn>
            </div>

            <div v-if="editedTransformation.type === 'Script'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">{{ $t('transformations.scriptConfiguration') }}</h3>
              <v-alert type="info" variant="tonal" class="mb-4">
                {{ $t('transformations.scriptConfigDescription') }}
              </v-alert>
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="editedTransformation.config.scriptLanguage"
                    :label="$t('transformations.scriptLanguage')"
                    :items="[
                      { title: 'JavaScript', value: 'javascript' },
                      { title: 'C#', value: 'csharp' }
                    ]"
                    hint="Choose the language for your transformation script"
                    persistent-hint
                    @update:model-value="updateScriptPlaceholder"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="editedTransformation.config.script"
                    :label="`${$t('transformations.transformationScript')} (${editedTransformation.config.scriptLanguage === 'csharp' ? 'C#' : 'JavaScript'})`"
                    rows="12"
                    class="font-family-monospace"
                    :placeholder="getScriptPlaceholder(editedTransformation.config.scriptLanguage)"
                    hint="Script will be applied to each row during pipeline execution"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Trim Transformation -->
            <div v-if="editedTransformation.type === 'Trim'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">{{ $t('transformations.trimConfiguration') }}</h3>
              <v-alert type="info" variant="tonal" class="mb-4">
                {{ $t('transformations.trimConfigDescription') }}
              </v-alert>
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="editedTransformation.config.trimType"
                    :label="$t('transformations.trimType')"
                    :items="trimTypeOptions"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Case Convert Transformation -->
            <div v-if="editedTransformation.type === 'Case Convert'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">{{ $t('transformations.caseConvertConfiguration') }}</h3>
              <v-alert type="info" variant="tonal" class="mb-4">
                {{ $t('transformations.caseConfigDescription') }}
              </v-alert>
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="editedTransformation.config.caseType"
                    :label="$t('transformations.caseType')"
                    :items="caseTypeOptions"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Substring Transformation -->
            <div v-if="editedTransformation.type === 'Substring'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">{{ $t('transformations.substringConfiguration') }}</h3>
              <v-alert type="info" variant="tonal" class="mb-4">
                {{ $t('transformations.substringConfigDescription') }}
              </v-alert>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="editedTransformation.config.start"
                    :label="$t('transformations.startPosition')"
                    type="number"
                    hint="0-based index (0 = first character)"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="editedTransformation.config.length"
                    :label="$t('transformations.length')"
                    type="number"
                    hint="Leave empty to extract to end of string"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Replace Transformation -->
            <div v-if="editedTransformation.type === 'Replace'">
              <v-divider class="my-4" />
              <h3 class="text-subtitle-1 mb-3">{{ $t('transformations.replaceConfiguration') }}</h3>
              <v-alert type="info" variant="tonal" class="mb-4">
                {{ $t('transformations.replaceConfigDescription') }}
              </v-alert>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedTransformation.config.searchValue"
                    :label="$t('transformations.searchFor')"
                    hint="Text or pattern to find"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedTransformation.config.replaceValue"
                    :label="$t('transformations.replaceWith')"
                    hint="Replacement text (empty to remove)"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12">
                  <v-checkbox
                    v-model="editedTransformation.config.useRegex"
                    :label="$t('transformations.useRegex')"
                    hide-details
                  />
                  <v-checkbox
                    v-model="editedTransformation.config.caseSensitive"
                    :label="$t('transformations.caseSensitive')"
                    hide-details
                  />
                  <v-checkbox
                    v-model="editedTransformation.config.replaceAll"
                    :label="$t('transformations.replaceAll')"
                    hide-details
                  />
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showCreateDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingTransformation"
            @click="saveTransformation"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="text-h5">
          {{ $t('transformations.deleteTransformation') }}
        </v-card-title>
        <v-card-text>
          {{ $t('transformations.deleteConfirm', { name: transformationToDelete?.name }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deletingTransformation"
            @click="deleteTransformation"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Transformation Details Dialog -->
    <v-dialog
      v-model="showDetailsDialog"
      max-width="800px"
    >
      <v-card v-if="selectedTransformation">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" :color="getTypeColor(selectedTransformation.type)">
            {{ getTransformationIcon(selectedTransformation.type) }}
          </v-icon>
          {{ selectedTransformation.name }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="showDetailsDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <!-- Basic Info -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <v-row dense>
                <v-col cols="6">
                  <div class="text-caption text-grey">{{ $t('common.type') }}</div>
                  <v-chip :color="getTypeColor(selectedTransformation.type)" size="small" class="mt-1">
                    {{ selectedTransformation.type }}
                  </v-chip>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey">{{ $t('common.created') }}</div>
                  <div class="text-body-2 mt-1">{{ formatDate(selectedTransformation.createdAt) }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="text-caption text-grey">{{ $t('common.description') }}</div>
                  <div class="text-body-2 mt-1">{{ selectedTransformation.description || '-' }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Configuration -->
          <v-card variant="outlined">
            <v-card-subtitle>{{ $t('transformations.configuration') }}</v-card-subtitle>
            <v-card-text>
              <!-- Filter Config -->
              <div v-if="selectedTransformation.type === 'Filter'">
                <v-row dense>
                  <v-col cols="4">
                    <div class="text-caption text-grey">{{ $t('transformations.operator') }}</div>
                    <v-chip size="small" class="mt-1">{{ selectedTransformation.config.operator }}</v-chip>
                  </v-col>
                  <v-col v-if="selectedTransformation.config.valueType" cols="4">
                    <div class="text-caption text-grey">{{ $t('transformations.valueType') }}</div>
                    <v-chip size="small" class="mt-1" color="blue">{{ selectedTransformation.config.valueType }}</v-chip>
                  </v-col>
                  <v-col v-if="selectedTransformation.config.defaultValue" cols="4">
                    <div class="text-caption text-grey">{{ $t('transformations.filterValue') }}</div>
                    <div class="text-body-1 mt-1">{{ selectedTransformation.config.defaultValue }}</div>
                  </v-col>
                  <v-col cols="12">
                    <v-alert type="info" variant="tonal" density="compact">
                      Field will be specified when applying this transformation in a pipeline
                    </v-alert>
                  </v-col>
                </v-row>
              </div>

              <!-- Map Config -->
              <div v-else-if="selectedTransformation.type === 'Map'">
                <div v-if="selectedTransformation.config.mappings && selectedTransformation.config.mappings.length > 0">
                  <div class="text-caption text-grey mb-2">{{ $t('transformations.valueMappings') }}</div>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>{{ $t('transformations.fromValue') }}</th>
                        <th>{{ $t('transformations.toValue') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(mapping, index) in selectedTransformation.config.mappings" :key="index">
                        <td>{{ mapping.from }}</td>
                        <td>{{ mapping.to }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
                <v-alert type="info" variant="tonal" density="compact" class="mt-3">
                  Source field will be specified when applying this transformation in a pipeline
                </v-alert>
              </div>

              <!-- Script Config -->
              <div v-else-if="selectedTransformation.type === 'Script'">
                <v-row dense class="mb-3">
                  <v-col cols="12">
                    <div class="text-caption text-grey">{{ $t('transformations.scriptLanguage') }}</div>
                    <v-chip size="small" class="mt-1" :color="selectedTransformation.config.scriptLanguage === 'csharp' ? 'purple' : 'blue'">
                      <v-icon start size="small">{{ selectedTransformation.config.scriptLanguage === 'csharp' ? 'mdi-language-csharp' : 'mdi-language-javascript' }}</v-icon>
                      {{ selectedTransformation.config.scriptLanguage === 'csharp' ? 'C#' : 'JavaScript' }}
                    </v-chip>
                  </v-col>
                </v-row>
                
                <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-code-braces</v-icon>
                        <span>{{ $t('transformations.viewScript') }}</span>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-card variant="outlined" class="script-display">
                        <v-card-text class="pa-0">
                          <pre class="language-code"><code :class="`language-${selectedTransformation.config.scriptLanguage === 'csharp' ? 'csharp' : 'javascript'}`" v-html="highlightedScript"></code></pre>
                        </v-card-text>
                      </v-card>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </v-card>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="showDetailsDialog = false"
          >
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTenantStore } from '@/stores/tenant';
import { useTranslatedMetadata } from '@/composables/useTranslatedMetadata';
import { transformationService } from '@/services/transformationService';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-csharp';

const { t } = useI18n();

// Destructure methods from service
const { 
  getTypeColor, 
  formatDate,
  createEmpty,
  getAvailableColumns 
} = transformationService;

const tenantStore = useTenantStore();
const { transformationTypes: metadataTransformations } = useTranslatedMetadata();

// Data table
const headers = computed(() => [
  { title: t('common.name'), key: 'name' },
  { title: t('common.type'), key: 'type', width: '120px' },
  { title: t('common.description'), key: 'description' },
  { title: t('common.created'), key: 'createdAt', width: '150px' },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '150px', align: 'end' }
]);

// Get transformation types from metadata service
const transformationTypes = computed(() => 
  metadataTransformations.value.map(t => t.value)
);

// Filters and sorting
const search = ref('');
const typeFilter = ref('All');
const sortBy = ref('name_asc');
const typeOptions = computed(() => [
  { title: t('filters.allTypes'), value: 'All' },
  ...metadataTransformations.value.map(type => ({ 
    title: type.label, 
    value: type.value 
  }))
]);
const sortOptions = computed(() => [
  { title: t('filters.nameAsc'), value: 'name_asc' },
  { title: t('filters.nameDesc'), value: 'name_desc' },
  { title: t('filters.typeAsc'), value: 'type_asc' },
  { title: t('filters.createdDesc'), value: 'created_desc' },
  { title: t('filters.createdAsc'), value: 'created_asc' }
]);

// Transformation configuration options
const trimTypeOptions = computed(() => [
  { title: t('transformations.trimBoth'), value: 'both' },
  { title: t('transformations.trimStart'), value: 'start' },
  { title: t('transformations.trimEnd'), value: 'end' }
]);

const caseTypeOptions = computed(() => [
  { title: t('transformations.caseUppercase'), value: 'uppercase' },
  { title: t('transformations.caseLowercase'), value: 'lowercase' },
  { title: t('transformations.caseTitleCase'), value: 'titlecase' },
  { title: t('transformations.caseCamelCase'), value: 'camelcase' }
]);

// Data
const transformations = ref([]);
const loading = ref(false);
const savingTransformation = ref(false);
const deletingTransformation = ref(false);

// Dialog controls
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const showDetailsDialog = ref(false);
const transformationToDelete = ref(null);
const selectedTransformation = ref(null);
const editedTransformation = ref(createEmpty());

// Computed property for syntax-highlighted script
const highlightedScript = computed(() => {
  if (!selectedTransformation.value?.config?.script) return '';
  
  const language = selectedTransformation.value.config.scriptLanguage === 'csharp' ? 'csharp' : 'javascript';
  return Prism.highlight(
    selectedTransformation.value.config.script,
    Prism.languages[language],
    language
  );
});

async function fetchTransformations() {
  try {
    loading.value = true;
    const allTransformations = await transformationService.getAll();
    transformations.value = transformationService.applyFilters(allTransformations, {
      search: search.value,
      type: typeFilter.value,
      sort: sortBy.value
    });
  } catch (error) {
    console.error('Error fetching transformations:', error);
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  editedTransformation.value = createEmpty();
  showCreateDialog.value = true;
}

function viewTransformationDetails(transformation) {
  selectedTransformation.value = transformation;
  showDetailsDialog.value = true;
}

function editTransformation(transformation) {
  editedTransformation.value = JSON.parse(JSON.stringify(transformation));
  showCreateDialog.value = true;
}

function getTransformationIcon(type) {
  const icons = {
    'Filter': 'mdi-filter',
    'Map': 'mdi-map',
    'Script': 'mdi-code-braces'
  };
  return icons[type] || 'mdi-cog';
}

function getScriptPlaceholder(language) {
  if (language === 'csharp') {
    return `// Write your C# transformation script here
// The 'row' dictionary contains all field values
// Example - Combine fields:
//   row["full_name"] = row["first_name"] + " " + row["last_name"];
//
// Example - Calculate:
//   row["total_value"] = (decimal)row["quantity"] * (decimal)row["price"];
//
// Example - Format:
//   row["phone"] = FormatPhoneNumber(row["phone"].ToString());
//
// Return the modified row
return row;`;
  }
  
  return `// Write your JavaScript transformation script here
// The 'row' object contains all field values
// Example - Combine fields:
//   row.full_name = row.first_name + ' ' + row.last_name;
//
// Example - Calculate:
//   row.total_value = row.quantity * row.price;
//
// Example - Format:
//   row.phone = formatPhoneNumber(row.phone);
//
// Return the modified row
return row;`;
}

function updateScriptPlaceholder() {
  // Clear script when changing language to avoid confusion
  if (!editedTransformation.value.config.script || 
      editedTransformation.value.config.script.trim() === '') {
    // Script is empty, just update placeholder
    return;
  }
}

// Validation functions for filter values
function validateNumberValue(value) {
  if (!value) return 'Value is required';
  if (isNaN(value)) return 'Value must be a valid number';
  return true;
}

function validateBooleanValue(value) {
  if (!value) return 'Value is required';
  const lowerValue = value.toString().toLowerCase();
  if (lowerValue !== 'true' && lowerValue !== 'false') {
    return 'Value must be either "true" or "false"';
  }
  return true;
}

async function cloneTransformation(transformation) {
  try {
    const cloned = await transformationService.clone(transformation);
    transformations.value.push(cloned);
    editTransformation(cloned);
  } catch (error) {
    console.error('Error cloning transformation:', error);
  }
}

function addMapping() {
  if (!editedTransformation.value.config.mappings) {
    editedTransformation.value.config.mappings = [];
  }
  editedTransformation.value.config.mappings.push({ from: '', to: '' });
}

function removeMapping(index) {
  editedTransformation.value.config.mappings.splice(index, 1);
}

function confirmDelete(transformation) {
  transformationToDelete.value = transformation;
  showDeleteDialog.value = true;
}

async function deleteTransformation() {
  try {
    deletingTransformation.value = true;
    await transformationService.delete(transformationToDelete.value.id);
    
    const index = transformations.value.findIndex(t => t.id === transformationToDelete.value.id);
    if (index !== -1) {
      transformations.value.splice(index, 1);
    }
    
    showDeleteDialog.value = false;
    transformationToDelete.value = null;
  } catch (error) {
    console.error('Error deleting transformation:', error);
  } finally {
    deletingTransformation.value = false;
  }
}

async function saveTransformation() {
  try {
    savingTransformation.value = true;
    
    let savedTransformation;
    if (editedTransformation.value.id) {
      savedTransformation = await transformationService.update(
        editedTransformation.value.id, 
        editedTransformation.value
      );
    } else {
      savedTransformation = await transformationService.create(editedTransformation.value);
    }
    
    const index = transformations.value.findIndex(t => t.id === savedTransformation.id);
    if (index !== -1) {
      transformations.value[index] = savedTransformation;
    } else {
      transformations.value.push(savedTransformation);
    }
    
    showCreateDialog.value = false;
    editedTransformation.value = transformationService.createEmpty();
  } catch (error) {
    console.error('Error saving transformation:', error);
  } finally {
    savingTransformation.value = false;
  }
}

// Watch for dialog close to reset form
watch(showCreateDialog, (newValue) => {
  if (!newValue && !savingTransformation.value) {
    // Dialog closed without saving, reset form
    editedTransformation.value = createEmpty();
  }
});

onMounted(() => {
  fetchTransformations();
  
  // Refetch if tenant changes
  tenantStore.$subscribe(() => {
    if (tenantStore.currentTenantId) {
      fetchTransformations();
    }
  });
});
</script>

<style scoped>
.script-display {
  overflow: hidden;
}

.script-display pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  background-color: #2d2d2d !important;
  border-radius: 0;
}

.script-display code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  text-shadow: none;
}

/* Light theme override */
.v-theme--light .script-display pre {
  background-color: #f5f5f5 !important;
}

/* Light theme - base text color */
.v-theme--light .script-display :deep(code) {
  color: #000000 !important;
}

.v-theme--light .script-display :deep(.token.comment),
.v-theme--light .script-display :deep(.token.prolog),
.v-theme--light .script-display :deep(.token.doctype),
.v-theme--light .script-display :deep(.token.cdata) {
  color: #008000 !important;
}

.v-theme--light .script-display :deep(.token.keyword),
.v-theme--light .script-display :deep(.token.control),
.v-theme--light .script-display :deep(.token.directive) {
  color: #0000ff !important;
}

.v-theme--light .script-display :deep(.token.operator),
.v-theme--light .script-display :deep(.token.punctuation) {
  color: #000000 !important;
}

.v-theme--light .script-display :deep(.token.string),
.v-theme--light .script-display :deep(.token.char) {
  color: #a31515 !important;
}

.v-theme--light .script-display :deep(.token.function),
.v-theme--light .script-display :deep(.token.method) {
  color: #795e26 !important;
}

.v-theme--light .script-display :deep(.token.number),
.v-theme--light .script-display :deep(.token.boolean) {
  color: #098658 !important;
}

.v-theme--light .script-display :deep(.token.class-name),
.v-theme--light .script-display :deep(.token.type-class-name) {
  color: #267f99 !important;
}

.v-theme--light .script-display :deep(.token.variable),
.v-theme--light .script-display :deep(.token.parameter) {
  color: #001080 !important;
}

.v-theme--light .script-display :deep(.token.property),
.v-theme--light .script-display :deep(.token.property-access) {
  color: #001080 !important;
}
</style>
