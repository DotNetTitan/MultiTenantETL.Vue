# Provider Icons Migration

## Issue Found
Provider icons and colors were hardcoded in `ConnectorsView.vue`:

```javascript
function getProviderIcon(provider) {
  const providerLower = provider?.toLowerCase() || '';
  
  // Database providers
  if (providerLower.includes('postgres')) return 'mdi-database';
  if (providerLower.includes('mysql')) return 'mdi-database';
  // ... 20+ hardcoded mappings
}
```

## Solution Implemented

### Backend Changes

#### 1. Added Provider Metadata to MetadataConstants
**File**: `MultiTenantETL.Domain/Constants/MetadataConstants.cs`

```csharp
public static class ConnectorProviders
{
    // ... existing ProvidersByType dictionary
    
    /// <summary>
    /// Provider icons and colors for UI display
    /// </summary>
    public static readonly Dictionary<string, (string Icon, string Color)> ProviderMetadata = new()
    {
        // Database providers
        { Constants.ConnectorProviders.SqlServer, ("mdi-database", "blue-darken-2") },
        { Constants.ConnectorProviders.PostgreSQL, ("mdi-database", "blue-darken-2") },
        { Constants.ConnectorProviders.MySQL, ("mdi-database", "orange-darken-1") },
        
        // File providers
        { Constants.ConnectorProviders.Local, ("mdi-folder", "grey-darken-1") },
        { Constants.ConnectorProviders.FTP, ("mdi-server-network", "green-darken-1") },
        { Constants.ConnectorProviders.SFTP, ("mdi-server-security", "green-darken-2") },
        { Constants.ConnectorProviders.S3, ("mdi-aws", "orange-darken-2") },
        { Constants.ConnectorProviders.AzureBlob, ("mdi-microsoft-azure", "blue-lighten-1") },
        
        // API providers
        { Constants.ConnectorProviders.REST, ("mdi-api", "purple-darken-1") }
    };
}
```

#### 2. Added DTO
**File**: `MultiTenantETL.Application/Metadata/MetadataDto.cs`

```csharp
public class ProviderMetadataDto
{
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class ConnectorConfigDto
{
    // ... existing properties
    public Dictionary<string, ProviderMetadataDto> ProviderMetadata { get; set; } = new();
}
```

#### 3. Updated MetadataService
**File**: `MultiTenantETL.Infrastructure/Services/MetadataService.cs`

```csharp
public ConnectorConfigDto GetConnectorConfig()
{
    return new ConnectorConfigDto
    {
        // ... existing mappings
        ProviderMetadata = MetadataConstants.ConnectorProviders.ProviderMetadata
            .ToDictionary(
                kvp => kvp.Key, 
                kvp => new ProviderMetadataDto { Icon = kvp.Value.Icon, Color = kvp.Value.Color }
            ),
    };
}
```

### Frontend Changes

#### 1. Created Composable
**File**: `src/composables/useProviderMetadata.js`

```javascript
export function useProviderMetadata() {
  async function loadProviderMetadata() {
    const config = await getConnectorConfig()
    providerMetadata.value = config.providerMetadata || {}
  }

  function getProviderIcon(provider) {
    const metadata = providerMetadata.value?.[provider]
    return metadata?.icon || 'mdi-connection'
  }

  function getProviderColor(provider) {
    const metadata = providerMetadata.value?.[provider]
    return metadata?.color || 'grey'
  }

  return {
    loadProviderMetadata,
    getProviderIcon,
    getProviderColor
  }
}
```

#### 2. Update ConnectorsView (TODO)
**File**: `src/views/ConnectorsView.vue`

Replace hardcoded functions with composable:

```javascript
// Before
function getProviderIcon(provider) {
  const providerLower = provider?.toLowerCase() || '';
  if (providerLower.includes('postgres')) return 'mdi-database';
  // ... 20+ lines
}

// After
import { useProviderMetadata } from '@/composables/useProviderMetadata'

const { loadProviderMetadata, getProviderIcon, getProviderColor } = useProviderMetadata()

onMounted(async () => {
  await loadProviderMetadata()
  await fetchConnectors()
})
```

## API Response

The `/api/metadata/connector-config` endpoint now returns:

```json
{
  "types": [...],
  "providers": {...},
  "providerMetadata": {
    "SqlServer": {
      "icon": "mdi-database",
      "color": "blue-darken-2"
    },
    "PostgreSQL": {
      "icon": "mdi-database",
      "color": "blue-darken-2"
    },
    "MySQL": {
      "icon": "mdi-database",
      "color": "orange-darken-1"
    },
    "Local": {
      "icon": "mdi-folder",
      "color": "grey-darken-1"
    },
    "S3": {
      "icon": "mdi-aws",
      "color": "orange-darken-2"
    },
    // ... etc
  }
}
```

## Benefits

1. ✅ **Single Source of Truth** - Icons defined once in backend
2. ✅ **Easy to Add Providers** - Just add to MetadataConstants
3. ✅ **Consistent** - Same icons across all views
4. ✅ **Maintainable** - No need to update frontend code
5. ✅ **Extensible** - Easy to add new providers

## Adding New Providers

To add a new provider (e.g., MongoDB):

### 1. Backend Constants
```csharp
// MultiTenantETL.Domain/Constants/ConnectorTypes.cs
public static class ConnectorProviders
{
    public const string MongoDB = "MongoDB";
}

// MultiTenantETL.Domain/Constants/MetadataConstants.cs
public static readonly Dictionary<string, string[]> ProvidersByType = new()
{
    { 
        Constants.ConnectorTypes.Database, 
        new[] { 
            Constants.ConnectorProviders.SqlServer, 
            Constants.ConnectorProviders.PostgreSQL, 
            Constants.ConnectorProviders.MySQL,
            Constants.ConnectorProviders.MongoDB  // Add here
        } 
    }
};

public static readonly Dictionary<string, (string Icon, string Color)> ProviderMetadata = new()
{
    // ... existing providers
    { Constants.ConnectorProviders.MongoDB, ("mdi-database", "green-darken-2") }  // Add here
};
```

### 2. Frontend
No changes needed! The composable will automatically pick up the new provider from the API.

## Status

- ✅ Backend implementation complete
- ✅ Backend builds successfully
- ✅ Composable created
- ⏳ ConnectorsView.vue needs to be updated to use composable
- ⏳ Test the integration

## Next Steps

1. Update `ConnectorsView.vue` to use `useProviderMetadata` composable
2. Remove hardcoded `getProviderIcon` and `getProviderColor` functions
3. Test with different providers
4. Verify icons display correctly
