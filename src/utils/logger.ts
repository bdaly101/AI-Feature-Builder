import chalk from 'chalk';
import ora, { Ora } from 'ora';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerOptions {
  level?: LogLevel;
  verbose?: boolean;
}

export class Logger {
  private level: LogLevel;
  private verbose: boolean;
  private spinners: Map<string, Ora> = new Map();

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.verbose = options.verbose ?? false;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(chalk.gray(`[DEBUG] ${message}`), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(chalk.blue('ℹ'), message, ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(chalk.green('✓'), message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(chalk.yellow('⚠'), message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(chalk.red('✗'), message, ...args);
    }
  }

  /**
   * Start a spinner for async operations
   */
  startSpinner(id: string, text: string): void {
    this.stopSpinner(id);
    const spinner = ora(text).start();
    this.spinners.set(id, spinner);
  }

  /**
   * Update spinner text
   */
  updateSpinner(id: string, text: string): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.text = text;
    }
  }

  /**
   * Stop and succeed spinner
   */
  succeedSpinner(id: string, text?: string): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.succeed(text);
      this.spinners.delete(id);
    }
  }

  /**
   * Stop and fail spinner
   */
  failSpinner(id: string, text?: string): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.fail(text);
      this.spinners.delete(id);
    }
  }

  /**
   * Stop spinner without message
   */
  stopSpinner(id: string): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.stop();
      this.spinners.delete(id);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level || (this.verbose && level === LogLevel.DEBUG);
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
    if (verbose) {
      this.level = LogLevel.DEBUG;
    }
  }
}

export const logger = new Logger();

