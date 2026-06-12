import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { SandboxPanel } from './SandboxPanel';
import { FlagsPanel } from './FlagsPanel';
import { ToolsPanel } from './ToolsPanel';
import { PropertyPanel } from './PropertyPanel'; 
import type { ToolMode } from '../../types/tools';
import type { INode } from '../../sandbox/interfaces';
import { StructureManager, type StructureInfo } from '../../sandbox/StructureManager';
import { PRESETS } from '../../sandbox/presets';
import { AVAILABLE_ALGORITHMS } from '../../sandbox/algorithms';
import { DefaultNode } from '../../sandbox/DefaultNode'; 
import '../../styles/sandbox.css';
import '../../styles/canvas.css';
import { SimulationCore } from './modules/SimulationCore';
import { PhysicsEngine, type SimLink } from './modules/PhysicsEngine';
import { CanvasRenderer } from './modules/CanvasRenderer';
import { CameraSystem } from './modules/CameraSystem';
import { InteractionManager } from './modules/InteractionManager';

export interface SimulationCanvasRef {
  getCanvasState: () => { nodes: any[], links: any[] };
}  

interface SimulationCanvasProps {
  initialData?: string;
  readOnly?: boolean;
}

export const SimulationCanvas = forwardRef<SimulationCanvasRef, SimulationCanvasProps>(({ initialData, readOnly = false }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<ToolMode>('SELECT');
  
  const [activeNode, setActiveNode] = useState<INode | null>(null);
  
  const modeRef = useRef(mode);
  const nodesRef = useRef<INode[]>([]);
  const linksRef = useRef<{ source: INode; target: INode; value: number; directed: boolean }[]>([]);
  const selectedNodeRef = useRef<INode | null>(null);
  const [structures, setStructures] = useState<StructureInfo[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const structureManagerRef = useRef<StructureManager>(new StructureManager(setStructures));
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null); // <-- Única declaración correcta
  const eventsRef = useRef<InteractionManager | null>(null);
  const pendingPresetRef = useRef<string | null>(null);
  const pendingAlgorithmRef = useRef<string | null>(null);

  const handleGeneratePreset = useCallback((presetId: string) => {
    pendingPresetRef.current = presetId;
  }, []);

  const handleRunAlgorithm = useCallback((algorithmId: string) => {
    pendingAlgorithmRef.current = algorithmId;
  }, []);

  useEffect(() => { modeRef.current = mode; console.log('[Canvas] mode:', mode); }, [mode]);

  useImperativeHandle(ref, () => ({
    getCanvasState: () => {
      const cleanNodes = nodesRef.current.map(n => {
        const isAlgo = (n as any).kind === 'algorithm';
        
        return {
          id: n.id,
          x: n.x,
          y: n.y,
          value: n.value,
          scale: n.scale ?? 1,
          color: n.color ?? '#2ecc71',
          ...(isAlgo && {
            kind: 'algorithm',
            algorithmId: (n as any).algorithmId,
            label: (n as any).label,
            connectedTo: (n as any).connectedTo,
            state: { snapshots: [], currentStep: 0, status: 'idle' }
          })
        };
      });

      const cleanLinks = linksRef.current
        .filter(l => (l as any).type !== 'algo-snapshot') // <-- FILTRO PROTECTOR
        .map(l => ({
          source: (l.source as INode).id,
          target: (l.target as INode).id,
          value: l.value,
          directed: l.directed,
          type: (l as any).type 
        }));

      return { nodes: cleanNodes, links: cleanLinks };
    }
  }));

  useEffect(() => {
    if (initialData) {
      try {
        const parsedData = typeof initialData === 'string' ? JSON.parse(initialData) : initialData;
        
        if (parsedData && Array.isArray(parsedData.nodes)) {
          nodesRef.current = parsedData.nodes
            .filter((n: any) => n && n.id) 
            .map((n: any) => {
              if (n.kind === 'algorithm') {
                const algoNode: any = {
                  kind: 'algorithm',
                  id: n.id,
                  algorithmId: n.algorithmId,
                  label: n.label,
                  scale: n.scale ?? 1,
                  color: n.color ?? '#34495e', 
                  x: Number(n.x) || 0,
                  y: Number(n.y) || 0,
                  fx: Number(n.x) || 0,
                  fy: Number(n.y) || 0,
                  connectedTo: n.connectedTo,
                  state: n.state || { snapshots: [], currentStep: 0, status: 'idle' },
                  pos: { x: Number(n.x) || 0, y: Number(n.y) || 0 },
                  edges: []
                };
                return algoNode;
              } else {
                const node = new DefaultNode(n.id, n.value ?? 1, Number(n.x) || 0, Number(n.y) || 0);
                node.pos = { x: Number(n.x), y: Number(n.y) };
                node.scale = n.scale ?? 1;
                node.color = n.color ?? '#2ecc71';
                node.fx = Number(n.x) || 0;
                node.fy = Number(n.y) || 0;
                return node;
              }
            });

          if (Array.isArray(parsedData.links)) {
            linksRef.current = parsedData.links
              .filter((l: any) => l && l.source && l.target)
              .map((l: any) => {
                const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                const tgtId = typeof l.target === 'object' ? l.target.id : l.target;

                const sourceNode = nodesRef.current.find(n => n.id === srcId);
                const targetNode = nodesRef.current.find(n => n.id === tgtId);
                
                if (sourceNode && targetNode && l.type !== 'algorithm') {
                    sourceNode.edges.push({ end: targetNode, weight: l.value, directed: l.directed });
                    if (!l.directed) {
                        targetNode.edges.push({ end: sourceNode, weight: l.value, directed: false });
                    }
                }

                return {
                  ...l,
                  source: sourceNode,
                  target: targetNode,
                  type: l.type 
                };
              }).filter((l: any) => l.source && l.target); 
          }
        }
      } catch (e) {
        console.error("Error parseando la data inicial del proyecto:", e);
      }
    }

    const core = new SimulationCore(svgRef.current);
    const { svg, container, layers } = core.getInfrastructure();
    const simulation = new PhysicsEngine(nodesRef.current, linksRef.current);
    
    const renderer = new CanvasRenderer(layers, simulation);
    rendererRef.current = renderer; 
    
    const camera = new CameraSystem(svg, container);
    camera.init();

    const onNodeSelected = (node: INode | null) => {
      setActiveNode(node); 
    };

    physicsRef.current = simulation;

    // Inicializamos el InteractionManager siempre
    const events = new InteractionManager(svg, simulation, renderer, layers.ghost);
    eventsRef.current = events;
    
    events.bindContext({
        modeRef,
        nodesRef,
        linksRef,
        selectedNodeRef,
        structureManagerRef,
        pendingPresetRef,
        pendingAlgorithmRef,
        onSelectNode: setSelectedNodeId,
        onNodeSelected
    });
    
    // Le pasamos el flag readOnly para que active los candados correspondientes
    events.setupListeners(readOnly);

    structureManagerRef.current.sync(nodesRef.current, linksRef.current);
    renderer.update();

    events.applyDrag(readOnly);

    if (!readOnly) {
      nodesRef.current.forEach(node => {
        // Quitamos el freno de mano que pusimos al parsear el JSON
        node.fx = null;
        node.fy = null;
      });
      
      // Le metemos un "shock térmico" al motor para que calcule las colisiones de entrada
      simulation.getSimulation().alpha(1).restart();
    } else {
      // Si es el feed de lectura, aseguramos que queden fijos y no colapsen
      nodesRef.current.forEach(node => {
        node.fx = node.x;
        node.fy = node.y;
      });
      simulation.getSimulation().alpha(0.1).alphaTarget(0).restart();
    }

    return () => {
        simulation.stop();
        if (eventsRef.current) eventsRef.current.destroy();
    };
  }, [initialData]); 

  const handleUpdateNode = (updatedFields: Partial<INode>) => {
    if (!selectedNodeRef.current || !rendererRef.current) return;

    if (updatedFields.edges) {
      updatedFields.edges.forEach(edge => {
        // Si la conexión es de doble mano (no tiene flecha)
        if (!edge.directed) {
          // Viajamos al nodo destino por referencia y actualizamos el peso de su ruta de vuelta
          const reverseEdge = edge.end.edges.find(e => e.end.id === selectedNodeRef.current!.id);
          if (reverseEdge) {
            reverseEdge.weight = edge.weight;
          }
        }
      });
    }

    Object.assign(selectedNodeRef.current, updatedFields);
    setActiveNode({ ...selectedNodeRef.current });
    rendererRef.current.update();
  };

  return (
    <div className={`canvas-wrapper${mode === 'DELETE_ANY' ? ' mode-delete' : ''}`}>
      
      {/* 1. ENVUELVO EL PANEL DE HERRAMIENTAS */}
      {!readOnly && (
        <div data-html2canvas-ignore="true">
          <SandboxPanel activeMode={mode} onModeChange={setMode} onGeneratePreset={handleGeneratePreset} onRunAlgorithm={handleRunAlgorithm} />
        </div>
      )}
      
      {/* (Opcional) Si también querés ocultar el cartel de Flags, envolvelo igual */}
      <FlagsPanel structures={structures} selectedNodeId={selectedNodeId} />
      
      <svg ref={svgRef} style={{ width: '100%', height: '100%', minHeight: '800px', display: 'block' }}></svg>
      
      {/* 2. ENVUELVO EL PANEL DE PROPIEDADES (El que sale al clickear un nodo) */}
      {!readOnly && (
        <div data-html2canvas-ignore="true">
          <PropertyPanel 
            node={activeNode} 
            onUpdate={handleUpdateNode}
            onClose={() => {
              selectedNodeRef.current = null;
              setActiveNode(null);
              if (rendererRef.current) rendererRef.current.update();
            }}
          />
        </div>
      )}
      
    </div>
  );
});