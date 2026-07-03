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
import { NetworkManager, type ProjectDelta } from '../../services/NetworkManager';
import {useParams} from 'react-router-dom';

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
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const eventsRef = useRef<InteractionManager | null>(null);
  const pendingPresetRef = useRef<string | null>(null);
  const pendingAlgorithmRef = useRef<string | null>(null);
  const networkManagerRef = useRef<NetworkManager | null>(null);
  const senderIdRef = useRef<string>(crypto.randomUUID());
  const pendingLinksRef = useRef<{ sourceId: string, targetId: string, value: number, directed: boolean }[]>([]);
  const handleRemoteDeltaRef = useRef<(delta: ProjectDelta) => void>(() => {});


  const { id: urlId } = useParams<{ id: string }>()
  const projectIdInt = urlId ? parseInt(urlId, 10) : 1;
  
  // Usamos una sala de test hardcodeada por ahora. Después puede venir de la URL
  const projectId = isNaN(projectIdInt) ? "1" : projectIdInt.toString(); 

  useEffect(() => {
    // Inicializamos el manager y le pasamos la función que procesa los deltas remotos (el Paso 4)
    networkManagerRef.current = new NetworkManager(projectId, (remoteDelta) => {
      handleRemoteDelta(remoteDelta);
    });

    // Levantamos el tubo de WebSocket
    networkManagerRef.current.connect();

    // Limpieza: si el usuario se va del canvas, cortamos la llamada
    return () => {
      networkManagerRef.current?.disconnect();
    };
  }, [projectId]);

  const handleRemoteDelta = (delta: ProjectDelta) => {
    
    handleRemoteDeltaRef.current = handleRemoteDelta;
    console.log("[SimulationCanvas] ¡ENTRÓ UN DELTA DESDE LA RED!", delta);
    
    const payloadData = delta.payload;
    const remoteSenderId = payloadData?.senderId;

    // --- EL FILTRO MÁGICO ---
    // Si el mensaje lo originé yo mismo, lo descarto de una porque mi pantalla ya cambió con el click
    if (remoteSenderId === senderIdRef.current) {
      return; 
    }

    // =========================================================================
    // CASO: LLEGÓ UN BORRADO REMOTO (DELETE_NODE)
    // =========================================================================
    if ((delta.action as any) === 'DELETE_NODE') {
      const idA_Borrar = String(delta.nodeId);

      // --- CASO ESPECIAL: BORRADO DE LINK SUELTO ---
      if (payloadData?.isLink) {
        const targetIdStr = String(payloadData.targetId);
        
        const filteredLinks = linksRef.current.filter(l => {
          const srcId = String((l.source as INode).id);
          const tgtId = String((l.target as INode).id);
          return !((srcId === idA_Borrar && tgtId === targetIdStr) ||
                   (!(l.directed) && tgtId === idA_Borrar && srcId === targetIdStr));
        });
        linksRef.current.length = 0;
        linksRef.current.push(...filteredLinks);

        const srcNode = nodesRef.current.find(n => String(n.id) === idA_Borrar);
        const tgtNode = nodesRef.current.find(n => String(n.id) === targetIdStr);
        if (srcNode && srcNode.edges) srcNode.edges = srcNode.edges.filter(e => String(e.end.id) !== targetIdStr);
        if (tgtNode && tgtNode.edges) tgtNode.edges = tgtNode.edges.filter(e => String(e.end.id) !== idA_Borrar);
        
        if (physicsRef.current) {
          physicsRef.current.updateLinks(linksRef.current);
          physicsRef.current.getSimulation().alpha(0.2).restart();
        }
        if (rendererRef.current) rendererRef.current.update();
        return;
      }

      // =======================================================================
      // CASO MAESTRO: BORRADO DE NODO / ESTRUCTURA
      // =======================================================================
      const index = nodesRef.current.findIndex(n => String(n.id) === idA_Borrar);
      
      if (index !== -1) {
        const [removedNode] = nodesRef.current.splice(index, 1);
        console.log("[SimulationCanvas] Nodo removido de la memoria física:", removedNode);

        const filteredLinks = linksRef.current.filter(l => 
          String((l.source as INode).id) !== idA_Borrar && String((l.target as INode).id) !== idA_Borrar
        );
        linksRef.current.length = 0;
        linksRef.current.push(...filteredLinks);

        pendingLinksRef.current = pendingLinksRef.current.filter(pending => 
          String(pending.sourceId) !== idA_Borrar && String(pending.targetId) !== idA_Borrar
        );

        nodesRef.current.forEach(n => {
          if (n.edges) n.edges = n.edges.filter(e => String(e.end.id) !== idA_Borrar);
        });

        if (structureManagerRef.current) {
          structureManagerRef.current.sync(nodesRef.current, linksRef.current);
        }

        if (physicsRef.current) {
          physicsRef.current.updateNodes(nodesRef.current);
          physicsRef.current.updateLinks(linksRef.current);
          physicsRef.current.getSimulation().nodes(nodesRef.current);
          physicsRef.current.getSimulation().alpha(0.4).restart();
        }

        if (rendererRef.current) {
          rendererRef.current.update();
        }
      } else {
        console.warn("[SimulationCanvas] Se recibió un borrado pero el ID no existía localmente:", idA_Borrar);
      }
      
      return;
    }

    if ((delta.action as any) === 'CREATE_NODE') {
      
      // =================================================================
      // CASO A: LLEGÓ UN CABLE REMOTO (LINK)
      // =================================================================
      if (payloadData?.isLink) {

        if (payloadData?.isAlgoLink) {
          const algoNode = nodesRef.current.find(n => n.id === delta.nodeId) as any;
          const structureNode = nodesRef.current.find(n => n.id === payloadData.targetId);

          if (algoNode && structureNode) {
            // Limpiamos cables de control viejos que pudiera tener ese algoritmo
            linksRef.current = linksRef.current.filter(l => !((l as any).type === 'algorithm' && (l.source as INode).id === algoNode.id));
            
            algoNode.connectedTo = structureNode.id;
            linksRef.current.push({ 
              source: algoNode, 
              target: structureNode, 
              value: 1, 
              directed: true, 
              type: 'algorithm' 
            } as any);

            if (physicsRef.current) {
              physicsRef.current.updateLinks(linksRef.current);
              physicsRef.current.getSimulation().alpha(0.2).restart();
            }
            if (rendererRef.current) rendererRef.current.update();
          }
          return;
        }

        const sourceNode = nodesRef.current.find(n => n.id === delta.nodeId);
        const targetNode = nodesRef.current.find(n => n.id === payloadData.targetId);

        // SI ALGUNO NO EXISTE TODAVÍA, LO MANDAMOS A LA SALA DE ESPERA
        if (!sourceNode || !targetNode) {
          pendingLinksRef.current.push({
            sourceId: delta.nodeId,
            targetId: payloadData.targetId,
            value: Number(payloadData.value),
            directed: payloadData.directed
          });
          return; // Esperamos a que nazcan los nodos
        }

        // Si ya existen ambos, los conectamos
        const linkExists = linksRef.current.some(l => 
          (l.source as INode).id === sourceNode.id && (l.target as INode).id === targetNode.id
        );

        if (!linkExists) {
          sourceNode.edges.push({ end: targetNode, weight: Number(payloadData.value), directed: payloadData.directed });
          if (!payloadData.directed) targetNode.edges.push({ end: sourceNode, weight: Number(payloadData.value), directed: false });

          linksRef.current.push({ source: sourceNode, target: targetNode, value: Number(payloadData.value), directed: payloadData.directed });
          if (physicsRef.current) {
            physicsRef.current.updateLinks(linksRef.current);
            physicsRef.current.getSimulation().alpha(0.1).restart();
          }
        }
        if (rendererRef.current) rendererRef.current.update();
        return;
      }

      // =================================================================
      // CASO NUEVO: LLEGÓ UN NODO DE ALGORITMO REMOTO
      // =================================================================
      if (payloadData?.kind === 'algorithm') {
        const exists = nodesRef.current.some(n => n.id === delta.nodeId);
        if (!exists) {
          const algoNode: any = {
            kind: 'algorithm',
            id: delta.nodeId,
            algorithmId: payloadData.algorithmId,
            label: payloadData.label,
            pos: { x: payloadData.x, y: payloadData.y },
            scale: 1,
            x: payloadData.x,
            y: payloadData.y,
            fx: null,
            fy: null,
            connectedTo: null, 
            state: { snapshots: [], currentStep: 0, status: 'idle' },
            edges: []
          };

          nodesRef.current.push(algoNode);

          if (physicsRef.current) {
            physicsRef.current.updateNodes(nodesRef.current);
            physicsRef.current.getSimulation().alpha(0.3).restart();
          }
        }
        
        if (rendererRef.current) rendererRef.current.update();
        return;
      }

      // =================================================================
      // CASO B: LLEGÓ UN NODO COMÚN (CIRCULO / ESTRUCTURA)
      // =================================================================
      const exists = nodesRef.current.some(n => n.id === delta.nodeId);
      if (!exists) {
        const newRemoteNode = new DefaultNode(
          delta.nodeId, 
          payloadData.value ?? 1, 
          payloadData.x, 
          payloadData.y
        );
        
        // --- FORCE FIX: Candado de asignación para saltear reseteos del constructor ---
        newRemoteNode.value = payloadData.value ?? 1;
        if ((newRemoteNode as any).val !== undefined) {
          (newRemoteNode as any).val = payloadData.value ?? 1;
        }
        
        (newRemoteNode as any).kind = payloadData.kind;
        newRemoteNode.scale = payloadData.kind === 'stack' || payloadData.kind === 'queue' ? 1.5 : 1.0;
        newRemoteNode.color = payloadData.kind === 'stack' ? '#8e44ad' : payloadData.kind === 'queue' ? '#2980b9' : '#2ecc71';
        (newRemoteNode as any).elements = [];
        (newRemoteNode as any).edges = [];
        
        nodesRef.current.push(newRemoteNode);
        
        if (physicsRef.current) physicsRef.current.updateNodes(nodesRef.current);
        if (structureManagerRef.current) structureManagerRef.current.sync(nodesRef.current, linksRef.current);

        // --- EFECTO RECOLECTOR: REVISAMOS SI ESTE NODO TIENE CABLES ESPERÁNDOLO ---
        pendingLinksRef.current = pendingLinksRef.current.filter(pending => {
          const srcNode = nodesRef.current.find(n => n.id === pending.sourceId);
          const tgtNode = nodesRef.current.find(n => n.id === pending.targetId);

          if (srcNode && tgtNode) {
            const linkExists = linksRef.current.some(l => 
              (l.source as INode).id === srcNode.id && (l.target as INode).id === tgtNode.id
            );

            if (!linkExists) {
              srcNode.edges.push({ end: tgtNode, weight: pending.value, directed: pending.directed });
              if (!pending.directed) tgtNode.edges.push({ end: srcNode, weight: pending.value, directed: false });
              linksRef.current.push({ source: srcNode, target: tgtNode, value: pending.value, directed: pending.directed });
            }
            return false; // Se conectó, sale de la sala de espera
          }
          return true; // Sigue esperando
        });

        // Refrescamos los links en la física si se rescató algún cable
        if (physicsRef.current) {
          physicsRef.current.updateLinks(linksRef.current);
          physicsRef.current.getSimulation().alpha(0.2).restart();
        }
      }
      
      if (rendererRef.current) rendererRef.current.update();
      return; 
    }

    const targetNode = nodesRef.current.find(node => node.id === delta.nodeId);
    
    if (targetNode) {
      const structNode = targetNode as any;
      const currentElements = structNode.elements || [];

      switch (delta.action) {
        case 'PUSH':
          // El valor real ahora viene adentro de payloadData.value
          structNode.elements = [...currentElements, payloadData.value];
          break;
          
        case 'POP':
          const updatedElements = [...currentElements];
          // El tipo ahora viene en payloadData.type
          if (payloadData.type === 'stack') {
            updatedElements.pop();
          } else {
            updatedElements.shift();
          }
          structNode.elements = updatedElements;
          break;
          
        case 'MOVE_NODE':
          structNode.x = payloadData.x;
          structNode.y = payloadData.y;
          break;
      }

      if (activeNode && activeNode.id === delta.nodeId) {
        setActiveNode({ ...structNode });
      }
    }

    if (rendererRef.current) {
      rendererRef.current.update();
    }
  };

  
  const handleGeneratePreset = useCallback((presetId: string) => {
    if (presetId === '__cancel__') { pendingPresetRef.current = null; return; }
    pendingPresetRef.current = presetId;
  }, []);

  const handleRunAlgorithm = useCallback((algorithmId: string) => {
    if (algorithmId === '__cancel__') { pendingAlgorithmRef.current = null; return; }
    pendingAlgorithmRef.current = algorithmId;
  }, []);

  useEffect(() => { modeRef.current = mode; console.log('[Canvas] mode:', mode); }, [mode]);

  useImperativeHandle(ref, () => ({
    getCanvasState: () => {
      const cleanNodes = nodesRef.current.map(n => {
        const isAlgo = (n as any).kind === 'algorithm';
        const isStruct = (n as any).kind === 'stack' || (n as any).kind === 'queue'; // <-- NUEVO
        
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
          }),
          // --- NUEVO: Si es estructura, guardamos su tipo y sus números ---
          ...(isStruct && {
            kind: (n as any).kind,
            elements: (n as any).elements || []
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
              } else if (n.kind === 'stack' || n.kind === 'queue') {
                const structNode: any = {
                  id: n.id,
                  kind: n.kind,
                  value: n.value ?? 0,
                  x: Number(n.x) || 0,
                  y: Number(n.y) || 0,
                  fx: Number(n.x) || 0,
                  fy: Number(n.y) || 0,
                  scale: n.scale ?? 1.5,
                  color: n.color ?? (n.kind === 'stack' ? '#8e44ad' : '#2980b9'),
                  elements: n.elements || [], // ¡Rescatamos los números guardados!
                  pos: { x: Number(n.x) || 0, y: Number(n.y) || 0 },
                  edges: []
                };
                return structNode;
              }
              else {
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
            const loadedLinks: any[] = [];
            
            // 1. MAPA DE RESCATE: Buscamos la verdad absoluta antes de borrar nada
            const rescuedValues = new Map<string, number>();
            parsedData.links.forEach((l: any) => {
              if (!l || !l.source || !l.target || l.type === 'algorithm') return;
              const srcId = typeof l.source === 'object' ? l.source.id : l.source;
              const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
              
              const linkKey = l.directed ? `${srcId}->${tgtId}` : [srcId, tgtId].sort().join('-');
              const val = Number(l.value ?? 1);
              
              // Si encontramos un clon con un valor mayor, actualizamos el mapa
              if (!rescuedValues.has(linkKey) || val > rescuedValues.get(linkKey)!) {
                rescuedValues.set(linkKey, val);
              }
            });

            const processedLinks = new Set<string>();

            // 2. AHORA SÍ, armamos las aristas limpias inyectando el valor rescatado
            parsedData.links
              .filter((l: any) => l && l.source && l.target)
              .forEach((l: any) => {
                const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                const tgtId = typeof l.target === 'object' ? l.target.id : l.target;

                if (l.type !== 'algorithm') {
                  const linkKey = l.directed ? `${srcId}->${tgtId}` : [srcId, tgtId].sort().join('-');
                  
                  // Si es de doble mano y ya la procesamos, la aniquilamos
                  if (!l.directed) {
                    if (processedLinks.has(linkKey)) return; 
                    processedLinks.add(linkKey);
                  }
                  
                  // ¡Le inyectamos el valor máximo que encontramos entre todos sus clones!
                  l.value = rescuedValues.get(linkKey) ?? 1;
                }

                const sourceNode = nodesRef.current.find(n => n.id === srcId);
                const targetNode = nodesRef.current.find(n => n.id === tgtId);
                
                if (sourceNode && targetNode) {
                  if (l.type !== 'algorithm') {
                    const edgeExists = sourceNode.edges.some(e => e.end.id === targetNode.id);
                    if (!edgeExists) {
                      sourceNode.edges.push({ end: targetNode, weight: Number(l.value), directed: l.directed });
                      if (!l.directed) {
                        targetNode.edges.push({ end: sourceNode, weight: Number(l.value), directed: false });
                      }
                    }
                  }

                  loadedLinks.push({
                    ...l,
                    source: sourceNode,
                    target: targetNode,
                    type: l.type 
                  });
                }
              });
              
            linksRef.current = loadedLinks;
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
        onNodeSelected,
        onNodeCreated: (action, nodeId, payload) => {
          networkManagerRef.current?.sendDelta(action, nodeId, {
            ...payload,
            senderId: senderIdRef.current // Le clavamos la firma digital
          });
        }
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
        if (svgRef.current) {
          svgRef.current.innerHTML = '';
        }
    };
  }, [initialData]);

  const handleUpdateNode = (updatedFields: Partial<INode>) => {
    if (!selectedNodeRef.current || !rendererRef.current) return;

    if (updatedFields.edges) {
      updatedFields.edges.forEach(edge => {
        const parsedWeight = Number(edge.weight);
        edge.weight = parsedWeight;

        if (!edge.directed) {
          const reverseEdge = edge.end.edges.find(e => e.end.id === selectedNodeRef.current!.id);
          if (reverseEdge) {
            reverseEdge.weight = parsedWeight;
          }
        }

        // 2. EL FIX: Sincronizamos la lista maestra para que se exporte/guarde bien
        const d3Link = linksRef.current.find(l => 
          ((l.source as INode).id === selectedNodeRef.current!.id && (l.target as INode).id === edge.end.id) ||
          (!edge.directed && (l.target as INode).id === selectedNodeRef.current!.id && (l.source as INode).id === edge.end.id)
        );
        
        if (d3Link) {
          d3Link.value = parsedWeight; // Actualizamos el valor real
        }
      });
    }

    if ((updatedFields as any).elements) {
      console.log("Mandando delta de push!")
      const oldElements = (selectedNodeRef.current as any).elements || [];
      const newElements = (updatedFields as any).elements; // <-- 'as any' acá también

      const metadata = {
        value: newElements[newElements.length - 1],
        senderId: senderIdRef.current // <--- FIRMA DE AUTOR
      };

      if (newElements.length > oldElements.length) {
        // En el PUSH, pasamos la metadata entera como payload
        networkManagerRef.current?.sendDelta('PUSH', selectedNodeRef.current.id, metadata);
      } else {
        // En el POP, hacemos lo mismo pasándole el tipo y la firma
        networkManagerRef.current?.sendDelta('POP', selectedNodeRef.current.id, {
          type: (selectedNodeRef.current as any).kind,
          senderId: senderIdRef.current // <--- FIRMA DE AUTOR
        });
      }
    }
    // =========================================================================

    Object.assign(selectedNodeRef.current, updatedFields);
    setActiveNode({ ...selectedNodeRef.current });
    rendererRef.current.update();
  };
  
  return (
    <div className={`canvas-wrapper mode-${mode === 'SELECT' ? 'select' : mode === 'ADD_NODE' ? 'add-node' : mode === 'LINK' ? 'link' : mode === 'ARROW' ? 'arrow' : 'delete'}`}>
      
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