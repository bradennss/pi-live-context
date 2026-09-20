/**
 * pi-live-context takes the AGENTS.md files out of the system prompt and sends
 * them as a hidden message before the newest user message, reloaded from disk
 * before every request.
 */
import {
  type BuildSystemPromptOptions,
  type ExtensionAPI,
  type ExtensionContext,
  getAgentDir,
  loadProjectContextFiles,
} from "@earendil-works/pi-coding-agent";
import {
  buildContextMessage,
  insertBeforeLastUserMessage,
} from "./src/context-message.ts";
import { stripContextFiles } from "./src/system-prompt.ts";

const LAYOUT_WARNING =
  "pi-live-context is off for this session: this version of Pi lays out context files in a way the extension cannot remove from the system prompt.";

function supportsStructuredSystemPrompt(
  options: BuildSystemPromptOptions,
): boolean {
  return "sections" in options;
}

export default function liveContext(pi: ExtensionAPI): void {
  let relocating = false;
  let warned = false;

  function warnOnce(ctx: ExtensionContext): void {
    if (warned) {
      return;
    }
    warned = true;
    ctx.ui.notify(LAYOUT_WARNING, "warning");
  }

  pi.on("before_agent_start", (event, ctx) => {
    const options = event.systemPromptOptions;
    const contextFiles = options.contextFiles;
    if (contextFiles.length === 0) {
      relocating = false;
      return;
    }

    if (supportsStructuredSystemPrompt(options)) {
      options.contextFiles = [];
      relocating = true;
      return;
    }

    const systemPrompt = stripContextFiles(event.systemPrompt, contextFiles);
    relocating = systemPrompt !== event.systemPrompt;
    if (!relocating) {
      warnOnce(ctx);
    }
    return relocating ? { systemPrompt } : undefined;
  });

  pi.on("context", (event, ctx) => {
    if (!relocating) {
      return;
    }
    const agentDir = getAgentDir();
    const contextFiles = loadProjectContextFiles({ cwd: ctx.cwd, agentDir });
    if (contextFiles.length === 0) {
      return;
    }
    return {
      messages: insertBeforeLastUserMessage(
        event.messages,
        buildContextMessage(contextFiles, agentDir),
      ),
    };
  });
}
