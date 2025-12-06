import { RoadmapFeature } from './roadmap-parser.js';
import { CodeGenerator, type GeneratedCode } from './code-generator.js';
import { FileWriter } from './file-writer.js';
import { ClaudeClient } from '../ai/claude-client.js';
import { buildPlanningPrompt } from '../ai/prompts/planning.js';
import { SYSTEM_PROMPT_PLANNING } from '../ai/prompts/system.js';
import { parsePlanResponse } from '../ai/parser.js';
import { GitUtils } from '../utils/git.js';
import { logger } from '../utils/logger.js';
import { execSync } from 'child_process';
import type { Config } from '../config/schema.js';

export interface ImplementationResult {
  branchName: string;
  filesWritten: string[];
  plan: string;
  success: boolean;
  error?: string;
}

export class FeatureBuilder {
  private config: Config;
  private projectRoot: string;
  private gitUtils: GitUtils;
  private planningClient: ClaudeClient;
  private codeGenerator: CodeGenerator;
  private fileWriter: FileWriter;

  constructor(config: Config, projectRoot: string = process.cwd()) {
    this.config = config;
    this.projectRoot = projectRoot;
    this.gitUtils = new GitUtils(projectRoot);

    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.planningClient = new ClaudeClient({
      apiKey: config.anthropicApiKey,
      model: config.ai?.model || 'claude-3-5-sonnet-20241022',
      maxTokens: config.ai?.maxTokens || 8192,
      temperature: config.ai?.temperature || 0.3,
    });

    this.codeGenerator = new CodeGenerator(config, projectRoot);
    this.fileWriter = new FileWriter(config, projectRoot);
  }

  /**
   * Generate implementation plan for a feature
   */
  async createPlan(feature: RoadmapFeature): Promise<string> {
    logger.startSpinner('planning', 'Creating implementation plan...');

    try {
      const projectContext = await this.getProjectContext();
      const existingFiles = await this.getSourceFiles();
      const dependencies = await this.getDependencies();

      const userPrompt = buildPlanningPrompt({
        feature,
        projectContext,
        existingFiles,
        dependencies,
      });

      const response = await this.planningClient.generateText(
        SYSTEM_PROMPT_PLANNING,
        userPrompt
      );

      const plan = parsePlanResponse(response);
      logger.succeedSpinner('planning', 'Plan created successfully');

      return plan;
    } catch (error) {
      logger.failSpinner('planning', 'Failed to create plan');
      throw error;
    }
  }

  /**
   * Implement a feature end-to-end
   */
  async implementFeature(feature: RoadmapFeature, dryRun: boolean = false): Promise<ImplementationResult> {
    logger.info(`🚀 Implementing: ${feature.title}`);
    if (dryRun) {
      logger.warn('DRY RUN MODE - No changes will be made');
    }

    const branchName = this.generateBranchName(feature);

    try {
      // 1. Ensure we're on base branch
      await this.ensureBaseBranch();

      // 2. Create feature branch
      if (!dryRun) {
        await this.gitUtils.createBranch(branchName, this.config.baseBranch);
        logger.success(`Created branch: ${branchName}`);
      } else {
        logger.info(`Would create branch: ${branchName}`);
      }

      // 3. Generate plan
      const plan = await this.createPlan(feature);

      if (dryRun) {
        return {
          branchName,
          filesWritten: [],
          plan,
          success: true,
        };
      }

      // 4. Generate code
      const generatedCode = await this.codeGenerator.generateCode(feature, plan);

      // 5. Write files
      const filesWritten = await this.fileWriter.writeFiles(generatedCode.files);

      // 6. Generate tests if enabled
      if (this.config.autoGenerateTests) {
        await this.generateTests();
      }

      // 7. Commit changes
      await this.commitChanges(feature, filesWritten);

      logger.success('✅ Feature implementation complete!');
      logger.info(`Branch: ${branchName}`);
      logger.info(`Next: Create PR to ${this.config.baseBranch} branch`);

      return {
        branchName,
        filesWritten,
        plan,
        success: true,
      };
    } catch (error) {
      logger.error('Implementation failed:', error instanceof Error ? error.message : error);

      // Rollback on failure
      if (!dryRun && this.config.rollbackOnFailure) {
        await this.fileWriter.rollback();
      }

      return {
        branchName,
        filesWritten: [],
        plan: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async ensureBaseBranch(): Promise<void> {
    const currentBranch = await this.gitUtils.getCurrentBranch();
    if (currentBranch !== this.config.baseBranch) {
      logger.warn(`Not on ${this.config.baseBranch} branch. Current: ${currentBranch}`);
      logger.info(`Switching to ${this.config.baseBranch}...`);
      const git = this.gitUtils.getGitInstance();
      await git.checkout(this.config.baseBranch);
      await git.pull();
    }
  }

  private generateBranchName(feature: RoadmapFeature): string {
    const sanitized = feature.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${this.config.branchPrefix}/${sanitized}`;
  }

  private async generateTests(): Promise<void> {
    try {
      logger.startSpinner('tests', 'Generating tests...');
      execSync(this.config.testGenerator || 'ai-test-generator generate --staged', {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });
      logger.succeedSpinner('tests', 'Tests generated');
    } catch (error) {
      logger.failSpinner('tests', 'Test generation failed (non-fatal)');
      logger.warn('Test generation failed, continuing...');
    }
  }

  private async commitChanges(feature: RoadmapFeature, files: string[]): Promise<void> {
    logger.startSpinner('commit', 'Committing changes...');
    try {
      const git = this.gitUtils.getGitInstance();
      await git.add(files);
      await git.commit(`feat: implement ${feature.title}`);
      logger.succeedSpinner('commit', 'Changes committed');
    } catch (error) {
      logger.failSpinner('commit', 'Commit failed');
      throw error;
    }
  }

  private async getProjectContext(): Promise<string> {
    // Similar to CodeGenerator.getProjectContext
    const { readFile, fileExists } = await import('../utils/fs.js');
    const { join } = await import('path');
    const context: string[] = [];

    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (fileExists(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFile(packageJsonPath));
        context.push(`Project: ${pkg.name || 'Unknown'}`);
        context.push(`Type: ${pkg.type || 'CommonJS'}`);
      } catch {
        // Ignore
      }
    }

    return context.join('\n');
  }

  private async getSourceFiles(): Promise<string[]> {
    const { findFiles, fileExists } = await import('../utils/fs.js');
    const { join } = await import('path');
    const srcPath = join(this.projectRoot, 'src');
    if (fileExists(srcPath)) {
      return findFiles(srcPath, /\.(ts|tsx|js|jsx)$/, [/node_modules/, /dist/]);
    }
    return [];
  }

  private async getDependencies(): Promise<string[]> {
    const { readFile, fileExists } = await import('../utils/fs.js');
    const { join } = await import('path');
    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (fileExists(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFile(packageJsonPath));
        return [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.devDependencies || {}),
        ];
      } catch {
        return [];
      }
    }
    return [];
  }
}

