# AGENTS.md - npmx

Guidelines for AI agents working on this codebase.

## Project Overview

**npmx** - Node Package Manager Extended. A CLI tool for monorepo versioning inspired by [axion-release-plugin](https://github.com/allegro/axion-release-plugin).

### Features

- **Git-based versioning** — determine version from commits/tags (like axion-release-plugin)
- **Workspace version sync** — update all package versions in monorepo
- **Dependency updates** — sync peerDependencies, dependencies, devDependencies that reference workspace packages

## Stack

- **Language**: TypeScript
- **CLI**: Commander + Chalk
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **Build**: TypeScript (`tsc`) / tsup

---

## Project Structure

```
src/
├── index.ts           # CLI entry point
├── commands/          # Commander subcommands
│   ├── version.ts     # Determine/show version from git
│   ├── release.ts     # Update all package versions
│   └── sync.ts        # Sync workspace dependencies
├── git/               # Git operations (tags, commits, parsing)
├── workspace/         # Workspace detection and manipulation
└── utils/             # Shared utilities
```

---

## Commands

```bash
pnpm install          # Install deps
pnpm build            # Build
pnpm test             # Run tests
pnpm lint             # Lint
pnpm typecheck        # Type check
```

---

## Core Rules

### Code Organization

- **Keep files small** — aim for ~300 lines per file
- **One responsibility per file** — commands, utilities, types in separate files
- **Group by feature** — use subdirectories to organize related code

### Language

- **All code, comments, and commit messages in English**

### Git Workflow

**Branches:**
| Prefix | Usage | Example |
|--------|-------|---------|
| `feature/` | New features | `feature/git-version-parser` |
| `bugfix/` | Bug fixes | `bugfix/fix-tag-parsing` |
| `chore/` | Maintenance | `chore/update-dependencies` |

**Commits (Conventional):**

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
```

**Before every PR:**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

---

## Versioning Logic

Based on axion-release-plugin approach:

1. **Find latest tag** matching version pattern (e.g., `v1.2.3`)
2. **Count commits** since that tag
3. **Determine bump type** from commit messages (feat → minor, fix → patch, BREAKING → major)
4. **Generate version** with optional pre-release suffix

### Skip patterns for `workspace:*`

When updating dependencies, skip references like:
- `"workspace:*"`
- `"workspace:^"`
- `"workspace:~"`

Only update explicit version references (e.g., `"^1.0.0"` → `"^1.1.0"`).

---

## Reference

- [axion-release-plugin](https://github.com/allegro/axion-release-plugin) — Gradle versioning plugin (inspiration)
- [conventional-commits](https://www.conventionalcommits.org/) — Commit message convention
