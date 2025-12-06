import { Anthropic } from '@anthropic-ai/sdk';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import simpleGit from 'simple-git';
import { RoadmapFeature } from './roadmap-parser';

export class FeatureBuilder {
  private anthropic: Anthropic;
  private git: ReturnType<typeof simpleGit>;
  private projectPath: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    
    this.anthropic = new Anthropic({ apiKey });
    this.projectPath = process.cwd();
    this.git = simpleGit(this.projectPath);
  }

  async createImplementationPlan(feature: RoadmapFeature): Promise<string> {
    const context = await this.getProjectContext();
    
    const prompt = `You are a software development assistant. Create a detailed implementation plan for the following feature from the project roadmap.

Feature: ${feature.title}
Description: ${feature.description}

Project Context:
${context}

Create a step-by-step implementation plan that includes:
1. Files that need to be created or modified
2. Dependencies that need to be added
3. Test cases that should be written
4. Any configuration changes needed
5. Estimated complexity

Format the plan as a markdown document.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      
      const content = message.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      
      throw new Error('Unexpected response format');
    } catch (error) {
      throw new Error(`Failed to create plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async implementFeature(feature: RoadmapFeature): Promise<void> {
    console.log(chalk.blue(`🚀 Implementing: ${feature.title}`));
    console.log('');
    
    // Ensure we're on dev branch
    const currentBranch = await this.git.branch();
    if (currentBranch.current !== 'dev') {
      console.log(chalk.yellow(`⚠️  Not on dev branch. Current: ${currentBranch.current}`));
      console.log(chalk.yellow('   Creating feature branch from dev...'));
      await this.git.checkout('dev');
      await this.git.pull();
    }
    
    // Create feature branch
    const branchName = `feature/${feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    console.log(chalk.blue(`Creating branch: ${branchName}`));
    await this.git.checkoutBranch(branchName, 'dev');
    
    // Get implementation plan
    console.log(chalk.blue('📋 Creating implementation plan...'));
    const plan = await this.createImplementationPlan(feature);
    
    // Save plan to file
    const planPath = path.join(this.projectPath, '.feature-plan.md');
    fs.writeFileSync(planPath, plan, 'utf-8');
    console.log(chalk.green(`✓ Plan saved to ${planPath}`));
    
    // Generate implementation code
    console.log(chalk.blue('💻 Generating implementation code...'));
    const implementation = await this.generateImplementation(feature, plan);
    
    // Apply implementation
    await this.applyImplementation(implementation);
    
    // Generate tests
    console.log(chalk.blue('🧪 Generating tests...'));
    await this.generateTests(feature);
    
    // Commit changes
    console.log(chalk.blue('📝 Committing changes...'));
    await this.git.add('.');
    await this.git.commit(`feat: implement ${feature.title}`);
    
    console.log(chalk.green(`✓ Feature implementation complete!`));
    console.log(chalk.blue(`Branch: ${branchName}`));
    console.log(chalk.blue(`Next: Create PR to dev branch`));
  }

  private async generateImplementation(feature: RoadmapFeature, plan: string): Promise<string> {
    const context = await this.getProjectContext();
    
    const prompt = `You are a software development assistant. Implement the following feature based on the implementation plan.

Feature: ${feature.title}
Description: ${feature.description}

Implementation Plan:
${plan}

Project Context:
${context}

Generate the complete implementation code. Include:
1. All necessary file changes
2. Proper imports and dependencies
3. Type definitions if needed
4. Error handling
5. Comments explaining complex logic

Format the response as a JSON object with file paths as keys and file contents as values:
{
  "path/to/file.ts": "file content here",
  "path/to/other.ts": "other file content"
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      
      const content = message.content[0];
      if (content.type === 'text') {
        // Extract JSON from response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return jsonMatch[0];
        }
        throw new Error('No JSON found in response');
      }
      
      throw new Error('Unexpected response format');
    } catch (error) {
      throw new Error(`Failed to generate implementation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async applyImplementation(implementationJson: string): Promise<void> {
    const files = JSON.parse(implementationJson);
    
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(this.projectPath, filePath);
      const dir = path.dirname(fullPath);
      
      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(fullPath, content as string, 'utf-8');
      console.log(chalk.green(`✓ Created/updated: ${filePath}`));
    }
  }

  private async generateTests(feature: RoadmapFeature): Promise<void> {
    // Use AI-Test-Generator if available, otherwise generate inline
    try {
      execSync('which ai-test-generator', { stdio: 'ignore' });
      execSync('ai-test-generator generate --changed-files', { cwd: this.projectPath });
    } catch (error) {
      console.log(chalk.yellow('⚠️  AI-Test-Generator not available, skipping test generation'));
    }
  }

  private async getProjectContext(): Promise<string> {
    const context: string[] = [];
    
    // Read package.json
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      context.push(`Project: ${pkg.name || 'Unknown'}`);
      context.push(`Type: ${pkg.type || 'CommonJS'}`);
      if (pkg.dependencies) {
        context.push(`Dependencies: ${Object.keys(pkg.dependencies).join(', ')}`);
      }
    }
    
    // Read ROADMAP.md
    const roadmapPath = path.join(this.projectPath, 'ROADMAP.md');
    if (fs.existsSync(roadmapPath)) {
      const roadmap = fs.readFileSync(roadmapPath, 'utf-8');
      context.push(`\nRoadmap excerpt:\n${roadmap.substring(0, 1000)}`);
    }
    
    // Get project structure
    const srcPath = path.join(this.projectPath, 'src');
    if (fs.existsSync(srcPath)) {
      const files = this.getSourceFiles(srcPath);
      context.push(`\nSource files: ${files.slice(0, 20).join(', ')}`);
    }
    
    return context.join('\n');
  }

  private getSourceFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.getSourceFiles(filePath, fileList);
      } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        fileList.push(path.relative(this.projectPath, filePath));
      }
    });
    
    return fileList;
  }
}

