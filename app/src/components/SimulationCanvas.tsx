import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import "../styles/canvas.css"
import { ToolsPanel } from './ToolsPanel';
import type { ToolMode } from '../types/tools';

// Definición de tipos para nuestros datos
interface CustomNode extends d3.SimulationNodeDatum {
  id: string;
  group?: number;
  type: 'circle' | 'square'; // Nuevo campo
}

interface CustomLink extends d3.SimulationLinkDatum<CustomNode> {
  value: number;
}

export const SimulationCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "grid")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", "rgba(255, 255, 255, 0.05)")
      .attr("stroke-width", 1);

    const container = svg.append("g");

    container.append("rect")
        .attr("width", width * 20)
        .attr("height", height * 20)
        .attr("x", -width * 10)
        .attr("y", -height * 10)
        .attr("fill", "url(#grid)")
        .style("pointer-events", "all");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    const handleResize = () => {
      svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="canvas-wrapper">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default SimulationCanvas;