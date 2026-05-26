import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SandboxPanel } from './SandboxPanel';
import { FlagsPanel } from './FlagsPanel';
import React, { useEffect, useRef, useState } from 'react';
import { ToolsPanel } from './ToolsPanel';
import { PropertyPanel } from './PropertyPanel'; // Importamos el inspector
import type { ToolMode } from '../../types/tools';
import type { INode } from '../../sandbox/interfaces';
import { StructureManager, type StructureInfo } from '../../sandbox/StructureManager';
import { PRESETS } from '../../sandbox/presets';
import { AVAILABLE_ALGORITHMS } from '../../sandbox/algorithms';
import '../../styles/sandbox.css';
import '../../styles/canvas.css';
import { SimulationCore } from './modules/SimulationCore';
import { PhysicsEngine, type SimLink } from './modules/PhysicsEngine';
import { CanvasRenderer } from './modules/CanvasRenderer';
import { CameraSystem } from './modules/CameraSystem';
import { InteractionManager } from './modules/InteractionManager';

export const SimulationCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<ToolMode>('SELECT');
  
  // ESTADO PUENTE: Sincroniza la referencia mutada por D3 con la UI de React
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

  const handleGeneratePreset = useCallback((presetId: string) => {
    pendingPresetRef.current = presetId;
  }, []);

  const handleRunAlgorithm = useCallback((algorithmId: string) => {
    const alg = AVAILABLE_ALGORITHMS.find(a => a.id === algorithmId);
    if (!alg || nodesRef.current.length === 0) return;
    alg.run(nodesRef.current);
    rendererRef.current?.update();
  }, []);

  // Guardamos la instancia del renderer para forzar redibujados desde los inputs
  const rendererRef = useRef<CanvasRenderer | null>(null);

  useEffect(() => { modeRef.current = mode; console.log('[Canvas] mode:', mode); }, [mode]);

  useEffect(() => {
    const core = new SimulationCore(svgRef.current);
    const { svg, container, layers } = core.getInfrastructure();
    const simulation = new PhysicsEngine(nodesRef.current, linksRef.current);
    
    const renderer = new CanvasRenderer(layers, simulation);
    rendererRef.current = renderer; // Seteamos la ref del renderer
    
    const camera = new CameraSystem(svg, container);
    camera.init();

    // Callback clave: Cuando el InteractionManager detecte click en un nodo, React se entera acá
    const onNodeSelected = (node: INode | null) => {
      setActiveNode(node); 
    };

    const events = new InteractionManager(svg, simulation, renderer);

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
        onSelectNode: setSelectedNodeId,
        onNodeSelected // <-- Inyectamos la función puente en el contexto del manager
    });
    events.setupListeners();

    renderer.update();

    return () => {
        simulation.stop();
        events.destroy();
    };
  }, []);

  // Handler que ejecuta el panel cuando el usuario interactúa con los inputs
  const handleUpdateNode = (updatedFields: Partial<INode>) => {
    if (!selectedNodeRef.current || !rendererRef.current) return;

    // 1. Modificamos la referencia mutable real que consumen D3 y PhysicsEngine
    Object.assign(selectedNodeRef.current, updatedFields);

    // 2. Sincronizamos el estado de React para que el input refleje lo tipeado
    setActiveNode({ ...selectedNodeRef.current });

    // 3. Le decimos a D3 que renderice de nuevo los nodos con los datos frescos
    rendererRef.current.update();
  };

  return (
    <div className={`canvas-wrapper${mode === 'DELETE_ANY' ? ' mode-delete' : ''}`}>
      <SandboxPanel activeMode={mode} onModeChange={setMode} onGeneratePreset={handleGeneratePreset} onRunAlgorithm={handleRunAlgorithm} />
      <FlagsPanel structures={structures} selectedNodeId={selectedNodeId} />
      <svg ref={svgRef}></svg>
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
};