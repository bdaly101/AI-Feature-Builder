import { writeFile, backupFile, restoreFile, fileExists, ensureDir } from '../utils/fs.js';
import { join, dirname } from 'path';
import { logger } from '../utils/logger.js';
import type { Config } from '../config/schema.js';

export interface FileBackup {
  originalPath: string;
  backupPath: string;
}

export class FileWriter {
  private config: Config;
  private projectRoot: string;
  private backups: FileBackup[] = [];
  private backupDir: string;

  constructor(config: Config, projectRoot: string = process.cwd()) {
    this.config = config;
    this.projectRoot = projectRoot;
    this.backupDir = join(projectRoot, '.ai-feature-backups');
  }

  /**
   * Write generated files to disk with backup support
   */
  async writeFiles(files: Record<string, string>): Promise<string[]> {
    const writtenFiles: string[] = [];

    logger.startSpinner('file-write', 'Writing files to disk...');

    try {
      // Create backup directory
      if (this.config.rollbackOnFailure) {
        ensureDir(this.backupDir);
      }

      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = join(this.projectRoot, filePath);

        // Backup existing file if it exists
        if (this.config.rollbackOnFailure && fileExists(fullPath)) {
          const backupPath = join(
            this.backupDir,
            `${filePath.replace(/\//g, '_')}.backup`
          );
          backupFile(fullPath, backupPath);
          this.backups.push({
            originalPath: fullPath,
            backupPath,
          });
        }

        // Write file
        writeFile(fullPath, content);
        writtenFiles.push(fullPath);
        logger.debug(`Written: ${filePath}`);
      }

      logger.succeedSpinner('file-write', `Written ${writtenFiles.length} file(s)`);
      return writtenFiles;
    } catch (error) {
      logger.failSpinner('file-write', 'Failed to write files');
      
      // Rollback on failure
      if (this.config.rollbackOnFailure) {
        await this.rollback();
      }
      
      throw error;
    }
  }

  /**
   * Rollback all changes
   */
  async rollback(): Promise<void> {
    logger.warn('Rolling back changes...');

    for (const backup of this.backups) {
      try {
        restoreFile(backup.backupPath, backup.originalPath);
        logger.debug(`Restored: ${backup.originalPath}`);
      } catch (error) {
        logger.error(`Failed to restore ${backup.originalPath}:`, error instanceof Error ? error.message : error);
      }
    }

    this.backups = [];
    logger.success('Rollback complete');
  }

  /**
   * Clean up backup directory
   */
  async cleanup(): Promise<void> {
    // Keep backups for now - user can clean up manually
    // In production, could add cleanup logic here
  }

  /**
   * Get list of written files
   */
  getWrittenFiles(): string[] {
    return this.backups.map(b => b.originalPath);
  }
}

