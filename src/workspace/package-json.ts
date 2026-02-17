import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PackageJson, PackageInfo } from "./packages.js";

export interface DependencyRef {
  /** Package name */
  name: string;
  /** Version specifier */
  version: string;
  /** Dependency type */
  type: "dependencies" | "devDependencies" | "peerDependencies";
}

export interface WorkspaceDependency extends DependencyRef {
  /** Whether this uses workspace protocol (workspace:*) */
  isWorkspaceProtocol: boolean;
  /** The referenced workspace package (if found) */
  referencedPackage?: PackageInfo;
}

/**
 * Check if a version string uses workspace protocol
 */
export function isWorkspaceProtocol(version: string): boolean {
  return version.startsWith("workspace:");
}

/**
 * Get all dependencies from a package.json
 */
export function getDependencies(pkg: PackageJson): DependencyRef[] {
  const deps: DependencyRef[] = [];

  const depTypes = ["dependencies", "devDependencies", "peerDependencies"] as const;

  for (const type of depTypes) {
    const depsObj = pkg[type];
    if (depsObj && typeof depsObj === "object") {
      for (const [name, version] of Object.entries(depsObj)) {
        deps.push({ name, version, type });
      }
    }
  }

  return deps;
}

/**
 * Find workspace package references in dependencies
 */
export function findWorkspaceDependencies(
  pkg: PackageJson,
  workspacePackages: Map<string, PackageInfo>
): WorkspaceDependency[] {
  const deps = getDependencies(pkg);
  const workspaceDeps: WorkspaceDependency[] = [];

  for (const dep of deps) {
    const referencedPackage = workspacePackages.get(dep.name);
    if (referencedPackage) {
      workspaceDeps.push({
        ...dep,
        isWorkspaceProtocol: isWorkspaceProtocol(dep.version),
        referencedPackage,
      });
    }
  }

  return workspaceDeps;
}

/**
 * Update version in package.json
 */
export function updatePackageVersion(packageJsonPath: string, newVersion: string): void {
  const content = readFileSync(packageJsonPath, "utf-8");
  const pkg = JSON.parse(content) as PackageJson;

  pkg.version = newVersion;

  // Preserve formatting (2 spaces indent)
  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
}

/**
 * Update a specific dependency version
 */
export function updateDependencyVersion(
  packageJsonPath: string,
  depName: string,
  newVersion: string,
  depType: "dependencies" | "devDependencies" | "peerDependencies"
): void {
  const content = readFileSync(packageJsonPath, "utf-8");
  const pkg = JSON.parse(content) as PackageJson;

  if (pkg[depType] && typeof pkg[depType] === "object") {
    const deps = pkg[depType] as Record<string, string>;
    if (deps[depName]) {
      deps[depName] = newVersion;
    }
  }

  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
}

/**
 * Update all workspace dependencies to match current versions
 * Skips workspace protocol references (workspace:*)
 */
export function syncWorkspaceDependencies(
  packageJsonPath: string,
  workspacePackages: Map<string, PackageInfo>
): { updated: DependencyRef[]; skipped: DependencyRef[] } {
  const content = readFileSync(packageJsonPath, "utf-8");
  const pkg = JSON.parse(content) as PackageJson;

  const updated: DependencyRef[] = [];
  const skipped: DependencyRef[] = [];

  const depTypes = ["dependencies", "devDependencies", "peerDependencies"] as const;

  for (const type of depTypes) {
    const depsObj = pkg[type];
    if (!depsObj || typeof depsObj !== "object") continue;

    const deps = depsObj as Record<string, string>;

    for (const [name, version] of Object.entries(deps)) {
      const workspacePkg = workspacePackages.get(name);
      if (!workspacePkg) continue;

      // Skip workspace protocol references
      if (isWorkspaceProtocol(version)) {
        skipped.push({ name, version, type });
        continue;
      }

      // Extract version prefix (^, ~, etc.)
      const prefixMatch = version.match(/^([~^])?/);
      const prefix = prefixMatch?.[1] || "";
      const newVersion = `${prefix}${workspacePkg.version}`;

      if (version !== newVersion) {
        deps[name] = newVersion;
        updated.push({ name, version: newVersion, type });
      }
    }
  }

  if (updated.length > 0) {
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  }

  return { updated, skipped };
}
