import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

export interface ClaudeClientOptions {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  retryDelay?: number;
  maxTokens?: number;
  temperature?: number;
}

export class ClaudeClient {
  private client: Anthropic;
  private model: string;
  private maxRetries: number;
  private retryDelay: number;
  private maxTokens: number;
  private temperature: number;

  constructor(options: ClaudeClientOptions) {
    if (!options.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.model = options.model || 'claude-3-5-sonnet-20241022';
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.maxTokens = options.maxTokens || 8192;
    this.temperature = options.temperature ?? 0.3;
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    return this.executeWithRetry(async () => {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return content.text;
    });
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a rate limit error
        const isRateLimit = this.isRateLimitError(lastError);
        const isRetryable = this.isRetryableError(lastError);

        if (!isRetryable || attempt === this.maxRetries) {
          throw lastError;
        }

        // Calculate exponential backoff delay
        const delay = isRateLimit
          ? this.retryDelay * Math.pow(2, attempt) * 2 // Longer delay for rate limits
          : this.retryDelay * Math.pow(2, attempt);

        logger.warn(
          `Request failed (attempt ${attempt + 1}/${this.maxRetries + 1}): ${lastError.message}. Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Unknown error occurred');
  }

  private isRateLimitError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('too many requests')
    );
  }

  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      this.isRateLimitError(error) ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

