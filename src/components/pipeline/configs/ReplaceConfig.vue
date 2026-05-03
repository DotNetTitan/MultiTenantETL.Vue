<template>
  <div>
    <v-text-field
      :model-value="modelValue.findPattern"
      :label="modelValue.useRegex ? $t('transformation.regexPattern') : $t('transformation.findPattern')"
      :placeholder="modelValue.useRegex ? $t('transformation.regexPatternPlaceholder') : $t('transformation.findPatternPlaceholder')"
      :hint="modelValue.useRegex ? $t('transformation.regexPatternHint') : ''"
      :persistent-hint="!!modelValue.useRegex"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      @update:model-value="updateConfig('findPattern', $event)"
    />
    <v-text-field
      :model-value="modelValue.replaceWith"
      :label="$t('transformation.replaceWith')"
      :placeholder="modelValue.useRegex ? $t('transformation.replaceWithRegexPlaceholder') : ''"
      :hint="modelValue.useRegex ? $t('transformation.replaceWithRegexHint') : ''"
      :persistent-hint="!!modelValue.useRegex"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      @update:model-value="updateConfig('replaceWith', $event)"
    />
    <v-checkbox
      :model-value="modelValue.useRegex"
      :label="$t('transformation.useRegex')"
      density="comfortable"
      @update:model-value="updateConfig('useRegex', $event)"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ findPattern: '', replaceWith: '', useRegex: false })
  }
});

const emit = defineEmits(['update:modelValue']);

function updateConfig(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>
