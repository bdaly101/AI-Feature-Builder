import { Command } from 'commander';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CONFIG_FILENAME, defaultConfig } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export function createInitCommand(): Command {
  const command = new Command('init');

  command
    .description('Initialize AI Feature Builder configuration')
    .option('-f, --force', 'Overwrite existing configuration')
    .action(async (options) => {
      const configPath = join(process.cwd(), CONFIG_FILENAME);

      if (existsSync(configPath) && !options.force) {
        logger.error(`Configuration file already exists: ${configPath}`);
        logger.error('Use --force to overwrite');
        process.exit(1);
      }

      const config = {
        ...defaultConfig,
        // Don't include API keys in the file - use environment variables
      };

      try {
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        logger.success(`Created configuration file: ${configPath}`);
        logger.info('\nNext steps:');
        logger.info('1. Set environment variables:');
        logger.info('   - ANTHROPIC_API_KEY (required)');
        logger.info('   - GITHUB_TOKEN (optional, for PR creation)');
        logger.info('2. Customize the configuration as needed');
        logger.info('3. Run `ai-feature-builder list` to see pending features');
      } catch (error) {
        logger.error(`Failed to create configuration file: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  return command;
}

