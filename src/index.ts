#!/usr/bin/env node
import { Command } from "commander";
import { createVersionCommand, createReleaseCommand, createSyncCommand } from "./commands/index.js";

const program = new Command();

program
  .name("npmx")
  .description("Node Package Manager Extended - CLI for monorepo versioning")
  .version("0.0.0");

// Add commands
program.addCommand(createVersionCommand());
program.addCommand(createReleaseCommand());
program.addCommand(createSyncCommand());

program.parse();
