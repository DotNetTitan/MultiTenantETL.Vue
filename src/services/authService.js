import api from "./api";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

const API_BASE = API_CONFIG.baseURL || "";

/**
 * Authentication Service (BFF/session-cookie mode)
 *
 * Browser never stores OAuth tokens.
 * Authentication state is represented by the backend auth cookie.
 */
export const authService = {
  /**
   * Start login flow by navigating to backend-hosted login page.
   */
  async initiateLogin() {
    window.location.href = `${API_BASE}/auth/login`;
  },

  /**
   * Fetch current authenticated user from backend.
   */
  async getCurrentUser() {
    const response = await api.get("/api/users/me");
    const data = response.data;

    const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
    const globalRoles = Array.isArray(data.roles) ? data.roles : [];
    const tenantMemberships = Array.isArray(data.tenants) ? data.tenants : [];

    const currentTenantMembership = tenantMemberships.find(
      (tenant) => tenant.tenantId === data.currentTenantId,
    );

    // Effective role for UI/route access:
    // 1) SuperAdmin always wins
    // 2) Otherwise use current tenant membership role
    // 3) Fallback to first global role or User
    const effectiveRole = globalRoles.includes("SuperAdmin")
      ? "SuperAdmin"
      : currentTenantMembership?.roleCode || globalRoles[0] || "User";

    return {
      id: data.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      name: fullName || data.email || "User",
      role: effectiveRole,
      globalRole: globalRoles[0] || "User",
      roles: globalRoles,
      tenantId: data.currentTenantId,
      tenantName: data.currentTenantName,
      currentTenantId: data.currentTenantId,
      currentTenantName: data.currentTenantName,
      tenants: tenantMemberships,
    };
  },

  /**
   * Logout current user session.
   */
  async logout() {
    await api.post(API_ENDPOINTS.auth.logout);
  },

  /**
   * Register a new user
   */
  async register(userData) {
    const response = await api.post(API_ENDPOINTS.auth.register, {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
    });
    return response.data;
  },

  /**
   * Confirm email address
   */
  async confirmEmail(userId, token) {
    const response = await api.post(API_ENDPOINTS.auth.confirmEmail, {
      userId,
      token,
    });
    return response.data;
  },

  /**
   * Request password reset email
   */
  async forgotPassword(email) {
    const response = await api.post(API_ENDPOINTS.auth.forgotPassword, {
      email,
    });
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(userId, token, newPassword) {
    const response = await api.post(API_ENDPOINTS.auth.resetPassword, {
      userId,
      token,
      newPassword,
    });
    return response.data;
  },

  /**
   * Change password for authenticated user
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    const response = await api.post(API_ENDPOINTS.auth.changePassword, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  /**
   * Switch tenant and re-fetch user profile.
   */
  async switchTenant(tenantId) {
    const response = await api.post(API_ENDPOINTS.auth.switchTenant, {
      tenantId,
    });
    const user = await this.getCurrentUser();

    return {
      user,
      tenantName: response.data.tenantName,
      currentTenantId: response.data.currentTenantId,
    };
  },

  /**
   * Guest login using secure BFF cookie session.
   */
  async loginAsGuest() {
    await api.post("/bff/guest-login");
    return this.getCurrentUser();
  },

  isGuestSession(user) {
    const role =
      user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);
    return role === "Viewer";
  },
};
