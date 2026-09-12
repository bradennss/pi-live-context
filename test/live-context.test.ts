import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type {
  BeforeAgentStartEvent,
  BeforeAgentStartEventResult,
  ContextEvent,
  ExtensionAPI,
  ExtensionContext,
  ExtensionHandler,
} from "@earendil-works/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import liveContext from "../index.ts";

interface ContextEventResult {
  messages?: ContextEvent["messages"];
}

interface Harness {
  beforeAgentStart: (
    event: BeforeAgentStartEvent,
  ) => BeforeAgentStartEventResult | undefined;
  context: (event: ContextEvent) => ContextEventResult | undefined;
  warnings: string[];
}

function start(cwd: string): Harness {
  const warnings: string[] = [];
  const ctx = {
    cwd,
    ui: {
      notify: (message: string) => {
        warnings.push(message);
      },
    },
  } as unknown as ExtensionContext;

  let beforeAgentStart:
    | ExtensionHandler<BeforeAgentStartEvent, BeforeAgentStartEventResult>
    | undefined;
  let context: ExtensionHandler<ContextEvent, ContextEventResult> | undefined;
  const pi = {
    on: (event: string, handler: unknown) => {
      if (event === "before_agent_start") {
        beforeAgentStart = handler as ExtensionHandler<
          BeforeAgentStartEvent,
          BeforeAgentStartEventResult
        >;
      }
      if (event === "context") {
        context = handler as ExtensionHandler<ContextEvent, ContextEventResult>;
      }
    },
  } as unknown as ExtensionAPI;

  liveContext(pi);
  if (!beforeAgentStart || !context) {
    throw new Error("The extension did not register both handlers.");
  }
  const registered = { beforeAgentStart, context };

  return {
    beforeAgentStart: (event) =>
      registered.beforeAgentStart(event, ctx) as
        BeforeAgentStartEventResult | undefined,
    context: (event) =>
      registered.context(event, ctx) as ContextEventResult | undefined,
    warnings,
  };
}

function systemPromptWith(contextFiles: { path: string; content: string }[]) {
  const files = contextFiles
    .map(
      ({ path: filePath, content }) =>
        `<project_instructions path="${filePath}">\n${content}\n</project_instructions>\n\n`,
    )
    .join("");
  return [
    "You are a coding assistant.",
    "\n\n<project_context>\n\n",
    "Project-specific instructions and guidelines:\n\n",
    files,
    "</project_context>\n",
  ].join("");
}

function startEvent(
  cwd: string,
  contextFiles: { path: string; content: string }[],
  systemPrompt = systemPromptWith(contextFiles),
): BeforeAgentStartEvent {
  return {
    type: "before_agent_start",
    prompt: "hello",
    systemPrompt,
    systemPromptOptions: { cwd, contextFiles },
  };
}

function contextEvent(): ContextEvent {
  return {
    type: "context",
    messages: [{ role: "user", content: "hello", timestamp: 1 }],
  };
}

function injectedContent(result: ContextEventResult | undefined): string {
  const message = result?.messages?.find((entry) => entry.role === "custom");
  if (!message || typeof message.content !== "string") {
    throw new Error("No context message was injected.");
  }
  return message.content;
}

describe("liveContext", () => {
  let root: string;
  let cwd: string;
  let contextFile: string;
  let previousAgentDir: string | undefined;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "pi-live-context-"));
    cwd = path.join(root, "project");
    contextFile = path.join(cwd, "AGENTS.md");
    const agentDir = path.join(root, "agent");
    mkdirSync(cwd);
    mkdirSync(agentDir);
    previousAgentDir = process.env.PI_CODING_AGENT_DIR;
    process.env.PI_CODING_AGENT_DIR = agentDir;
  });

  afterEach(() => {
    if (previousAgentDir === undefined) {
      delete process.env.PI_CODING_AGENT_DIR;
    } else {
      process.env.PI_CODING_AGENT_DIR = previousAgentDir;
    }
    rmSync(root, { recursive: true, force: true });
  });

  it("strips the system prompt block and injects the files", () => {
    writeFileSync(contextFile, "First rules.");
    const loaded = [{ path: contextFile, content: "First rules." }];

    const started = start(cwd);
    const result = started.beforeAgentStart(startEvent(cwd, loaded));

    expect(result?.systemPrompt).toBe("You are a coding assistant.");

    const content = injectedContent(started.context(contextEvent()));

    expect(content).toContain("First rules.");
    expect(started.warnings).toEqual([]);
  });

  it("reads the files again for each request", () => {
    writeFileSync(contextFile, "First rules.");
    const started = start(cwd);
    started.beforeAgentStart(
      startEvent(cwd, [{ path: contextFile, content: "First rules." }]),
    );

    writeFileSync(contextFile, "Second rules.");
    const content = injectedContent(started.context(contextEvent()));

    expect(content).toContain("Second rules.");
    expect(content).not.toContain("First rules.");
  });

  it("stays out of the way when Pi loaded no context files", () => {
    writeFileSync(contextFile, "Rules Pi was told to ignore.");
    const started = start(cwd);

    const result = started.beforeAgentStart(
      startEvent(cwd, [], "You are a coding assistant."),
    );

    expect(result).toBeUndefined();
    expect(started.context(contextEvent())).toBeUndefined();
    expect(started.warnings).toEqual([]);
  });

  it("warns once and keeps Pi's prompt when the block is not there", () => {
    writeFileSync(contextFile, "First rules.");
    const loaded = [{ path: contextFile, content: "Stale rules." }];
    const started = start(cwd);

    const first = started.beforeAgentStart(
      startEvent(cwd, loaded, "You are a coding assistant."),
    );
    const second = started.beforeAgentStart(
      startEvent(cwd, loaded, "You are a coding assistant."),
    );

    expect(first).toBeUndefined();
    expect(second).toBeUndefined();
    expect(started.context(contextEvent())).toBeUndefined();
    expect(started.warnings).toHaveLength(1);
    expect(started.warnings[0]).toContain("pi-live-context is off");
  });
});
