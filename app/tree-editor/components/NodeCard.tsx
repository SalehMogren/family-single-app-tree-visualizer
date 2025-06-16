import { Selection } from "d3";
import * as d3 from "d3";
import { TreeNodeData } from "../types";

interface NodeCardProps {
  node: TreeNodeData;
  nodeGroup: Selection<SVGGElement, TreeNodeData, null, undefined>;
}

export function NodeCard({ node, nodeGroup }: NodeCardProps) {
  // Add node background
  nodeGroup
    .append("rect")
    .attr("x", -80)
    .attr("y", -35)
    .attr("width", 160)
    .attr("height", 70)
    .attr("rx", 8)
    .attr("fill", (d) => {
      if (d.isPlaceholder) return d.type === "parent" ? "#E0F2F7" : "#FFF7ED";
      return d.gender === "male" ? "#1E40AF" : "#BE185D";
    })
    .attr("stroke", (d) => {
      if (d.isPlaceholder) {
        return d.type === "parent" ? "#0A7F9F" : "#F59E0B";
      }
      return "#D4AF37";
    })
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", (d) => (d.isPlaceholder ? "5,5" : "none"))
    .attr("opacity", 1)
    .style("transition", "all 0.2s ease-in-out")
    .style("cursor", "pointer")
    .on("mouseover", function (this: SVGRectElement) {
      const datum = d3.select(this).datum() as TreeNodeData;
      if (!datum.isPlaceholder) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("transform", "scale(1.05)")
          .attr("filter", "brightness(1.1)");
      }
    })
    .on("mouseout", function (this: SVGRectElement) {
      const datum = d3.select(this).datum() as TreeNodeData;
      if (!datum.isPlaceholder) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("transform", "scale(1)")
          .attr("filter", "brightness(1)");
      }
    });

  // Add node name
  nodeGroup
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", (d) => (d.isPlaceholder ? 5 : -10))
    .attr("fill", (d) => {
      if (d.isPlaceholder) {
        return d.type === "parent" ? "#0A7F9F" : "#F59E0B";
      }
      return "white";
    })
    .attr("font-size", "14px")
    .attr("font-weight", (d) => (d.isPlaceholder ? "bold" : "bold"))
    .text((d) => d.name);

  // Add birth year (only for real nodes)
  if (!node.isPlaceholder) {
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 10)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .text((d) => d.birth_year.toString());
  }

  // Add image if available (only for real nodes)
  if (!node.isPlaceholder && node.image) {
    nodeGroup
      .append("image")
      .attr("x", -70)
      .attr("y", -25)
      .attr("width", 30)
      .attr("height", 30)
      .attr("href", (d) => d.image!)
      .attr("clip-path", "circle(15px)");
  }
}
