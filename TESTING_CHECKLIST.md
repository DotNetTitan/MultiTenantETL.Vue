# Testing Checklist: User & Tenant Management

## ✅ Tenant Management (`/tenants`)

### List Tenants
- [ ] Page loads without errors
- [ ] Tenants are displayed in a table
- [ ] Table shows: Name, Slug, Status, Created date, Actions
- [ ] Loading indicator appears while fetching data

### Create Tenant
- [ ] Click "Add Tenant" button
- [ ] Dialog opens with empty form
- [ ] Fill in:
  - Name (required)
  - Slug (required, lowercase/numbers/hyphens only)
  - Description (optional)
- [ ] Click "Save"
- [ ] New tenant appears in the list
- [ ] Success message shown (if implemented)

### Edit Tenant
- [ ] Click edit (pencil) icon on a tenant
- [ ] Dialog opens with tenant data pre-filled
- [ ] Modify name or description
- [ ] Click "Save"
- [ ] Changes reflected in the list
- [ ] Success message shown (if implemented)

### Delete Tenant
- [ ] Click delete (trash) icon on a tenant
- [ ] Confirmation dialog appears
- [ ] Click "Confirm"
- [ ] Tenant removed from list
- [ ] Success message shown (if implemented)

### Manage Tenant Users
- [ ] Click users (people) icon on a tenant
- [ ] Dialog opens showing users in that tenant
- [ ] Can add users to tenant
- [ ] Can remove users from tenant
- [ ] Can update user roles (TenantAdmin/User)

### Filters & Search
- [ ] Status filter works (All/Active/Inactive)
- [ ] Sort options work (Name, Created date)

---

## ✅ User Management (`/users`)

### List Users
- [ ] Page loads without errors
- [ ] Users are displayed in a table
- [ ] Table shows: Name, Email, Roles, Status, Created date, Actions
- [ ] Loading indicator appears while fetching data

### View User Details
- [ ] User information displayed correctly
- [ ] Multiple roles shown as chips (if user has multiple roles)
- [ ] Role colors displayed correctly:
  - SuperAdmin: Red
  - TenantAdmin/Admin: Deep Purple
  - Manager: Indigo
  - User: Blue

### Edit User
- [ ] Click edit (pencil) icon on a user
- [ ] Dialog opens with user data pre-filled
- [ ] Can modify:
  - First Name
  - Last Name
  - Email
  - Role (dropdown)
  - Active status (toggle)
- [ ] Click "Save"
- [ ] Changes reflected in the list
- [ ] Success message shown (if implemented)

### Activate/Deactivate User
- [ ] For active users: Click deactivate (X) icon
- [ ] User status changes to "Inactive"
- [ ] For inactive users: Click activate (✓) icon
- [ ] User status changes to "Active"
- [ ] Status chip color updates (green for active, red for inactive)

### Delete User
- [ ] Delete button is disabled for active users
- [ ] Deactivate user first
- [ ] Click delete (trash) icon
- [ ] Confirmation dialog appears
- [ ] Click "Confirm"
- [ ] User removed from list
- [ ] Success message shown (if implemented)

### Filters & Search
- [ ] Search by name or email works
- [ ] Status filter works (All/Active/Inactive)
- [ ] Sort options work (Name, Created date)

---

## ✅ Tenant Membership Management

### Add User to Tenant
- [ ] Open tenant users dialog
- [ ] Click "Add User to Tenant"
- [ ] Select user from dropdown
- [ ] Select role (TenantAdmin or User)
- [ ] Click "Add"
- [ ] User appears in tenant users list
- [ ] User removed from available users dropdown

### Update User Role in Tenant
- [ ] Click edit (pencil) icon on a tenant user
- [ ] Role dropdown appears
- [ ] Select new role
- [ ] Click "Save"
- [ ] Role chip updates

### Remove User from Tenant
- [ ] Click delete (trash) icon on a tenant user
- [ ] Confirmation dialog appears
- [ ] Click "Confirm"
- [ ] User removed from tenant users list
- [ ] User appears back in available users dropdown

---

## ✅ Authorization & Permissions

### SuperAdmin Access
- [ ] Can access `/tenants` page
- [ ] Can access `/users` page
- [ ] Can create/edit/delete tenants
- [ ] Can edit/deactivate/delete users
- [ ] Can manage tenant membership

### TenantAdmin Access
- [ ] Can access their own tenant details
- [ ] Can manage users within their tenant
- [ ] Cannot access other tenants
- [ ] Cannot access global users list (should redirect or show error)

### Regular User Access
- [ ] Cannot access `/tenants` page (should redirect)
- [ ] Cannot access `/users` page (should redirect)
- [ ] Can only view their own profile

---

## ✅ Error Handling

### Network Errors
- [ ] If backend is down, appropriate error message shown
- [ ] User can retry the operation

### Validation Errors
- [ ] Required fields show error if empty
- [ ] Email format validated
- [ ] Slug format validated (lowercase, numbers, hyphens only)
- [ ] Error messages are clear and helpful

### Permission Errors (403)
- [ ] If user lacks permission, clear error message shown
- [ ] User is not left in broken state

### Not Found Errors (404)
- [ ] If resource doesn't exist, appropriate message shown

---

## ✅ UI/UX

### Loading States
- [ ] Loading indicators shown during API calls
- [ ] Buttons disabled during save/delete operations
- [ ] No flickering or layout shifts

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] Tables scroll horizontally on small screens

### Dialogs
- [ ] Can close dialogs with X button
- [ ] Can close dialogs with Cancel button
- [ ] Can close dialogs with Escape key
- [ ] Dialogs don't close accidentally during operations

### Notifications
- [ ] Success messages shown for successful operations
- [ ] Error messages shown for failed operations
- [ ] Messages auto-dismiss after a few seconds
- [ ] Messages are readable and helpful

---

## 🐛 Known Limitations

### User Creation
- **Users cannot be created directly from the Users page**
- Users must register via the `/api/Account/register` endpoint
- This is by design for security reasons
- Admins can only edit existing users

### User Deletion
- Users must be deactivated before they can be deleted
- This prevents accidental deletion of active users
- Soft delete is used (user data retained in database)

### Tenant Deletion
- Deleting a tenant may fail if it has associated data
- Backend should handle cascade deletion or prevent deletion
- Check backend logs if deletion fails

---

## 📝 Testing Notes

### Test Data Setup
1. Ensure you have at least 3 tenants in the database
2. Ensure you have users with different roles:
   - At least 1 SuperAdmin
   - At least 1 TenantAdmin
   - At least 2 regular Users
3. Ensure some users are assigned to tenants

### Test Accounts
- **SuperAdmin**: admin@multitenant-etl.com
- **TenantAdmin**: (create via database)
- **User**: (create via registration)

### Browser Console
- Check for JavaScript errors
- Check for failed API calls (Network tab)
- Check for warning messages

### Backend Logs
- Monitor backend console for errors
- Check for authorization failures
- Verify API calls are reaching controllers

---

## ✅ Sign-off

- [ ] All tenant operations tested and working
- [ ] All user operations tested and working
- [ ] All tenant membership operations tested and working
- [ ] Authorization working correctly for all roles
- [ ] Error handling working correctly
- [ ] UI/UX is smooth and responsive
- [ ] No console errors
- [ ] No backend errors

**Tested by:** _______________  
**Date:** _______________  
**Notes:** _______________
