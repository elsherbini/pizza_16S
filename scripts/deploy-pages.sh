#!/usr/bin/env bash
#
# Publish build/ to the gh-pages branch as an orphan commit containing the built
# site and nothing else.
#
# The gh-pages npm package seeds a new deploy branch from the repository's
# default branch, and its clean-up step does not remove what it inherited, so
# the first publish left .gitignore, .npmrc, .vscode/ and static/ sitting on the
# deploy branch. This does the same job with plain git, and the result is
# verifiable: the branch tree equals the build directory.

set -euo pipefail

BRANCH="gh-pages"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm run build:gh

WORKTREE="$(mktemp -d)"
cleanup() {
	cd "$ROOT"
	git worktree remove --force "$WORKTREE" >/dev/null 2>&1 || true
}
trap cleanup EXIT

git worktree add --detach --quiet "$WORKTREE"
cd "$WORKTREE"

git checkout --quiet --orphan "$BRANCH"
git rm -rq --cached . >/dev/null 2>&1 || true
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +

cp -R "$ROOT/build/." .
git add -A
git commit -q -m "Deploy $(git -C "$ROOT" rev-parse --short HEAD)"
git push -f --quiet origin "$BRANCH"

echo "published $(git -C "$ROOT" rev-parse --short HEAD) to $BRANCH"
