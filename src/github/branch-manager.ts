import { GitUtils } from '../utils/git.js';
import { logger } from '../utils/logger.js';

export class BranchManager {
  private gitUtils: GitUtils;

  constructor(repoPath: string = process.cwd()) {
    this.gitUtils = new GitUtils(repoPath);
  }

  /**
   * Create a feature branch from base branch
   */
  async createFeatureBranch(branchName: string, baseBranch: string = 'dev'): Promise<void> {
    try {
      await this.gitUtils.createBranch(branchName, baseBranch);
      logger.success(`Created branch: ${branchName}`);
    } catch (error) {
      logger.error(`Failed to create branch ${branchName}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  /**
   * Check if branch exists
   */
  async branchExists(branchName: string): Promise<boolean> {
    return this.gitUtils.branchExists(branchName);
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(): Promise<string> {
    return this.gitUtils.getCurrentBranch();
  }

  /**
   * Push branch to remote
   */
  async pushBranch(branchName: string): Promise<void> {
    try {
      const git = this.gitUtils.getGitInstance();
      await git.push('origin', branchName, ['--set-upstream']);
      logger.success(`Pushed branch: ${branchName}`);
    } catch (error) {
      logger.error(`Failed to push branch ${branchName}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }
}

