# Improvement: Constants from MetadataConstants Class

## Issue Identified
The initial implementation had hardcoded values in `MetadataService.GetAppConstants()`:
- OAuth scopes were hardcoded as a list
- Supported languages were hardcoded as individual objects
- OAuth endpoints were hardcoded strings

This violated the DRY principle and made maintenance harder.

## Solution Applied
Moved all constant values to `MetadataConstants` class in the Domain layer, following the existing pattern used for connector types, transformation types, etc.

## Changes Made

### 1. Added to MetadataConstants.cs
```csharp
public static class OAuth
{
    public static readonly string[] DefaultScopes = new[]
    {
        "openid", "email", "profile", "roles", "api", "offline_access"
    };

    public const string AuthorizeEndpoint = "/connect/authorize";
    public const string TokenEndpoint = "/connect/token";
    public const string RevokeEndpoint = "/connect/revoke";
}

public static class SupportedLanguages
{
    public static readonly (string Code, string Name, string NativeName)[] Languages = new[]
    {
        ("en", "English", "English"),
        ("es", "Spanish", "Español"),
        ("fr", "French", "Français"),
        ("de", "German", "Deutsch"),
        ("it", "Italian", "Italiano"),
        ("pt", "Portuguese", "Português")
    };
}
```

### 2. Updated MetadataService.GetAppConstants()
**Before**:
```csharp
OAuthConfig = new OAuthConfigDto
{
    ClientId = clientId,
    Scopes = new List<string> { "openid", "email", "profile", ... },
    AuthorizeEndpoint = "/connect/authorize",
    TokenEndpoint = "/connect/token",
    RevokeEndpoint = "/connect/revoke"
},
SupportedLanguages = new List<SupportedLanguageDto>
{
    new() { Code = "en", Name = "English", NativeName = "English" },
    new() { Code = "es", Name = "Spanish", NativeName = "Español" },
    // ... more hardcoded entries
}
```

**After**:
```csharp
OAuthConfig = new OAuthConfigDto
{
    ClientId = clientId,
    Scopes = MetadataConstants.OAuth.DefaultScopes.ToList(),
    AuthorizeEndpoint = MetadataConstants.OAuth.AuthorizeEndpoint,
    TokenEndpoint = MetadataConstants.OAuth.TokenEndpoint,
    RevokeEndpoint = MetadataConstants.OAuth.RevokeEndpoint
},
SupportedLanguages = MetadataConstants.SupportedLanguages.Languages
    .Select(l => new SupportedLanguageDto 
    { 
        Code = l.Code, 
        Name = l.Name, 
        NativeName = l.NativeName 
    })
    .ToList()
```

## Benefits

1. **Consistency**: Follows the same pattern as other metadata (ConnectorTypes, TransformationTypes, etc.)
2. **Single Source of Truth**: All constants defined in one place (Domain layer)
3. **Easier Maintenance**: Add/modify languages or scopes in one location
4. **Better Organization**: Constants grouped logically in MetadataConstants class
5. **Type Safety**: Compile-time checking for constant values
6. **Reusability**: Constants can be used elsewhere in the codebase if needed

## Architecture Alignment

This change aligns with Clean Architecture principles:
- **Domain Layer**: Contains pure business constants (no dependencies)
- **Application Layer**: Contains DTOs for data transfer
- **Infrastructure Layer**: Maps domain constants to DTOs
- **API Layer**: Exposes DTOs via endpoints

## Future Additions

To add new constants, follow this pattern:

1. Add to `MetadataConstants` in Domain layer
2. Add corresponding DTO in Application layer (if needed)
3. Map in `MetadataService.GetAppConstants()`
4. Frontend automatically receives via API

Example for adding API rate limits:
```csharp
// Domain/Constants/MetadataConstants.cs
public static class RateLimits
{
    public const int RequestsPerMinute = 60;
    public const int RequestsPerHour = 1000;
}

// Application/Metadata/AppConstantsDto.cs
public class RateLimitDto
{
    public int RequestsPerMinute { get; set; }
    public int RequestsPerHour { get; set; }
}

// Infrastructure/Services/MetadataService.cs
RateLimits = new RateLimitDto
{
    RequestsPerMinute = MetadataConstants.RateLimits.RequestsPerMinute,
    RequestsPerHour = MetadataConstants.RateLimits.RequestsPerHour
}
```

## Testing
- ✅ Backend builds successfully
- ✅ Frontend builds successfully
- ✅ No diagnostics errors
- ✅ Follows existing patterns in codebase
