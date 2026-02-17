# npmx

**Node Package Manager Extended** — CLI for monorepo versioning.

Inspired by [axion-release-plugin](https://github.com/allegro/axion-release-plugin).

## Features

- 📋 **Git-based versioning** — determine version from commits/tags using conventional commits
- 🔄 **Workspace version sync** — update all package versions in monorepo
- 🔗 **Dependency updates** — sync inter-package dependencies automatically

## Installation

```bash
npm install -g npmx
# or
pnpm add -g npmx
# or
yarn global add npmx
```

## Quick Start

```bash
# Check current/next version
npmx version
npmx version --next

# Release new version
npmx release --commit --tag --push

# Sync workspace dependencies
npmx sync
```

## Commands

### `npmx version`

Determine and display version from git tags/commits.

```bash
# Show current version (from latest tag, or 0.0.0 if none)
npmx version

# Show next version based on commits since last tag
npmx version --next

# Verbose output with commit list
npmx version --verbose

# JSON output for scripting
npmx version --format json

# Custom tag prefix (if your tags are v1.0.0 instead of 1.0.0)
npmx version --tag-prefix v

# Check specific branch
npmx version --branch develop

# Pre-release version
npmx version --next --pre-release alpha
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

### `npmx release`

Update all package versions in workspace.

```bash
# Release with git-calculated version
npmx release

# Set specific version
npmx release --version 1.2.3

# Full release workflow
npmx release --commit --tag --push

# Pre-release
npmx release --pre-release beta

# Preview changes without modifying files
npmx release --dry-run
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

### `npmx sync`

Sync workspace package dependencies to current versions.

```bash
# Sync all dependencies
npmx sync

# Preview changes
npmx sync --dry-run
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

npmx uses [conventional commits](https://www.conventionalcommits.org/) to determine version bumps:

| Commit Type | Version Bump |
|-------------|--------------|
| `BREAKING CHANGE:` or `feat!:` | Major |
| `feat:` | Minor |
| `fix:`, `perf:` | Patch |
| Others (`docs:`, `chore:`, etc.) | None |

### Workflow Example

```bash
# 1. Check what version will be released
npmx version --next --verbose

# 2. Preview release
npmx release --dry-run --commit --tag

# 3. Execute release
npmx release --commit --tag --push

# 4. Sync any workspace dependencies
npmx sync
```

## Workspace Support

npmx automatically detects workspace configuration:

| Package Manager | Config File |
|-----------------|-------------|
| pnpm | `pnpm-workspace.yaml` |
| npm | `package.json` → `workspaces` |
| yarn | `package.json` → `workspaces` |

## Troubleshooting

### No tags found

If `npmx version` shows `0.0.0`, you haven't created any version tags yet:

```bash
# Create initial tag
git tag 0.1.0
git push --tags
```

### Wrong branch

By default, npmx checks the `main` branch. Use `--branch` to specify a different branch:

```bash
npmx version --branch develop
```

### Pre-release versions

For alpha/beta releases:

```bash
npmx release --pre-release alpha --commit --tag
# Creates: 1.1.0-alpha.5 (where 5 is commits since last tag)
```

## License

MIT
