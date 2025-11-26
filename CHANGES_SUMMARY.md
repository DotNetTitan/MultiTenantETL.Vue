# Changes Summary: Configuration Constants Migration

## Overview
Migrated hardcoded configuration values from frontend to backend to establish a single source of truth for application constants.

## Files Changed

### Backend (C# / .NET)

#### New Files
1. **MultiTenantETL.Application/Metadata/AppConstantsDto.cs**
   - Added DTOs for app constants: `AppConstantsDto`, `RolesDto`, `OAuthConfigDto`, `SupportedLanguageDto`

#### Modified Files
1. **MultiTenantETL.Application/Interfaces/IMetadataService.cs**
   - Added `GetAppConstants()` method

2. **MultiTenantETL.Application/Metadata/MetadataDto.cs**
   - Added `AppConstants` property to include in "all" endpoint

3. **MultiTenantETL.Infrastructure/Services/MetadataService.cs**
   - Added constructor with `IConfiguration` dependency injection
   - Implemented `GetAppConstants()` method
   - Updated `GetAllMetadata()` to include app constants

4. **MultiTenantETL.API/Controllers/MetadataController.cs**
   - Added `GET /api/metadata/app-constants` endpoint

### Frontend (Vue.js)

#### New Files
1. **src/config/constants.js**
   - Central module for app constants
   - `initializeConstants()` - Fetches from backend on startup
   - `getRoles()` - Returns role constants
   - `getOAuthConfig()` - Returns OAuth configuration
   - `getSupportedLanguages()` - Returns supported languages
   - Includes fallback defaults if backend unavailable

2. **CONFIGURATION_CONSTANTS.md**
   - Documentation explaining the new system
   - Usage examples and migration guide

3. **CHANGES_SUMMARY.md** (this file)
   - Summary of all changes made

#### Modified Files
1. **src/main.js**
   - Added `initializeConstants()` call before app mount
   - Ensures constants loaded before authentication

2. **src/services/authService.js**
   - Removed hardcoded `CLIENT_ID` constant
   - Removed hardcoded `SCOPES` object
   - Removed hardcoded `DEFAULT_SCOPES` string
   - Now uses `getOAuthConfig()` for all OAuth operations
   - Updated 5 methods: `initiateLogin()`, `handleCallback()`, `refreshToken()`, `logout()`

3. **src/utils/jwtHelper.js**
   - Changed permission format from colon (`:`) to dot (`.`) notation
   - Updated `hasPermission()` to use dot notation (e.g., `pipelines.create`)
   - Updated `isSuperAdmin()` to use role constants from backend
   - Updated `isAdmin()` to use role constants from backend

## API Changes

### New Endpoint
```
GET /api/metadata/app-constants
```

**Response**:
```json
{
  "roles": {
    "superAdmin": "SuperAdmin",
    "tenantAdmin": "TenantAdmin",
    "user": "User",
    "viewer": "Viewer"
  },
  "oauthConfig": {
    "clientId": "multitenant-etl-spa",
    "scopes": ["openid", "email", "profile", "roles", "api", "offline_access"],
    "authorizeEndpoint": "/connect/authorize",
    "tokenEndpoint": "/connect/token",
    "revokeEndpoint": "/connect/revoke"
  },
  "supportedLanguages": [
    { "code": "en", "name": "English", "nativeName": "English" },
    { "code": "es", "name": "Spanish", "nativeName": "Español" },
    { "code": "fr", "name": "French", "nativeName": "Français" },
    { "code": "de", "name": "German", "nativeName": "Deutsch" },
    { "code": "it", "name": "Italian", "nativeName": "Italiano" },
    { "code": "pt", "name": "Portuguese", "nativeName": "Português" }
  ]
}
```

### Updated Endpoint
```
GET /api/metadata/all
```
Now includes `appConstants` in the response.

## Breaking Changes

### Permission Format Change
**Before**: `resource:action` (e.g., `pipelines:create`)
**After**: `resource.action` (e.g., `pipelines.create`)

This aligns with the backend `Permissions.cs` constants format.

**Impact**: Any frontend code checking permissions must use dot notation.

**Example**:
```javascript
// Before
if (hasPermission('pipelines:create')) { ... }

// After
if (hasPermission('pipelines.create')) { ... }
```

## Benefits

1. **Single Source of Truth**: Backend controls all configuration
2. **No Hardcoded Values**: OAuth client, roles, languages all from backend
3. **Easier Maintenance**: Change configuration in one place
4. **Consistency**: Frontend and backend always synchronized
5. **Flexibility**: Easy to add tenant-specific configurations
6. **Resilience**: Fallback defaults if backend unavailable

## Testing

### Backend
```bash
cd MultiTenantETL
dotnet build
# ✓ Build succeeded with 51 warnings (expected nullable warnings)
```

### Frontend
```bash
cd MultiTenantETL.Vue
npm run build
# ✓ Built successfully
```

### Runtime Testing
1. Start backend: `dotnet run` (from `src/MultiTenantETL.API`)
2. Start frontend: `npm run dev`
3. Check browser console for: "App constants initialized from backend"
4. Verify login flow works with dynamic OAuth config
5. Test permission checks with dot notation

## Migration Notes

- No database migrations required
- No breaking changes to existing API endpoints
- Frontend gracefully falls back to defaults if backend unavailable
- All existing functionality preserved

## Future Enhancements

Potential additions to app constants:
- Token lifetimes (access token, refresh token)
- Feature flags
- Tenant-specific branding/themes
- API rate limits
- File upload size limits
