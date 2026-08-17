#!/usr/bin/env bash
#
# Publish build/ to the gh-pages branch as an orphan commit containing the built
# site and nothing else.
#
# The gh-pages npm package seeds a new deploy branch from the repository's
# default branch and its clean-up step does not remove what it inherited, so the
# first publish left .gitignore, .npmrc, .vscode/ and static/ on the deploy
# branch. This does the same job with plain git, and the result is verifiable:
# the branch tree equals the build directory.
#
# The commit is built with write-tree and commit-tree rather than by checking
# out an orphan branch, so nothing here creates or depends on a local branch ref
# and repeat deploys cannot collide with the last one.

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

# Empty the index and the worktree, then stage the built site alone.
git rm -rq --cached . >/dev/null 2>&1 || true
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$ROOT/build/." .
git add -A

SOURCE="$(git -C "$ROOT" rev-parse --short HEAD)"
TREE="$(git write-tree)"
COMMIT="$(git commit-tree "$TREE" -m "Deploy $SOURCE")"
git push -f --quiet origin "$COMMIT:refs/heads/$BRANCH"

echo "published $SOURCE to $BRANCH ($(git ls-tree -r --name-only "$TREE" | wc -l | tr -d ' ') files)"
