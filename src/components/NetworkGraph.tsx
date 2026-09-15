"use client";

import { useEffect, useRef, useState } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
} from "d3-force";
import { useRouter } from "next/navigation";
import type { GraphNode, GraphEdge } from "@/lib/graph";

type SimNode = GraphNode & SimulationNodeDatum;
type SimLink = { source: SimNode; target: SimNode; kind: "follow" | "similar" };

const WIDTH = 900;
const HEIGHT = 640;

const RING_COLOR: Record<number, string> = {
  0: "#58a6ff",
  1: "#3fb950",
  2: "#8b949e",
};
const RING_RADIUS: Record<number, number> = { 0: 26, 1: 20, 2: 15 };

export default function NetworkGraph({
  nodes,
  edges,
  centerId,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  centerId: string;
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<string | null>(null);
  const movedRef = useRef(false);

  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);

  const [renderNodes, setRenderNodes] = useState<SimNode[]>([]);
  const [renderLinks, setRenderLinks] = useState<SimLink[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  // The force layout only ever runs client-side: it's seeded with tiny
  // floating-point-sensitive physics, so computing it during SSR and again
  // on hydration produces mismatched attribute values.
  useEffect(() => {
    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const byId = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks: SimLink[] = edges
      .map((e) => ({ source: byId.get(e.source)!, target: byId.get(e.target)!, kind: e.kind }))
      .filter((l) => l.source && l.target);

    nodesRef.current = simNodes;
    linksRef.current = simLinks;

    const sim = forceSimulation(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .distance((l) => (l.kind === "similar" ? 160 : 100))
          .strength(0.5)
      )
      .force("charge", forceManyBody().strength(-260))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collide", forceCollide<SimNode>().radius((d) => RING_RADIUS[d.ring] + 24))
      .on("tick", () => {
        setRenderNodes([...nodesRef.current]);
        setRenderLinks([...linksRef.current]);
      });

    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [nodes, edges]);

  function toSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function onPointerDown(e: React.PointerEvent, node: SimNode) {
    (e.target as Element).setPointerCapture(e.pointerId);
    draggingRef.current = node.id;
    movedRef.current = false;
    simRef.current?.alphaTarget(0.3).restart();
    node.fx = node.x;
    node.fy = node.y;
  }

  function onPointerMove(e: React.PointerEvent) {
    const id = draggingRef.current;
    if (!id) return;
    movedRef.current = true;
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    const { x, y } = toSvgPoint(e.clientX, e.clientY);
    node.fx = x;
    node.fy = y;
  }

  function onPointerUp(node: SimNode) {
    const wasClick = !movedRef.current;
    draggingRef.current = null;
    node.fx = null;
    node.fy = null;
    simRef.current?.alphaTarget(0);
    if (wasClick) router.push(`/u/${node.username}`);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto touch-none select-none"
      onPointerMove={onPointerMove}
    >
      {renderLinks.map((l, i) => (
        <line
          key={i}
          x1={l.source.x}
          y1={l.source.y}
          x2={l.target.x}
          y2={l.target.y}
          stroke={l.kind === "similar" ? "#8b949e" : "#30363d"}
          strokeWidth={l.kind === "similar" ? 1 : 1.5}
          strokeDasharray={l.kind === "similar" ? "4 4" : undefined}
          opacity={l.kind === "similar" ? 0.6 : 0.8}
        />
      ))}

      {renderNodes.map((n) => {
        const r = RING_RADIUS[n.ring];
        const isCenter = n.id === centerId;
        return (
          <g
            key={n.id}
            transform={`translate(${n.x ?? 0}, ${n.y ?? 0})`}
            className="cursor-pointer"
            onPointerDown={(e) => onPointerDown(e, n)}
            onPointerUp={() => onPointerUp(n)}
            onPointerEnter={() => setHovered(n.id)}
            onPointerLeave={() => setHovered((h) => (h === n.id ? null : h))}
          >
            <circle
              r={r + (hovered === n.id ? 3 : 0)}
              fill="#161b22"
              stroke={RING_COLOR[n.ring]}
              strokeWidth={isCenter ? 3 : 2}
              className="transition-all"
            />
            <clipPath id={`clip-${n.id}`}>
              <circle r={r - 3} />
            </clipPath>
            <image
              href={n.avatar ?? undefined}
              x={-(r - 3)}
              y={-(r - 3)}
              width={(r - 3) * 2}
              height={(r - 3) * 2}
              clipPath={`url(#clip-${n.id})`}
            />
            <text
              y={r + 16}
              textAnchor="middle"
              fontSize={12}
              fontFamily="var(--font-geist-mono), monospace"
              fill={hovered === n.id ? "#e6edf3" : "#8b949e"}
            >
              @{n.username}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
