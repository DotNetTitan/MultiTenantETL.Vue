/**
 * Composable for provider metadata (icons and colors)
 * Fetches from backend instead of hardcoding
 */

import { ref, computed } from 'vue'
import { getConnectorConfig } from '@/services/metadataService'

const providerMetadata = ref(null)
const loading = ref(false)
const error = ref(null)

export function useProviderMetadata() {
  /**
   * Load provider metadata from backend
   */
  async function loadProviderMetadata() {
    if (providerMetadata.value) {
      return providerMetadata.value
    }

    try {
      loading.value = true
      error.value = null
      
      const config = await getConnectorConfig()
      providerMetadata.value = config.providerMetadata || {}
      
      return providerMetadata.value
    } catch (err) {
      console.error('Failed to load provider metadata:', err)
      error.value = err
      
      // Fallback to empty object - component will use defaults
      providerMetadata.value = {}
      return providerMetadata.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Get icon for a provider
   * @param {string} provider - Provider name (e.g., 'PostgreSQL', 'S3')
   * @returns {string} Material Design Icon name
   */
  function getProviderIcon(provider) {
    if (!provider) return 'mdi-connection'
    
    const metadata = providerMetadata.value?.[provider]
    if (metadata?.icon) {
      return metadata.icon
    }

    // Fallback: try to match by lowercase
    const providerLower = provider.toLowerCase()
    for (const [key, value] of Object.entries(providerMetadata.value || {})) {
      if (key.toLowerCase() === providerLower) {
        return value.icon || 'mdi-connection'
      }
    }

    // Default fallback
    return 'mdi-connection'
  }

  /**
   * Get color for a provider
   * @param {string} provider - Provider name
   * @returns {string} Vuetify color name
   */
  function getProviderColor(provider) {
    if (!provider) return 'grey'
    
    const metadata = providerMetadata.value?.[provider]
    if (metadata?.color) {
      return metadata.color
    }

    // Fallback: try to match by lowercase
    const providerLower = provider.toLowerCase()
    for (const [key, value] of Object.entries(providerMetadata.value || {})) {
      if (key.toLowerCase() === providerLower) {
        return value.color || 'grey'
      }
    }

    // Default fallback
    return 'grey'
  }

  /**
   * Check if metadata is loaded
   */
  const isLoaded = computed(() => providerMetadata.value !== null)

  return {
    providerMetadata: computed(() => providerMetadata.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isLoaded,
    loadProviderMetadata,
    getProviderIcon,
    getProviderColor
  }
}
