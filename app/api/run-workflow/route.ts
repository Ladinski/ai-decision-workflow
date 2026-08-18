import { NextResponse } from "next/server";
import { inngest } from "../../client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      nodes,
      edges,
      input,
      startNodeId,
    } = body;

    if (
      !nodes ||
      !edges ||
      !input ||
      !startNodeId
    ) {
      return NextResponse.json(
        {
          error: "Missing workflow data",
        },
        {
          status: 400,
        }
      );
    }

    const runId = crypto.randomUUID();

    await inngest.send({
      name: "workflow/run",
      data: {
        nodes,
        edges,
        input,
        startNodeId,
        runId,
      },
    });

    return NextResponse.json({
      success: true,
      runId,
    });
  } catch (error) {
    console.error(
      "Failed to start workflow:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to start workflow",
      },
      {
        status: 500,
      }
    );
  }
}