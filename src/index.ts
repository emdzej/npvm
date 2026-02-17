#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { getVersionInfo, getCurrentVersion, getNextVersion, type VersionOptions } from "./git/index.js";

const program = new Command();

program
  .name("npmx")
  .description("Node Package Manager Extended - CLI for monorepo versioning")
  .version("0.0.0");

program
  .command("version")
  .description("Determine and display version from git tags/commits")
  .option("-n, --next", "Show next version based on commits")
  .option("--tag-prefix <prefix>", "Tag prefix (default: none)")
  .option("--branch <name>", "Branch to check (default: main)", "main")
  .option("--pre-release <name>", "Pre-release identifier (e.g., alpha, beta)")
  .option("--format <format>", "Output format: plain, json", "plain")
  .option("--verbose", "Show detailed information")
  .action(async (options) => {
    const versionOpts: VersionOptions = {
      prefix: options.tagPrefix || "",
      branch: options.branch,
      preRelease: options.preRelease,
    };

    try {
      if (options.verbose || options.format === "json") {
        const info = await getVersionInfo(versionOpts);

        if (options.format === "json") {
          console.log(JSON.stringify({
            current: info.current,
            next: info.next,
            bumpType: info.bumpType,
            commitCount: info.commitCount,
            latestTag: info.latestTag?.tag || null,
          }, null, 2));
        } else {
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
  });

program
  .command("release")
  .description("Update all package versions in workspace")
  .option("-v, --version <version>", "Specific version to set")
  .option("--tag-prefix <prefix>", "Tag prefix (default: none)")
  .option("--branch <name>", "Branch to check (default: main)", "main")
  .option("--pre-release <name>", "Pre-release identifier")
  .option("--tag", "Create git tag after updating versions")
  .option("--commit", "Create git commit")
  .option("--push", "Push changes to remote")
  .option("--dry-run", "Show what would happen without making changes")
  .action(async (options) => {
    console.log(chalk.blue("npmx release"), options);
    console.log(chalk.yellow("Not implemented yet - requires workspace module (#3)"));
  });

program
  .command("sync")
  .description("Sync workspace package dependencies")
  .option("--dry-run", "Show what would happen without making changes")
  .action(async (options) => {
    console.log(chalk.blue("npmx sync"), options);
    console.log(chalk.yellow("Not implemented yet - requires workspace module (#3)"));
  });

program.parse();
