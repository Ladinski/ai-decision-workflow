import OpenAI from "openai";
import { inngest } from "./client";
import { workflowChannel } from "./channels";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type WorkflowNode = {
  id: string;
  data: {
    prompt?: string;
  };
};

type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
};

export const runWorkflow = inngest.createFunction(
  {
    id: "run-workflow",
    triggers: {
      event: "workflow/run",
    },
  },
  async ({ event, step }) => {
    const nodes = event.data.nodes as WorkflowNode[];
    const edges = event.data.edges as WorkflowEdge[];
    const input = event.data.input as string;
    const startNodeId = event.data.startNodeId as string;
    const runId = event.data.runId as string;

    const executionHistory: {
      nodeId: string;
      prompt: string;
      decision: "YES" | "NO";
    }[] = [];

    let currentNodeId: string | null = startNodeId;

    while (currentNodeId) {
      const node = nodes.find(
        (item) => item.id === currentNodeId
      );

      if (!node) {
        throw new Error(
          `Node not found: ${currentNodeId}`
        );
      }

      const prompt =
        node.data.prompt ??
        "Make a YES or NO decision.";

      const nodeId: string = currentNodeId;

      const decision = await step.run(
        `node-${nodeId}`,
        async () => {
          const response =
            await openai.responses.create({
              model: "gpt-5-mini",

              input: [
                {
                  role: "system",
                  content: `
You are a strict binary classification engine.

Evaluate the user's input against the decision question.

Rules:
- Return YES only when the user's input clearly satisfies the decision question.
- Return NO when it does not satisfy the decision question.
- Do not treat unrelated requests as YES.
- Do not infer categories that are not clearly supported by the input.
- Return exactly one word: YES or NO.
- Never provide an explanation.
`,
                },
                {
                  role: "user",
                  content: `
Decision question:
${prompt}

Input:
${input}

Does the user input clearly satisfy the decision question?

Return only YES or NO.

                  `,
                },
              ],
            });

          const result =
            response.output_text
              .trim()
              .toUpperCase();

          if (
            result !== "YES" &&
            result !== "NO"
          ) {
            throw new Error(
              `Invalid AI response: ${result}`
            );
          }

          return result as "YES" | "NO";
        }
      );

      executionHistory.push({
        nodeId,
        prompt,
        decision,
      });

      // Send node execution update to frontend
      await step.realtime.publish(
      `publish-execution-${nodeId}`,
      workflowChannel({ runId }).execution,
      {
        nodeId,
        decision,
      }
);

      const matchingEdge:
        | WorkflowEdge
        | undefined = edges.find(
        (edge) =>
          edge.source === nodeId &&
          edge.sourceHandle?.toLowerCase() ===
            decision.toLowerCase()
      );

      if (!matchingEdge) {
        currentNodeId = null;
      } else {
        currentNodeId =
          matchingEdge.target;
      }
    }

    const finalNodeId =
      executionHistory[
        executionHistory.length - 1
      ]?.nodeId ?? null;

    // Tell frontend workflow has finished
    await step.realtime.publish(
      "publish-completed",
      workflowChannel({ runId }).completed,
      {
        finalNodeId,
      }
    );
    return {
      executionHistory,
      finalNodeId,
    };
  }
);

export const functions = [runWorkflow];