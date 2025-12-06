import { Command } from 'commander';
import { RoadmapParser } from '../../core/roadmap-parser.js';
import { logger } from '../../utils/logger.js';
import chalk from 'chalk';

export function createListCommand(): Command {
  const command = new Command('list');

  command
    .description('List pending features from ROADMAP.md')
    .option('--roadmap <path>', 'Path to ROADMAP.md', 'ROADMAP.md')
    .option('--format <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        const parser = new RoadmapParser(options.roadmap);
        const features = await parser.getPendingFeatures();

        if (options.format === 'json') {
          console.log(JSON.stringify(features, null, 2));
          return;
        }

        console.log(chalk.blue('📋 Pending Features:'));
        console.log('');

        if (features.length === 0) {
          console.log(chalk.yellow('No pending features found'));
          return;
        }

        features.forEach((feature, index) => {
          console.log(`${index + 1}. ${chalk.bold(feature.title)}`);
          if (feature.description) {
            const desc = feature.description.length > 80
              ? feature.description.substring(0, 80) + '...'
              : feature.description;
            console.log(`   ${chalk.gray(desc)}`);
          }
          if (feature.priority) {
            const priorityColor = feature.priority === 'high' ? 'red' : feature.priority === 'medium' ? 'yellow' : 'blue';
            console.log(`   ${chalk[priorityColor](`Priority: ${feature.priority}`)}`);
          }
          if (feature.status === 'in-progress') {
            console.log(`   ${chalk.yellow('Status: in-progress')}`);
          }
          console.log('');
        });
      } catch (error) {
        logger.error('Failed to list features:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return command;
}

