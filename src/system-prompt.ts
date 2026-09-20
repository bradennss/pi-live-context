import type { ContextFile } from "./context-file.ts";

/** Renders the context block used by Pi 0.85 and earlier. */
function renderSystemPromptBlock(contextFiles: ContextFile[]): string {
  let block = "\n\n<project_context>\n\n";
  block += "Project-specific instructions and guidelines:\n\n";
  for (const { path, content } of contextFiles) {
    block += `<project_instructions path="${path}">\n${content}\n</project_instructions>\n\n`;
  }
  block += "</project_context>\n";
  return block;
}

export function stripContextFiles(
  systemPrompt: string,
  contextFiles: ContextFile[],
): string {
  if (contextFiles.length === 0) {
    return systemPrompt;
  }
  return systemPrompt.replace(renderSystemPromptBlock(contextFiles), "");
}
