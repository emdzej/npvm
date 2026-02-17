import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export type WorkspaceType = "npm" | "pnpm" | "yarn" | "none";

export interface WorkspaceInfo {
  /** Detected workspace type */
  type: WorkspaceType;
  /** Root directory of the workspace */
  root: string;
  /** Workspace patterns (glob patterns for package locations) */
  patterns: string[];
}

/**
 * Detect workspace type from configuration files
 */
export async function detectWorkspace(cwd: string = process.cwd()): Promise<WorkspaceInfo> {
  // Check for pnpm-workspace.yaml first (most specific)
  const pnpmWorkspacePath = join(cwd, "pnpm-workspace.yaml");
  if (existsSync(pnpmWorkspacePath)) {
    const content = readFileSync(pnpmWorkspacePath, "utf-8");
    const config = parseYaml(content) as { packages?: string[] };
    return {
      type: "pnpm",
      root: cwd,
      patterns: config.packages || ["packages/*"],
    };
  }

  // Check package.json for workspaces field
  const packageJsonPath = join(cwd, "package.json");
  if (existsSync(packageJsonPath)) {
    const content = readFileSync(packageJsonPath, "utf-8");
    const pkg = JSON.parse(content) as {
      workspaces?: string[] | { packages?: string[] };
    };

    if (pkg.workspaces) {
      // Determine if npm or yarn based on lock file
      const hasYarnLock = existsSync(join(cwd, "yarn.lock"));
      const hasPackageLock = existsSync(join(cwd, "package-lock.json"));

      const patterns = Array.isArray(pkg.workspaces)
        ? pkg.workspaces
        : pkg.workspaces.packages || [];

      return {
        type: hasYarnLock ? "yarn" : hasPackageLock ? "npm" : "npm",
        root: cwd,
        patterns,
      };
    }
  }

  return {
    type: "none",
    root: cwd,
    patterns: [],
  };
}

/**
 * Check if directory is a workspace root
 */
export function isWorkspaceRoot(cwd: string = process.cwd()): boolean {
  const pnpmWorkspacePath = join(cwd, "pnpm-workspace.yaml");
  if (existsSync(pnpmWorkspacePath)) {
    return true;
  }

  const packageJsonPath = join(cwd, "package.json");
  if (existsSync(packageJsonPath)) {
    const content = readFileSync(packageJsonPath, "utf-8");
    const pkg = JSON.parse(content) as { workspaces?: unknown };
    return !!pkg.workspaces;
  }

  return false;
}
