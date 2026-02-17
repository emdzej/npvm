# npvm

**Node Package Version Manager** — CLI for monorepo versioning.

Inspired by [axion-release-plugin](https://github.com/allegro/axion-release-plugin).

## Features

- **Git-based versioning** — determine version from commits/tags using conventional commits
- **Workspace version sync** — update all package versions in monorepo
- **Dependency updates** — sync inter-package dependencies automatically

## Installation

```bash
npm install -g @emdzej/npvm
# or
pnpm add -g @emdzej/npvm
# or
yarn global add @emdzej/npvm
```

## Quick Start

```bash
# Check current/next version
npvm version
npvm version --next

# Release new version
npvm release --commit --tag --push

# Sync workspace dependencies
npvm sync
```

## Commands

### `npvm version`

Determine and display version from git tags/commits.

```bash
# Show current version (from latest tag, or 0.0.0 if none)
npvm version

# Show next version based on commits since last tag
npvm version --next

# Verbose output with commit list
npvm version --verbose

# JSON output for scripting
npvm version --format json

# Custom tag prefix (if your tags are v1.0.0 instead of 1.0.0)
npvm version --tag-prefix v

# Check specific branch
npvm version --branch develop

# Pre-release version
npvm version --next --pre-release alpha
# Output: 1.1.0-alpha.5
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-n, --next` | Show next version based on commits | - |
| `--tag-prefix <prefix>` | Tag prefix (e.g., `v`) | none |
| `--branch <name>` | Branch to check | `main` |
| `--pre-release <name>` | Pre-release identifier | - |
| `--format <format>` | Output format: `plain`, `json` | `plain` |
| `--verbose` | Show detailed information | - |

### `npvm release`

Update all package versions in workspace.

```bash
# Release with git-calculated version
npvm release

# Set specific version
npvm release --version 1.2.3

# Full release workflow
npvm release --commit --tag --push

# Pre-release
npvm release --pre-release beta

# Preview changes without modifying files
npvm release --dry-run
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-v, --version <ver>` | Explicit version to set | git-calculated |
| `--tag-prefix <prefix>` | Tag prefix | none |
| `--branch <name>` | Branch to check | `main` |
| `--pre-release <name>` | Pre-release identifier | - |
| `--tag` | Create git tag | - |
| `--commit` | Create git commit | - |
| `--push` | Push to remote | - |
| `--dry-run` | Preview changes | - |

### `npvm sync`

Sync workspace package dependencies to current versions.

```bash
# Sync all dependencies
npvm sync

# Preview changes
npvm sync --dry-run
```

#### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without modifying files |

#### Behavior

- Updates `dependencies`, `devDependencies`, `peerDependencies`
- **Skips** `workspace:*` protocol references (pnpm workspace protocol)
- Preserves version prefix (`^`, `~`)

## How It Works

### Version Detection

npvm uses [conventional commits](https://www.conventionalcommits.org/) to determine version bumps:

| Commit Type | Version Bump |
|-------------|--------------|
| `BREAKING CHANGE:` or `feat!:` | Major |
| `feat:` | Minor |
| `fix:`, `perf:` | Patch |
| Others (`docs:`, `chore:`, etc.) | None |

### Workflow Example

```bash
# 1. Check what version will be released
npvm version --next --verbose

# 2. Preview release
npvm release --dry-run --commit --tag

# 3. Execute release
npvm release --commit --tag --push

# 4. Sync any workspace dependencies
npvm sync
```

## Workspace Support

npvm automatically detects workspace configuration:

| Package Manager | Config File |
|-----------------|-------------|
| pnpm | `pnpm-workspace.yaml` |
| npm | `package.json` → `workspaces` |
| yarn | `package.json` → `workspaces` |

## Troubleshooting

### No tags found

If `npvm version` shows `0.0.0`, you haven't created any version tags yet:

```bash
# Create initial tag
git tag 0.1.0
git push --tags
```

### Wrong branch

By default, npvm checks the `main` branch. Use `--branch` to specify a different branch:

```bash
npvm version --branch develop
```

### Pre-release versions

For alpha/beta releases:

```bash
npvm release --pre-release alpha --commit --tag
# Creates: 1.1.0-alpha.5 (where 5 is commits since last tag)
```

## License

MIT
