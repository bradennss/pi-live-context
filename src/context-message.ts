import path from "node:path";
import type { ContextEvent } from "@earendil-works/pi-coding-agent";
import type { ContextFile } from "./context-file.ts";

export const CONTEXT_MESSAGE_TYPE = "live-context";

type AgentMessage = ContextEvent["messages"][number];
type CustomMessage = Extract<AgentMessage, { role: "custom" }>;

function isGlobal(file: ContextFile, agentDir: string): boolean {
  return path.resolve(path.dirname(file.path)) === path.resolve(agentDir);
}

function renderBlock(
  tag: string,
  heading: string,
  contextFiles: ContextFile[],
): string {
  const files = contextFiles
    .map(
      ({ path: filePath, content }) =>
        `<instructions path="${filePath}">\n${content}\n</instructions>`,
    )
    .join("\n\n");
  return `<${tag}>\n\n${heading}\n\n${files}\n\n</${tag}>`;
}

export function buildContextMessageContent(
  contextFiles: ContextFile[],
  agentDir: string,
): string {
  const global = contextFiles.filter((file) => isGlobal(file, agentDir));
  const project = contextFiles.filter((file) => !isGlobal(file, agentDir));
  const blocks: string[] = [];
  if (global.length > 0) {
    blocks.push(
      renderBlock(
        "global_context",
        "Global instructions and guidelines:",
        global,
      ),
    );
  }
  if (project.length > 0) {
    blocks.push(
      renderBlock(
        "project_context",
        "Project-specific instructions and guidelines:",
        project,
      ),
    );
  }
  return blocks.join("\n\n");
}

export function buildContextMessage(
  contextFiles: ContextFile[],
  agentDir: string,
  timestamp: number = Date.now(),
): CustomMessage {
  return {
    role: "custom",
    customType: CONTEXT_MESSAGE_TYPE,
    content: buildContextMessageContent(contextFiles, agentDir),
    display: false,
    timestamp,
  };
}

export function insertBeforeLastUserMessage<M extends { role: string }>(
  messages: M[],
  message: M,
): M[] {
  const result = [...messages];
  for (let index = result.length - 1; index >= 0; index--) {
    if (result[index].role === "user") {
      result.splice(index, 0, message);
      return result;
    }
  }
  result.push(message);
  return result;
}
