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

    <!-- Warning/Error State -->
    <v-alert v-else type="warning" variant="tonal" prominent>
      <v-alert-title>
        <v-icon start>mdi-alert</v-icon>
        Field Mapping Issues
      </v-alert-title>

      <!-- Unmapped Required Fields -->
      <div v-if="unmappedRequiredFields && unmappedRequiredFields.length > 0" class="mt-3">
        <strong>Unmapped Required Fields:</strong>
        <v-chip-group class="mt-2">
          <v-chip
            v-for="field in unmappedRequiredFields"
            :key="field"
            color="error"
            size="small"
          >
            <v-icon start size="small">mdi-alert-circle</v-icon>
            {{ field }}
          </v-chip>
        </v-chip-group>
        <p class="text-caption mt-2 text-grey-darken-1">
          These fields are required in the destination and must be mapped before saving the pipeline.
        </p>
      </div>

      <!-- Validation Errors -->
      <div v-if="validationErrors && validationErrors.length > 0" class="mt-3">
        <strong>Validation Errors:</strong>
        <ul class="mt-2 pl-4">
          <li v-for="(error, index) in validationErrors" :key="index" class="mb-1">
            {{ error }}
          </li>
        </ul>
      </div>

      <!-- Action Hint -->
      <div class="mt-3">
        <v-divider class="my-2" />
        <p class="text-caption text-grey-darken-1">
          <v-icon size="small" class="mr-1">mdi-information</v-icon>
          Fix the issues above to enable pipeline saving.
        </p>
      </div>
    </v-alert>
  </div>
</template>

<script setup>
defineProps({
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
