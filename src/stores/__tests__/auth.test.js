import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/authService";

// Mock dependencies
vi.mock("@/services/authService", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    initiateLogin: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    switchTenant: vi.fn(),
  },
}));

vi.mock("@/router", () => ({
  default: {
    push: vi.fn(),
    replace: vi.fn(),
  },
}));

// Mock global objects
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000",
    assign: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
});

describe("useAuthStore", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAuthStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with correct default values", () => {
      expect(store.user.value).toBe(null);
      expect(store.error.value).toBe(null);
      expect(store.loading.value).toBe(false);
      expect(store.apiOffline.value).toBe(false);
      expect(store.loggingOut.value).toBe(false);
      expect(store.isAuthenticated.value).toBe(false);
      expect(store.isAdmin.value).toBe(false);
    });
  });

  describe("initialize", () => {
    it("should set user when backend session is active", async () => {
      const mockUser = { id: 1, name: "Test User", role: "User" };
      authService.getCurrentUser.mockResolvedValue(mockUser);

      await store.initialize();

      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(store.user.value).toEqual(mockUser);
      expect(store.initialized.value).toBe(true);
    });

    it("should keep user null when backend returns 401", async () => {
      store.user.value = { id: 1 };
      authService.getCurrentUser.mockRejectedValue({
        response: { status: 401 },
      });

      await store.initialize();

      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(store.user.value).toBe(null);
      expect(store.initialized.value).toBe(true);
    });
  });

  describe("login", () => {
    it("should initiate login flow successfully", async () => {
      authService.initiateLogin.mockResolvedValue();

      const loginPromise = store.login();

      expect(store.loading.value).toBe(true);
      expect(store.error.value).toBe(null);
      expect(store.apiOffline.value).toBe(false);

      await loginPromise;

      expect(authService.initiateLogin).toHaveBeenCalled();
    });

    it("should handle network errors during login", async () => {
      const networkError = new Error("Network Error");
      networkError.isNetworkError = true;
      authService.initiateLogin.mockRejectedValue(networkError);

      await expect(store.login()).rejects.toThrow("Network Error");

      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe(
        "Cannot connect to the server. Please ensure the API server is running.",
      );
      expect(store.apiOffline.value).toBe(true);
    });

    it("should handle other errors during login", async () => {
      const loginError = new Error("Login failed");
      authService.initiateLogin.mockRejectedValue(loginError);

      await expect(store.login()).rejects.toThrow("Login failed");

      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe("Login failed");
      expect(store.apiOffline.value).toBe(false);
    });
  });

  describe("logout", () => {
    beforeEach(() => {
      store.user.value = { id: 1, username: "testuser" };
      store.loggingOut.value = false;
    });

    it("should logout successfully", async () => {
      authService.logout.mockResolvedValue();

      await store.logout();

      expect(store.loggingOut.value).toBe(false);
      expect(store.user.value).toBe(null);
      expect(store.error.value).toBe(null);
      expect(authService.logout).toHaveBeenCalled();
    });

    it("should handle logout errors gracefully", async () => {
      const logoutError = new Error("Logout failed");
      authService.logout.mockRejectedValue(logoutError);

      // Mock console.warn to avoid console output during test
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await store.logout();

      expect(store.loggingOut.value).toBe(false);
      expect(store.user.value).toBe(null);
      expect(store.error.value).toBe(null);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Backend logout error (continuing with local cleanup):",
        logoutError,
      );

      consoleWarnSpy.mockRestore();
    });

    it("should set loggingOut during logout process", async () => {
      authService.logout.mockResolvedValue();

      const logoutOperation = store.logout();

      expect(store.loggingOut.value).toBe(true);

      await logoutOperation;

      expect(store.loggingOut.value).toBe(false);
    });
  });

  describe("computed properties", () => {
    it("should compute isAuthenticated correctly", () => {
      expect(store.isAuthenticated.value).toBe(false);

      store.user.value = { id: 1 };
      expect(store.isAuthenticated.value).toBe(true);

      store.loggingOut.value = true;
      expect(store.isAuthenticated.value).toBe(false);
    });

    it("should compute isAdmin correctly", () => {
      // Initially no user, so isAdmin should be false
      store.user.value = null;
      expect(store.isAdmin.value).toBe(false);

      // Effective role TenantAdmin should be admin
      store.user.value = { id: 1, role: "TenantAdmin", roles: ["User"] };
      expect(store.isAdmin.value).toBe(true);

      // Tenant membership role TenantAdmin should be admin even if global role is User
      store.user.value = {
        id: 1,
        role: "User",
        roles: ["User"],
        currentTenantId: "t1",
        tenants: [{ tenantId: "t1", roleCode: "TenantAdmin" }],
      };
      expect(store.isAdmin.value).toBe(true);

      // Set user with regular role
      store.user.value = { id: 1, role: "User", roles: ["User"] };
      expect(store.isAdmin.value).toBe(false);

      // Set user with SuperAdmin role
      store.user.value = { id: 1, role: "SuperAdmin", roles: ["SuperAdmin"] };
      expect(store.isAdmin.value).toBe(true);
    });

    it("should return null token in session mode", () => {
      expect(store.token.value).toBe(null);
    });
  });

  describe("register", () => {
    it("should register user successfully", async () => {
      const userData = { email: "test@example.com", password: "password123" };
      authService.register.mockResolvedValue();

      const result = await store.register(userData);

      expect(result).toBe(true);
      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe(null);
      expect(authService.register).toHaveBeenCalledWith(userData);
    });

    it("should handle registration errors", async () => {
      const userData = { email: "test@example.com", password: "password123" };
      const registerError = new Error("Registration failed");
      registerError.response = { data: { message: "Email already exists" } };
      authService.register.mockRejectedValue(registerError);

      await expect(store.register(userData)).rejects.toThrow(
        "Registration failed",
      );

      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe("Email already exists");
    });
  });

  describe("forgotPassword", () => {
    it("should send forgot password email successfully", async () => {
      const email = "test@example.com";
      authService.forgotPassword.mockResolvedValue();

      const result = await store.forgotPassword(email);

      expect(result).toBe(true);
      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe(null);
      expect(authService.forgotPassword).toHaveBeenCalledWith(email);
    });

    it("should handle forgot password errors", async () => {
      const email = "test@example.com";
      const forgotError = new Error("Failed to send email");
      authService.forgotPassword.mockRejectedValue(forgotError);

      await expect(store.forgotPassword(email)).rejects.toThrow(
        "Failed to send email",
      );

      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe("Failed to send reset email.");
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const userId = 1;
      const token = "reset-token";
      const newPassword = "newpassword123";
      authService.resetPassword.mockResolvedValue();

      const result = await store.resetPassword(userId, token, newPassword);

      expect(result).toBe(true);
      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe(null);
      expect(authService.resetPassword).toHaveBeenCalledWith(
        userId,
        token,
        newPassword,
      );
    });

    it("should handle reset password errors", async () => {
      const userId = 1;
      const token = "reset-token";
      const newPassword = "newpassword123";
      const resetError = new Error("Invalid token");
      authService.resetPassword.mockRejectedValue(resetError);

      await expect(
        store.resetPassword(userId, token, newPassword),
      ).rejects.toThrow("Invalid token");

      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe("Failed to reset password.");
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      const currentPassword = "oldpass";
      const newPassword = "newpass";
      const confirmPassword = "newpass";
      authService.changePassword.mockResolvedValue();

      const result = await store.changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
      );

      expect(result).toBe(true);
      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe(null);
      expect(authService.changePassword).toHaveBeenCalledWith(
        currentPassword,
        newPassword,
        confirmPassword,
      );
    });

    it("should handle change password errors", async () => {
      const currentPassword = "oldpass";
      const newPassword = "newpass";
      const confirmPassword = "newpass";
      const changeError = new Error("Wrong current password");
      authService.changePassword.mockRejectedValue(changeError);

      await expect(
        store.changePassword(currentPassword, newPassword, confirmPassword),
      ).rejects.toThrow("Wrong current password");

      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe("Failed to change password.");
    });
  });

  describe("switchTenant", () => {
    it("should switch tenant successfully", async () => {
      const tenantId = 2;
      const mockResponse = {
        user: { id: 1, username: "testuser", currentTenantId: 2 },
      };
      authService.switchTenant.mockResolvedValue(mockResponse);

      const result = await store.switchTenant(tenantId);

      expect(result).toBe(true);
      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe(null);
      expect(store.user.value).toEqual(mockResponse.user);
      expect(authService.switchTenant).toHaveBeenCalledWith(tenantId);
    });

    it("should handle tenant switch errors", async () => {
      const tenantId = 2;
      const switchError = new Error("Tenant not found");
      authService.switchTenant.mockRejectedValue(switchError);

      await expect(store.switchTenant(tenantId)).rejects.toThrow(
        "Tenant not found",
      );

      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe(
        "Failed to switch tenant. Please try again.",
      );
    });
  });

  describe("clearAuth", () => {
    it("should clear authentication state", () => {
      store.user.value = { id: 1 };
      store.error.value = "Some error";

      store.clearAuth();

      expect(store.user.value).toBe(null);
    });
  });

  describe("resetState", () => {
    it("should reset UI state", () => {
      store.loading.value = true;
      store.error.value = "Some error";
      store.apiOffline.value = true;

      store.resetState();

      expect(store.loading.value).toBe(false);
      expect(store.error.value).toBe(null);
      expect(store.apiOffline.value).toBe(false);
    });
  });

  describe("legacy methods", () => {
    it("should set user with setUser", () => {
      const userData = { id: 1, username: "testuser" };

      store.setUser(userData);

      expect(store.user.value).toEqual(userData);
    });

    it("should warn when using deprecated setToken", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      store.setToken("token123");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "setToken is deprecated in session mode",
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
