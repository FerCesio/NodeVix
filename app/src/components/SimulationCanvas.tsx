import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ToolsPanel } from './ToolsPanel';
import type { ToolMode } from '../types/tools';
import { DefaultNode } from '../sandbox/DefaultNode';
import type { INode } from '../sandbox/interfaces';
import '../styles/sandbox.css';

export const SimulationCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<ToolMode>('SELECT');
  
  // Refs para mantener la simulación y el modo sincronizados sin re-renders
  const modeRef = useRef(mode);
  const nodesRef = useRef<INode[]>([]);
  const simulationRef = useRef<d3.Simulation<INode & d3.SimulationNodeDatum, undefined>>(null);
  
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. CONFIGURACIÓN INICIAL DEL LIENZO ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);
    svg.selectAll("*").remove(); // Limpieza

    // --- 2. DEFINICIONES Y GRILLA (ESTÁTICO) ---
    const defs = svg.append("defs");
    defs.append("pattern")
      .attr("id", "grid")
      .attr("width", 50)
      .attr("height", 50)
      .attr("patternUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M 50 0 L 0 0 0 50")
      .attr("fill", "none")
      .attr("stroke", "rgba(255, 255, 255, 0.05)")
      .attr("stroke-width", 1);

    const container = svg.append("g").attr("class", "zoom-container");
    
    // Rectángulo de fondo para la grilla
    container.append("rect")
      .attr("width", width * 10)
      .attr("height", height * 10)
      .attr("x", -width * 5)
      .attr("y", -height * 5)
      .attr("fill", "url(#grid)");

    // Capas de renderizado (Orden Z)
    const linkLayer = container.append("g").attr("class", "links-layer");
    const nodeLayer = container.append("g").attr("class", "nodes-layer");

    // --- 3. MOTOR FÍSICO ---
    const simulation = d3.forceSimulation<INode & d3.SimulationNodeDatum>(nodesRef.current)
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));
    
    simulationRef.current = simulation;

    // --- 4. PIPELINE DE RENDERIZADO (updateVisuals) ---
    const updateVisuals = () => {
      // Sincronización de Nodos
      const node = nodeLayer.selectAll<SVGGElement, INode>(".node-group")
        .data(nodesRef.current, d => d.id)
        .join(
          enter => {
            const g = enter.append("g").attr("class", "node-group");
            g.append("circle").attr("r", 20).attr("fill", "#2ecc71");
            g.append("text")
              .attr("text-anchor", "middle")
              .attr("dy", ".35em")
              .attr("fill", "white")
              .style("font-size", "12px");
            return g;
          }
        );

      // Actualizar el texto del valor (para cuando BubbleSort cambie valores)
      node.select("text").text(d => d.value);

      simulation.on("tick", () => {
        node.attr("transform", d => `translate(${d.pos.x}, ${d.pos.y})`);
      });
    };

    // --- 5. INTERACCIONES Y ZOOM ---
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .on("zoom", (event) => container.attr("transform", event.transform));
    svg.call(zoom);

    svg.on("click", (event) => {
      if (modeRef.current === 'ADD_NODE') {
        const [mx, my] = d3.pointer(event);
        const transform = d3.zoomTransform(svg.node() as any);
        const rx = (mx - transform.x) / transform.k;
        const ry = (my - transform.y) / transform.k;

        const newNode = new DefaultNode(`n-${Date.now()}`, Math.floor(Math.random() * 100), rx, ry);
        nodesRef.current.push(newNode);
        
        simulation.nodes(nodesRef.current);
        updateVisuals();
        simulation.alpha(0.3).restart();
      }
    });

    updateVisuals();
  }, []);

  return (
    <div className="canvas-wrapper">
      <ToolsPanel activeMode={mode} onModeChange={setMode} />
      <svg ref={svgRef}></svg>
    </div>
  );
};