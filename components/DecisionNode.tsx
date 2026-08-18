"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type DecisionNodeData = {
  prompt: string;
  onChange: (id: string, prompt: string) => void;
};

export default function DecisionNode({
  id,
  data,
}: NodeProps) {
  const nodeData = data as DecisionNodeData;

  return (
    <div
      style={{
        width: 260,
        background: "white",
        color: "#111827",
        border: "2px solid #6366f1",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
      />

      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        AI Decision
      </div>

      <textarea
        value={nodeData.prompt}
        onChange={(event) =>
          nodeData.onChange(id, event.target.value)
        }
        className="nodrag"
        rows={3}
        style={{
          width: "100%",
          resize: "none",
          padding: 8,
          border: "1px solid #d1d5db",
          borderRadius: 6,
          color: "#111827",
          background: "#f9fafb",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <span>NO</span>
        <span>YES</span>
      </div>

      <Handle
        id="no"
        type="source"
        position={Position.Bottom}
        style={{
          left: "25%",
        }}
      />

      <Handle
        id="yes"
        type="source"
        position={Position.Bottom}
        style={{
          left: "75%",
        }}
      />
    </div>
  );
}