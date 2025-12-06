# AI-Feature-Builder

AI-powered feature implementation tool that reads ROADMAP.md and automatically implements features.

## Features

- 📋 Parses ROADMAP.md for pending features
- 🤖 AI-powered implementation using Claude
- 🔀 Automatically creates feature branches
- 🧪 Generates tests using AI-Test-Generator
- 📝 Commits changes with proper messages

## Installation

```bash
cd ~/Dev/shared/AI-Feature-Builder
npm install
npm run build
```

## Usage

### List pending features

```bash
ai-feature-builder list
```

### Implement a feature

```bash
# Interactive selection
ai-feature-builder implement

# Specific feature by index
ai-feature-builder implement --feature 1

# Dry run (preview only)
ai-feature-builder implement --feature 1 --dry-run
```

## How It Works

1. **Parse ROADMAP.md**: Extracts pending features from markdown
2. **Create Plan**: AI generates detailed implementation plan
3. **Generate Code**: AI writes all necessary code changes
4. **Generate Tests**: Uses AI-Test-Generator to create tests
5. **Create Branch**: Creates feature branch from `dev`
6. **Commit**: Commits all changes with descriptive message

## Safety Features

- Always creates feature branch (never commits to main/staging)
- Requires human review before merge
- AI-PR-Dev will review the AI's code
- Never auto-merges

## Requirements

- `ANTHROPIC_API_KEY` environment variable
- Git repository with `dev` branch
- `ROADMAP.md` file in project root

## Integration

This tool is designed to work with the AI PR workflow:
1. Use `ai-feature-builder` to implement features
2. Feature branch is created automatically
3. Create PR to `dev` branch
4. AI-PR-Dev reviews the code
5. Merge after approval

