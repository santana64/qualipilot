import { describe, expect, it } from "vitest";
import { roleAllows, type WorkspaceRole } from "./rbac";

describe("RBAC workspace", () => {
  const roles: WorkspaceRole[] = ["OWNER", "ADMIN", "QUALITY_MANAGER", "TRAINER", "VIEWER"];

  it("blocks viewers from every mutation permission", () => {
    expect(roleAllows("VIEWER", "viewWorkspace")).toBe(true);
    expect(roleAllows("VIEWER", "exportAudit")).toBe(true);
    expect(roleAllows("VIEWER", "manageEvidence")).toBe(false);
    expect(roleAllows("VIEWER", "manageTraining")).toBe(false);
    expect(roleAllows("VIEWER", "manageCabinet")).toBe(false);
    expect(roleAllows("VIEWER", "manageBilling")).toBe(false);
  });

  it("keeps cabinet and billing restricted to high-trust roles", () => {
    expect(roleAllows("OWNER", "manageCabinet")).toBe(true);
    expect(roleAllows("ADMIN", "manageCabinet")).toBe(true);
    expect(roleAllows("QUALITY_MANAGER", "manageCabinet")).toBe(false);
    expect(roleAllows("TRAINER", "manageCabinet")).toBe(false);
    expect(roleAllows("VIEWER", "manageCabinet")).toBe(false);
    expect(roleAllows("OWNER", "manageBilling")).toBe(true);
    expect(roleAllows("ADMIN", "manageBilling")).toBe(false);
  });

  it("never grants unknown permissions by role accident", () => {
    for (const role of roles) {
      expect(roleAllows(role, "notARealPermission" as never)).toBe(false);
    }
  });
});
