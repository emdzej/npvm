import { Command } from "commander";
import chalk from "chalk";
import { getVersionInfo, getCurrentVersion, getNextVersion, type VersionOptions } from "../git/index.js";

export interface VersionCommandOptions {
  next?: boolean;
  tagPrefix?: string;
  branch: string;
  preRelease?: string;
  format: "plain" | "json";
  verbose?: boolean;
}

export function createVersionCommand(): Command {
  const cmd = new Command("version")
    .description("Determine and display version from git tags/commits")
    .option("-n, --next", "Show next version based on commits")
    .option("--tag-prefix <prefix>", "Tag prefix (default: none)")
    .option("--branch <name>", "Branch to check (default: main)", "main")
    .option("--pre-release <name>", "Pre-release identifier (e.g., alpha, beta)")
    .option("--format <format>", "Output format: plain, json", "plain")
    .option("--verbose", "Show detailed information")
    .action(async (options: VersionCommandOptions) => {
      await runVersionCommand(options);
    });

  return cmd;
}

export async function runVersionCommand(options: VersionCommandOptions): Promise<void> {
  const versionOpts: VersionOptions = {
    prefix: options.tagPrefix || "",
    branch: options.branch,
    preRelease: options.preRelease,
  };

  try {
    if (options.verbose || options.format === "json") {
      const info = await getVersionInfo(versionOpts);

      if (options.format === "json") {
        const output = {
          current: info.current,
          next: info.next,
          bumpType: info.bumpType,
          commitCount: info.commitCount,
          latestTag: info.latestTag?.tag || null,
          commits: info.commits.map((c) => ({
            hash: c.hash,
            message: c.message,
            bumpType: c.bumpType,
          })),
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        printVersionInfo(info);
      }
    } else {
      const version = options.next
        ? await getNextVersion(versionOpts)
        : await getCurrentVersion(versionOpts);
      console.log(version);
    }
  } catch (error) {
    console.error(chalk.red("Error:"), (error as Error).message);
    process.exit(1);
  }
}

function printVersionInfo(info: Awaited<ReturnType<typeof getVersionInfo>>): void {
  console.log(chalk.bold("Version Info:"));
  console.log(`  Current:      ${chalk.cyan(info.current)}`);
  console.log(`  Next:         ${chalk.green(info.next)}`);
  console.log(`  Bump type:    ${chalk.yellow(info.bumpType)}`);
  console.log(`  Commits:      ${info.commitCount}`);

  if (info.latestTag) {
    console.log(`  Latest tag:   ${info.latestTag.tag}`);
  } else {
    console.log(`  Latest tag:   ${chalk.dim("none")}`);
  }

  if (info.commits.length > 0) {
    console.log();
    console.log(chalk.bold("Commits since last tag:"));
    for (const commit of info.commits.slice(0, 10)) {
      const bumpColor =
        commit.bumpType === "major"
          ? chalk.red
          : commit.bumpType === "minor"
            ? chalk.yellow
            : commit.bumpType === "patch"
              ? chalk.green
              : chalk.dim;
      console.log(`  ${chalk.dim(commit.hash)} ${commit.message} ${bumpColor(`[${commit.bumpType}]`)}`);
    }
    if (info.commits.length > 10) {
      console.log(chalk.dim(`  ... and ${info.commits.length - 10} more`));
    }
  }
}
