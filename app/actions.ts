"use server";

import {
  getClientSubscriptionToken,
} from "inngest/react";

import { inngest } from "./client";
import { workflowChannel } from "./channels";

export async function getWorkflowToken(
  runId: string
) {
  return getClientSubscriptionToken(
    inngest,
    {
      channel: workflowChannel({ runId }),
      topics: [
        "execution",
        "completed",
      ],
    }
  );
}