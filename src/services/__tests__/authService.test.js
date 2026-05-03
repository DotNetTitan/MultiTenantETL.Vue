import { describe, it, expect, beforeEach, vi } from "vitest";
import { authService } from "@/services/authService";

vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from "@/services/api";

const mockLocation = {
  href: "",
  pathname: "/current-path",
  origin: "http://localhost:5173",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("authService (BFF session mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockReset();
    api.post.mockReset();
    mockLocation.href = "";
  });

  it("initiateLogin should navigate to backend login page", async () => {
    await authService.initiateLogin();
    expect(mockLocation.href).toBe("/auth/login");
  });

  it("getCurrentUser should normalize backend payload", async () => {
    api.get.mockResolvedValue({
      data: {
        id: "u1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        roles: ["SuperAdmin"],
        currentTenantId: "t1",
        currentTenantName: "Tenant One",
        tenants: [
          { tenantId: "t1", tenantName: "Tenant One", roleCode: "SuperAdmin" },
        ],
      },
    });

    const result = await authService.getCurrentUser();

    expect(api.get).toHaveBeenCalledWith("/api/users/me");
    expect(result).toEqual({
      id: "u1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      name: "Test User",
      role: "SuperAdmin",
      globalRole: "SuperAdmin",
      roles: ["SuperAdmin"],
      tenantId: "t1",
      tenantName: "Tenant One",
      currentTenantId: "t1",
      currentTenantName: "Tenant One",
      tenants: [
        { tenantId: "t1", tenantName: "Tenant One", roleCode: "SuperAdmin" },
      ],
    });
  });

  it("logout should call account logout endpoint", async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    await authService.logout();
    expect(api.post).toHaveBeenCalledWith("/api/Account/logout");
  });

  it("register should call register endpoint", async () => {
    const payload = {
      email: "e@x.com",
      password: "P@ssw0rd!",
      firstName: "A",
      lastName: "B",
    };
    api.post.mockResolvedValue({ data: { ok: true } });

    await authService.register(payload);

    expect(api.post).toHaveBeenCalledWith("/api/Account/register", payload);
  });

  it("switchTenant should call switch endpoint and refetch user profile", async () => {
    api.post.mockResolvedValue({
      data: { tenantName: "Tenant B", currentTenantId: "t2" },
    });
    api.get.mockResolvedValue({
      data: {
        id: "u1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        roles: ["User"],
        currentTenantId: "t2",
        currentTenantName: "Tenant B",
        tenants: [
          { tenantId: "t2", tenantName: "Tenant B", roleCode: "TenantAdmin" },
        ],
      },
    });

    const result = await authService.switchTenant("t2");

    expect(api.post).toHaveBeenCalledWith("/api/Account/switch-tenant", {
      tenantId: "t2",
    });
    expect(api.get).toHaveBeenCalledWith("/api/users/me");
    expect(result.currentTenantId).toBe("t2");
    expect(result.user.role).toBe("TenantAdmin");
  });

  it("getCurrentUser should prefer current tenant membership role over global user role", async () => {
    api.get.mockResolvedValue({
      data: {
        id: "u2",
        email: "tenant.admin@example.com",
        firstName: "Tenant",
        lastName: "Admin",
        roles: ["User"],
        currentTenantId: "tenant-2",
        currentTenantName: "Tenant Two",
        tenants: [
          { tenantId: "tenant-1", tenantName: "Tenant One", roleCode: "User" },
          {
            tenantId: "tenant-2",
            tenantName: "Tenant Two",
            roleCode: "TenantAdmin",
          },
        ],
      },
    });

    const result = await authService.getCurrentUser();

    expect(result.role).toBe("TenantAdmin");
    expect(result.globalRole).toBe("User");
  });

  it("getCurrentUser should keep SuperAdmin as effective role", async () => {
    api.get.mockResolvedValue({
      data: {
        id: "u3",
        email: "super.admin@example.com",
        firstName: "Super",
        lastName: "Admin",
        roles: ["SuperAdmin"],
        currentTenantId: "tenant-3",
        currentTenantName: "Tenant Three",
        tenants: [
          {
            tenantId: "tenant-3",
            tenantName: "Tenant Three",
            roleCode: "User",
          },
        ],
      },
    });

    const result = await authService.getCurrentUser();

    expect(result.role).toBe("SuperAdmin");
    expect(result.globalRole).toBe("SuperAdmin");
  });
});
