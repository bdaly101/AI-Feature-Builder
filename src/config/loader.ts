import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ConfigSchema, type Config, defaultConfig } from './schema.js';

const CONFIG_FILENAME = '.aifeaturerc.json';

export function loadConfig(cwd: string = process.cwd()): Config {
  const configPath = join(cwd, CONFIG_FILENAME);
  
  if (!existsSync(configPath)) {
    // Return default config with environment variables
    return {
      ...defaultConfig,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      githubToken: process.env.GITHUB_TOKEN,
    };
  }

  try {
    const configFile = readFileSync(configPath, 'utf-8');
    const configData = JSON.parse(configFile);
    
    // Handle env: prefix for environment variables
    if (configData.anthropicApiKey?.startsWith('env:')) {
      const envVar = configData.anthropicApiKey.substring(4);
      configData.anthropicApiKey = process.env[envVar] || configData.anthropicApiKey;
    }
    
    if (configData.githubToken?.startsWith('env:')) {
      const envVar = configData.githubToken.substring(4);
      configData.githubToken = process.env[envVar] || configData.githubToken;
    }
    
    // Merge with environment variables (env vars take precedence)
    const mergedConfig = {
      ...configData,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || configData.anthropicApiKey,
      githubToken: process.env.GITHUB_TOKEN || configData.githubToken,
    };
    
    const parsed = ConfigSchema.parse(mergedConfig);
    return parsed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
    }
    throw error;
  }
}

export { CONFIG_FILENAME };

