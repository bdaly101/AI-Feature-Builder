#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createListCommand } from './commands/list.js';
import { createImplementCommand } from './commands/implement.js';
import { createPlanCommand } from './commands/plan.js';
import { createStatusCommand } from './commands/status.js';
import { createInitCommand } from './commands/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
  .name('ai-feature-builder')
  .description('AI-powered feature implementation from ROADMAP.md')
  .version(packageJson.version);

// Register commands
program.addCommand(createListCommand());
program.addCommand(createImplementCommand());
program.addCommand(createPlanCommand());
program.addCommand(createStatusCommand());
program.addCommand(createInitCommand());

// Parse arguments
program.parse();

