<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    :max-width="width"
  >
    <v-card>
      <v-card-title :class="titleClass">
        {{ title }}
      </v-card-title>
      <v-card-text class="pt-4">
        <slot>{{ message }}</slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="$emit('update:show', false)"
          :disabled="loading"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          @click="$emit('confirm')"
          :loading="loading"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmColor: {
    type: String,
    default: 'primary'
  },
  titleClass: {
    type: String,
    default: 'text-h5'
  },
  width: {
    type: [Number, String],
    default: 400
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:show', 'confirm']);
</script>