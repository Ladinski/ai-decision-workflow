"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";

import { useRealtime } from "inngest/react";

import DecisionNode from "@/components/DecisionNode";
import { workflowChannel } from "./channels";
import { getWorkflowToken } from "./actions";

import "@xyflow/react/dist/style.css";

const nodeTypes = {
  decision: DecisionNode,
};

type ExecutionItem = {
  nodeId: string;
  decision: "YES" | "NO";
};

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "1",
      type: "decision",
      position: {
        x: 300,
        y: 100,
      },
      data: {
        prompt: "Is this a support request?",
      },
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([]);

  const [workflowInput, setWorkflowInput] =
    useState("");

  const [isRunning, setIsRunning] =
    useState(false);

  const [runId, setRunId] =
    useState<string | null>(null);

  const [executionHistory, setExecutionHistory] =
    useState<ExecutionItem[]>([]);

  // ---------------------------------------
  // Realtime subscription
  // ---------------------------------------

  const realtime = useRealtime({
    channel: workflowChannel({
      runId: runId ?? "inactive",
    }),

    topics: ["execution", "completed"] as const,

    token: () => {
      if (!runId) {
        throw new Error(
          "No workflow run ID"
        );
      }

      return getWorkflowToken(runId);
    },

    enabled: Boolean(runId),
  });

  const realtimeExecution =
    realtime.messages.byTopic.execution;

  const realtimeCompleted =
    realtime.messages.byTopic.completed;

  // ---------------------------------------
  // Realtime execution update
  // ---------------------------------------

  useEffect(() => {
    if (!realtimeExecution) {
      return;
    }

    const newExecution =
      realtimeExecution.data;

    setExecutionHistory((current) => {
      const alreadyExists =
        current.some(
          (item) =>
            item.nodeId ===
              newExecution.nodeId &&
            item.decision ===
              newExecution.decision
        );

      if (alreadyExists) {
        return current;
      }

      return [
        ...current,
        {
          nodeId:
            newExecution.nodeId,
          decision:
            newExecution.decision,
        },
      ];
    });
  }, [realtimeExecution]);

  // ---------------------------------------
  // Workflow completed
  // ---------------------------------------

  useEffect(() => {
    if (!realtimeCompleted) {
      return;
    }

    setIsRunning(false);
  }, [realtimeCompleted]);

  // ---------------------------------------
  // Update prompt
  // ---------------------------------------

  const updatePrompt = useCallback(
    (id: string, prompt: string) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  prompt,
                },
              }
            : node
        )
      );
    },
    []
  );

  // ---------------------------------------
  // Nodes with execution styling
  // ---------------------------------------

  const nodesWithActions =
    nodes.map((node) => {
      const execution =
        executionHistory.find(
          (item) =>
            item.nodeId === node.id
        );

      return {
        ...node,

        data: {
          ...node.data,
          onChange: updatePrompt,
          executionDecision:
            execution?.decision,
        },

        style: execution
          ? {
              boxShadow:
                "0 0 0 4px #22c55e",
              borderRadius: 12,
            }
          : undefined,
      };
    });

  // ---------------------------------------
  // Animated chosen edges
  // ---------------------------------------

  const displayedEdges =
    edges.map((edge) => {
      const sourceExecution =
        executionHistory.find(
          (item) =>
            item.nodeId ===
            edge.source
        );

      const wasTaken =
        sourceExecution &&
        edge.sourceHandle?.toLowerCase() ===
          sourceExecution.decision.toLowerCase();

      return {
        ...edge,

        animated: Boolean(wasTaken),

        style: wasTaken
          ? {
              strokeWidth: 4,
            }
          : {
              strokeWidth: 1.5,
            },
      };
    });

  // ---------------------------------------
  // Node changes
  // ---------------------------------------

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((currentNodes) =>
        applyNodeChanges(
          changes,
          currentNodes
        )
      );
    },
    []
  );

  // ---------------------------------------
  // Edge changes
  // ---------------------------------------

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((currentEdges) =>
        applyEdgeChanges(
          changes,
          currentEdges
        )
      );
    },
    []
  );

  // ---------------------------------------
  // Connect nodes
  // ---------------------------------------

  const onConnect = useCallback(
    (connection: Connection) => {
      const path =
        connection.sourceHandle ===
        "yes"
          ? "YES"
          : "NO";

      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            label: path,
          },
          currentEdges
        )
      );
    },
    []
  );

  // ---------------------------------------
  // Add Node
  // ---------------------------------------

  function addNode() {
    const id =
      crypto.randomUUID();

    const newNode: Node = {
      id,
      type: "decision",

      position: {
        x:
          200 +
          Math.random() * 400,

        y:
          200 +
          Math.random() * 300,
      },

      data: {
        prompt:
          "Enter decision prompt...",
      },
    };

    setNodes((currentNodes) => [
      ...currentNodes,
      newNode,
    ]);
  }

  // ---------------------------------------
  // Save workflow locally
  // ---------------------------------------

  function saveWorkflow() {
    const workflow = {
      nodes,
      edges,
    };

    localStorage.setItem(
      "ai-workflow",
      JSON.stringify(workflow)
    );

    alert("Workflow saved!");
  }

  // ---------------------------------------
  // Load workflow locally
  // ---------------------------------------

  function loadWorkflow() {
    const savedWorkflow =
      localStorage.getItem(
        "ai-workflow"
      );

    if (!savedWorkflow) {
      alert(
        "No saved workflow found."
      );

      return;
    }

    try {
      const workflow =
        JSON.parse(savedWorkflow);

      setNodes(
        workflow.nodes ?? []
      );

      setEdges(
        workflow.edges ?? []
      );

      setExecutionHistory([]);
      setRunId(null);
      setIsRunning(false);

      alert("Workflow loaded!");
    } catch (error) {
      console.error(
        "Failed to load workflow:",
        error
      );

      alert(
        "Failed to load workflow."
      );
    }
  }

  // ---------------------------------------
  // Export workflow as JSON
  // ---------------------------------------

  function exportWorkflow() {
    const workflow = {
      nodes,
      edges,
    };

    const json =
      JSON.stringify(
        workflow,
        null,
        2
      );

    const blob = new Blob(
      [json],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "ai-workflow.json";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  }

  // ---------------------------------------
  // Import workflow from JSON
  // ---------------------------------------

  function importWorkflow(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const workflow =
          JSON.parse(
            reader.result as string
          );

        if (
          !Array.isArray(
            workflow.nodes
          ) ||
          !Array.isArray(
            workflow.edges
          )
        ) {
          throw new Error(
            "Invalid workflow JSON"
          );
        }

        setNodes(
          workflow.nodes
        );

        setEdges(
          workflow.edges
        );

        setExecutionHistory([]);
        setRunId(null);
        setIsRunning(false);

        alert(
          "Workflow imported!"
        );
      } catch (error) {
        console.error(
          "Failed to import workflow:",
          error
        );

        alert(
          "Invalid workflow JSON file."
        );
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  }

  // ---------------------------------------
  // Run Workflow
  // ---------------------------------------

  async function runWorkflow() {
    if (nodes.length === 0) {
      alert(
        "Add at least one node first."
      );

      return;
    }

    if (!workflowInput.trim()) {
      alert(
        "Enter workflow input first."
      );

      return;
    }

    setIsRunning(true);
    setExecutionHistory([]);
    setRunId(null);

    try {
      const response =
        await fetch(
          "/api/run-workflow",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nodes,
              edges,

              input:
                workflowInput,

              startNodeId:
                nodes[0].id,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Failed to start workflow"
        );
      }

      setRunId(
        result.runId
      );

      console.log(
        "Workflow started:",
        result
      );
    } catch (error) {
      console.error(
        "Workflow error:",
        error
      );

      setIsRunning(false);

      alert(
        "Failed to start workflow."
      );
    }
  }

  // ---------------------------------------
  // Clear execution
  // ---------------------------------------

  function clearExecution() {
    setExecutionHistory([]);
    setRunId(null);
    setIsRunning(false);
  }

  // ---------------------------------------
  // UI
  // ---------------------------------------

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      {/* Toolbar */}

      <div
        style={{
          position: "absolute",
          zIndex: 10,
          top: 20,
          left: 20,

          display: "flex",
          gap: 8,
          alignItems: "center",

          flexWrap: "wrap",

          maxWidth:
            "calc(100vw - 340px)",
        }}
      >
        {/* Workflow input */}

        <input
          value={
            workflowInput
          }
          onChange={(event) =>
            setWorkflowInput(
              event.target.value
            )
          }
          placeholder="Enter workflow input..."
          style={{
            width: 320,

            padding:
              "10px 12px",

            borderRadius: 8,

            border:
              "1px solid #4b5563",

            background:
              "#111827",

            color: "white",

            outline: "none",
          }}
        />

        {/* Add Node */}

        <button
          onClick={addNode}
          style={buttonStyle}
        >
          + Add Node
        </button>

        {/* Save */}

        <button
          onClick={saveWorkflow}
          style={buttonStyle}
        >
          Save
        </button>

        {/* Load */}

        <button
          onClick={loadWorkflow}
          style={buttonStyle}
        >
          Load
        </button>

        {/* Export JSON */}

        <button
          onClick={exportWorkflow}
          style={{
            ...buttonStyle,
            background:
              "#0f766e",
          }}
        >
          Export JSON
        </button>

        {/* Import JSON */}

        <label
          style={{
            ...buttonStyle,

            background:
              "#0e7490",

            display:
              "inline-block",
          }}
        >
          Import JSON

          <input
            type="file"
            accept=".json,application/json"
            onChange={
              importWorkflow
            }
            style={{
              display: "none",
            }}
          />
        </label>

        {/* Run */}

        <button
          onClick={runWorkflow}
          disabled={isRunning}
          style={{
            ...buttonStyle,

            background:
              isRunning
                ? "#4b5563"
                : "#16a34a",

            cursor:
              isRunning
                ? "not-allowed"
                : "pointer",
          }}
        >
          {isRunning
            ? "Running..."
            : "▶ Run Workflow"}
        </button>

        {/* Clear */}

        <button
          onClick={
            clearExecution
          }
          style={{
            ...buttonStyle,

            background:
              "#374151",
          }}
        >
          Clear
        </button>
      </div>

      {/* Execution Log */}

      <div
        style={{
          position: "absolute",

          zIndex: 10,

          right: 20,
          top: 20,

          width: 280,

          maxHeight: 420,

          overflowY: "auto",

          background:
            "rgba(17, 24, 39, 0.95)",

          border:
            "1px solid #374151",

          borderRadius: 12,

          padding: 16,

          color: "white",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,

            marginBottom: 10,
          }}
        >
          Execution Log
        </div>

        <div
          style={{
            fontSize: 12,

            color:
              "#9ca3af",

            marginBottom: 12,
          }}
        >
          Realtime:{" "}
          {
            realtime.connectionStatus
          }
        </div>

        {executionHistory.length ===
        0 ? (
          <div
            style={{
              color:
                "#9ca3af",

              fontSize: 14,
            }}
          >
            No workflow executed yet.
          </div>
        ) : (
          executionHistory.map(
            (item, index) => {
              const node =
                nodes.find(
                  (node) =>
                    node.id ===
                    item.nodeId
                );

              return (
                <div
                  key={`${item.nodeId}-${index}`}
                  style={{
                    marginBottom: 12,

                    padding: 10,

                    background:
                      "#1f2937",

                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,

                      color:
                        "#9ca3af",
                    }}
                  >
                    Step{" "}
                    {index + 1}
                  </div>

                  <div
                    style={{
                      fontWeight: 600,

                      marginTop: 4,
                    }}
                  >
                    {String(
                      node?.data
                        ?.prompt ??
                        item.nodeId
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 6,

                      fontWeight: 700,
                    }}
                  >
                    Decision:{" "}
                    {item.decision}
                  </div>
                </div>
              );
            }
          )
        )}

        {realtimeCompleted && (
          <div
            style={{
              marginTop: 10,

              padding: 10,

              background:
                "#14532d",

              borderRadius: 8,

              fontWeight: 700,
            }}
          >
            ✓ Workflow completed
          </div>
        )}
      </div>

      {/* React Flow */}

      <ReactFlow
        nodes={
          nodesWithActions
        }
        edges={
          displayedEdges
        }
        nodeTypes={
          nodeTypes
        }
        onNodesChange={
          onNodesChange
        }
        onEdgesChange={
          onEdgesChange
        }
        onConnect={
          onConnect
        }
        fitView
      >
        <Background />

        <Controls />
      </ReactFlow>
    </main>
  );
}

// ---------------------------------------
// Shared button style
// ---------------------------------------

const buttonStyle: React.CSSProperties =
  {
    padding:
      "10px 16px",

    background:
      "#6366f1",

    color: "white",

    border: "none",

    borderRadius: 8,

    cursor: "pointer",

    fontWeight: 600,

    whiteSpace:
      "nowrap",
  };