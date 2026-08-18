import { realtime, staticSchema } from "inngest";

export const workflowChannel = realtime.channel({
  name: ({ runId }: { runId: string }) =>
    `workflow:${runId}`,

  topics: {
    execution: {
      schema: staticSchema<{
        nodeId: string;
        decision: "YES" | "NO";
      }>(),
    },

    completed: {
      schema: staticSchema<{
        finalNodeId: string | null;
      }>(),
    },
  },
});