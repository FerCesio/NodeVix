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
// IMPORTAMOS LA CLASE REAL PARA RECONSTRUIR LOS NODOS
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
}

export const SimulationCanvas = forwardRef<SimulationCanvasRef, SimulationCanvasProps>((props, ref) => {
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
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const eventsRef = useRef<InteractionManager | null>(null);
  const pendingPresetRef = useRef<string | null>(null);

  const pendingAlgorithmRef = useRef<string | null>(null);

  const handleGeneratePreset = useCallback((presetId: string) => {
    pendingPresetRef.current = presetId;
  }, []);

  const handleRunAlgorithm = useCallback((algorithmId: string) => {
    pendingAlgorithmRef.current = algorithmId;
  }, []);

  // Guardamos la instancia del renderer para forzar redibujados desde los inputs

  useEffect(() => { modeRef.current = mode; console.log('[Canvas] mode:', mode); }, [mode]);

  useImperativeHandle(ref, () => ({
    getCanvasState: () => {
      const cleanNodes = nodesRef.current.map(n => ({
        id: n.id,
        x: n.x,
        y: n.y,
        value: n.value,
        scale: n.scale ?? 1,
        color: n.color ?? '#2ecc71'
      }));

      const cleanLinks = linksRef.current.map(l => ({
        source: (l.source as INode).id,
        target: (l.target as INode).id,
        value: l.value,
        directed: l.directed
      }));

      return { nodes: cleanNodes, links: cleanLinks };
    }
  }));

  useEffect(() => {
    if (props.initialData) {
      try {
        const parsedData = typeof props.initialData === 'string' ? JSON.parse(props.initialData) : props.initialData;
        
        if (parsedData && Array.isArray(parsedData.nodes)) {
          // BLINDAJE 1: Filtramos fantasmas y usamos 'new DefaultNode'
          nodesRef.current = parsedData.nodes
            .filter((n: any) => n && n.id) 
            .map((n: any) => {
              const node = new DefaultNode(n.id, n.value ?? 1, Number(n.x) || 0, Number(n.y) || 0);
              node.pos = { x: Number(n.x), y: Number(n.y) };
              node.scale = n.scale ?? 1;
              node.color = n.color ?? '#2ecc71';
              node.fx = Number(n.x) || 0; // Lo clavamos en X
              node.fy = Number(n.y) || 0; // Lo clavamos en Y
              return node;
            });

          if (Array.isArray(parsedData.links)) {
            // BLINDAJE 2: Soportamos si el source llega como objeto o como string
            linksRef.current = parsedData.links
              .filter((l: any) => l && l.source && l.target)
              .map((l: any) => {
                const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                const tgtId = typeof l.target === 'object' ? l.target.id : l.target;

                const sourceNode = nodesRef.current.find(n => n.id === srcId);
                const targetNode = nodesRef.current.find(n => n.id === tgtId);
                
                if (sourceNode && targetNode) {
                    sourceNode.edges.push({ end: targetNode, weight: l.value, directed: l.directed });
                    if (!l.directed) {
                        targetNode.edges.push({ end: sourceNode, weight: l.value, directed: false });
                    }
                }

                return {
                  ...l,
                  source: sourceNode,
                  target: targetNode
                };
              }).filter((l: any) => l.source && l.target); // Limpiamos enlaces rotos
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

    const events = new InteractionManager(svg, simulation, renderer, layers.ghost);

    physicsRef.current = simulation;
    rendererRef.current = renderer;
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
    events.setupListeners();

    structureManagerRef.current.sync(nodesRef.current, linksRef.current);
    renderer.update();

    return () => {
        simulation.stop();
        events.destroy();
    };
  }, [props.initialData]); 

  const handleUpdateNode = (updatedFields: Partial<INode>) => {
    if (!selectedNodeRef.current || !rendererRef.current) return;

    Object.assign(selectedNodeRef.current, updatedFields);
    setActiveNode({ ...selectedNodeRef.current });
    rendererRef.current.update();
  };

  return (
    <div className={`canvas-wrapper${mode === 'DELETE_ANY' ? ' mode-delete' : ''}`}>
      
      <SandboxPanel activeMode={mode} onModeChange={setMode} onGeneratePreset={handleGeneratePreset} onRunAlgorithm={handleRunAlgorithm} />
      
      <FlagsPanel structures={structures} selectedNodeId={selectedNodeId} />
      
      <svg ref={svgRef} style={{ width: '100%', height: '100%', minHeight: '800px', display: 'block' }}></svg>
      
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
  );
});