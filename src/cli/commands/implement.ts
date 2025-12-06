import { Command } from 'commander';
import inquirer from 'inquirer';
import { RoadmapParser } from '../../core/roadmap-parser.js';
import { FeatureBuilder } from '../../core/feature-builder.js';
import { loadConfig } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import chalk from 'chalk';

export function createImplementCommand(): Command {
  const command = new Command('implement');

  command
    .description('Implement a feature from ROADMAP.md')
    .option('--roadmap <path>', 'Path to ROADMAP.md', 'ROADMAP.md')
    .option('--feature <index>', 'Feature index to implement')
    .option('--dry-run', 'Preview implementation without making changes')
    .option('--no-tests', 'Skip test generation')
    .action(async (options) => {
      try {
        const config = loadConfig();
        
        // Override config if needed
        if (options.noTests) {
          config.autoGenerateTests = false;
        }

        const parser = new RoadmapParser(options.roadmap);
        const features = await parser.getPendingFeatures();

        if (features.length === 0) {
          logger.warn('No pending features found');
          return;
        }

        let featureIndex = 0;
        if (options.feature) {
          featureIndex = parseInt(options.feature) - 1;
          if (featureIndex < 0 || featureIndex >= features.length) {
            logger.error(`Invalid feature index: ${options.feature}`);
            process.exit(1);
          }
        } else {
          // Interactive selection
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'feature',
              message: 'Select a feature to implement:',
              choices: features.map((f, i) => ({
                name: `${i + 1}. ${f.title}${f.description ? ` - ${f.description.substring(0, 50)}...` : ''}`,
                value: i,
              })),
            },
          ]);
          featureIndex = answer.feature;
        }

        const feature = features[featureIndex];
        const builder = new FeatureBuilder(config);

        // Confirm before implementing
        if (!options.dryRun) {
          const confirm = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: `Implement "${feature.title}"?`,
              default: true,
            },
          ]);

          if (!confirm.proceed) {
            logger.info('Cancelled');
            return;
          }
        }

        const result = await builder.implementFeature(feature, options.dryRun);

        if (result.success) {
          logger.success('✅ Implementation complete!');
          if (!options.dryRun) {
            logger.info(`Branch: ${result.branchName}`);
            logger.info(`Files: ${result.filesWritten.length}`);
          }
        } else {
          logger.error(`Implementation failed: ${result.error}`);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Implementation failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return command;
}

