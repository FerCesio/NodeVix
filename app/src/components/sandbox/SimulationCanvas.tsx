import React, { useEffect, useRef, useState } from 'react';
import { SandboxPanel } from './SandboxPanel';
import { FlagsPanel } from './FlagsPanel';
import type { ToolMode } from '../../types/tools';
import type { INode } from '../../sandbox/interfaces';
import { StructureManager, type StructureInfo } from '../../sandbox/StructureManager';
import '../../styles/sandbox.css';
import '../../styles/canvas.css';
import { SimulationCore } from './modules/SimulationCore';
import { PhysicsEngine } from './modules/PhysicsEngine';
import { CanvasRenderer } from './modules/CanvasRenderer';
import { CameraSystem } from './modules/CameraSystem';
import { InteractionManager } from './modules/InteractionManager';



export const SimulationCanvas: React.FC = () => {

  // Modes map
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<ToolMode>('SELECT');
  
  // Refs para mantener la simulación y el modo sincronizados sin re-renders
  const modeRef = useRef(mode);
  const nodesRef = useRef<INode[]>([]);
  const linksRef = useRef<{ source: INode; target: INode; value: number; directed: boolean }[]>([]);
  const selectedNodeRef = useRef<INode | null>(null);
  const [structures, setStructures] = useState<StructureInfo[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const structureManagerRef = useRef<StructureManager>(new StructureManager(setStructures));


  useEffect(() => { modeRef.current = mode; console.log('[Canvas] mode:', mode); }, [mode]);

  useEffect(() => {
    // 1. SETUP: Inicialización de la infraestructura base
    // Crea el SVG, las capas (layers) y el motor físico
    const core = new SimulationCore(svgRef.current);
    const { svg, container, layers } = core.getInfrastructure();
    const simulation = new PhysicsEngine(nodesRef.current, linksRef.current);

    // 2. UPDATE VISUALS: Definición de la tubería de renderizado
    // Encapsula el patrón .data().join() y el callback del "tick"
    const renderer = new CanvasRenderer(layers, simulation);
    
    // 3. CAMERA: Gestión de la vista y navegación
    // Configura el d3.zoom y lo vincula al container
    const camera = new CameraSystem(svg, container);
    camera.init();

    // 4. EVENT HANDLER: Gestión de interacción por modos
    // Implementa el mapa de estrategias (toolActions) y listeners
    const events = new InteractionManager(svg, simulation, renderer);
    events.bindContext({
        modeRef,
        nodesRef,
        linksRef,
        selectedNodeRef,
        structureManagerRef,
        onSelectNode: setSelectedNodeId
    });
    events.setupListeners();

    // 5. INITIAL EXECUTION
    // Primer renderizado para mostrar los datos existentes si los hubiera
    renderer.update();

    // CLEANUP
    return () => {
        simulation.stop();
        events.destroy();
    };
  }, []);


  return (
    <div className={`canvas-wrapper${mode === 'DELETE_ANY' ? ' mode-delete' : ''}`}>
      <SandboxPanel activeMode={mode} onModeChange={setMode} />
      <FlagsPanel structures={structures} selectedNodeId={selectedNodeId} />
      <svg ref={svgRef}></svg>
    </div>
  );
};