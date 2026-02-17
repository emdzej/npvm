#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { createVersionCommand } from "./commands/index.js";

const program = new Command();

program
  .name("npmx")
  .description("Node Package Manager Extended - CLI for monorepo versioning")
  .version("0.0.0");

// Add commands
program.addCommand(createVersionCommand());

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
    console.log(chalk.yellow("Not implemented yet - see #5"));
  });

program
  .command("sync")
  .description("Sync workspace package dependencies")
  .option("--dry-run", "Show what would happen without making changes")
  .action(async (options) => {
    console.log(chalk.blue("npmx sync"), options);
    console.log(chalk.yellow("Not implemented yet - see #6"));
  });

program.parse();
