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

const SimulationCanvas: React.FC = () => {
    // Usamos referencia al modo para que no quede fijo en uno
    const [mode, setMode] = useState<ToolMode>('SELECT');
    const modeRef = useRef(mode);
    
    // Sincronizar Ref para que D3 siempre lea el modo actual sin re-renders
    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);
    
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
        
        const linkGroup = container.append("g").attr("class", "links-layer");
        const nodeGroup = container.append("g").attr("class", "nodes-layer");
        
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

        
        
        
        const updateVisuals = () => {
            // Añadir círculos a los nodos tipo 'circle'
            // 1. Seleccionamos sobre el grupo ya existente, NO hacemos append general
                const link = linkGroup.selectAll("line")
                    .data(links)
                    .join("line")
                    .attr("stroke", "var(--line-color)")
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", d => Math.sqrt(d.value || 1));

                // 2. Seleccionamos sobre el grupo de nodos
                const node = nodeGroup.selectAll(".node-group")
                    .data(nodes, d => d.id) // USAR KEY (d.id) es vital para estabilidad
                    .join(
                        enter => {
                            // Solo lo que entra (nodos nuevos) recibe esto
                            const g = enter.append("g").attr("class", "node-group");
                            
                            g.filter(d => d.type === 'circle')
                                .append("circle")
                                .attr("r", 15)
                                .attr("fill", "var(--circle-color)");

                            g.filter(d => d.type === 'square')
                                .append("rect")
                                .attr("width", 24).attr("height", 24)
                                .attr("x", -12).attr("y", -12)
                                .attr("fill", "var(--square-color)");

                            return g;
                        }
                    )
                    .call(drag(simulation) as any);
            // 5. El "Tick": Función que actualiza las posiciones en cada cuadro
            simulation.on("tick", () => {
                link
                    .attr("x1", d => (d.source as any).x)
                    .attr("y1", d => (d.source as any).y)
                    .attr("x2", d => (d.target as any).x)
                    .attr("y2", d => (d.target as any).y);

                node.attr("transform", d => `translate(${d.x}, ${d.y})`);
                
            });
        }
        updateVisuals()

        const addNewNode = (newNode: CustomNode) => {
            // Actualizar el array de datos (puedes usar un estado de React o mutar el array original)
            nodes.push(newNode);

            // Reinyectar los nodos a la simulación
            simulation.nodes(nodes);

            // Volver a vincular los elementos del DOM
            // Esta es la parte donde ejecutas de nuevo el .data().join() para los círculos/rectángulos
            updateVisuals(); 

            // Dar un pequeño impulso para que se acomoden
            simulation.alpha(0.3).restart();
        };
        
        // Cuando le damos al click
        svg.on("click", (event) => {
            const currentMode = modeRef.current;

            // Si estamos en modo selección, no creamos nada
            if (currentMode === 'SELECT') return;

            // 1. Obtener posición del mouse relativa al SVG
            const [mouseX, mouseY] = d3.pointer(event);

            // 2. Ajustar por el Zoom actual para obtener coordenadas reales
            const transform = d3.zoomTransform(svg.node() as any);
            const realX = (mouseX - transform.x) / transform.k;
            const realY = (mouseY - transform.y) / transform.k;

            // 3. Crear el nuevo objeto nodo
            const newNode: CustomNode = {
                id: `node-${Date.now()}`, // ID único temporal
                type: currentMode === 'ADD_CIRCLE' ? 'circle' : 'square',
                x: realX,
                y: realY,
                vx: 0,
                vy: 0
            };

            // 4. Actualizar datos y reiniciar simulación
            addNewNode(newNode);
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
    <div className="canvas-container">
      <ToolsPanel activeMode={mode} onModeChange={setMode} />
      
      <svg ref={svgRef}>
        {/* La lógica de D3 usará modeRef.current para decidir si crea nodos */}
      </svg>
    </div>
  );
};

export default SimulationCanvas;