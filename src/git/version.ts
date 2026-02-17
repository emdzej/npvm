import * as semver from "semver";
import { getLatestTagOnBranch, type TagOptions, type VersionTag } from "./tags.js";
import {
  getCommitsSince,
  getAllCommits,
  getHighestBumpType,
  countCommitsSince,
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
    // No version bump needed
    if (preRelease && commitCount !== undefined) {
      // But if pre-release requested, bump patch and add pre-release
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
export function getVersionInfo(options: VersionOptions = {}): VersionInfo {
  const { defaultVersion = "0.0.0", preRelease, cwd } = options;

  // Get latest tag
  const latestTag = getLatestTagOnBranch(options);

  let current: string;
  let commits: Commit[];
  let commitCount: number;

  if (latestTag) {
    current = latestTag.version;
    commits = getCommitsSince(latestTag.tag, { cwd });
    commitCount = countCommitsSince(latestTag.tag, { cwd });
  } else {
    // No tags exist - start from default version
    current = defaultVersion;
    commits = getAllCommits({ cwd });
    commitCount = commits.length;
  }

  // Determine bump type from commits
  const bumpType = getHighestBumpType(commits);

  // Calculate next version
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
export function getCurrentVersion(options: VersionOptions = {}): string {
  const { defaultVersion = "0.0.0" } = options;
  const latestTag = getLatestTagOnBranch(options);
  return latestTag ? latestTag.version : defaultVersion;
}

/**
 * Get next version based on commits
 */
export function getNextVersion(options: VersionOptions = {}): string {
  const info = getVersionInfo(options);
  return info.next;
}

/**
 * Format version for display
 */
export function formatVersion(version: string, prefix: string = ""): string {
  return `${prefix}${version}`;
}
