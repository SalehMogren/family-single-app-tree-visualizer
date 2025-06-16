import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { TreeNodeData, LinkData } from "../types";
import { NodeCard } from "./NodeCard";
import { Link } from "./Link";

interface TreeSvgProps {
  nodes: TreeNodeData[];
  links: LinkData[];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onNodeClick: (node: TreeNodeData) => void;
  onNodeDrag: (node: TreeNodeData, x: number, y: number) => void;
}

export function TreeSvg({
  nodes,
  links,
  zoom,
  onZoomChange,
  onNodeClick,
  onNodeDrag,
}: TreeSvgProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        onZoomChange(event.transform.k);
      });

    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    const container = svg.append("g");

    // Draw links
    container
      .selectAll(".link")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", (d) => d.d || "")
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (d.source.isPlaceholder || d.target.isPlaceholder) return "#9CA3AF";
        return d.type === "spouse" ? "#F59E0B" : "#D4AF37";
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => {
        return d.source.isPlaceholder || d.target.isPlaceholder
          ? "5,5"
          : "none";
      })
      .attr("opacity", (d) => {
        return d.source.isPlaceholder || d.target.isPlaceholder ? 0.8 : 0.7;
      });

    // Create node groups
    const nodeGroups = container
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick(d);
      });

    // Make real nodes draggable
    nodeGroups
      .filter((d) => !d.isPlaceholder)
      .call(
        d3
          .drag<SVGGElement, TreeNodeData>()
          .on("start", function (event, d) {
            d3.select(this).raise();
          })
          .on("drag", function (event, d) {
            const newX = event.x;
            const newY = event.y;
            d3.select(this).attr("transform", `translate(${newX},${newY})`);
            onNodeDrag(d, newX, newY);
          })
      );

    // Add node cards
    nodeGroups.each(function (d) {
      const nodeGroup = d3.select<SVGGElement, TreeNodeData>(this);
      NodeCard({ node: d, nodeGroup });
    });

    // Initial zoom to center
    svg
      .transition()
      .duration(750)
      .call(
        zoomBehavior.transform,
        d3.zoomIdentity.translate(400, 300).scale(1)
      );
  }, [nodes, links, onZoomChange, onNodeClick, onNodeDrag]);

  return (
    <svg
      ref={svgRef}
      width='100%'
      height='100%'
      viewBox='0 0 800 600'
      className='cursor-move'
      style={{
        fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
      }}
    />
  );
}
