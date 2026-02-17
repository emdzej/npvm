import { describe, it, expect } from "vitest";
import { calculateNextVersion } from "./version.js";

describe("calculateNextVersion", () => {
  it("should bump major version", () => {
    expect(calculateNextVersion("1.0.0", "major")).toBe("2.0.0");
    expect(calculateNextVersion("0.5.3", "major")).toBe("1.0.0");
  });

  it("should bump minor version", () => {
    expect(calculateNextVersion("1.0.0", "minor")).toBe("1.1.0");
    expect(calculateNextVersion("1.5.3", "minor")).toBe("1.6.0");
  });

  it("should bump patch version", () => {
    expect(calculateNextVersion("1.0.0", "patch")).toBe("1.0.1");
    expect(calculateNextVersion("1.5.3", "patch")).toBe("1.5.4");
  });

  it("should return same version for none bump", () => {
    expect(calculateNextVersion("1.0.0", "none")).toBe("1.0.0");
    expect(calculateNextVersion("2.3.4", "none")).toBe("2.3.4");
  });

  it("should add prerelease suffix", () => {
    expect(calculateNextVersion("1.0.0", "minor", "alpha", 5)).toBe("1.1.0-alpha.5");
    expect(calculateNextVersion("1.0.0", "patch", "beta", 3)).toBe("1.0.1-beta.3");
    expect(calculateNextVersion("1.0.0", "major", "rc", 1)).toBe("2.0.0-rc.1");
  });

  it("should handle prerelease with none bump", () => {
    expect(calculateNextVersion("1.0.0", "none", "alpha", 5)).toBe("1.0.1-alpha.5");
  });

  it("should handle zero commit count in prerelease", () => {
    expect(calculateNextVersion("1.0.0", "minor", "alpha", 0)).toBe("1.1.0-alpha.0");
  });
});
