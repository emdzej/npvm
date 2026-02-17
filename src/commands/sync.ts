import { Command } from "commander";
import chalk from "chalk";
import {
  detectWorkspace,
  discoverPackages,
  getPackageMap,
  syncWorkspaceDependencies,
  type PackageInfo,
} from "../workspace/index.js";

export interface SyncCommandOptions {
  dryRun?: boolean;
}

export function createSyncCommand(): Command {
  const cmd = new Command("sync")
    .description("Sync workspace package dependencies")
    .option("--dry-run", "Show what would happen without making changes")
    .action(async (options: SyncCommandOptions) => {
      await runSyncCommand(options);
    });

  return cmd;
}

export async function runSyncCommand(options: SyncCommandOptions): Promise<void> {
  const cwd = process.cwd();

  try {
    // Detect workspace
    const workspace = await detectWorkspace(cwd);
    if (workspace.type === "none") {
      console.log(chalk.yellow("No workspace detected. Nothing to sync."));
      return;
    }

    console.log(chalk.dim(`Detected ${workspace.type} workspace`));
    console.log();

    // Discover packages and build map
    const packages = await discoverPackages({ cwd, includeRoot: true });
    const packageMap = await getPackageMap({ cwd, includeRoot: true });

    if (packages.length <= 1) {
      console.log(chalk.yellow("Only one package found. Nothing to sync."));
      return;
    }

    console.log(chalk.bold(`Syncing dependencies across ${packages.length} packages`));
    console.log();

    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const pkg of packages) {
      if (options.dryRun) {
        // For dry-run, we need to check what would be updated without modifying
        const result = previewSync(pkg, packageMap);
        if (result.updates.length > 0 || result.skipped.length > 0) {
          console.log(chalk.bold(pkg.name));
          for (const update of result.updates) {
            console.log(
              `  ${chalk.cyan(update.name)}: ${chalk.dim(update.oldVersion)} → ${chalk.green(update.newVersion)} ${chalk.yellow("(dry-run)")}`
            );
          }
          for (const skip of result.skipped) {
            console.log(
              `  ${chalk.cyan(skip.name)}: ${chalk.dim(skip.version)} ${chalk.dim("(workspace protocol, skipped)")}`
            );
          }
          console.log();
        }
        totalUpdated += result.updates.length;
        totalSkipped += result.skipped.length;
      } else {
        const { updated, skipped } = syncWorkspaceDependencies(pkg.packageJsonPath, packageMap);

        if (updated.length > 0 || skipped.length > 0) {
          console.log(chalk.bold(pkg.name));
          for (const dep of updated) {
            console.log(`  ${chalk.cyan(dep.name)}: → ${chalk.green(dep.version)}`);
          }
          for (const dep of skipped) {
            console.log(
              `  ${chalk.cyan(dep.name)}: ${chalk.dim(dep.version)} ${chalk.dim("(workspace protocol, skipped)")}`
            );
          }
          console.log();
        }
        totalUpdated += updated.length;
        totalSkipped += skipped.length;
      }
    }

    // Summary
    console.log(chalk.bold("Summary:"));
    console.log(`  Updated: ${chalk.green(totalUpdated)}`);
    console.log(`  Skipped: ${chalk.dim(totalSkipped)} (workspace protocol)`);

    if (options.dryRun) {
      console.log();
      console.log(chalk.yellow("Dry run complete. No changes were made."));
    } else if (totalUpdated > 0) {
      console.log();
      console.log(chalk.green("✓ Dependencies synced"));
    }
  } catch (error) {
    console.error(chalk.red("Error:"), (error as Error).message);
    process.exit(1);
  }
}

interface SyncPreview {
  updates: Array<{ name: string; oldVersion: string; newVersion: string; type: string }>;
  skipped: Array<{ name: string; version: string; type: string }>;
}

function previewSync(pkg: PackageInfo, packageMap: Map<string, PackageInfo>): SyncPreview {
  const updates: SyncPreview["updates"] = [];
  const skipped: SyncPreview["skipped"] = [];

  const depTypes = ["dependencies", "devDependencies", "peerDependencies"] as const;

  for (const type of depTypes) {
    const deps = pkg.packageJson[type];
    if (!deps || typeof deps !== "object") continue;

    for (const [name, version] of Object.entries(deps as Record<string, string>)) {
      const workspacePkg = packageMap.get(name);
      if (!workspacePkg) continue;

      if (version.startsWith("workspace:")) {
        skipped.push({ name, version, type });
        continue;
      }

      const prefixMatch = version.match(/^([~^])?/);
      const prefix = prefixMatch?.[1] || "";
      const newVersion = `${prefix}${workspacePkg.version}`;

      if (version !== newVersion) {
        updates.push({ name, oldVersion: version, newVersion, type });
      }
    }
  }

  return { updates, skipped };
}
