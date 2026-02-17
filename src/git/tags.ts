import { simpleGit, SimpleGit, TagResult } from "simple-git";
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
}

/**
 * Create simple-git instance
 */
function getGit(cwd?: string): SimpleGit {
  return simpleGit(cwd || process.cwd());
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
export async function listVersionTags(options: TagOptions = {}): Promise<VersionTag[]> {
  const { prefix = "", cwd } = options;
  const git = getGit(cwd);

  const result: TagResult = await git.tags();
  const tags: VersionTag[] = [];

  for (const tag of result.all) {
    // Filter by prefix if specified
    if (prefix && !tag.startsWith(prefix)) {
      continue;
    }

    const version = parseTagVersion(tag, prefix);
    if (version) {
      tags.push({ tag, version });
    }
  }

  // Sort by semver descending
  return tags.sort((a, b) => semver.rcompare(a.version, b.version));
}

/**
 * Get the latest version tag
 */
export async function getLatestTag(options: TagOptions = {}): Promise<VersionTag | null> {
  const tags = await listVersionTags(options);
  return tags.length > 0 ? tags[0] : null;
}

/**
 * Get the latest version tag reachable from a specific branch
 */
export async function getLatestTagOnBranch(options: TagOptions = {}): Promise<VersionTag | null> {
  const { prefix = "", branch = "main", cwd } = options;
  const git = getGit(cwd);

  try {
    // Get tags merged into the branch
    const result = await git.tag(["--merged", branch, "-l", `${prefix}*`]);
    const tagNames = result.trim().split("\n").filter(Boolean);

    const tags: VersionTag[] = [];
    for (const tag of tagNames) {
      const version = parseTagVersion(tag, prefix);
      if (version) {
        tags.push({ tag, version });
      }
    }

    // Sort by semver descending and return the latest
    tags.sort((a, b) => semver.rcompare(a.version, b.version));
    return tags.length > 0 ? tags[0] : null;
  } catch {
    // If branch doesn't exist or no tags, return null
    return null;
  }
}

/**
 * Create a new version tag
 */
export async function createTag(
  version: string,
  options: TagOptions & { message?: string } = {}
): Promise<string> {
  const { prefix = "", message, cwd } = options;
  const git = getGit(cwd);
  const tag = `${prefix}${version}`;

  if (message) {
    await git.addAnnotatedTag(tag, message);
  } else {
    await git.addTag(tag);
  }

  return tag;
}

/**
 * Push tags to remote
 */
export async function pushTags(remote: string = "origin", cwd?: string): Promise<void> {
  const git = getGit(cwd);
  await git.pushTags(remote);
}
