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
      :error="!!tenantStore.error"
      :error-messages="tenantStore.error"
      @update:model-value="changeTenant"
    >
      <template #prepend>
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
  if (tenantStore.error) return [];
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
  try {
    const { tenantService } = await import('@/services/tenantService');
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();
    
    console.log('Current user role:', authStore.user?.role);
    
    // Try to get all tenants if SuperAdmin, fallback to user's tenants if 403
    if (authStore.user?.role === 'SuperAdmin') {
      try {
        const allTenants = await tenantService.getAll();
        tenantStore.tenants = allTenants;
      } catch (error) {
        // If 403, user might not actually be SuperAdmin, fallback to their tenants
        if (error.response?.status === 403) {
          console.warn('SuperAdmin check failed, falling back to user tenants');
          const userTenants = await tenantService.getMyTenants();
          tenantStore.tenants = userTenants.map(ut => ({
            id: ut.tenantId,
            name: ut.tenantName,
            slug: ut.tenantSlug,
            isActive: ut.isActive
          }));
        } else {
          throw error;
        }
      }
    } else {
      const userTenants = await tenantService.getMyTenants();
      tenantStore.tenants = userTenants.map(ut => ({
        id: ut.tenantId,
        name: ut.tenantName,
        slug: ut.tenantSlug,
        isActive: ut.isActive
      }));
    }
  } catch (error) {
    console.error('Failed to fetch tenants in TenantSelector:', error);
    tenantStore.error = 'Failed to load tenants';
  }
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

.tenant-select :deep(.v-field--error) {
  color: rgb(var(--v-theme-error));
}
</style>
