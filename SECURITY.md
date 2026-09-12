# Security Policy

## Scope and behavior

`pi-live-context` is a Pi extension. Like all Pi extensions it runs with your full user permissions. This extension:

- Reads the `AGENTS.md` and `CLAUDE.md` files Pi already discovers, through Pi's own `loadProjectContextFiles`, once per provider request.
- Removes that content from the system prompt and sends it as a hidden message instead. The content still goes to your model provider, in the same request it would have gone in before.
- Writes nothing to disk, makes no network calls of its own, collects no telemetry, and reads no credentials. It has no runtime dependencies beyond Pi itself.

## Reporting a vulnerability

Please report suspected vulnerabilities privately via a [GitHub security advisory](https://github.com/bradennss/pi-live-context/security/advisories/new). You will receive an acknowledgement within a few days.
