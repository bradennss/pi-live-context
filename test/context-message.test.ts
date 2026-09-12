import { describe, expect, it } from "vitest";
import {
  buildContextMessage,
  buildContextMessageContent,
  CONTEXT_MESSAGE_TYPE,
  insertBeforeLastUserMessage,
} from "../src/context-message.ts";

const agentDir = "/home/dev/.pi/agent";
const globalFile = {
  path: "/home/dev/.pi/agent/AGENTS.md",
  content: "Global rules.",
};
const projectFile = {
  path: "/home/dev/project/AGENTS.md",
  content: "Project rules.",
};
const nestedFile = {
  path: "/home/dev/project/api/AGENTS.md",
  content: "API rules.",
};

describe("buildContextMessageContent", () => {
  it("splits the agent directory file from the project files", () => {
    const content = buildContextMessageContent(
      [globalFile, projectFile, nestedFile],
      agentDir,
    );

    expect(content).toBe(
      [
        "<global_context>",
        "",
        "Global instructions and guidelines:",
        "",
        '<instructions path="/home/dev/.pi/agent/AGENTS.md">',
        "Global rules.",
        "</instructions>",
        "",
        "</global_context>",
        "",
        "<project_context>",
        "",
        "Project-specific instructions and guidelines:",
        "",
        '<instructions path="/home/dev/project/AGENTS.md">',
        "Project rules.",
        "</instructions>",
        "",
        '<instructions path="/home/dev/project/api/AGENTS.md">',
        "API rules.",
        "</instructions>",
        "",
        "</project_context>",
      ].join("\n"),
    );
  });

  it("drops the block for a side that has no files", () => {
    const content = buildContextMessageContent([projectFile], agentDir);

    expect(content).not.toContain("<global_context>");
    expect(content).toContain("<project_context>");
  });

  it("reads the agent directory through an unresolved path", () => {
    const content = buildContextMessageContent(
      [globalFile],
      "/home/dev/.pi/agent/",
    );

    expect(content).toContain("<global_context>");
  });
});

describe("buildContextMessage", () => {
  it("builds a hidden custom message", () => {
    const message = buildContextMessage([projectFile], agentDir, 1700000000000);

    expect(message).toEqual({
      role: "custom",
      customType: CONTEXT_MESSAGE_TYPE,
      content: buildContextMessageContent([projectFile], agentDir),
      display: false,
      timestamp: 1700000000000,
    });
  });
});

describe("insertBeforeLastUserMessage", () => {
  it("inserts ahead of the newest user message", () => {
    const messages = [
      { role: "user", id: "first" },
      { role: "assistant", id: "reply" },
      { role: "user", id: "latest" },
      { role: "toolResult", id: "tool" },
    ];

    expect(
      insertBeforeLastUserMessage(messages, { role: "custom", id: "context" }),
    ).toEqual([
      { role: "user", id: "first" },
      { role: "assistant", id: "reply" },
      { role: "custom", id: "context" },
      { role: "user", id: "latest" },
      { role: "toolResult", id: "tool" },
    ]);
  });

  it("appends when no user message is there", () => {
    const messages = [{ role: "assistant", id: "reply" }];

    expect(
      insertBeforeLastUserMessage(messages, { role: "custom", id: "context" }),
    ).toEqual([
      { role: "assistant", id: "reply" },
      { role: "custom", id: "context" },
    ]);
  });

  it("leaves the given array alone", () => {
    const messages = [{ role: "user", id: "first" }];

    insertBeforeLastUserMessage(messages, { role: "custom", id: "context" });

    expect(messages).toEqual([{ role: "user", id: "first" }]);
  });
});
