import React, { useEffect, useRef, useState } from 'react';
import { ToolsPanel } from './ToolsPanel';
import { PropertyPanel } from './PropertyPanel'; // Importamos el inspector
import type { ToolMode } from '../../types/tools';
import type { INode } from '../../sandbox/interfaces';
import '../../styles/sandbox.css';
import '../../styles/canvas.css';
import { SimulationCore } from './modules/SimulationCore';
import { PhysicsEngine } from './modules/PhysicsEngine';
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
  const linksRef = useRef<{ source: INode; target: INode; value: number }[]>([]);
  const selectedNodeRef = useRef<INode | null>(null);

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
    events.bindContext({
        modeRef,
        nodesRef,
        linksRef,
        selectedNodeRef,
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
    <div className="canvas-wrapper" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
    <ToolsPanel activeMode={mode} onModeChange={setMode} />
    
    {/* Forzamos al SVG a ocupar toda la pantalla */}
    <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }}></svg>

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