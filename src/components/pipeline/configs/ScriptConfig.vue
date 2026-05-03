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

    <v-expansion-panels variant="accordion" class="mt-3 script-panels">
      <!-- Script Reference & Examples -->
      <v-expansion-panel>
        <v-expansion-panel-title class="text-body-2 font-weight-medium">
          <v-icon start size="small" color="info">mdi-help-circle-outline</v-icon>
          {{ $t('transformation.scriptReference') }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="script-examples">
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

      <!-- Test Script -->
      <v-expansion-panel>
        <v-expansion-panel-title class="text-body-2 font-weight-medium">
          <v-icon start size="small" color="warning">mdi-play-circle-outline</v-icon>
          {{ $t('transformation.scriptTestTitle') }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="test-section">
            <!-- No script warning -->
            <v-alert
              v-if="!modelValue.script"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              {{ $t('transformation.scriptTestNoScript') }}
            </v-alert>

            <template v-else>
              <!-- Single source field -->
              <div v-if="effectiveSourceFields.length <= 1" class="mb-3">
                <v-text-field
                  v-model="testInputs[effectiveSourceFields[0] || '_value']"
                  :label="$t('transformation.scriptTestValue')"
                  :placeholder="$t('transformation.scriptTestEnterValue', { field: effectiveSourceFields[0] || 'value' })"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="test-input"
                  @keydown.enter="runScript"
                />
              </div>

              <!-- Multiple source fields -->
              <div v-else class="mb-3">
                <v-text-field
                  v-for="field in effectiveSourceFields"
                  :key="field"
                  v-model="testInputs[field]"
                  :label="field"
                  :placeholder="$t('transformation.scriptTestEnterValue', { field })"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="test-input mb-2"
                  @keydown.enter="runScript"
                />
              </div>

              <!-- Run button -->
              <v-btn
                color="warning"
                variant="tonal"
                size="small"
                prepend-icon="mdi-play"
                :loading="isRunning"
                class="mb-3"
                @click="runScript"
              >
                {{ $t('transformation.scriptTestRun') }}
              </v-btn>

              <!-- Result display -->
              <div v-if="testResult !== null" class="result-container">
                <!-- Error -->
                <v-alert
                  v-if="testResult.error"
                  type="error"
                  variant="tonal"
                  density="compact"
                >
                  <div class="text-caption font-weight-bold mb-1">{{ $t('transformation.scriptTestError') }}</div>
                  <code class="error-code">{{ testResult.error }}</code>
                </v-alert>

                <!-- Success -->
                <div v-else class="result-success">
                  <div class="d-flex align-center mb-1">
                    <span class="text-caption font-weight-bold mr-2">{{ $t('transformation.scriptTestResult') }}</span>
                    <v-chip size="x-small" color="info" variant="outlined" class="type-chip">
                      {{ testResult.type }}
                    </v-chip>
                  </div>
                  <div class="result-value-box">
                    <code>{{ testResult.display }}</code>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ scriptLanguage: 'javascript', script: '' })
  },
  sourceFields: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const languageOptions = [
  { title: 'JavaScript', value: 'javascript' }
];

const testInputs = reactive({});
const testResult = ref(null);
const isRunning = ref(false);

/** Source fields with a fallback so the test section always has at least one input. */
const effectiveSourceFields = computed(() =>
  props.sourceFields.length > 0 ? props.sourceFields : ['_value']
);

/**
 * Executes the user's script in the browser using new Function().
 * Mirrors the backend Jint variables: value, row, sourceFields.
 */
function runScript() {
  const script = props.modelValue.script;
  if (!script) return;

  isRunning.value = true;
  testResult.value = null;

  try {
    const fields = effectiveSourceFields.value;

    // Build the row object from test inputs
    const row = {};
    for (const field of fields) {
      row[field === '_value' ? 'value' : field] = parseTestValue(testInputs[field]);
    }

    // Build value: single parsed value or array of parsed values
    let value;
    if (fields.length <= 1) {
      value = parseTestValue(testInputs[fields[0]]);
    } else {
      value = fields.map(f => parseTestValue(testInputs[f]));
    }

    // Use the real field names (not the internal '_value' key)
    const sourceFieldNames = fields.map(f => f === '_value' ? 'value' : f);

    // Execute via new Function — the returned expression is the result
    // eslint-disable-next-line no-new-func
    const fn = new Function('value', 'row', 'sourceFields', `"use strict"; return (${script});`);
    const result = fn(value, row, sourceFieldNames);

    testResult.value = {
      error: null,
      raw: result,
      type: getDisplayType(result),
      display: formatResult(result)
    };
  } catch (err) {
    testResult.value = {
      error: err.message || String(err),
      raw: null,
      type: null,
      display: null
    };
  } finally {
    isRunning.value = false;
  }
}

/**
 * Attempts to parse a raw string input into a typed value.
 * Recognises numbers, booleans, null, and JSON arrays/objects.
 */
function parseTestValue(raw) {
  if (raw === undefined || raw === null || raw === '') return '';
  const trimmed = raw.trim();

  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed !== '' && !isNaN(Number(trimmed))) return Number(trimmed);

  // Try JSON (for arrays / objects entered as "[1,2]" or '{"a":1}')
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try { return JSON.parse(trimmed); } catch { /* fall through to string */ }
  }

  return raw;
}

/** Returns a human-readable type label for a result value. */
function getDisplayType(val) {
  if (val === null || val === undefined) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

/** Formats a result value for display. */
function formatResult(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

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

.script-panels :deep(.v-expansion-panel-title) {
  min-height: 40px;
  padding: 8px 16px;
}

.script-panels :deep(.v-expansion-panel-text__wrapper) {
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

/* Test section styles */
.test-input :deep(input) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.875rem;
}

.result-container {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-top: 12px;
}

.error-code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.8rem;
  word-break: break-word;
  white-space: pre-wrap;
}

.result-value-box {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  padding: 10px 14px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
}

.result-value-box code {
  background: none;
  padding: 0;
}

.type-chip {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.7rem;
}
</style>
