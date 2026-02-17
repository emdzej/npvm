import * as semver from "semver";
import { getLatestTagOnBranch, type TagOptions, type VersionTag } from "./tags.js";
import {
  getCommitsSince,
  getAllCommits,
  getHighestBumpType,
  type BumpType,
  type Commit,
} from "./commits.js";

export interface VersionInfo {
  /** Current version (from latest tag, or 0.0.0 if none) */
  current: string;
  /** Latest tag info (null if no tags) */
  latestTag: VersionTag | null;
  /** Next calculated version */
  next: string;
  /** Bump type for next version */
  bumpType: BumpType;
  /** Number of commits since last tag */
  commitCount: number;
  /** Commits since last tag */
  commits: Commit[];
}

export interface VersionOptions extends TagOptions {
  /** Pre-release identifier (e.g., 'alpha', 'beta') */
  preRelease?: string;
  /** Default version when no tags exist */
  defaultVersion?: string;
}

/**
 * Calculate next version based on bump type
 */
export function calculateNextVersion(
  current: string,
  bumpType: BumpType,
  preRelease?: string,
  commitCount?: number
): string {
  if (bumpType === "none") {
    if (preRelease && commitCount !== undefined) {
      const next = semver.inc(current, "patch");
      return `${next}-${preRelease}.${commitCount}`;
    }
    return current;
  }

  const next = semver.inc(current, bumpType);
  if (!next) {
    throw new Error(`Failed to bump version ${current} with ${bumpType}`);
  }

  if (preRelease) {
    return `${next}-${preRelease}.${commitCount ?? 0}`;
  }

  return next;
}

/**
 * Get full version information for the repository
 */
export async function getVersionInfo(options: VersionOptions = {}): Promise<VersionInfo> {
  const { defaultVersion = "0.0.0", preRelease, cwd } = options;

  const latestTag = await getLatestTagOnBranch(options);

  let current: string;
  let commits: Commit[];

  if (latestTag) {
    current = latestTag.version;
    commits = await getCommitsSince(latestTag.tag, { cwd });
  } else {
    current = defaultVersion;
    commits = await getAllCommits({ cwd });
  }

  const commitCount = commits.length;
  const bumpType = getHighestBumpType(commits);
  const next = calculateNextVersion(current, bumpType, preRelease, commitCount);

  return {
    current,
    latestTag,
    next,
    bumpType,
    commitCount,
    commits,
  };
}

/**
 * Get current version (from latest tag or default)
 */
export async function getCurrentVersion(options: VersionOptions = {}): Promise<string> {
  const { defaultVersion = "0.0.0" } = options;
  const latestTag = await getLatestTagOnBranch(options);
  return latestTag ? latestTag.version : defaultVersion;
}

/**
 * Get next version based on commits
 */
export async function getNextVersion(options: VersionOptions = {}): Promise<string> {
  const info = await getVersionInfo(options);
  return info.next;
}

/**
 * Format version for display
 */
export function formatVersion(version: string, prefix: string = ""): string {
  return `${prefix}${version}`;
}
