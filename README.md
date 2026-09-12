# pi-live-context

A [Pi](https://pi.dev) extension that reloads `AGENTS.md` every turn and sends it as a user message instead of system prompt text.

## Install

```bash
# from npm
pi install npm:pi-live-context

# or from git
pi install git:github.com/bradennss/pi-live-context

# try it for a single run without installing
pi -e npm:pi-live-context
```

## How it works

Pi discovers `AGENTS.md` and `CLAUDE.md` the same way it usually does, but sends it just before your message instead of including it in the system prompt. This makes agents follow global and project instructions more reliably, with the tradeoff of consuming more input tokens over time.

## Requirements

- Node.js >= 22.19, the version Pi itself requires.
- Pi 0.85 or newer.

## Development

```bash
pnpm install
pnpm run check
```

## Contributing

Every change that affects the published package needs a [changeset](https://github.com/changesets/changesets):

```bash
pnpm changeset
```
