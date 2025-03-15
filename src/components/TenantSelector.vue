<template>
  <div class="tenant-selector">
    <v-select
      v-model="selectedTenantId"
      :items="tenantItems"
      label="Select Tenant"
      density="compact"
      hide-details
      bg-color="transparent"
      class="tenant-select"
      :loading="tenantStore.loading"
      @update:model-value="changeTenant"
    >
      <template v-slot:prepend>
        <v-icon>mdi-office-building</v-icon>
      </template>
    </v-select>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTenantStore } from '@/stores/tenant';

const tenantStore = useTenantStore();
const selectedTenantId = ref(tenantStore.currentTenantId);

// Convert tenants array to format needed for v-select
const tenantItems = computed(() => {
  return tenantStore.tenants.map(tenant => ({
    title: tenant.name,
    value: tenant.id,
    disabled: !tenant.isActive
  }));
});

function changeTenant(tenantId) {
  tenantStore.setCurrentTenant(tenantId);
}

// Watch for current tenant changes in store
watch(() => tenantStore.currentTenantId, (newTenantId) => {
  selectedTenantId.value = newTenantId;
});

onMounted(async () => {
  await tenantStore.fetchTenants();
});
</script>

<style scoped>
.tenant-selector {
  min-width: 200px;
  margin: 0 16px;
}

.tenant-select :deep(.v-field__input) {
  color: white;
}

.tenant-select :deep(.v-field__append-inner) {
  color: white;
}
</style>
