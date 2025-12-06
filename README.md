# AI Feature Builder

AI-powered feature implementation tool that reads ROADMAP.md and automatically implements features using Claude AI.

## Features

- 📋 **ROADMAP.md Parsing**: Automatically extracts pending features from your roadmap
- 🤖 **AI-Powered Implementation**: Uses Claude AI to generate implementation plans and code
- 🔀 **Git Integration**: Automatically creates feature branches and commits changes
- 🧪 **Test Generation**: Integrates with AI-Test-Generator for automatic test creation
- 📝 **Interactive Selection**: Choose features interactively with inquirer
- ⚡ **Progress Tracking**: Real-time progress indicators with ora spinners
- 🔄 **Rollback Support**: Automatic rollback on implementation failures
- ✅ **Code Validation**: Validates generated code before applying

## Installation

```bash
npm install -g ai-feature-builder
```

Or use locally in a project:

```bash
npm install --save-dev ai-feature-builder
```

## Quick Start

### 1. Initialize Configuration

```bash
ai-feature-builder init
```

This creates a `.aifeaturerc.json` file with default settings.

### 2. Set Environment Variables

```bash
export ANTHROPIC_API_KEY="your-api-key"
export GITHUB_TOKEN="your-github-token"  # Optional, for PR creation
```

### 3. List Pending Features

```bash
ai-feature-builder list
```

### 4. Implement a Feature

```bash
# Interactive selection
ai-feature-builder implement

# By index
ai-feature-builder implement --feature 1

# Dry run (preview only)
ai-feature-builder implement --feature 1 --dry-run
```

## Commands

### `list`

List all pending features from ROADMAP.md

```bash
ai-feature-builder list
ai-feature-builder list --roadmap ./docs/ROADMAP.md
ai-feature-builder list --format json
```

### `plan`

Generate implementation plan without executing

```bash
ai-feature-builder plan --feature 1
ai-feature-builder plan --feature 1 --output plan.md
```

### `implement`

Implement a feature

```bash
# Interactive selection
ai-feature-builder implement

# By index
ai-feature-builder implement --feature 1

# Dry run
ai-feature-builder implement --feature 1 --dry-run

# Skip tests
ai-feature-builder implement --feature 1 --no-tests
```

### `status`

Show implementation status

```bash
ai-feature-builder status
ai-feature-builder status --feature 1
```

### `init`

Initialize configuration

```bash
ai-feature-builder init
ai-feature-builder init --force
```

## Configuration

The `.aifeaturerc.json` file supports the following options:

```json
{
  "$schema": "https://ai-feature-builder.dev/schema.json",
  "anthropicApiKey": "env:ANTHROPIC_API_KEY",
  "githubToken": "env:GITHUB_TOKEN",
  "baseBranch": "dev",
  "branchPrefix": "feature",
  "autoCreatePR": false,
  "autoGenerateTests": true,
  "testGenerator": "ai-test-generator",
  "rollbackOnFailure": true,
  "validateCode": true,
  "maxFileSize": 100000,
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "**/*.test.ts"
  ],
  "ai": {
    "model": "claude-3-5-sonnet-20241022",
    "temperature": 0.3,
    "maxTokens": 8192
  }
}
```

## How It Works

1. **Parse ROADMAP.md**: Extracts pending features from markdown
2. **Create Plan**: AI generates detailed implementation plan
3. **Generate Code**: AI writes all necessary code changes
4. **Generate Tests**: Uses AI-Test-Generator to create tests
5. **Create Branch**: Creates feature branch from `dev`
6. **Commit**: Commits all changes with descriptive message

## Project Structure

```
src/
├── cli/
│   ├── commands/
│   │   ├── list.ts          # List command
│   │   ├── implement.ts     # Implement command
│   │   ├── plan.ts          # Plan command
│   │   ├── status.ts        # Status command
│   │   └── init.ts          # Init command
│   └── index.ts             # CLI entry point
├── core/
│   ├── roadmap-parser.ts    # ROADMAP.md parsing
│   ├── feature-builder.ts    # Core orchestration
│   ├── code-generator.ts     # AI code generation
│   └── file-writer.ts        # File operations with rollback
├── ai/
│   ├── claude-client.ts      # Claude API with retry logic
│   ├── parser.ts             # Response parsing
│   └── prompts/
│       ├── system.ts         # System prompts
│       ├── planning.ts       # Planning prompts
│       └── implementation.ts # Implementation prompts
├── github/
│   ├── branch-manager.ts     # Branch management
│   └── pr-creator.ts         # PR creation
├── config/
│   ├── schema.ts             # Zod config validation
│   └── loader.ts             # Config loader
└── utils/
    ├── logger.ts             # Logging with spinners
    ├── git.ts                # Git utilities
    └── fs.ts                 # File system helpers
```

## Development

```bash
# Clone the repository
git clone https://github.com/bdaly101/AI-Feature-Builder.git
cd AI-Feature-Builder

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run locally
node dist/cli/index.js --help
```

## Integration with Dev Lifecycle

AI-Feature-Builder integrates with the dev lifecycle automation:

1. **Feature Planning**: Define features in ROADMAP.md
2. **Implementation**: Run `ai-feature-builder implement`
3. **Testing**: Tests generated automatically
4. **PR Creation**: Create PR to dev branch
5. **Review**: AI-PR-Dev reviews the code
6. **Merge**: Human approval and merge

## Safety Features

- Always creates feature branches (never commits to main/staging)
- Requires human review before merge
- Rollback on failure
- Code validation before applying
- Dry-run mode for preview

## License

MIT
