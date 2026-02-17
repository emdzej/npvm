import { simpleGit, SimpleGit, LogResult, DefaultLogFields } from "simple-git";

export type BumpType = "major" | "minor" | "patch" | "none";

export interface Commit {
  /** Commit SHA */
  hash: string;
  /** Commit message (first line) */
  message: string;
  /** Full commit body */
  body?: string;
  /** Detected bump type */
  bumpType: BumpType;
}

export interface CommitOptions {
  /** Working directory */
  cwd?: string;
}

/**
 * Create simple-git instance
 */
function getGit(cwd?: string): SimpleGit {
  return simpleGit(cwd || process.cwd());
}

/**
 * Parse conventional commit message to determine bump type
 */
export function parseConventionalCommit(message: string, body?: string): BumpType {
  const fullMessage = body ? `${message}\n\n${body}` : message;

  // Check for breaking change indicators
  if (
    fullMessage.includes("BREAKING CHANGE:") ||
    fullMessage.includes("BREAKING-CHANGE:") ||
    /^[a-z]+(\(.+\))?!:/.test(message)
  ) {
    return "major";
  }

  // Extract type from conventional commit format: type(scope): description
  const match = message.match(/^([a-z]+)(\(.+\))?!?:/);
  if (!match) {
    return "none";
  }

  const type = match[1];

  switch (type) {
    case "feat":
      return "minor";
    case "fix":
    case "perf":
      return "patch";
    default:
      return "none";
  }
}

/**
 * Convert simple-git log entry to our Commit format
 */
function toCommit(entry: DefaultLogFields): Commit {
  const message = entry.message;
  const body = entry.body || undefined;
  const bumpType = parseConventionalCommit(message, body);

  return {
    hash: entry.hash,
    message,
    body,
    bumpType,
  };
}

/**
 * Get commits since a specific ref (tag or commit)
 */
export async function getCommitsSince(ref: string, options: CommitOptions = {}): Promise<Commit[]> {
  const { cwd } = options;
  const git = getGit(cwd);

  try {
    const log: LogResult = await git.log({ from: ref, to: "HEAD" });
    return log.all.map(toCommit);
  } catch {
    return [];
  }
}

/**
 * Get all commits (when no tags exist)
 */
export async function getAllCommits(options: CommitOptions = {}): Promise<Commit[]> {
  const { cwd } = options;
  const git = getGit(cwd);

  try {
    const log: LogResult = await git.log();
    return log.all.map(toCommit);
  } catch {
    return [];
  }
}

/**
 * Count commits since a specific ref
 */
export async function countCommitsSince(ref: string, options: CommitOptions = {}): Promise<number> {
  const commits = await getCommitsSince(ref, options);
  return commits.length;
}

/**
 * Determine the highest bump type from a list of commits
 */
export function getHighestBumpType(commits: Commit[]): BumpType {
  const priority: Record<BumpType, number> = {
    major: 3,
    minor: 2,
    patch: 1,
    none: 0,
  };

  let highest: BumpType = "none";

  for (const commit of commits) {
    if (priority[commit.bumpType] > priority[highest]) {
      highest = commit.bumpType;
    }
  }

  return highest;
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(options: CommitOptions = {}): Promise<string | null> {
  const { cwd } = options;
  const git = getGit(cwd);

  try {
    const branch = await git.revparse(["--abbrev-ref", "HEAD"]);
    return branch.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Check if HEAD is detached
 */
export async function isDetachedHead(options: CommitOptions = {}): Promise<boolean> {
  const branch = await getCurrentBranch(options);
  return branch === "HEAD";
}
