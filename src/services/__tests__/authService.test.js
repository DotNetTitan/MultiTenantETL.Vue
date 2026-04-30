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
        tenants: [],
      },
    });

    const result = await authService.switchTenant("t2");

    expect(api.post).toHaveBeenCalledWith("/api/Account/switch-tenant", {
      tenantId: "t2",
    });
    expect(api.get).toHaveBeenCalledWith("/api/users/me");
    expect(result.currentTenantId).toBe("t2");
  });
});
