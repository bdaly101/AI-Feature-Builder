import { Command } from 'commander';
import { RoadmapParser } from '../../core/roadmap-parser.js';
import { FeatureBuilder } from '../../core/feature-builder.js';
import { loadConfig } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { writeFile } from '../../utils/fs.js';
import chalk from 'chalk';

export function createPlanCommand(): Command {
  const command = new Command('plan');

  command
    .description('Generate implementation plan for a feature without implementing')
    .option('--roadmap <path>', 'Path to ROADMAP.md', 'ROADMAP.md')
    .option('--feature <index>', 'Feature index to plan')
    .option('--output <path>', 'Save plan to file')
    .action(async (options) => {
      try {
        const config = loadConfig();
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
          // Use first feature if not specified
          logger.info(`No feature specified, using first feature: ${features[0].title}`);
        }

        const feature = features[featureIndex];
        const builder = new FeatureBuilder(config);

        logger.info(`Creating plan for: ${chalk.bold(feature.title)}`);
        const plan = await builder.createPlan(feature);

        if (options.output) {
          writeFile(options.output, plan);
          logger.success(`Plan saved to: ${options.output}`);
        } else {
          console.log('\n' + chalk.blue('Implementation Plan:'));
          console.log('─'.repeat(60));
          console.log(plan);
        }
      } catch (error) {
        logger.error('Failed to create plan:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return command;
}

