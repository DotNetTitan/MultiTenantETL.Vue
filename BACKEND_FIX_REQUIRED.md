# Backend Fix Required: 403 Forbidden on User/Tenant Endpoints

## Problem
The frontend is successfully authenticating and receiving tokens, but API calls to `/api/Users` and `/api/Tenants` are returning **403 Forbidden** errors, even though the user has the `SuperAdmin` role.

## Root Cause
The **access_token** being sent to the API does not contain the role claims, or the backend is not properly extracting and validating the role claims from the access_token.

## Current Situation

### Frontend (Working Correctly)
- User logs in successfully
- Receives `access_token`, `refresh_token`, and `id_token`
- The `id_token` contains the role claim: `"role": "SuperAdmin"`
- Frontend sends `access_token` in Authorization header: `Bearer {access_token}`
- API calls are made to: `https://localhost:7288/api/Users` and `https://localhost:7288/api/Tenants`

### Backend (Needs Fix)
- Receives the request with valid `access_token`
- Returns 403 Forbidden
- Authorization check is failing because role claims are not found in the access_token

## Required Backend Fixes

### Fix 1: Include Role Claims in Access Token

When issuing access tokens (in your OpenIddict token endpoint configuration), you need to ensure that role claims are included in the access token, not just the id_token.

**Location:** Token endpoint configuration (usually in `Program.cs` or `Startup.cs`)

**What to add:**

```csharp
// In your OpenIddict configuration
builder.Services.AddOpenIddict()
    .AddServer(options =>
    {
        // ... existing configuration ...
        
        // IMPORTANT: Include role claims in access token
        options.RegisterClaims(
            OpenIddictConstants.Claims.Role,
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        );
        
        // Ensure claims are included in access token
        options.SetAccessTokenLifetime(TimeSpan.FromHours(1));
    });
```

**And in your token generation logic:**

```csharp
// When creating the ClaimsPrincipal for the token
var identity = new ClaimsIdentity(
    OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
    OpenIddictConstants.Claims.Name,
    OpenIddictConstants.Claims.Role);

// Add user claims
identity.AddClaim(OpenIddictConstants.Claims.Subject, user.Id);
identity.AddClaim(OpenIddictConstants.Claims.Email, user.Email);
identity.AddClaim(OpenIddictConstants.Claims.Name, user.FullName);

// IMPORTANT: Add role claims to the identity
var roles = await _userManager.GetRolesAsync(user);
foreach (var role in roles)
{
    identity.AddClaim(OpenIddictConstants.Claims.Role, role);
    // Also add the Microsoft schema version
    identity.AddClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", role);
}

// Set destinations for claims (where they should appear)
identity.SetDestinations(claim => claim.Type switch
{
    OpenIddictConstants.Claims.Name => new[]
    {
        OpenIddictConstants.Destinations.AccessToken,
        OpenIddictConstants.Destinations.IdentityToken
    },
    OpenIddictConstants.Claims.Email => new[]
    {
        OpenIddictConstants.Destinations.AccessToken,
        OpenIddictConstants.Destinations.IdentityToken
    },
    OpenIddictConstants.Claims.Role => new[]
    {
        OpenIddictConstants.Destinations.AccessToken,  // IMPORTANT: Include in access token
        OpenIddictConstants.Destinations.IdentityToken
    },
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role" => new[]
    {
        OpenIddictConstants.Destinations.AccessToken,  // IMPORTANT: Include in access token
        OpenIddictConstants.Destinations.IdentityToken
    },
    _ => new[] { OpenIddictConstants.Destinations.AccessToken }
});
```

### Fix 2: Configure Authentication to Read Role Claims

Ensure your authentication middleware is configured to map role claims correctly.

**Location:** `Program.cs` or `Startup.cs`

```csharp
// Configure authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
});

// Add OpenIddict validation
builder.Services.AddOpenIddict()
    .AddValidation(options =>
    {
        options.SetIssuer("https://localhost:7288/");
        options.AddAudiences("api");
        
        // Use local server for validation
        options.UseLocalServer();
        
        // Use ASP.NET Core integration
        options.UseAspNetCore();
    });

// IMPORTANT: Configure claim mapping
builder.Services.Configure<IdentityOptions>(options =>
{
    // Map OpenIddict role claim to ASP.NET Core role claim
    options.ClaimsIdentity.RoleClaimType = OpenIddictConstants.Claims.Role;
    options.ClaimsIdentity.UserNameClaimType = OpenIddictConstants.Claims.Name;
    options.ClaimsIdentity.UserIdClaimType = OpenIddictConstants.Claims.Subject;
});
```

### Fix 3: Verify Controller Authorization Attributes

Ensure your controllers have the correct authorization attributes.

**Location:** `UsersController.cs` and `TenantsController.cs`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication
public class UsersController : ControllerBase
{
    // GET: api/Users
    [HttpGet]
    [Authorize(Roles = "SuperAdmin")] // Require SuperAdmin role
    public async Task<IActionResult> GetUsers([FromQuery] UserQueryParameters parameters)
    {
        // ... implementation
    }
    
    // Other endpoints...
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantsController : ControllerBase
{
    // GET: api/Tenants
    [HttpGet]
    [Authorize(Roles = "SuperAdmin")] // Require SuperAdmin role
    public async Task<IActionResult> GetTenants()
    {
        // ... implementation
    }
    
    // Other endpoints...
}
```

### Fix 4: Add Debugging to Verify Claims

Add temporary logging to see what claims are in the token.

**Location:** In your controller or a middleware

```csharp
// In your controller action, add this temporarily for debugging
[HttpGet]
[Authorize(Roles = "SuperAdmin")]
public async Task<IActionResult> GetUsers()
{
    // DEBUG: Log all claims
    var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
    _logger.LogInformation("User claims: {Claims}", JsonSerializer.Serialize(claims));
    
    // Check if user is in role
    var isInRole = User.IsInRole("SuperAdmin");
    _logger.LogInformation("User is in SuperAdmin role: {IsInRole}", isInRole);
    
    // ... rest of implementation
}
```

## Testing After Fix

After implementing these fixes:

1. **Restart the backend** to apply configuration changes
2. **Logout from the frontend** (to clear old tokens)
3. **Login again** (to get new tokens with role claims)
4. **Navigate to Users or Tenants page**
5. **Check backend logs** to see the claims being received
6. **Verify the API calls succeed** (should return 200 OK instead of 403)

## Expected Result

After the fix:
- Access token will contain role claims
- Backend will properly validate and extract role claims
- User with SuperAdmin role will be able to access `/api/Users` and `/api/Tenants`
- API calls will return 200 OK with data

## Alternative Quick Fix (Not Recommended for Production)

If you need a quick temporary fix for development, you can temporarily remove role-based authorization:

```csharp
// TEMPORARY - Remove role requirement
[HttpGet]
[Authorize] // Only require authentication, not specific role
public async Task<IActionResult> GetUsers()
{
    // ... implementation
}
```

**Note:** This is NOT recommended for production as it removes security. Only use for testing.

## Summary

The core issue is that **role claims must be included in the access_token** and the backend must be configured to read them correctly. The fixes above ensure:

1. Role claims are added to access tokens when they're issued
2. Claims have the correct destinations (AccessToken + IdentityToken)
3. Authentication middleware maps role claims correctly
4. Controllers properly check for roles

Once these fixes are applied, the 403 errors should be resolved.
