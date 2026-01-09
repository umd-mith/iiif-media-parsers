#!/usr/bin/env bash
set -euo pipefail

# Release script for @umd-mith/iiif-media-parsers
# Usage: ./scripts/release.sh [--dry-run] [--no-publish] [version]
# Example: ./scripts/release.sh 0.2.0
#          ./scripts/release.sh --dry-run 0.2.0
#          ./scripts/release.sh --no-publish 0.2.0  # tag only, skip npm publish

cd "$(dirname "$0")/.."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DRY_RUN=false
NO_PUBLISH=false

info() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}==>${NC} $1"; }
error() { echo -e "${RED}==>${NC} $1" >&2; exit 1; }
dry() { echo -e "${BLUE}[dry-run]${NC} $1"; }

# Run a command, or just print it in dry-run mode
run() {
    if [[ "$DRY_RUN" == true ]]; then
        dry "$*"
    else
        "$@"
    fi
}

# Parse flags
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-publish)
            NO_PUBLISH=true
            shift
            ;;
        -*)
            error "Unknown option: $1"
            ;;
        *)
            break
            ;;
    esac
done

if [[ "$DRY_RUN" == true ]]; then
    echo -e "${BLUE}=== DRY RUN MODE ===${NC}"
    echo ""
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Get new version from arg or prompt
if [[ -n "${1:-}" ]]; then
    NEW_VERSION="$1"
else
    echo "Current version: $CURRENT_VERSION"
    read -rp "New version: " NEW_VERSION
fi

# Validate version format (semver)
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    error "Invalid version format: $NEW_VERSION (expected semver like 1.0.0 or 1.0.0-beta.1)"
fi

# Confirm
echo ""
info "Release checklist:"
echo "  - Version: $CURRENT_VERSION → $NEW_VERSION"
echo "  - Update package.json"
echo "  - Update CHANGELOG.md"
echo "  - Commit and tag v$NEW_VERSION"
echo "  - Push to origin"
if [[ "$NO_PUBLISH" == true ]]; then
    echo "  - Publish to npm (SKIPPED)"
else
    echo "  - Publish to npm"
fi
echo ""
read -rp "Proceed? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Preflight checks
info "Running preflight checks..."

# Check for clean working directory
if [[ -n "$(git status --porcelain)" ]]; then
    if [[ "$DRY_RUN" == true ]]; then
        warn "Working directory not clean (ignored in dry-run)"
    else
        error "Working directory not clean. Commit or stash changes first."
    fi
fi

# Check we're on main branch
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "main" ]]; then
    warn "Not on main branch (currently on $BRANCH)"
    read -rp "Continue anyway? [y/N] " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Run tests
info "Running tests..."
pnpm test:ci

# Run type check
info "Running type check..."
pnpm type-check

# Build
info "Building..."
pnpm build

# Update package.json version
info "Updating package.json..."
run npm version "$NEW_VERSION" --no-git-tag-version

# Update CHANGELOG
info "Updating CHANGELOG.md..."
TODAY=$(date +%Y-%m-%d)
if [[ "$DRY_RUN" == true ]]; then
    dry "sed: [Unreleased] → [Unreleased] + [$NEW_VERSION] - $TODAY"
else
    sed -i '' "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $TODAY/" CHANGELOG.md
fi

# Commit
info "Committing changes..."
run git add package.json CHANGELOG.md
run git commit -m "chore(release): release v$NEW_VERSION

Assisted-by: Claude <noreply@anthropic.com>"

# Tag
info "Creating tag v$NEW_VERSION..."
run git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push
info "Pushing to origin..."
run git push origin "$BRANCH"
run git push origin "v$NEW_VERSION"

# Publish
if [[ "$NO_PUBLISH" == true ]]; then
    warn "Skipping npm publish (--no-publish)"
else
    info "Publishing to npm..."
    run pnpm publish --access public
fi

echo ""
if [[ "$DRY_RUN" == true ]]; then
    info "Dry run complete for v$NEW_VERSION"
    echo "  Run without --dry-run to execute"
elif [[ "$NO_PUBLISH" == true ]]; then
    info "Tagged v$NEW_VERSION (not published to npm)"
    echo "  - GitHub: https://github.com/umd-mith/iiif-media-parsers/releases/tag/v$NEW_VERSION"
    echo "  - To publish later: pnpm publish --access public"
else
    info "Released v$NEW_VERSION"
    echo "  - npm: https://www.npmjs.com/package/@umd-mith/iiif-media-parsers"
    echo "  - GitHub: https://github.com/umd-mith/iiif-media-parsers/releases/tag/v$NEW_VERSION"
fi
