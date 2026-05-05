import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import "../styles/canvas.css"

// Definición de tipos para nuestros datos
interface CustomNode extends d3.SimulationNodeDatum {
  id: string;
  group?: number;
  type: 'circle' | 'square'; // Nuevo campo
}

interface CustomLink extends d3.SimulationLinkDatum<CustomNode> {
  value: number;
}

const SimulationCanvas: React.FC = () => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const links_length = 100;
    const links_strength = -200;
    const nodes_stop_delay = 0.8;

    useEffect(() => {
        if (!svgRef.current) return;
        
        d3.select(svgRef.current).selectAll("*").remove();
        
        // 1. Datos iniciales de ejemplo
        const nodes: CustomNode[] = [
            { id: "Root", type:'circle', x: width / 2, y: height / 2 },
            { id: "Node A", type:'circle', x: width / 2, y: height / 2 },
            { id: "Node B", type:'circle', x: width / 2, y: height / 2 },
            { id: "Node C", type:'circle', x: width / 2, y: height / 2 },
            { id: "Node D", type:'circle', x: width / 2, y: height / 2 },
            { id: "Node E", type:'square', x: width / 2, y: height / 2 }
        ];
        
        const links: CustomLink[] = [
            { source: "Root", target: "Node A", value: 1 },
            { source: "Root", target: "Node B", value: 1 },
            { source: "Node B", target: "Node C", value: 1 },    { source: "Root", target: "Node A", value: 1 },
            { source: "Node A", target: "Node D", value: 1 },
            { source: "Node D", target: "Node E", value: 1 },
            { source: "Node E", target: "Root", value: 1 }
        ];

        
        // 2. Configuración de la simulación de fuerzas
        const simulation = d3.forceSimulation<CustomNode>(nodes)
            .force("link", d3.forceLink<CustomNode, CustomLink>(links).id(d => d.id).distance(links_length))
            .force("charge", d3.forceManyBody().strength(links_strength))
            .velocityDecay(nodes_stop_delay) // Repulsión entre nodos

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
        
        // La capa interna (se mueve con el zoom)
        const container = svg.append("g");

        
        const defs = svg.append("defs");

        const pattern = defs.append("pattern")
            .attr("id", "grid")             // ID para referenciarlo luego
            .attr("width", 40)              // Tamaño del cuadrado de la grilla
            .attr("height", 40)
            .attr("patternUnits", "userSpaceOnUse");

        // Línea vertical
        pattern.append("line")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", 0).attr("y2", 40)
            .attr("stroke", "#333")         // Color sutil
            .attr("stroke-width", 1);

        // Línea horizontal
        pattern.append("line")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", 40).attr("y2", 0)
            .attr("stroke", "#333")
            .attr("stroke-width", 1);
        
        // Definición del Zoom
        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 10])
            .on("zoom", (event) => {
                // MOVEMOS EL CONTENEDOR, NO EL SVG
                container.attr("transform", event.transform);
            });
        svg.call(zoomBehavior);
        
        // 3. Renderizado de los enlaces (líneas)
        container.append("rect")
            .attr("width", width * 10)      // Un tamaño mucho mayor al viewport para no ver bordes
            .attr("height", height * 10)
            .attr("x", -width * 5)          // Centrarlo respecto al origen
            .attr("y", -height * 5)
            .attr("fill", "url(#grid)");    // Referencia al ID del patrón
      
        const link = container.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", "var(--line-color)")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", d => Math.sqrt(d.value));

        // 4. Renderizado de los nodos (círculos)
        const node = container.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .call(drag(simulation) as any); // Habilitar arrastre

        // Añadir círculos a los nodos tipo 'circle'
        node.filter(d => d.type === 'circle')
            .append("circle")
            .attr("r", 15)
            .attr("fill", "var(--circle-color)");

        // Añadir cuadrados a los nodos tipo 'square'
        node.filter(d => d.type === 'square')
            .append("rect")
            .attr("width", 24)
            .attr("height", 24)
            .attr("x", -12) // Centrar el cuadrado respecto al punto (x,y)
            .attr("y", -12)
            .attr("fill", "var(--square-color)"); // Verde

        // 5. El "Tick": Función que actualiza las posiciones en cada cuadro
        simulation.on("tick", () => {
            link
                .attr("x1", d => (d.source as any).x)
                .attr("y1", d => (d.source as any).y)
                .attr("x2", d => (d.target as any).x)
                .attr("y2", d => (d.target as any).y);

            node.attr("transform", d => `translate(${d.x}, ${d.y})`);
            
        });

        // Limpieza al desmontar el componente
        return () => {
            simulation.stop()
        };
    }, []);

  // Función auxiliar para el comportamiento de arrastre (Drag & Drop)
  function drag(simulation: d3.Simulation<CustomNode, undefined>) {
    return d3.drag<SVGCircleElement, CustomNode>()
      .on("start", (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });
  }

  return (
    <div className="canvas-wrapper" style={{ textAlign: 'center', marginTop: '20px' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default SimulationCanvas;