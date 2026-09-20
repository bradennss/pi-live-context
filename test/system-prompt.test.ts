import { describe, expect, it } from "vitest";
import { stripContextFiles } from "../src/system-prompt.ts";

const contextFiles = [
  { path: "/home/dev/.pi/agent/AGENTS.md", content: "Global rules." },
  { path: "/home/dev/project/AGENTS.md", content: "Project rules." },
];

const block = [
  "\n\n<project_context>\n\n",
  "Project-specific instructions and guidelines:\n\n",
  '<project_instructions path="/home/dev/.pi/agent/AGENTS.md">\nGlobal rules.\n</project_instructions>\n\n',
  '<project_instructions path="/home/dev/project/AGENTS.md">\nProject rules.\n</project_instructions>\n\n',
  "</project_context>\n",
].join("");

describe("stripContextFiles", () => {
  it("removes the context block Pi appended", () => {
    const prompt = `You are a coding assistant.${block}\nCurrent working directory: /home/dev/project`;

    expect(stripContextFiles(prompt, contextFiles)).toBe(
      "You are a coding assistant.\nCurrent working directory: /home/dev/project",
    );
  });

  it("keeps a prompt that carries no context files", () => {
    const prompt = "You are a coding assistant.";

    expect(stripContextFiles(prompt, [])).toBe(prompt);
  });

  it("keeps a prompt whose block does not match the loaded files", () => {
    const prompt = `You are a coding assistant.${block}`;

    expect(
      stripContextFiles(prompt, [
        { path: "/home/dev/project/AGENTS.md", content: "Edited since load." },
      ]),
    ).toBe(prompt);
  });

  it("removes the block when a file quotes the closing tag", () => {
    const quoted = [
      {
        path: "/home/dev/project/AGENTS.md",
        content: "Never write </project_context> in a file.",
      },
    ];
    const prompt = [
      "You are a coding assistant.",
      "\n\n<project_context>\n\n",
      "Project-specific instructions and guidelines:\n\n",
      `<project_instructions path="/home/dev/project/AGENTS.md">\n${quoted[0].content}\n</project_instructions>\n\n`,
      "</project_context>\n",
      "\nCurrent working directory: /home/dev/project",
    ].join("");

    expect(stripContextFiles(prompt, quoted)).toBe(
      "You are a coding assistant.\nCurrent working directory: /home/dev/project",
    );
  });
});
