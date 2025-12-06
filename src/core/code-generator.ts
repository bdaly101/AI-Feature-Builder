import { ClaudeClient } from '../ai/claude-client.js';
import { buildImplementationPrompt, type ImplementationContext } from '../ai/prompts/implementation.js';
import { SYSTEM_PROMPT_IMPLEMENTATION } from '../ai/prompts/system.js';
import { parseCodeResponse, validateParsedFiles } from '../ai/parser.js';
import { RoadmapFeature } from './roadmap-parser.js';
import { logger } from '../utils/logger.js';
import { readFile, findFiles, fileExists } from '../utils/fs.js';
import { join, relative } from 'path';
import type { Config } from '../config/schema.js';

export interface GeneratedCode {
  files: Record<string, string>;
  metadata?: {
    description?: string;
    dependencies?: string[];
    testFiles?: string[];
  };
}

export class CodeGenerator {
  private client: ClaudeClient;
  private config: Config;
  private projectRoot: string;

  constructor(config: Config, projectRoot: string = process.cwd()) {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.config = config;
    this.projectRoot = projectRoot;
    this.client = new ClaudeClient({
      apiKey: config.anthropicApiKey,
      model: config.ai?.model || 'claude-3-5-sonnet-20241022',
      maxTokens: config.ai?.maxTokens || 8192,
      temperature: config.ai?.temperature || 0.3,
    });
  }

  async generateCode(
    feature: RoadmapFeature,
    plan: string
  ): Promise<GeneratedCode> {
    logger.startSpinner('code-gen', 'Generating implementation code...');

    try {
      // Get project context
      const projectContext = await this.getProjectContext();
      const existingFiles = await this.getExistingFiles();

      // Build prompt
      const context: ImplementationContext = {
        feature,
        plan,
        projectContext,
        existingFiles,
      };

      const userPrompt = buildImplementationPrompt(context);

      // Generate code
      logger.updateSpinner('code-gen', 'Calling Claude API...');
      const response = await this.client.generateText(
        SYSTEM_PROMPT_IMPLEMENTATION,
        userPrompt
      );

      // Parse response
      logger.updateSpinner('code-gen', 'Parsing generated code...');
      const parsed = parseCodeResponse(response);

      // Validate
      const validation = validateParsedFiles(parsed);
      if (!validation.valid) {
        logger.failSpinner('code-gen', 'Validation failed');
        throw new Error(`Generated code validation failed: ${validation.errors.join(', ')}`);
      }

      // Filter out excluded patterns
      const filteredFiles: Record<string, string> = {};
      for (const [filePath, content] of Object.entries(parsed.files)) {
        if (this.shouldIncludeFile(filePath)) {
          filteredFiles[filePath] = content;
        }
      }

      logger.succeedSpinner('code-gen', `Generated ${Object.keys(filteredFiles).length} file(s)`);

      return {
        files: filteredFiles,
        metadata: parsed.metadata,
      };
    } catch (error) {
      logger.failSpinner('code-gen', 'Code generation failed');
      throw error;
    }
  }

  private async getProjectContext(): Promise<string> {
    const context: string[] = [];

    // Read package.json
    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (fileExists(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFile(packageJsonPath));
        context.push(`Project: ${pkg.name || 'Unknown'}`);
        context.push(`Type: ${pkg.type || 'CommonJS'}`);
        if (pkg.dependencies) {
          context.push(`Dependencies: ${Object.keys(pkg.dependencies).join(', ')}`);
        }
        if (pkg.devDependencies) {
          context.push(`Dev Dependencies: ${Object.keys(pkg.devDependencies).join(', ')}`);
        }
      } catch (error) {
        logger.warn('Failed to parse package.json:', error instanceof Error ? error.message : error);
      }
    }

    // Read ROADMAP.md
    const roadmapPath = join(this.projectRoot, 'ROADMAP.md');
    if (fileExists(roadmapPath)) {
      try {
        const roadmap = readFile(roadmapPath);
        context.push(`\nRoadmap excerpt:\n${roadmap.substring(0, 1000)}`);
      } catch (error) {
        logger.warn('Failed to read ROADMAP.md:', error instanceof Error ? error.message : error);
      }
    }

    // Get project structure
    const srcPath = join(this.projectRoot, 'src');
    if (fileExists(srcPath)) {
      const files = findFiles(srcPath, /\.(ts|tsx|js|jsx)$/, [
        /node_modules/,
        /dist/,
        /\.test\./,
        /\.spec\./,
      ]);
      context.push(`\nSource files: ${files.slice(0, 20).join(', ')}`);
    }

    return context.join('\n');
  }

  private async getExistingFiles(): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    const srcPath = join(this.projectRoot, 'src');

    if (!fileExists(srcPath)) {
      return files;
    }

    const sourceFiles = findFiles(srcPath, /\.(ts|tsx|js|jsx)$/, [
      /node_modules/,
      /dist/,
      /\.test\./,
      /\.spec\./,
    ]);

    // Read up to 10 files for context
    for (const filePath of sourceFiles.slice(0, 10)) {
      try {
        const content = readFile(filePath);
        const relativePath = relative(this.projectRoot, filePath);
        files[relativePath] = content.substring(0, 2000); // Limit size
      } catch (error) {
        logger.debug(`Failed to read ${filePath}:`, error instanceof Error ? error.message : error);
      }
    }

    return files;
  }

  private shouldIncludeFile(filePath: string): boolean {
    // Check exclude patterns
    for (const pattern of this.config.excludePatterns || []) {
      // Simple glob matching
      const regex = new RegExp(
        pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace(/\//g, '\\/')
      );
      if (regex.test(filePath)) {
        return false;
      }
    }

    // Check file size
    // We can't check actual size until we write, but we can estimate
    return true;
  }
}

