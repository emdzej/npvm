import { Command } from "commander";
import chalk from "chalk";
import { simpleGit } from "simple-git";
import { getNextVersion, createTag, type VersionOptions } from "../git/index.js";
import {
  detectWorkspace,
  discoverPackages,
  updatePackageVersion,
  type PackageInfo,
} from "../workspace/index.js";

export interface ReleaseCommandOptions {
  version?: string;
  tagPrefix?: string;
  branch: string;
  preRelease?: string;
  tag?: boolean;
  commit?: boolean;
  push?: boolean;
  dryRun?: boolean;
}

export function createReleaseCommand(): Command {
  const cmd = new Command("release")
    .description("Update all package versions in workspace")
    .option("-v, --version <version>", "Specific version to set")
    .option("--tag-prefix <prefix>", "Tag prefix (default: none)")
    .option("--branch <name>", "Branch to check (default: main)", "main")
    .option("--pre-release <name>", "Pre-release identifier")
    .option("--tag", "Create git tag after updating versions")
    .option("--commit", "Create git commit")
    .option("--push", "Push changes to remote")
    .option("--dry-run", "Show what would happen without making changes")
    .action(async (options: ReleaseCommandOptions) => {
      await runReleaseCommand(options);
    });

  return cmd;
}

export async function runReleaseCommand(options: ReleaseCommandOptions): Promise<void> {
  const cwd = process.cwd();
  const git = simpleGit(cwd);

  try {
    // Detect workspace
    const workspace = await detectWorkspace(cwd);
    if (workspace.type === "none") {
      console.log(chalk.yellow("No workspace detected, updating root package.json only"));
    } else {
      console.log(chalk.dim(`Detected ${workspace.type} workspace`));
    }

    // Determine version
    let newVersion: string;
    if (options.version) {
      newVersion = options.version;
      console.log(chalk.dim(`Using specified version: ${newVersion}`));
    } else {
      const versionOpts: VersionOptions = {
        prefix: options.tagPrefix || "",
        branch: options.branch,
        preRelease: options.preRelease,
      };
      newVersion = await getNextVersion(versionOpts);
      console.log(chalk.dim(`Calculated next version: ${newVersion}`));
    }

    // Discover packages
    const packages = await discoverPackages({ cwd, includeRoot: true });
    if (packages.length === 0) {
      console.error(chalk.red("No packages found"));
      process.exit(1);
    }

    console.log();
    console.log(chalk.bold(`Updating ${packages.length} package(s) to version ${chalk.green(newVersion)}`));
    console.log();

    // Update each package
    const updatedPackages: PackageInfo[] = [];
    for (const pkg of packages) {
      const oldVersion = pkg.version;
      if (oldVersion === newVersion) {
        console.log(chalk.dim(`  ${pkg.name} - already at ${newVersion}`));
        continue;
      }

      if (options.dryRun) {
        console.log(`  ${pkg.name}: ${chalk.dim(oldVersion)} → ${chalk.green(newVersion)} ${chalk.yellow("(dry-run)")}`);
      } else {
        updatePackageVersion(pkg.packageJsonPath, newVersion);
        console.log(`  ${pkg.name}: ${chalk.dim(oldVersion)} → ${chalk.green(newVersion)}`);
      }
      updatedPackages.push(pkg);
    }

    if (updatedPackages.length === 0) {
      console.log(chalk.yellow("\nNo packages needed updating"));
      return;
    }

    // Git commit
    if (options.commit) {
      console.log();
      const commitMsg = `chore(release): ${newVersion}`;

      if (options.dryRun) {
        console.log(chalk.yellow(`Would commit: "${commitMsg}"`));
      } else {
        await git.add(".");
        await git.commit(commitMsg);
        console.log(chalk.green(`✓ Committed: "${commitMsg}"`));
      }
    }

    // Git tag
    if (options.tag) {
      const tagName = `${options.tagPrefix || ""}${newVersion}`;

      if (options.dryRun) {
        console.log(chalk.yellow(`Would create tag: ${tagName}`));
      } else {
        await createTag(newVersion, {
          prefix: options.tagPrefix || "",
          message: `Release ${newVersion}`,
          cwd,
        });
        console.log(chalk.green(`✓ Created tag: ${tagName}`));
      }
    }

    // Git push
    if (options.push) {
      if (options.dryRun) {
        console.log(chalk.yellow("Would push to origin"));
        if (options.tag) {
          console.log(chalk.yellow("Would push tags"));
        }
      } else {
        await git.push();
        console.log(chalk.green("✓ Pushed to origin"));

        if (options.tag) {
          await git.pushTags();
          console.log(chalk.green("✓ Pushed tags"));
        }
      }
    }

    // Summary
    console.log();
    if (options.dryRun) {
      console.log(chalk.yellow("Dry run complete. No changes were made."));
    } else {
      console.log(chalk.green(`✓ Released version ${newVersion}`));
    }
  } catch (error) {
    console.error(chalk.red("Error:"), (error as Error).message);
    process.exit(1);
  }
}
