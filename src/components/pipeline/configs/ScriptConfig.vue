<template>
  <div>
    <v-select
      :model-value="modelValue.scriptLanguage"
      :label="$t('transformation.scriptLanguage')"
      :items="languageOptions"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      @update:model-value="updateConfig('scriptLanguage', $event)"
    />
    
    <v-textarea
      :model-value="modelValue.script"
      :label="$t('transformation.script')"
      variant="outlined"
      rows="10"
      class="code-textarea"
      @update:model-value="updateConfig('script', $event)"
    />

    <!-- Expandable script reference with examples -->
    <v-expansion-panels variant="accordion" class="mt-3 script-reference">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-body-2 font-weight-medium">
          <v-icon start size="small" color="info">mdi-help-circle-outline</v-icon>
          {{ $t('transformation.scriptReference') }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="script-examples">
            <!-- Variables table -->
            <div class="text-caption font-weight-bold text-uppercase mb-2">
              {{ $t('transformation.scriptVarsTitle') }}
            </div>
            <v-table density="compact" class="mb-4 vars-table">
              <thead>
                <tr>
                  <th class="text-left">{{ $t('transformation.scriptVarName') }}</th>
                  <th class="text-left">{{ $t('transformation.scriptVarType') }}</th>
                  <th class="text-left">{{ $t('transformation.scriptVarDesc') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>value</code></td>
                  <td><code>any | array</code></td>
                  <td>{{ $t('transformation.scriptVarValue') }}</td>
                </tr>
                <tr>
                  <td><code>row</code></td>
                  <td><code>object</code></td>
                  <td>{{ $t('transformation.scriptVarRow') }}</td>
                </tr>
                <tr>
                  <td><code>sourceFields</code></td>
                  <td><code>string[]</code></td>
                  <td>{{ $t('transformation.scriptVarSourceFields') }}</td>
                </tr>
              </tbody>
            </v-table>

            <!-- Examples -->
            <div class="text-caption font-weight-bold text-uppercase mb-2">
              {{ $t('transformation.scriptExamplesTitle') }}
            </div>

            <div v-for="(example, idx) in scriptExamples" :key="idx" class="example-block mb-3">
              <div class="text-caption text-medium-emphasis mb-1">{{ example.label }}</div>
              <div class="code-block">
                <code>{{ example.code }}</code>
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ scriptLanguage: 'javascript', script: '' })
  }
});

const emit = defineEmits(['update:modelValue']);

const languageOptions = [
  { title: 'JavaScript', value: 'javascript' },
  { title: 'C#', value: 'csharp' }
];

const scriptExamples = computed(() => [
  {
    label: t('transformation.scriptExSingleField'),
    code: '// value = "john doe"\nvalue.toUpperCase()   // → "JOHN DOE"'
  },
  {
    label: t('transformation.scriptExMultiField'),
    code: '// sourceFields = ["firstName", "lastName"]\n// value = ["John", "Doe"]\nvalue[0] + " " + value[1]   // → "John Doe"'
  },
  {
    label: t('transformation.scriptExRowAccess'),
    code: '// row = { firstName: "John", lastName: "Doe", age: 30 }\nrow.firstName + " (" + row.age + ")"   // → "John (30)"'
  },
  {
    label: t('transformation.scriptExConditional'),
    code: '// Conditional logic\nvalue > 100 ? "High" : "Low"'
  },
  {
    label: t('transformation.scriptExFormat'),
    code: '// Format a date string\nnew Date(value).toLocaleDateString("en-US")'
  }
]);

function updateConfig(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>

<style scoped>
.code-textarea :deep(textarea) {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.script-reference :deep(.v-expansion-panel-title) {
  min-height: 40px;
  padding: 8px 16px;
}

.script-reference :deep(.v-expansion-panel-text__wrapper) {
  padding: 8px 16px 16px;
}

.vars-table {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.vars-table code {
  font-size: 0.8rem;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.code-block {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  padding: 10px 14px;
  white-space: pre;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
}

.code-block code {
  background: none;
  padding: 0;
}

.example-block:last-child {
  margin-bottom: 0 !important;
}
</style>
