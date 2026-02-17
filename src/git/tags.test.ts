import { describe, it, expect } from "vitest";
import { parseTagVersion } from "./tags.js";

describe("parseTagVersion", () => {
  it("should parse simple semver", () => {
    expect(parseTagVersion("1.0.0")).toBe("1.0.0");
    expect(parseTagVersion("0.1.0")).toBe("0.1.0");
    expect(parseTagVersion("10.20.30")).toBe("10.20.30");
  });

  it("should parse semver with prefix", () => {
    expect(parseTagVersion("v1.0.0", "v")).toBe("1.0.0");
    expect(parseTagVersion("release-1.0.0", "release-")).toBe("1.0.0");
  });

  it("should parse semver with prerelease", () => {
    expect(parseTagVersion("1.0.0-alpha.1")).toBe("1.0.0-alpha.1");
    expect(parseTagVersion("1.0.0-beta.2")).toBe("1.0.0-beta.2");
    expect(parseTagVersion("1.0.0-rc.1")).toBe("1.0.0-rc.1");
  });

  it("should parse semver with build metadata", () => {
    expect(parseTagVersion("1.0.0+build.123")).toBe("1.0.0");
  });

  it("should return null for invalid versions", () => {
    expect(parseTagVersion("not-a-version")).toBe(null);
    expect(parseTagVersion("1.0")).toBe(null);
    expect(parseTagVersion("v1.0", "")).toBe(null);
    expect(parseTagVersion("")).toBe(null);
  });

  it("should handle prefix mismatch", () => {
    // When tag doesn't start with expected prefix, parsing may fail
    expect(parseTagVersion("1.0.0", "v")).toBe("1.0.0"); // prefix stripped, still valid
    expect(parseTagVersion("release-1.0.0", "v")).toBe(null); // "elease-1.0.0" not valid
  });
});
