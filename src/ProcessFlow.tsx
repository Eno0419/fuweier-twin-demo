import {
  ReactFlow,
  Background,
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect } from "react";
import { equipment, processes } from "./data";
import { useTwin } from "./store";
function ProcessNode({ data }: NodeProps) {
  return (
    <button
      className={`process-node ${data.active ? "active" : ""}`}
      aria-label={`定位工序：${String(data.label)}`}
    >
      <Handle type="target" position={Position.Left} />
      <span>{String(data.index).padStart(2, "0")}</span>
      <strong>{String(data.label)}</strong>
      <small>{String(data.count)} 条设备记录 · 点击定位</small>
      <Handle type="source" position={Position.Right} />
    </button>
  );
}
const nodeTypes = { process: ProcessNode };
export default function ProcessFlow() {
  const s = useTwin();
  const current = equipment.find((e) => e.id === s.selected);
  useEffect(() => {
    if (s.line === "all") s.set({ line: current?.line === "2" ? "2" : "1" });
  }, [s.line, current?.line, s.set]);
  const nodes = processes.map((p, i) => ({
    id: p,
    type: "process",
    position: { x: i * 195, y: 20 },
    data: {
      label: p,
      index: i + 1,
      count: equipment.filter(
        (e) => e.process === p && (s.line === "all" || e.line === s.line),
      ).length,
      active: current?.process === p,
    },
  }));
  const edges = processes.slice(1).map((p, i) => ({
    id: `e${i}`,
    source: processes[i],
    target: p,
    animated: true,
    style: { stroke: "#7795c3", strokeWidth: 2 },
  }));
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      defaultViewport={{x: 15, y: 10, zoom: 0.8}}
      nodesDraggable={false}
      nodesConnectable={false}
      minZoom={0.12}
      maxZoom={1.4}
      onNodeClick={(_, node) => {
        const e = equipment.find(
          (e) =>
            e.process === node.id && (s.line === "all" || e.line === s.line),
        );
        if (e) s.locate(e.id);
      }}
    >
      <Background color="#d8e0e9" gap={20} />
    </ReactFlow>
  );
}
