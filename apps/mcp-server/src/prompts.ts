import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  // 1. plannic-grill-mode
  server.registerPrompt(
    "plannic-grill-mode",
    {
      title: "Plannic 5-Step Grill Mode",
      description: "Trigger the structured 5-step clarification and planning workflow before implementation",
      argsSchema: {
        featureName: z.string().describe("Name of the feature or architecture initiative to plan"),
      },
    },
    async ({ featureName }) => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Please plan the feature or initiative "${featureName}" using the Plannic 5-Step Grill Mode:
1. Call get_config(cwd=".") to read project conventions and stack.
2. Ask 3–5 sharp clarifying questions regarding MVP scope boundaries, architectural trade-offs, and edge cases.
3. Call init_plan(cwd=".", name="${featureName}", mode="deep").
4. Call update_document to thoroughly populate scope, feature, phase, and limitation documents.
5. Provide a clear summary with links to the generated documents in .docs/.`,
            },
          },
        ],
      };
    }
  );

  // 2. plannic-distill-adr
  server.registerPrompt(
    "plannic-distill-adr",
    {
      title: "Distill ADR from Decision",
      description: "Extract an architectural decision into an immutable Architecture Decision Record (ADR)",
      argsSchema: {
        decisionTitle: z.string().describe("Title of the architectural decision made"),
      },
    },
    async ({ decisionTitle }) => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Please record the architectural decision "${decisionTitle}" into an ADR using Plannic:
1. Call init_adr(cwd=".", title="${decisionTitle}").
2. Document the context, considered options, decision outcome, and positive/negative consequences according to standard MADR format.`,
            },
          },
        ],
      };
    }
  );
}
