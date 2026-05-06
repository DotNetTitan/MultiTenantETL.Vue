# Role Permission Matrix (Current State)

This document reflects how authorization and UI behavior are **actually implemented now** across frontend and backend.

## Roles in Use

### Global roles
- `SuperAdmin`
- `PlatformAdmin`
- `User` (no global admin rights)

### Tenant membership roles
- `TenantAdmin`
- `User`

## Effective Policy (Implemented)

| Capability | SuperAdmin | PlatformAdmin (global) | TenantAdmin (membership) | User |
|---|---|---|---|---|
| View all tenants list | Yes | Yes | No | No |
| Create tenant | Yes | Yes | No | No |
| Edit tenant details | Yes | Yes | No | No |
| Deactivate/activate tenant | Yes | Yes | No | No |
| Delete tenant | Yes | No | No | No |
| View all users | Yes | Yes | Tenant-scoped only | No |
| Edit user profile (name/email) | Yes | Yes, but only self or lower-level users | No | No |
| Edit another PlatformAdmin profile | Yes | No | No | No |
| Edit SuperAdmin profile | Yes | No | No | No |
| Change global role (assign/remove) | Yes | No | No | No |
| Update user status (active/inactive) | Yes | No | No | No |
| Delete user | Yes | No | No | No |
| Admin reset password | Yes | No | No | No |
| Assign/remove tenant membership | Yes | Yes, but not for SuperAdmin/PlatformAdmin targets | No | No |
| Change tenant membership role | Yes | Yes, but not for SuperAdmin/PlatformAdmin targets | No | No |
| View tenant users | Yes | Yes | Yes (own current tenant only) | No |
| View global audit logs (`/audit-logs`) | Yes | Yes | No | No |
| View own audit logs (`/auditlogs/my-logs`) | Yes | Yes | Yes | Yes |
| Manage connectors/pipelines/schedules/executions in current tenant | Yes | Yes | Yes (tenant-scoped) | Yes (policy/resource-scoped) |
| Switch tenant | Yes (any active tenant) | Yes (any active tenant) | Membership-only | Membership-only |

## Important Special Rules

1. `PlatformAdmin` cannot mutate `SuperAdmin` or `PlatformAdmin` accounts (except own profile edit).
2. `PlatformAdmin` can edit lower-level user profiles.
3. Tenant membership mutations are restricted to global admins only (`SuperAdmin`/`PlatformAdmin`).
4. `TenantAdmin` is view-only in tenant/user admin pages in current implementation.

## Frontend Status (Implemented)

- Role helpers exist in `src/stores/auth.js`:
  - `isSuperAdmin`
  - `isPlatformAdmin`
  - `isTenantAdminCurrentTenant`
  - `isAdmin`
- Routes:
  - `/tenants`: admin-access page
  - `/users`: admin-access page
  - `/audit-logs`: global admin only (`SuperAdmin` or `PlatformAdmin`)
- Users page behavior:
  - `PlatformAdmin` sees edit for self and lower-level users.
  - `PlatformAdmin` cannot edit peer `PlatformAdmin` or `SuperAdmin` rows.
  - Protected-row lock tooltip reasons are localized via i18n (`users.superAdminProtected`, `users.platformAdminPeerProtected`).
  - Tenant membership add/remove controls are hidden/blocked for protected targets.
- Tenant users dialog is mutation-enabled only for global admins.

## Backend Status (Implemented)

- Global role mutation endpoints are SuperAdmin-only.
- Security-sensitive user operations (status update, delete, admin password reset) are SuperAdmin-only.
- Tenant and user mutation endpoints enforce role checks server-side.
- Global-admin checks are centralized in `IAdminAuthorizationService` / `AdminAuthorizationService` and reused across controllers.
- Protected-target checks (SuperAdmin/PlatformAdmin target mutation restrictions) are centralized and reused.
- Audit log list/detail endpoints are limited to global admins.
- `GET /api/AuditLogs/{id}` now uses a dedicated service lookup by ID (`GetAuditLogByIdAsync`) instead of paged-list probing.
- Tenant switching allows:
  - `SuperAdmin` and `PlatformAdmin`: any active tenant
  - non-global users: only tenants where they have active membership

## Notes

- This file is a snapshot of implemented behavior, not a proposal.
- If policy changes, update both frontend guards and backend authorization together.
- Keep backend authorization helper usage consistent when adding new admin endpoints (prefer `IAdminAuthorizationService` over duplicating inline role checks).