# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets). Every change that affects the published package needs a changeset describing the release.

Add one before opening a pull request:

```sh
pnpm changeset
```

Pick the bump level (`patch`, `minor`, or `major`) and write a short summary. The generated Markdown file is committed alongside your change and becomes the changelog entry when the release is published.

For a change that should not trigger a release, add an empty changeset instead:

```sh
pnpm changeset --empty
```
