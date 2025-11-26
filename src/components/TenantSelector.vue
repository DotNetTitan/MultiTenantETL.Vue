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
import { ref, computed, onMounted, watch, inject } from 'vue';
import { useTenantStore } from '@/stores/tenant';

const tenantStore = useTenantStore();
const selectedTenantId = ref(tenantStore.currentTenantId);
const showNotification = inject('showNotification', null);

// Convert tenants array to format needed for v-select
const tenantItems = computed(() => {
  if (tenantStore.error) return [];
  // Filter out inactive tenants - users shouldn't see or switch to them
  return tenantStore.tenants
    .filter(tenant => tenant.isActive)
    .map(tenant => ({
      title: tenant.name,
      value: tenant.id
    }));
});

async function changeTenant(tenantId) {
  try {
    await tenantStore.setCurrentTenant(tenantId);
    
    // Find tenant name for notification
    const tenant = tenantStore.tenants.find(t => t.id === tenantId);
    const tenantName = tenant?.name || 'tenant';
    
    // Show success notification
    if (showNotification) {
      showNotification(`Switched to ${tenantName}`, 'success');
    }
  } catch (error) {
    // Error is already handled in store, just show notification
    if (showNotification) {
      showNotification('Failed to switch tenant', 'error');
    }
  }
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
          tenantStore.tenants = userTenants.map(ut => {
            const { tenantId, tenantName, tenantSlug, isActive } = ut;
            return {
              id: tenantId,
              name: tenantName,
              slug: tenantSlug,
              isActive: isActive
            };
          });
        } else {
          throw error;
        }
      }
    } else {
      const userTenants = await tenantService.getMyTenants();
      tenantStore.tenants = userTenants.map(ut => {
        const { tenantId, tenantName, tenantSlug, isActive } = ut;
        return {
          id: tenantId,
          name: tenantName,
          slug: tenantSlug,
          isActive: isActive
        };
      });
    }
    
    // Validate that current tenant ID exists in user's tenant list
    if (tenantStore.currentTenantId) {
      const tenantExists = tenantStore.tenants.some(t => t.id === tenantStore.currentTenantId);
      if (!tenantExists) {
        console.warn('Current tenant not found in user tenants, clearing selection');
        localStorage.removeItem('currentTenantId');
        tenantStore.currentTenantId = null;
        selectedTenantId.value = null;
      }
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
