#!/usr/bin/env node
import { Command } from "commander";
import { createVersionCommand, createReleaseCommand, createSyncCommand } from "./commands/index.js";

const program = new Command();

program
  .name("npvm")
  .description("Node Package Version Manager - CLI for monorepo versioning")
  .version("0.0.0");

// Add commands
program.addCommand(createVersionCommand());
program.addCommand(createReleaseCommand());
program.addCommand(createSyncCommand());

program.parse();
