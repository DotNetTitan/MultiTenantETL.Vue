<template>
  <div>
    <!-- Success State -->
    <v-alert v-if="isValid" type="success" variant="tonal" prominent>
      <v-alert-title>
        <v-icon start>mdi-check-circle</v-icon>
        All Field Mappings Valid
      </v-alert-title>
      All required destination fields are mapped correctly!
    </v-alert>

    <!-- Compact Error State -->
    <div v-else>
      <!-- Unique Identifier Validation (compact card) -->
      <v-card v-if="uniqueIdentifierErrors.length > 0" variant="outlined" color="error" class="mb-3">
        <v-card-text class="py-3">
          <div class="d-flex align-center">
            <v-icon color="error" class="mr-3">mdi-key-alert</v-icon>
            <div class="flex-grow-1">
              <div class="text-subtitle-2 mb-1">Unique Identifier Mapping Required</div>
              <div class="text-caption text-grey">
                {{ uniqueIdentifierErrors[0] }}
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Unmapped Required Fields (compact) -->
      <v-card v-if="unmappedRequiredFields && unmappedRequiredFields.length > 0" variant="outlined" class="mb-3">
        <v-card-text class="py-3">
          <div class="d-flex align-center">
            <v-icon color="warning" class="mr-3">mdi-alert-circle</v-icon>
            <div class="flex-grow-1">
              <div class="text-subtitle-2 mb-2">Unmapped Required Fields</div>
              <v-chip-group>
                <v-chip
                  v-for="field in unmappedRequiredFields"
                  :key="field"
                  color="warning"
                  size="small"
                  variant="outlined"
                >
                  {{ field }}
                </v-chip>
              </v-chip-group>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Other Validation Errors (compact) -->
      <v-card v-if="otherErrors.length > 0" variant="outlined" class="mb-3">
        <v-card-text class="py-3">
          <div class="d-flex align-start">
            <v-icon color="error" class="mr-3 mt-1">mdi-alert</v-icon>
            <div class="flex-grow-1">
              <div class="text-subtitle-2 mb-2">Validation Issues</div>
              <div v-for="(error, index) in otherErrors" :key="index" class="text-caption mb-1">
                • {{ error }}
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  validationErrors: {
    type: Array,
    default: () => []
  },
  unmappedRequiredFields: {
    type: Array,
    default: () => []
  },
  isValid: {
    type: Boolean,
    default: false
  }
});

// Separate unique identifier errors from other errors
const uniqueIdentifierErrors = computed(() => {
  return props.validationErrors.filter(error => 
    error.includes('unique identifier') || 
    error.includes('Unique identifier')
  );
});

const otherErrors = computed(() => {
  return props.validationErrors.filter(error => 
    !error.includes('unique identifier') && 
    !error.includes('Unique identifier')
  );
});
</script>

<style scoped>
ul {
  list-style-type: disc;
}

li {
  color: rgba(0, 0, 0, 0.87);
}

.v-theme--dark li {
  color: rgba(255, 255, 255, 0.87);
}
</style>
