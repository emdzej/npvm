import { existsSync, readFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { glob } from "glob";
import { detectWorkspace, type WorkspaceInfo } from "./detect.js";

export interface PackageInfo {
  /** Package name from package.json */
  name: string;
  /** Current version */
  version: string;
  /** Absolute path to package directory */
  path: string;
  /** Relative path from workspace root */
  relativePath: string;
  /** Path to package.json */
  packageJsonPath: string;
  /** Full package.json content */
  packageJson: PackageJson;
}

export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface DiscoverOptions {
  /** Working directory (defaults to cwd) */
  cwd?: string;
  /** Include root package */
  includeRoot?: boolean;
}

/**
 * Read and parse package.json from a directory
 */
export function readPackageJson(dir: string): PackageJson | null {
  const packageJsonPath = join(dir, "package.json");
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  const content = readFileSync(packageJsonPath, "utf-8");
  return JSON.parse(content) as PackageJson;
}

/**
 * Discover all packages in a workspace
 */
export async function discoverPackages(options: DiscoverOptions = {}): Promise<PackageInfo[]> {
  const { cwd = process.cwd(), includeRoot = false } = options;

  const workspace: WorkspaceInfo = await detectWorkspace(cwd);
  const packages: PackageInfo[] = [];

  // Add root package if requested
  if (includeRoot) {
    const rootPkg = readPackageJson(cwd);
    if (rootPkg && rootPkg.name) {
      packages.push({
        name: rootPkg.name,
        version: rootPkg.version || "0.0.0",
        path: cwd,
        relativePath: ".",
        packageJsonPath: join(cwd, "package.json"),
        packageJson: rootPkg,
      });
    }
  }

  // If no workspace patterns, return just root (if included)
  if (workspace.patterns.length === 0) {
    return packages;
  }

  // Find all packages matching workspace patterns
  for (const pattern of workspace.patterns) {
    // Glob for package.json files in pattern directories
    const matches = await glob(join(pattern, "package.json"), {
      cwd,
      absolute: true,
    });

    for (const packageJsonPath of matches) {
      const packageDir = dirname(packageJsonPath);
      const pkg = readPackageJson(packageDir);

      if (pkg && pkg.name) {
        packages.push({
          name: pkg.name,
          version: pkg.version || "0.0.0",
          path: packageDir,
          relativePath: relative(cwd, packageDir),
          packageJsonPath,
          packageJson: pkg,
        });
      }
    }
  }

  return packages;
}

/**
 * Get a map of package names to their info
 */
export async function getPackageMap(
  options: DiscoverOptions = {}
): Promise<Map<string, PackageInfo>> {
  const packages = await discoverPackages(options);
  const map = new Map<string, PackageInfo>();

  for (const pkg of packages) {
    map.set(pkg.name, pkg);
  }

  return map;
}

/**
 * Find a package by name in the workspace
 */
export async function findPackage(
  name: string,
  options: DiscoverOptions = {}
): Promise<PackageInfo | null> {
  const map = await getPackageMap(options);
  return map.get(name) || null;
}
