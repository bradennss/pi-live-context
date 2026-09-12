# pi-live-context

A [Pi](https://pi.dev) extension that reloads `AGENTS.md` every turn and sends it as a user message instead of system prompt text.

## Verify

```sh
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm test
```

## Testing end-to-end

Run Pi in a scratch directory with an `AGENTS.md`, a second extension that dumps `before_provider_request` payloads, and `-ne` so nothing else loads:

```sh
pi -ne -e ./index.ts -e /tmp/probe.ts -p "hello"
```

The dumped payload should carry the rules in the last user message and not in the system prompt.

## Contributing and publishing

Follow this workflow:

1. Make the change on a feature branch and run `pnpm run check`.
2. Add a [changeset](https://github.com/changesets/changesets) with `pnpm changeset`. Pick the bump level and write the summary. The `Changeset Check` workflow fails the PR without one.
3. Open a pull request into `main`. Wait for the `CI` and `Changeset Check` workflows to pass, then merge.
4. On merge to `main`, the `Release` workflow opens or updates a `Version Packages` PR that bumps the version and updates `CHANGELOG.md`. Wait for it to appear.
5. Review and merge the `Version Packages` PR. That merge triggers the `Release` workflow again, which packs and publishes the package to npm.
