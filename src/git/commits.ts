import { execSync } from "node:child_process";

export type BumpType = "major" | "minor" | "patch" | "none";

export interface Commit {
  /** Short commit SHA */
  sha: string;
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
    const err = error as { status?: number };
    if (err.status === 128) {
      return "";
    }
    throw error;
  }
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
      // Other types (docs, style, refactor, test, chore, etc.) don't bump
      return "none";
  }
}

/**
 * Get commits since a specific ref (tag or commit)
 */
export function getCommitsSince(ref: string, options: CommitOptions = {}): Commit[] {
  const { cwd } = options;

  // Format: SHA|subject|body (separated by NULL)
  const format = "%h|%s|%b%x00";
  const output = git(`log ${ref}..HEAD --format="${format}"`, cwd);

  if (!output) {
    return [];
  }

  const commits: Commit[] = [];

  // Split by NULL character
  const entries = output.split("\x00").filter(Boolean);

  for (const entry of entries) {
    const [sha, message, ...bodyParts] = entry.split("|");
    if (!sha || !message) continue;

    const body = bodyParts.join("|").trim() || undefined;
    const bumpType = parseConventionalCommit(message, body);

    commits.push({ sha, message, body, bumpType });
  }

  return commits;
}

/**
 * Get all commits (when no tags exist)
 */
export function getAllCommits(options: CommitOptions = {}): Commit[] {
  const { cwd } = options;

  const format = "%h|%s|%b%x00";
  const output = git(`log --format="${format}"`, cwd);

  if (!output) {
    return [];
  }

  const commits: Commit[] = [];
  const entries = output.split("\x00").filter(Boolean);

  for (const entry of entries) {
    const [sha, message, ...bodyParts] = entry.split("|");
    if (!sha || !message) continue;

    const body = bodyParts.join("|").trim() || undefined;
    const bumpType = parseConventionalCommit(message, body);

    commits.push({ sha, message, body, bumpType });
  }

  return commits;
}

/**
 * Count commits since a specific ref
 */
export function countCommitsSince(ref: string, options: CommitOptions = {}): number {
  const { cwd } = options;
  const output = git(`rev-list --count ${ref}..HEAD`, cwd);
  return output ? parseInt(output, 10) : 0;
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
export function getCurrentBranch(options: CommitOptions = {}): string | null {
  const { cwd } = options;
  const output = git("rev-parse --abbrev-ref HEAD", cwd);
  return output || null;
}

/**
 * Check if HEAD is detached
 */
export function isDetachedHead(options: CommitOptions = {}): boolean {
  const branch = getCurrentBranch(options);
  return branch === "HEAD";
}
