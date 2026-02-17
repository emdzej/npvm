import { describe, it, expect } from "vitest";
import { isWorkspaceProtocol, getDependencies, type PackageJson } from "./package-json.js";

describe("isWorkspaceProtocol", () => {
  it("should detect workspace:* protocol", () => {
    expect(isWorkspaceProtocol("workspace:*")).toBe(true);
    expect(isWorkspaceProtocol("workspace:^")).toBe(true);
    expect(isWorkspaceProtocol("workspace:~")).toBe(true);
    expect(isWorkspaceProtocol("workspace:1.0.0")).toBe(true);
  });

  it("should return false for regular versions", () => {
    expect(isWorkspaceProtocol("1.0.0")).toBe(false);
    expect(isWorkspaceProtocol("^1.0.0")).toBe(false);
    expect(isWorkspaceProtocol("~1.0.0")).toBe(false);
    expect(isWorkspaceProtocol(">=1.0.0")).toBe(false);
  });
});

describe("getDependencies", () => {
  it("should get all dependencies", () => {
    const pkg: PackageJson = {
      name: "test",
      version: "1.0.0",
      dependencies: {
        "pkg-a": "^1.0.0",
      },
      devDependencies: {
        "pkg-b": "^2.0.0",
      },
      peerDependencies: {
        "pkg-c": "^3.0.0",
      },
    };

    const deps = getDependencies(pkg);
    expect(deps).toHaveLength(3);
    expect(deps).toContainEqual({ name: "pkg-a", version: "^1.0.0", type: "dependencies" });
    expect(deps).toContainEqual({ name: "pkg-b", version: "^2.0.0", type: "devDependencies" });
    expect(deps).toContainEqual({ name: "pkg-c", version: "^3.0.0", type: "peerDependencies" });
  });

  it("should handle missing dependency fields", () => {
    const pkg: PackageJson = {
      name: "test",
      version: "1.0.0",
    };

    const deps = getDependencies(pkg);
    expect(deps).toHaveLength(0);
  });

  it("should handle empty dependency objects", () => {
    const pkg: PackageJson = {
      name: "test",
      version: "1.0.0",
      dependencies: {},
      devDependencies: {},
    };

    const deps = getDependencies(pkg);
    expect(deps).toHaveLength(0);
  });
});
