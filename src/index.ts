#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { createVersionCommand, createReleaseCommand } from "./commands/index.js";

const program = new Command();

program
  .name("npmx")
  .description("Node Package Manager Extended - CLI for monorepo versioning")
  .version("0.0.0");

// Add commands
program.addCommand(createVersionCommand());
program.addCommand(createReleaseCommand());

program
  .command("sync")
  .description("Sync workspace package dependencies")
  .option("--dry-run", "Show what would happen without making changes")
  .action(async (options) => {
    console.log(chalk.blue("npmx sync"), options);
    console.log(chalk.yellow("Not implemented yet - see #6"));
  });

program.parse();
