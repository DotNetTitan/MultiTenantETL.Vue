# Role Permission Matrix

## Goal
Create clear functional separation between:
- `SuperAdmin` (global)
- `PlatformAdmin` (global, renamed from current global `TenantAdmin`)
- `TenantAdmin` (tenant membership role only)
- `User` (tenant membership role)

## Recommended Model

### Global roles
- `SuperAdmin`: full system control, including security-critical operations.
- `PlatformAdmin`: cross-tenant operational admin, but no security-critical global actions.
- `User`: no global admin rights.

### Tenant membership roles
- `TenantAdmin`: admin rights within assigned tenant(s) only.
- `User`: regular tenant user rights.

## Permission Matrix

| Capability | SuperAdmin | PlatformAdmin (global) | TenantAdmin (membership) | User |
|---|---|---|---|---|
| View all tenants | Yes | Yes | No (own tenant(s) only) | No |
| Create/edit/deactivate/delete tenant | Yes | Yes (optional: except delete) | No | No |
| View all users | Yes | Yes | No (own tenant(s) only) | No |
| Edit user profile (name/email) globally | Yes | Yes | No | No |
| Change global role | Yes | No | No | No |
| Assign/remove tenant membership | Yes | Yes | Yes (own tenant only) | No |
| Change tenant membership role | Yes | Yes | Yes (own tenant only, cannot elevate to global) | No |
| View global audit logs | Yes | Yes (read-only recommended) | No | No |
| Manage connectors/pipelines/schedules in tenant | Yes | Yes | Yes (own tenant only) | Yes/limited by resource policy |
| Security operations (password reset admin, lockout, role escalation) | Yes | No | No | No |

## Frontend Changes (This Repo)

## 1) Introduce explicit role helpers
File: `src/stores/auth.js`
- Add:
  - `isSuperAdmin`
  - `isPlatformAdmin`
  - `isTenantAdminCurrentTenant`
  - Keep `isAdmin` as union for broad access if needed.
- Stop using `authStore.user?.role === 'SuperAdmin'` checks directly in views.

## 2) Replace hard-coded SuperAdmin checks in views
Files:
- `src/views/UsersView.vue`
- `src/views/TenantsView.vue`
- `src/components/tenants/TenantUsers.vue`

Required split:
- Global role mutation and security actions: `isSuperAdmin` only.
- Cross-tenant operational actions: `isSuperAdmin || isPlatformAdmin`.
- Tenant-scoped membership actions: allow tenant admin only for current tenant.

## 3) Route-level policy split
File: `src/router/index.js`
- Replace generic `requiresAdmin` for sensitive pages with role-specific meta:
  - `requiresPlatformAdmin` for `/tenants`, `/users`, `/audit-logs` (if desired)
  - `requiresSuperAdmin` for security-only screens/actions
- Keep route guard logic explicit and centralized.

## 4) UI labeling cleanup
Files:
- `src/services/userService.js` (`getAvailableRoles`)
- i18n labels in `src/locales/*.json`

Changes:
- Replace global `TenantAdmin` option with `PlatformAdmin`.
- Keep tenant role dropdowns as `TenantAdmin`/`User` only.

## Backend/API Changes (Required for Real Security)

Frontend-only checks are not enough. API authorization must enforce the same matrix.

## 1) Global role endpoints
Endpoints like:
- `POST /api/Users/{id}/roles`
- `DELETE /api/Users/{id}/roles`

Policy:
- Only `SuperAdmin` can change global roles.
- Block assigning `SuperAdmin` except by existing `SuperAdmin`.

## 2) Tenant membership endpoints
Endpoints like:
- `POST /api/Users/{id}/tenants`
- `DELETE /api/Users/{id}/tenants/{tenantId}`
- `PUT /api/Users/{id}/tenants/{tenantId}/role`

Policy:
- `SuperAdmin` and `PlatformAdmin`: any tenant.
- `TenantAdmin`: own tenant only.
- Prevent privilege escalation to global roles.

## 3) Data scoping
List/read endpoints must filter by caller scope:
- Tenant admin sees own tenant users/resources only.
- Platform admin can query cross-tenant.

## Rollout Plan

1. Add new auth computed helpers in frontend.
2. Update route guards and page action guards to use helper-based policy.
3. Rename global role `TenantAdmin` -> `PlatformAdmin` in UI/API contracts.
4. Enforce backend policies for each endpoint.
5. Add integration tests:
- global role mutation forbidden for non-superadmin
- tenant admin can manage only own tenant memberships
- platform admin cannot perform security-critical actions

## Minimal Next Implementation Slice

If implemented incrementally, start with:
1. Frontend helper refactor (`auth.js`) + replacing direct `SuperAdmin` checks.
2. Backend lock for global role mutation to `SuperAdmin` only.
3. Tenant membership endpoint scope checks for tenant admins.

