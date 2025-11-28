import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DialogueNode, GraphNode, GraphLink } from '../types';

interface GraphViewerProps {
  data: DialogueNode[];
  onError: (error: string | null) => void;
  isDarkMode: boolean;
  repulsionForce: number;
}

const GraphViewer: React.FC<GraphViewerProps> = ({ data, onError, isDarkMode, repulsionForce }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Force without re-rendering graph
  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current
        .force("charge", d3.forceManyBody().strength(-repulsionForce))
        .alpha(0.3)
        .restart();
    }
  }, [repulsionForce]);

  // Render Graph
  useEffect(() => {
    if (!data || data.length === 0 || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Theme Colors
    const colors = isDarkMode ? {
      nodeFill: "#0f172a", // Slate-950
      nodeStroke: "#38bdf8", // Sky-400
      textMain: "#e2e8f0", // Slate-200
      textSub: "#94a3b8", // Slate-400
      link: "#64748b", // Slate-500
      linkText: "#cbd5e1", // Slate-300
    } : {
      nodeFill: "#ffffff", // White
      nodeStroke: "#6366f1", // Indigo-500
      textMain: "#1e293b", // Slate-800
      textSub: "#64748b", // Slate-500
      link: "#94a3b8", // Slate-400
      linkText: "#475569", // Slate-600
    };

    // 1. Prepare Data for D3
    const nodes: GraphNode[] = data.map(d => ({
      id: d.id,
      speaker: d.speaker || 'Narrator',
      text: d.text,
      type: 'node',
      // Randomize slightly to help simulation start if no previous positions
      x: dimensions.width / 2 + (Math.random() - 0.5) * 50,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 50
    }));

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const linkExistenceMap = new Set<string>();

    // First pass: map all potential links to detect bidirectional
    data.forEach(node => {
      if (node.choices) {
        node.choices.forEach(choice => {
          if (nodeMap.has(choice.nextId)) {
            linkExistenceMap.add(`${node.id}|${choice.nextId}`);
          }
        });
      }
    });

    const links: GraphLink[] = [];
    data.forEach(node => {
      if (node.choices) {
        node.choices.forEach(choice => {
          if (nodeMap.has(choice.nextId)) {
            const isBidirectional = linkExistenceMap.has(`${choice.nextId}|${node.id}`);
            links.push({
              source: node.id,
              target: choice.nextId,
              label: choice.text,
              bidirectional: isBidirectional
            });
          } else {
             console.warn(`Missing target node: ${choice.nextId}`);
          }
        });
      }
    });

    // 2. Setup Simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(250))
      .force("charge", d3.forceManyBody().strength(-repulsionForce))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collide", d3.forceCollide().radius(80).iterations(2));
    
    simulationRef.current = simulation;

    // 3. Draw Elements
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Define Arrow Marker
    // Node radius is 25. Stroke is 3. 
    // We shorten the link path to stop at the node boundary.
    // The marker path is "M0,-5L10,0L0,5". Tip is at x=10.
    // Setting refX=9 puts the tip (10) 1 unit past the end of the line, ensuring it overlaps/touches the node circle.
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 9) 
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", colors.link);

    // Links
    const linkGroup = g.append("g").attr("class", "links");
    
    const link = linkGroup.selectAll("g")
      .data(links)
      .enter().append("g");

    const linkPath = link.append("path")
      .attr("stroke", colors.link)
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)");

    // Link Labels (Choice Text)
    const linkText = link.append("text")
      .attr("dy", 4) // Centered vertically relative to the computed point
      .attr("font-size", "11px")
      .attr("fill", colors.linkText)
      .attr("text-anchor", "middle")
      .style("pointer-events", "none") // Let clicks pass through
      .style("text-shadow", isDarkMode ? "0 0 4px #000" : "0 0 4px #fff")
      .text(d => d.label.length > 25 ? d.label.substring(0, 25) + '...' : d.label);

    // Nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("cursor", "grab")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Circle
    node.append("circle")
      .attr("r", 25) 
      .attr("fill", colors.nodeFill)
      .attr("stroke", colors.nodeStroke)
      .attr("stroke-width", 3);

    // Node Labels (ID)
    node.append("text")
      .attr("dy", 42)
      .attr("text-anchor", "middle")
      .attr("fill", colors.textMain)
      .attr("font-size", "13px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("text-shadow", isDarkMode ? "0 1px 2px rgba(0,0,0,0.8)" : "none")
      .text(d => d.id);

    // Node Content Text (Truncated)
    node.append("text")
      .attr("dy", 56) // Positioned below ID
      .attr("text-anchor", "middle")
      .attr("fill", colors.textSub)
      .attr("font-size", "10px")
      .attr("font-style", "italic")
      .style("pointer-events", "none")
      .style("text-shadow", isDarkMode ? "0 1px 2px rgba(0,0,0,0.8)" : "none")
      .text(d => d.text.length > 25 ? `"${d.text.substring(0, 25)}..."` : `"${d.text}"`);

    // Speaker Label (Small)
    node.append("text")
      .attr("dy", -32)
      .attr("text-anchor", "middle")
      .attr("fill", colors.textSub)
      .attr("font-size", "11px")
      .style("pointer-events", "none")
      .text(d => d.speaker);

    // Simulation Tick
    simulation.on("tick", () => {
      linkPath.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return ""; 

        // Calculate unit vector
        const ux = dx / dist;
        const uy = dy / dist;

        // Radius to stop at (Node Radius 25 + Stroke 1.5 + Padding 1.5)
        const radius = 28;

        // New start and end points at the edge of the nodes
        const sx = d.source.x + ux * radius;
        const sy = d.source.y + uy * radius;
        const tx = d.target.x - ux * radius;
        const ty = d.target.y - uy * radius;

        // Recalculate distance for the shortened segment
        const ddist = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2);
        
        if (d.bidirectional) {
            // Curve Left (sweep-flag 0). 
            // We use the new endpoints (sx, sy) -> (tx, ty).
            // The curvature logic remains '0 0,0' which draws an arc with radius = chord length.
            return `M${sx},${sy}A${ddist},${ddist} 0 0,0 ${tx},${ty}`;
        }
        
        // Straight line for unidirectional
        return `M${sx},${sy}L${tx},${ty}`;
      });

      linkText
        .attr("x", (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const midX = (d.source.x + d.target.x) / 2;
            
            // Perpendicular Vector (-dy, dx) for Left
            // We normalized (dx, dy) previously.
            // Left Normal = (dy/dist, -dx/dist) if Y is Up. 
            // SVG Y is Down.
            // Vector V = (1, 0) [Right]. Normal Left is (0, -1) [Up].
            // Formula (dy, -dx) gives (0, -1). Correct.
            
            const nx = dy / dist; 
            
            // If bidirectional, push it OUTSIDE the curve (Left side).
            // Curve is Left (sweep 0). Outside is Left.
            // If straight, push it Left (Above).
            // Inverted offset logic for Bidirectional to match the Curve Left.
            // Bidirectional: Curve Left -> Text Left (Negative offset)
            // Unidirectional: Straight -> Text Left (Negative offset)
            const offset = d.bidirectional ? -Math.max(25, dist * 0.15) : -15;
            
            return midX + nx * offset;
        })
        .attr("y", (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const midY = (d.source.y + d.target.y) / 2;
            
            const ny = -dx / dist;
            const offset = d.bidirectional ? -Math.max(25, dist * 0.15) : -15;
            
            return midY + ny * offset;
        });

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag Functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, unknown>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, unknown>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, unknown>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, dimensions, isDarkMode]);

  return (
    <div ref={containerRef} className={`w-full h-full overflow-hidden relative rounded-lg border shadow-inner transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
      <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded text-xs border pointer-events-none transition-colors duration-300 ${isDarkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-white/80 text-slate-500 border-slate-200'}`}>
        Wait for physics to settle • Scroll to Zoom • Drag to Move
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default GraphViewer;