# AI Feature Builder — Development Roadmap

> **Purpose**: Automatically implement features from ROADMAP.md using Claude AI. Parses roadmap, generates implementation plans, writes code, creates tests, and manages git branches.

---

## 1. Project Overview

### What We're Building

A CLI tool that:
1. Reads `ROADMAP.md` and extracts pending features
2. Uses Claude AI to generate detailed implementation plans
3. Generates complete code implementations
4. Integrates with AI-Test-Generator for test creation
5. Manages git branches and commits automatically
6. Provides interactive selection and progress tracking

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ (ESM) |
| Language | TypeScript 5.x |
| CLI Framework | Commander.js + Inquirer |
| AI Provider | Anthropic Claude API (claude-3-5-sonnet-20241022) |
| Git Operations | simple-git |
| Testing | Vitest |
| Validation | Zod |
| Progress UI | Ora (spinners) |

---

## 2. Architecture

```
ai-feature-builder/
├── src/
│   ├── index.ts                    # Main exports
│   ├── cli/
│   │   ├── index.ts                # CLI entry point
│   │   └── commands/
│   │       ├── list.ts             # List pending features
│   │       ├── implement.ts        # Implement feature
│   │       ├── plan.ts             # Generate plan only
│   │       ├── status.ts           # Show implementation status
│   │       └── init.ts             # Initialize config
│   ├── core/
│   │   ├── roadmap-parser.ts       # ROADMAP.md parsing
│   │   ├── feature-builder.ts      # Core orchestration
│   │   ├── code-generator.ts        # AI code generation
│   │   └── file-writer.ts          # Apply changes with rollback
│   ├── ai/
│   │   ├── claude-client.ts        # Claude with retry/rate limiting
│   │   ├── parser.ts               # Parse AI responses
│   │   └── prompts/
│   │       ├── system.ts           # System prompts
│   │       ├── planning.ts         # Feature planning prompts
│   │       └── implementation.ts   # Code generation prompts
│   ├── github/
│   │   ├── branch-manager.ts       # Branch creation/management
│   │   └── pr-creator.ts           # Optional PR creation
│   ├── config/
│   │   ├── schema.ts               # Zod config schema
│   │   └── loader.ts               # Config loader
│   └── utils/
│       ├── logger.ts               # Logging with ora spinners
│       ├── git.ts                  # Git utilities
│       └── fs.ts                   # File system helpers
├── __tests__/
│   └── unit/
│       ├── roadmap-parser.test.ts
│       ├── code-generator.test.ts
│       └── ai-parser.test.ts
├── ROADMAP.md
├── .aifeaturerc.example.json
├── vitest.config.ts
└── package.json
```

---

## 3. Implementation Phases

### Phase 1: Foundation & Configuration ✅

- [x] Create comprehensive ROADMAP.md
- [ ] Update package.json with dependencies
- [ ] Create vitest.config.ts
- [ ] Create .aifeaturerc.example.json

### Phase 2: Utils & Config Layer

- [ ] Create `src/utils/logger.ts` - Logging with chalk + ora
- [ ] Create `src/utils/git.ts` - Git utilities
- [ ] Create `src/utils/fs.ts` - File system helpers
- [ ] Create `src/config/schema.ts` - Zod config schema
- [ ] Create `src/config/loader.ts` - Config loader

### Phase 3: AI Layer

- [ ] Create `src/ai/claude-client.ts` - Enhanced Claude client
- [ ] Create `src/ai/parser.ts` - Response parsing
- [ ] Create `src/ai/prompts/system.ts` - System prompts
- [ ] Create `src/ai/prompts/planning.ts` - Planning prompts
- [ ] Create `src/ai/prompts/implementation.ts` - Implementation prompts

### Phase 4: Core Layer

- [ ] Refactor `src/core/roadmap-parser.ts` - Enhanced parsing
- [ ] Refactor `src/core/feature-builder.ts` - Orchestration
- [ ] Create `src/core/code-generator.ts` - Code generation
- [ ] Create `src/core/file-writer.ts` - File operations with rollback

### Phase 5: CLI Layer

- [ ] Create `src/cli/index.ts` - CLI entry point
- [ ] Create `src/cli/commands/list.ts` - List command
- [ ] Create `src/cli/commands/implement.ts` - Implement command
- [ ] Create `src/cli/commands/plan.ts` - Plan command
- [ ] Create `src/cli/commands/status.ts` - Status command
- [ ] Create `src/cli/commands/init.ts` - Init command

### Phase 6: GitHub Integration

- [ ] Create `src/github/branch-manager.ts` - Branch management
- [ ] Create `src/github/pr-creator.ts` - PR creation

### Phase 7: Testing

- [ ] Create `__tests__/unit/roadmap-parser.test.ts`
- [ ] Create `__tests__/unit/code-generator.test.ts`
- [ ] Create `__tests__/unit/ai-parser.test.ts`
- [ ] Run full test suite

### Phase 8: Enhancements

- [ ] Interactive feature selection with inquirer
- [ ] Progress indicators with ora spinners
- [ ] Rollback capability for failed implementations
- [ ] Multi-step implementation support
- [ ] Code validation before applying
- [ ] AI-Test-Generator integration

### Phase 9: Documentation & Deployment

- [ ] Update README.md
- [ ] Build and verify CLI
- [ ] Commit and push to GitHub

---

## 4. Key Features

### Interactive Selection

Users can:
- List all pending features
- Select feature interactively
- Preview implementation plan
- Confirm before implementing

### Progress Tracking

- Spinner indicators for all async operations
- Step-by-step progress display
- Estimated time remaining
- Success/failure status

### Safety Features

- Always creates feature branches (never commits to main/staging)
- Backup files before changes
- Rollback on failure
- Validation before applying changes
- Requires human review before merge

### Integration

- Works with AI-Test-Generator for test creation
- Integrates with AI-PR-Dev workflow
- Supports custom config via `.aifeaturerc.json`
- Environment variable support

---

## 5. Configuration

### `.aifeaturerc.json`

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
  ]
}
```

---

## 6. Commands

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
ai-feature-builder plan --feature "Add authentication"
ai-feature-builder plan --feature 1 --output plan.md
```

### `implement`

Implement a feature

```bash
# Interactive selection
ai-feature-builder implement

# By index
ai-feature-builder implement --feature 1

# By name
ai-feature-builder implement --feature "Add authentication"

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

---

## 7. Implementation Flow

```
1. Parse ROADMAP.md
   ↓
2. Extract pending features
   ↓
3. User selects feature (interactive or CLI arg)
   ↓
4. Generate implementation plan (AI)
   ↓
5. Review plan (optional)
   ↓
6. Create feature branch
   ↓
7. Generate code (AI)
   ↓
8. Validate code
   ↓
9. Apply changes to disk
   ↓
10. Generate tests (AI-Test-Generator)
   ↓
11. Commit changes
   ↓
12. Optionally create PR
```

---

## 8. Error Handling

| Scenario | Handling |
|----------|----------|
| API key missing | Prompt for key or show setup instructions |
| Rate limited | Exponential backoff with progress indicator |
| Invalid roadmap | Error with parsing details |
| Parse error in response | Retry with simplified prompt |
| Git not available | Error with installation instructions |
| No features found | Info message, exit cleanly |
| Implementation failure | Rollback changes, show error details |
| Validation failure | Show errors, ask to continue or abort |

---

## 9. Success Metrics

- [ ] CLI generates valid, runnable code
- [ ] 80%+ of generated code passes validation
- [ ] Interactive selection works smoothly
- [ ] Rollback works correctly on failures
- [ ] Integration with AI-Test-Generator works
- [ ] All tests pass
- [ ] Documentation complete and accurate

---

*Built with ❤️ for developer productivity*

