import { defineStore } from "pinia";
import { ref, computed } from "vue";
import router from "@/router";
import { authService } from "@/services/authService";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref(null);
  const error = ref(null);
  const loading = ref(false);
  const apiOffline = ref(false);
  const loggingOut = ref(false);
  const initialized = ref(false);

  // Computed properties
  const isAuthenticated = computed(() => !!user.value && !loggingOut.value);
  const isSuperAdmin = computed(() => user.value?.role === "SuperAdmin");
  const isPlatformAdmin = computed(() => {
    if (!user.value) return false;
    const globalRoles = Array.isArray(user.value.roles) ? user.value.roles : [];
    return globalRoles.includes("PlatformAdmin");
  });
  const isTenantAdminCurrentTenant = computed(() => {
    if (!user.value) return false;
    const currentTenantId = user.value.currentTenantId;
    const currentTenantMembership = Array.isArray(user.value.tenants)
      ? user.value.tenants.find((tenant) => tenant.tenantId === currentTenantId)
      : null;
    return currentTenantMembership?.roleCode === "TenantAdmin";
  });
  const isAdmin = computed(() => {
    if (!user.value) return false;

    const effectiveRole = user.value.role;
    const globalRoles = Array.isArray(user.value.roles) ? user.value.roles : [];
    const currentTenantId = user.value.currentTenantId;
    const currentTenantMembership = Array.isArray(user.value.tenants)
      ? user.value.tenants.find((tenant) => tenant.tenantId === currentTenantId)
      : null;

    return (
      effectiveRole === "SuperAdmin" ||
      effectiveRole === "PlatformAdmin" ||
      effectiveRole === "TenantAdmin" ||
      globalRoles.includes("SuperAdmin") ||
      globalRoles.includes("PlatformAdmin") ||
      currentTenantMembership?.roleCode === "TenantAdmin"
    );
  });
  const isGuest = computed(() => authService.isGuestSession(user.value));
  const token = computed(() => null); // Backward compatibility

  /**
   * Initialize auth state from backend session.
   */
  async function initialize() {
    try {
      const currentUser = await authService.getCurrentUser();
      user.value = currentUser;

      if (user.value?.currentTenantId) {
        localStorage.setItem("currentTenantId", user.value.currentTenantId);
      }
    } catch (err) {
      // Not authenticated is an expected startup state.
      if (err?.response?.status === 401 || err?.silent) {
        user.value = null;
        return;
      }

      console.warn("Auth initialization failed:", err);
      user.value = null;
    } finally {
      initialized.value = true;
    }
  }

  /**
   * Login - navigate to backend login page.
   */
  async function login() {
    try {
      loading.value = true;
      error.value = null;
      apiOffline.value = false;

      await authService.initiateLogin();
    } catch (err) {
      console.error("Login error:", err);

      if (
        err.isNetworkError ||
        err.code === "ERR_NETWORK" ||
        err.code === "ERR_CONNECTION_REFUSED"
      ) {
        apiOffline.value = true;
        error.value =
          "Cannot connect to the server. Please ensure the API server is running.";
      } else {
        error.value = err.message || "Login failed. Please try again later.";
      }
      loading.value = false;
      throw err;
    }
  }

  /**
   * Guest login via BFF endpoint.
   */
  async function loginAsGuest() {
    try {
      loading.value = true;
      error.value = null;
      apiOffline.value = false;

      const guestUser = await authService.loginAsGuest();
      user.value = guestUser;

      if (user.value?.currentTenantId) {
        localStorage.setItem("currentTenantId", user.value.currentTenantId);
      }

      return true;
    } catch (err) {
      console.error("Guest login error:", err);

      if (
        err.isNetworkError ||
        err.code === "ERR_NETWORK" ||
        err.code === "ERR_CONNECTION_REFUSED"
      ) {
        apiOffline.value = true;
        error.value =
          "Cannot connect to the server. Please ensure the API server is running.";
      } else {
        error.value =
          err.response?.data?.detail ||
          err.message ||
          "Guest login failed. Please try again later.";
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Register new user
   */
  async function register(userData) {
    try {
      loading.value = true;
      error.value = null;

      await authService.register(userData);
      return true;
    } catch (err) {
      console.error("Registration error:", err);
      error.value =
        err.response?.data?.message ||
        err.userMessage ||
        "Registration failed. Please try again.";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      loggingOut.value = true;

      try {
        await authService.logout();
      } catch (err) {
        console.warn(
          "Backend logout error (continuing with local cleanup):",
          err,
        );
      }

      clearAuth();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error (clearing local state anyway):", err);
      clearAuth();
      window.location.href = "/login";
    } finally {
      loggingOut.value = false;
    }
  }

  /**
   * Forgot password
   */
  async function forgotPassword(email) {
    try {
      loading.value = true;
      error.value = null;

      await authService.forgotPassword(email);
      return true;
    } catch (err) {
      console.error("Forgot password error:", err);
      error.value =
        err.response?.data?.message ||
        err.userMessage ||
        "Failed to send reset email.";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Reset password
   */
  async function resetPassword(userId, tokenValue, newPassword) {
    try {
      loading.value = true;
      error.value = null;

      await authService.resetPassword(userId, tokenValue, newPassword);
      return true;
    } catch (err) {
      console.error("Reset password error:", err);
      error.value =
        err.response?.data?.message ||
        err.userMessage ||
        "Failed to reset password.";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Change password (authenticated users)
   */
  async function changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      loading.value = true;
      error.value = null;

      await authService.changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
      );
      return true;
    } catch (err) {
      console.error("Change password error:", err);
      error.value =
        err.response?.data?.message ||
        err.userMessage ||
        "Failed to change password.";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Switch tenant
   */
  async function switchTenant(tenantId) {
    try {
      loading.value = true;
      error.value = null;

      const response = await authService.switchTenant(tenantId);
      user.value = response.user;

      const updatedTenantId =
        response.currentTenantId || response.user?.currentTenantId || tenantId;
      if (updatedTenantId) {
        localStorage.setItem("currentTenantId", updatedTenantId);
      }

      return true;
    } catch (err) {
      console.error("Tenant switch error:", err);
      error.value = "Failed to switch tenant. Please try again.";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear authentication state
   */
  function clearAuth() {
    user.value = null;
    loggingOut.value = false;
    localStorage.removeItem("currentTenantId");
    sessionStorage.clear();

    if (
      router &&
      router.currentRoute &&
      router.currentRoute.value &&
      router.currentRoute.value.meta.requiresAuth
    ) {
      router.replace("/login");
    }
  }

  /**
   * Reset UI state (loading, error)
   */
  function resetState() {
    loading.value = false;
    error.value = null;
    apiOffline.value = false;
  }

  /**
   * Legacy methods for backward compatibility
   */
  function setUser(userData) {
    user.value = userData;
  }

  function setToken() {
    console.warn("setToken is deprecated in session mode");
  }

  return {
    // State
    user,
    error,
    loading,
    apiOffline,
    loggingOut,
    initialized,
    token,

    // Computed
    isAuthenticated,
    isSuperAdmin,
    isPlatformAdmin,
    isTenantAdminCurrentTenant,
    isAdmin,
    isGuest,

    // Actions
    login,
    loginAsGuest,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    switchTenant,
    clearAuth,
    resetState,
    initialize,

    // Legacy
    setUser,
    setToken,
  };
});
