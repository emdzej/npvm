import { execSync } from "node:child_process";
import * as semver from "semver";

export interface TagOptions {
  /** Tag prefix (default: none) */
  prefix?: string;
  /** Branch to check (default: main) */
  branch?: string;
  /** Working directory */
  cwd?: string;
}

export interface VersionTag {
  /** Full tag name */
  tag: string;
  /** Parsed semver version */
  version: string;
  /** Commit SHA */
  sha: string;
}

/**
 * Execute git command and return stdout
 */
function git(args: string, cwd?: string): string {
  try {
    return execSync(`git ${args}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const err = error as { status?: number; stderr?: Buffer };
    if (err.status === 128) {
      // Git error (e.g., not a repo, no commits)
      return "";
    }
    throw error;
  }
}

/**
 * Parse version from tag string
 */
export function parseTagVersion(tag: string, prefix: string = ""): string | null {
  const versionStr = prefix ? tag.replace(new RegExp(`^${prefix}`), "") : tag;
  const parsed = semver.parse(versionStr);
  return parsed ? parsed.version : null;
}

/**
 * List all version tags in the repository
 */
export function listVersionTags(options: TagOptions = {}): VersionTag[] {
  const { prefix = "", cwd } = options;
  const pattern = prefix ? `${prefix}*` : "*";

  // Get all tags with their commit SHAs
  const output = git(`tag -l "${pattern}" --format="%(refname:short) %(objectname:short)"`, cwd);

  if (!output) {
    return [];
  }

  const tags: VersionTag[] = [];

  for (const line of output.split("\n")) {
    const [tag, sha] = line.split(" ");
    if (!tag || !sha) continue;

    const version = parseTagVersion(tag, prefix);
    if (version) {
      tags.push({ tag, version, sha });
    }
  }

  // Sort by semver descending
  return tags.sort((a, b) => semver.rcompare(a.version, b.version));
}

/**
 * Get the latest version tag
 */
export function getLatestTag(options: TagOptions = {}): VersionTag | null {
  const tags = listVersionTags(options);
  return tags.length > 0 ? tags[0] : null;
}

/**
 * Get the latest version tag reachable from a specific branch
 */
export function getLatestTagOnBranch(options: TagOptions = {}): VersionTag | null {
  const { prefix = "", branch = "main", cwd } = options;

  // Get all tags reachable from the branch
  const output = git(`tag --merged ${branch} -l "${prefix || ""}*"`, cwd);

  if (!output) {
    return null;
  }

  const tagNames = output.split("\n").filter(Boolean);
  const tags: VersionTag[] = [];

  for (const tag of tagNames) {
    const version = parseTagVersion(tag, prefix);
    if (version) {
      const sha = git(`rev-parse --short "${tag}^{}"`, cwd);
      tags.push({ tag, version, sha });
    }
  }

  // Sort by semver descending and return the latest
  tags.sort((a, b) => semver.rcompare(a.version, b.version));
  return tags.length > 0 ? tags[0] : null;
}

/**
 * Check if current HEAD has a version tag
 */
export function getCurrentTag(options: TagOptions = {}): VersionTag | null {
  const { prefix = "", cwd } = options;

  const output = git("describe --tags --exact-match HEAD 2>/dev/null || true", cwd);

  if (!output) {
    return null;
  }

  const version = parseTagVersion(output, prefix);
  if (!version) {
    return null;
  }

  const sha = git("rev-parse --short HEAD", cwd);
  return { tag: output, version, sha };
}

/**
 * Create a new version tag
 */
export function createTag(version: string, options: TagOptions = {}): string {
  const { prefix = "", cwd } = options;
  const tag = `${prefix}${version}`;

  git(`tag "${tag}"`, cwd);
  return tag;
}
