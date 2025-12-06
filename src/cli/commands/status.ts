import { Command } from 'commander';
import { RoadmapParser } from '../../core/roadmap-parser.js';
import { GitUtils } from '../../utils/git.js';
import { logger } from '../../utils/logger.js';
import chalk from 'chalk';

export function createStatusCommand(): Command {
  const command = new Command('status');

  command
    .description('Show implementation status')
    .option('--roadmap <path>', 'Path to ROADMAP.md', 'ROADMAP.md')
    .option('--feature <index>', 'Show status for specific feature')
    .action(async (options) => {
      try {
        const parser = new RoadmapParser(options.roadmap);
        const features = await parser.getPendingFeatures();
        const gitUtils = new GitUtils();

        const currentBranch = await gitUtils.getCurrentBranch();
        const isGitRepo = await gitUtils.isGitRepo();

        console.log(chalk.blue('📊 Implementation Status\n'));
        console.log(`Current branch: ${chalk.bold(currentBranch)}`);
        console.log(`Git repo: ${isGitRepo ? chalk.green('Yes') : chalk.red('No')}`);
        console.log(`Pending features: ${chalk.bold(features.length)}\n`);

        if (options.feature) {
          const featureIndex = parseInt(options.feature) - 1;
          if (featureIndex >= 0 && featureIndex < features.length) {
            const feature = features[featureIndex];
            console.log(chalk.bold(`Feature: ${feature.title}`));
            console.log(`Status: ${feature.status}`);
            if (feature.priority) {
              console.log(`Priority: ${feature.priority}`);
            }
            if (feature.description) {
              console.log(`Description: ${feature.description}`);
            }
          }
        } else {
          console.log(chalk.bold('Pending Features:'));
          features.forEach((feature, index) => {
            console.log(`  ${index + 1}. ${feature.title} (${feature.status})`);
          });
        }
      } catch (error) {
        logger.error('Failed to get status:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return command;
}

