# npmx

**Node Package Manager Extended** - CLI for monorepo versioning.

Inspired by [axion-release-plugin](https://github.com/allegro/axion-release-plugin).

## Features

- 📋 **Git-based versioning** — determine version from commits/tags
- 🔄 **Workspace version sync** — update all package versions in monorepo
- 🔗 **Dependency updates** — sync peerDependencies, dependencies, devDependencies

## Installation

```bash
npm install -g npmx
# or
pnpm add -g npmx
```

## Usage

### Determine version from git

```bash
# Show current version based on latest tag
npmx version

# Show next version based on commits since last tag
npmx version --next
```

### Release (update all packages)

```bash
# Update all packages to version derived from git
npmx release

# Set specific version
npmx release --version 1.2.3

# Create git tag after release
npmx release --tag

# Dry run
npmx release --dry-run
```

### Sync dependencies

```bash
# Sync workspace package references
npmx sync

# Dry run
npmx sync --dry-run
```

## How it works

### Version detection (like axion-release-plugin)

1. Find latest tag matching version pattern (`v1.2.3`)
2. Count commits since that tag
3. Analyze commit messages for bump type:
   - `feat:` → minor bump
   - `fix:` → patch bump
   - `BREAKING CHANGE` → major bump
4. Generate new version

### Dependency sync

Updates `dependencies`, `devDependencies`, `peerDependencies` that reference other workspace packages.

**Skips:**
- `workspace:*` references (pnpm workspace protocol)
- External packages

## License

MIT
