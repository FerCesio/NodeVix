import * as d3 from 'd3';
import type { INode, CanvasNode, IAlgorithmNode } from '../../../sandbox/interfaces';
import type { ToolMode } from '../../../types/tools';
import { DefaultNode } from '../../../sandbox/DefaultNode';
import { PRESETS } from '../../../sandbox/presets';
import { AVAILABLE_ALGORITHMS } from '../../../sandbox/algorithms';
import { AlgorithmExecutor } from '../../../sandbox/AlgorithmExecutor';
import { BubbleSort } from '../../../sandbox/algorithms/BubbleSort';
import { Inorder } from '../../../sandbox/algorithms/Inorder';
import { BogoSort } from '../../../sandbox/algorithms/BogoSort';
import { MergeSort } from '../../../sandbox/algorithms/MergeSort';
import { diffSnapshots } from '../../../sandbox/utils/diffSnapshots';
import type { StructureManager } from '../../../sandbox/StructureManager';
import type { PhysicsEngine, SimLink } from './PhysicsEngine';
import type { CanvasRenderer } from './CanvasRenderer';
import { Dijkstra } from '../../../sandbox/algorithms/Dijkstra';

export interface InteractionRefs {
  modeRef: React.MutableRefObject<ToolMode>;
  nodesRef: React.MutableRefObject<INode[]>;
  linksRef: React.MutableRefObject<SimLink[]>;
  selectedNodeRef: React.MutableRefObject<INode | null>;
  structureManagerRef: React.MutableRefObject<StructureManager>;
  pendingPresetRef: React.MutableRefObject<string | null>;
  pendingAlgorithmRef: React.MutableRefObject<string | null>;
  onSelectNode: (nodeId: string | null) => void;
  onNodeSelected: (node: INode | null) => void;
  onNodeCreated: (action: 'CREATE_NODE', nodeId: string, payload: any) => void;
}

export class InteractionManager {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private physics: PhysicsEngine;
  private renderer: CanvasRenderer;
  private refs!: InteractionRefs;
  private ghostLine: d3.Selection<SVGLineElement, unknown, null, undefined> | null = null;
  private ghostLayer: d3.Selection<SVGGElement, unknown, null, undefined>;
  private executors: Map<string, AlgorithmExecutor> = new Map();
  private autoPlayIntervals: Map<string, number> = new Map();
  private animating = false;
  private selectedNodes: Set<string> = new Set();
  private clipboard: { nodes: { id: string; value: number; scale: number; color?: string; dx: number; dy: number }[]; edges: { fromIdx: number; toIdx: number; weight: number; directed: boolean }[] } | null = null;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxHistory = 50;

  constructor(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    physics: PhysicsEngine,
    renderer: CanvasRenderer,
    ghostLayer: d3.Selection<SVGGElement, unknown, null, undefined>
  ) {
    this.svg = svg;
    this.physics = physics;
    this.renderer = renderer;
    this.ghostLayer = ghostLayer;
  }

  bindContext(refs: InteractionRefs): void {
    this.refs = refs;
  }

  setupListeners(readOnly: boolean = false): void {
    // Ghost line: mousemove (Solo si NO es readOnly)
    this.svg.on('mousemove.ghost', (event: MouseEvent) => {
      if (readOnly) return; 
      const mode = this.refs.modeRef.current;
      if ((mode === 'LINK' || mode === 'ARROW') && this.refs.selectedNodeRef.current) {
        const [mx, my] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);
        const src = this.refs.selectedNodeRef.current;
        if (!this.ghostLine) {
          this.ghostLine = this.ghostLayer.append('line').attr('class', 'ghost-line');
        }
        this.ghostLine
          .attr('x1', src.x ?? 0)
          .attr('y1', src.y ?? 0)
          .attr('x2', mx)
          .attr('y2', my)
          .attr('stroke', mode === 'ARROW' ? '#e74c3c' : '#888')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '6 4')
          .attr('opacity', 0.6);
      } else {
        this.clearGhost();
      }
    });

    // ESC: cancelar operaciones en curso
    d3.select('body').on('keydown.interaction', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.cancelPending();
      }
      if (readOnly) return;
      // Ctrl+C: copy selected nodes
      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && this.selectedNodes.size > 0) {
        event.preventDefault();
        const selected = this.refs.nodesRef.current.filter(n => this.selectedNodes.has(n.id));
        const cx = selected.reduce((s, n) => s + (n.x ?? 0), 0) / selected.length;
        const cy = selected.reduce((s, n) => s + (n.y ?? 0), 0) / selected.length;
        const idToIdx = new Map(selected.map((n, i) => [n.id, i]));
        const edges: { fromIdx: number; toIdx: number; weight: number; directed: boolean }[] = [];
        for (const node of selected) {
          for (const edge of node.edges) {
            const toIdx = idToIdx.get(edge.end.id);
            if (toIdx !== undefined) {
              edges.push({ fromIdx: idToIdx.get(node.id)!, toIdx, weight: edge.weight, directed: edge.directed });
            }
          }
        }
        this.clipboard = {
          nodes: selected.map(n => ({ id: n.id, value: n.value, scale: n.scale, color: n.color, dx: (n.x ?? 0) - cx, dy: (n.y ?? 0) - cy })),
          edges
        };
      }
      // Ctrl+Z: undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo();
      }
      // Ctrl+Y / Ctrl+Shift+Z: redo
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        this.redo();
      }
      // Ctrl+V: paste
      if ((event.ctrlKey || event.metaKey) && event.key === 'v' && this.clipboard) {
        event.preventDefault();
        this.saveState();
        const cx = (this.svg.node()?.clientWidth ?? 800) / 2;
        const cy = (this.svg.node()?.clientHeight ?? 600) / 2;
        const newNodes: INode[] = [];
        for (const data of this.clipboard.nodes) {
          const node = new DefaultNode(crypto.randomUUID(), data.value, cx + data.dx, cy + data.dy);
          node.scale = data.scale;
          if (data.color) node.color = data.color;
          newNodes.push(node);
        }
        // Recreate edges
        for (const e of this.clipboard.edges) {
          const from = newNodes[e.fromIdx];
          const to = newNodes[e.toIdx];
          from.edges.push({ end: to, weight: e.weight, directed: e.directed });
        }
        // Create links
        const newLinks: SimLink[] = [];
        const processedPairs = new Set<string>();
        for (const node of newNodes) {
          for (const edge of node.edges) {
            const key = edge.directed ? `${node.id}->${edge.end.id}` : [node.id, edge.end.id].sort().join('--');
            if (!processedPairs.has(key)) {
              processedPairs.add(key);
              newLinks.push({ source: node, target: edge.end, value: edge.weight, directed: edge.directed });
            }
          }
        }
        this.refs.nodesRef.current.push(...newNodes);
        this.refs.linksRef.current.push(...newLinks);
        this.physics.updateNodes(this.refs.nodesRef.current);
        this.physics.updateLinks(this.refs.linksRef.current);
        this.renderer.update();
        this.applyDrag(readOnly);
        this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
        // Select pasted nodes
        this.selectedNodes.clear();
        for (const n of newNodes) this.selectedNodes.add(n.id);
        this.renderer.setSelectedNodes(this.selectedNodes);
      }
    });

    // MARQUEE SELECTION (rubber band)
    let marqueeRect: d3.Selection<SVGRectElement, unknown, null, undefined> | null = null;
    let marqueeStart: [number, number] | null = null;

    const cleanupMarquee = () => {
      if (marqueeRect) { marqueeRect.remove(); marqueeRect = null; }
      marqueeStart = null;
    };

    this.svg.on('mousedown.marquee', (event: MouseEvent) => {
      if (readOnly) return;
      const mode = this.refs.modeRef.current;
      if (mode !== 'SELECT' && mode !== 'DELETE_ANY') return;
      const target = event.target as Element;
      if (target.closest('g.node') || target.tagName === 'line') return;
      // Only start marquee from background
      const [x, y] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);
      marqueeStart = [x, y];
      marqueeRect = this.svg.select<SVGGElement>('.container').append('rect')
        .attr('class', 'marquee')
        .attr('x', x).attr('y', y)
        .attr('width', 0).attr('height', 0)
        .attr('fill', mode === 'DELETE_ANY' ? 'rgba(231,76,60,0.1)' : 'rgba(74,144,226,0.1)')
        .attr('stroke', mode === 'DELETE_ANY' ? '#e74c3c' : '#4A90E2')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 2');
    });

    this.svg.on('mousemove.marquee', (event: MouseEvent) => {
      if (!marqueeStart || !marqueeRect) return;
      const [x, y] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);
      const x0 = Math.min(marqueeStart[0], x);
      const y0 = Math.min(marqueeStart[1], y);
      const w = Math.abs(x - marqueeStart[0]);
      const h = Math.abs(y - marqueeStart[1]);
      marqueeRect.attr('x', x0).attr('y', y0).attr('width', w).attr('height', h);
    });

    window.addEventListener('mouseup', (event: MouseEvent) => {
      if (!marqueeStart || !marqueeRect) return;
      const [x, y] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);
      const x0 = Math.min(marqueeStart[0], x);
      const y0 = Math.min(marqueeStart[1], y);
      const x1 = Math.max(marqueeStart[0], x);
      const y1 = Math.max(marqueeStart[1], y);
      cleanupMarquee();

      // Only count as marquee if dragged at least 5px
      if ((x1 - x0) < 5 && (y1 - y0) < 5) return;

      const mode = this.refs.modeRef.current;
      const enclosed = this.refs.nodesRef.current.filter(n => {
        const nx = n.x ?? 0;
        const ny = n.y ?? 0;
        return nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1;
      });

      if (mode === 'SELECT') {
        this.selectedNodes.clear();
        for (const n of enclosed) this.selectedNodes.add(n.id);
        this.renderer.setSelectedNodes(this.selectedNodes);
      } else if (mode === 'DELETE_ANY' && enclosed.length > 0) {
        this.saveState();

        enclosed.forEach(node => {
          this.refs.onNodeCreated('DELETE_NODE' as any, node.id, {
            kind: (node as any).kind || 'default'
          });
        });

        const toDelete = new Set(enclosed.map(n => n.id));
        this.refs.nodesRef.current = this.refs.nodesRef.current.filter(n => !toDelete.has(n.id));
        this.refs.linksRef.current = this.refs.linksRef.current.filter(l => !toDelete.has((l.source as INode).id) && !toDelete.has((l.target as INode).id));
        for (const n of this.refs.nodesRef.current) {
          if (n.edges) n.edges = n.edges.filter(e => !toDelete.has(e.end.id));
        }
        this.physics.updateNodes(this.refs.nodesRef.current);
        this.physics.updateLinks(this.refs.linksRef.current);
        this.renderer.update();
        this.applyDrag(readOnly);
        this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
        this.invalidateExecutors();
      }
    });

    window.addEventListener('blur', cleanupMarquee);
    document.addEventListener('visibilitychange', cleanupMarquee);

    // LINK/ARROW: mousedown on source node starts connection
    this.svg.on('mousedown.link', (event: MouseEvent) => {
      if (readOnly) return;
      const mode = this.refs.modeRef.current;
      if (mode !== 'LINK' && mode !== 'ARROW') return;
      const target = event.target as Element;
      const clickedNode = this.getNodeFromTarget(target);
      if (clickedNode) {
        this.refs.selectedNodeRef.current = clickedNode;
      }
    });

    // LINK/ARROW: mouseup on target node completes connection
    this.svg.on('mouseup.link', (event: MouseEvent) => {
      if (readOnly) return;
      const mode = this.refs.modeRef.current;
      if (mode !== 'LINK' && mode !== 'ARROW') return;
      const source = this.refs.selectedNodeRef.current;
      if (!source) return;

      const target = event.target as Element;
      const targetNode = this.getNodeFromTarget(target);

      if (targetNode && source.id !== targetNode.id) {
        this.saveState();
        const isAlgoSource = (source as any).kind === 'algorithm';
        const isAlgoTarget = (targetNode as any).kind === 'algorithm';

        if (isAlgoSource || isAlgoTarget) {
          // Algorithm connection: either direction
          const algoNode = (isAlgoSource ? source : targetNode) as unknown as IAlgorithmNode;
          const structureNode = isAlgoSource ? targetNode : source;
          this.executors.delete(algoNode.id);
          this.stopAutoPlay(algoNode.id);
          algoNode.state = { snapshots: [], currentStep: 0, status: 'idle' };
          this.refs.linksRef.current = this.refs.linksRef.current.filter(l => !(l.type === 'algorithm' && ((l.source as INode).id === algoNode.id || (l.target as INode).id === algoNode.id)));
          algoNode.connectedTo = structureNode.id;
          this.refs.linksRef.current.push({ source: algoNode as any, target: structureNode, value: 1, directed: true, type: 'algorithm' });
          this.physics.updateLinks(this.refs.linksRef.current);
          this.renderer.update();
          this.applyDrag(readOnly);

          this.refs.onNodeCreated('CREATE_NODE', algoNode.id, {
            isLink: true,
            isAlgoLink: true, // Flag especial para que el receptor sepa qué tipo de cable es
            targetId: structureNode.id,
            directed: true,
            value: 1
          });


        } else {
          const directed = mode === 'ARROW';
          const link: SimLink = { source, target: targetNode, value: 1, directed };
          this.refs.linksRef.current.push(link);
          source.edges.push({ end: targetNode, weight: 1, directed });
          if (!directed) targetNode.edges.push({ end: source, weight: 1, directed: false });
          this.physics.updateLinks(this.refs.linksRef.current);
          this.renderer.update();
          this.applyDrag(readOnly);
          this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
          this.invalidateExecutors();

          this.refs.onNodeCreated('CREATE_NODE', source.id, {
            isLink: true,
            targetId: targetNode.id,
            directed: directed,
            value: 1
          });
        }
      }

      this.refs.selectedNodeRef.current = null;
      this.clearGhost();
    });

    // Drag-and-drop placement from panel (presets/algorithms)
    this.svg.on('mouseup.placement', (event: MouseEvent) => {
      if (readOnly) return;
      const [x, y] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);

      if (this.refs.pendingPresetRef.current) {
        const presetId = this.refs.pendingPresetRef.current;
        this.refs.pendingPresetRef.current = null;
        const preset = PRESETS.find(p => p.id === presetId);
        if (preset) {
          const { nodes, links } = preset.generate(x, y);
          this.refs.nodesRef.current.push(...nodes);
          this.refs.linksRef.current.push(...links);
          this.physics.updateNodes(this.refs.nodesRef.current);
          this.physics.updateLinks(this.refs.linksRef.current);
          this.renderer.update();
          this.applyDrag(readOnly);
          this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
          this.invalidateExecutors();
          nodes.forEach(node => {
            const realValue = node.value !== undefined ? node.value : ((node as any).val ?? 1);
            this.refs.onNodeCreated('CREATE_NODE', node.id, {
              kind: (node as any).kind || 'default', // Ajustá a cómo guarde tu preset el tipo
              x: node.x,
              y: node.y,
              value: realValue
            });
          });
          links.forEach(link => {
          this.refs.onNodeCreated('CREATE_NODE', link.source.id, {
            isLink: true, // Flag para saber que no es un círculo, es un cable
            targetId: link.target.id,
            directed: link.directed,
            value: link.value ?? 1
          });
        });
        }
        return;
      }

      if (this.refs.pendingAlgorithmRef.current) {
        const algId = this.refs.pendingAlgorithmRef.current;
        this.refs.pendingAlgorithmRef.current = null;
        const alg = AVAILABLE_ALGORITHMS.find(a => a.id === algId);
        if (alg) {
          const algoNode: any = {
            kind: 'algorithm',
            id: crypto.randomUUID(),
            algorithmId: algId,
            label: alg.label,
            pos: { x, y },
            scale: 1,
            x, y,
            connectedTo: null,
            state: { snapshots: [], currentStep: 0, status: 'idle' },
            edges: []
          };
          (this.refs.nodesRef.current as any[]).push(algoNode);
          this.physics.updateNodes(this.refs.nodesRef.current);
          this.renderer.update();
          this.applyDrag(readOnly);

          this.refs.onNodeCreated('CREATE_NODE', algoNode.id, {
            kind: 'algorithm',
            algorithmId: algoNode.algorithmId,
            label: algoNode.label,
            x: algoNode.x,
            y: algoNode.y
          });
        }
        return;
      }
    });

    this.svg.on('click.interaction', (event: MouseEvent) => {
      const target = event.target as Element;
      const mode = readOnly ? 'SELECT' : this.refs.modeRef.current;
      console.log('[Interaction] click | mode:', mode, '| target:', target.tagName);

      // --- ALGORITHM BUTTONS (Habilitado siempre, incluso en readOnly) ---
      const algoBtn = target.closest('.algo-btn');
      if (algoBtn) {
        const algoG = target.closest('g.node-algo');
        if (algoG) {
          const algoNode = d3.select<Element, IAlgorithmNode>(algoG).datum();
          if (algoNode) this.handleAlgoButton(algoNode, algoBtn);
        }
        return;
      }

      // --- ESCUDO ANTIVANDALISMO PARA MODO LECTURA ---
      if (readOnly) {
        if (mode === 'SELECT') {
          const clickedNode = this.getNodeFromTarget(target);
          this.refs.selectedNodeRef.current = clickedNode;
          this.refs.onSelectNode(clickedNode?.id ?? null);
          this.highlightStructure(clickedNode?.id ?? null);
          if (this.refs.onNodeSelected) {
            this.refs.onNodeSelected(clickedNode);
          }
        }
        return; 
      }

      // --- DE ACÁ PARA ABAJO SÓLO ENTRARÁ SI NO ES READONLY (MODO EDITOR) ---

      // Skip click handling for LINK/ARROW since it's now drag-based
      if (mode === 'LINK' || mode === 'ARROW') return;

      if (mode === 'SELECT') {
        const clickedNode = this.getNodeFromTarget(target);
        if (!clickedNode) this.selectedNodes.clear();
        else if (!this.selectedNodes.has(clickedNode.id)) {
          this.selectedNodes.clear();
          this.selectedNodes.add(clickedNode.id);
        }
        this.refs.selectedNodeRef.current = clickedNode;
        this.refs.onSelectNode(clickedNode?.id ?? null);
        this.renderer.setSelectedNodes(this.selectedNodes);
        this.highlightStructure(clickedNode?.id ?? null);
        if (this.refs.onNodeSelected) {
          this.refs.onNodeSelected(clickedNode); 
        }
      }

      // Preset placement
      if (this.refs.pendingPresetRef.current && !target.closest('g.node')) {
        this.saveState();
        const presetId = this.refs.pendingPresetRef.current;
        this.refs.pendingPresetRef.current = null;
        const preset = PRESETS.find(p => p.id === presetId);
        if (preset) {
          const [cx, cy] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);
          const { nodes, links } = preset.generate(cx, cy);
          this.refs.nodesRef.current.push(...nodes);
          this.refs.linksRef.current.push(...links);
          this.physics.updateNodes(this.refs.nodesRef.current);
          this.physics.updateLinks(this.refs.linksRef.current);
          this.renderer.update();
          this.applyDrag(readOnly);
          this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
          this.invalidateExecutors();
        }
        return;
      }

      // Algorithm placement
      if (this.refs.pendingAlgorithmRef.current && !target.closest('g.node')) {
        const algId = this.refs.pendingAlgorithmRef.current;
        this.refs.pendingAlgorithmRef.current = null;
        const alg = AVAILABLE_ALGORITHMS.find(a => a.id === algId);
        if (alg) {
          const [x, y] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);
          const algoNode: any = {
            kind: 'algorithm',
            id: crypto.randomUUID(),
            algorithmId: algId,
            label: alg.label,
            pos: { x, y },
            scale: 1,
            x, y,
            connectedTo: null,
            state: { snapshots: [], currentStep: 0, status: 'idle' },
            edges: []
          };
          (this.refs.nodesRef.current as any[]).push(algoNode);
          this.physics.updateNodes(this.refs.nodesRef.current);
          this.renderer.update();
          this.applyDrag(readOnly);
          this.refs.onNodeCreated('CREATE_NODE', algoNode.id, {
            kind: 'algorithm',
            algorithmId: algoNode.algorithmId,
            label: algoNode.label,
            x: algoNode.x,
            y: algoNode.y
          });
        }
        return;
      }

      // Add common node
      if (mode === 'ADD_NODE' && !target.closest('g.node')) {
        this.saveState();
        const [x, y] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);
        const node = new DefaultNode(crypto.randomUUID(), Math.floor(Math.random() * 99) + 1, x, y);
        this.refs.nodesRef.current.push(node);
        this.physics.updateNodes(this.refs.nodesRef.current);
        this.renderer.update();
        this.applyDrag(readOnly);
        this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
        this.invalidateExecutors();
        this.refs.onNodeCreated('CREATE_NODE', node.id, {
          kind: (node as any).kind || 'default', // Si DefaultNode guarda su tipo, usalo acá
          x: node.x,
          y: node.y,
          value: node.value
        });
      }

      // Deletion (Delete elements)
      if (mode === 'DELETE_ANY') {
        this.saveState();
        if (this.selectedNodes.size > 0) {
          const toDelete = new Set(this.selectedNodes);

          this.refs.nodesRef.current.forEach(n => {
            if (toDelete.has(n.id)) {
              this.refs.onNodeCreated('DELETE_NODE' as any, n.id, { 
                kind: (n as any).kind || 'default' 
              });
            }
          });

          this.refs.nodesRef.current = this.refs.nodesRef.current.filter(n => !toDelete.has(n.id));
          this.refs.linksRef.current = this.refs.linksRef.current.filter(l => !toDelete.has((l.source as INode).id) && !toDelete.has((l.target as INode).id));
          for (const n of this.refs.nodesRef.current) {
            if (n.edges) n.edges = n.edges.filter(e => !toDelete.has(e.end.id));
          }
          this.selectedNodes.clear();
          this.renderer.setSelectedNodes(this.selectedNodes);
        } else {
        const clickedNode = this.getNodeFromTarget(target);
        if (clickedNode) {
          if (this.refs.selectedNodeRef.current?.id === clickedNode.id) this.refs.selectedNodeRef.current = null;
          this.refs.nodesRef.current = this.refs.nodesRef.current.filter(n => n.id !== clickedNode.id);
          this.refs.linksRef.current = this.refs.linksRef.current.filter(l => (l.source as INode).id !== clickedNode.id && (l.target as INode).id !== clickedNode.id);
          
          for (const n of this.refs.nodesRef.current) {
            if (n.edges) n.edges = n.edges.filter(e => e.end.id !== clickedNode.id);
          }

          this.refs.onNodeCreated('DELETE_NODE' as any, clickedNode.id, {
              kind: (clickedNode as any).kind || 'default'
          });
          
        } else if (target.tagName === 'line') {
          const datum = d3.select<Element, SimLink>(target).datum();
          if (datum) {
            const srcId = (datum.source as INode).id;
            const tgtId = (datum.target as INode).id;
            this.refs.linksRef.current = this.refs.linksRef.current.filter(l => l !== datum);
            const srcNode = this.refs.nodesRef.current.find(n => n.id === srcId);
            const tgtNode = this.refs.nodesRef.current.find(n => n.id === tgtId);
            
            if (srcNode && srcNode.edges) srcNode.edges = srcNode.edges.filter(e => e.end.id !== tgtId);
            if (tgtNode && tgtNode.edges && !datum.directed) tgtNode.edges = tgtNode.edges.filter(e => e.end.id !== srcId);

            // Notificar el borrado del link a los clientes remotos
            this.refs.onNodeCreated('DELETE_NODE' as any, srcId, {
              isLink: true,
              targetId: tgtId,
              directed: datum.directed
            });
          }
        }
        }
        this.physics.updateNodes(this.refs.nodesRef.current);
        this.physics.updateLinks(this.refs.linksRef.current);
        this.renderer.update();
        this.applyDrag(readOnly);
        this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
        this.invalidateExecutors();
      }
    });

    this.applyDrag(readOnly);
  }

  destroy(): void {
    this.svg.on('click.interaction', null);
    this.svg.on('mousemove.ghost', null);
    this.svg.on('mousedown.link', null);
    this.svg.on('mouseup.link', null);
    this.svg.on('mouseup.placement', null);
    d3.select('body').on('keydown.interaction', null);
    this.clearGhost();
    for (const id of this.autoPlayIntervals.keys()) this.stopAutoPlay(id);
  }

  private handleAlgoButton(algoNode: IAlgorithmNode, btn: Element): void {
    if (this.animating) return;
    const executor = this.getOrCreateExecutor(algoNode);
    if (!executor) return;

    if (btn.classList.contains('btn-fwd')) {
      this.stopAutoPlay(algoNode.id);
      this.animatedStep(algoNode, executor, 'forward');
    } else if (btn.classList.contains('btn-back')) {
      this.stopAutoPlay(algoNode.id);
      this.animatedStep(algoNode, executor, 'back');
    } else if (btn.classList.contains('btn-play')) {
      if (this.autoPlayIntervals.has(algoNode.id)) {
        this.stopAutoPlay(algoNode.id);
      } else {
        this.startAutoPlay(algoNode.id, executor, algoNode);
      }
    } else if (btn.classList.contains('btn-reset')) {
      this.stopAutoPlay(algoNode.id);
      if (algoNode.state.snapshots.length > 0) {
        while (algoNode.state.currentStep > 0) executor.stepBack();
        const initial = algoNode.state.snapshots[0];
        if (initial.edges) this.syncLinksFromEdges(initial.edges);
      }
      this.executors.delete(algoNode.id);
      algoNode.state = { snapshots: [], currentStep: 0, status: 'idle' };
      this.renderer.setHighlights(undefined);
      this.renderer.update();
    }
  }

  private animatedStep(algoNode: IAlgorithmNode, executor: AlgorithmExecutor, direction: 'forward' | 'back', onDone?: () => void): void {
    const { state } = algoNode;
    const prevStep = state.currentStep;
    const ok = direction === 'forward' ? executor.stepForward() : executor.stepBack();
    if (!ok) { onDone?.(); return; }

    const prev = state.snapshots[prevStep];
    const next = state.snapshots[state.currentStep];
    const hasSwapping = next.highlights?.swapping && next.highlights.swapping.length > 0;
    const swaps = hasSwapping ? diffSnapshots(prev, next) : [];

    if (next.edges) this.syncLinksFromEdges(next.edges);

    // Apply value updates directly (for algorithms like Dijkstra that don't swap)
    if (!hasSwapping && next.values) {
      for (const node of this.refs.nodesRef.current) {
        if (node.id in next.values && next.values[node.id] !== Infinity) {
          node.value = next.values[node.id];
        }
      }
    }

    this.animating = true;
    this.renderer.setHighlights(next.highlights);
    this.renderer.transitionHighlights(() => {
      this.renderer.animateStep(swaps, () => {
        this.animating = false;
        this.renderer.update();
        onDone?.();
      });
    });
  }

  private syncLinksFromEdges(edges: { source: string; target: string }[]): void {
    const nodeMap = new Map(this.refs.nodesRef.current.map(n => [n.id, n]));
    
    // 1. FILTRADO QUIRÚRGICO: Dejamos únicamente el cable azul de control
    const algoControlLinks = this.refs.linksRef.current.filter(l => l.type === 'algorithm');
    const newLinks: SimLink[] = [...algoControlLinks];

    // --- FIX DEFINITIVO: Registro de rutas para evitar clones bidireccionales ---
    const processedPairs = new Set<string>();

    // 2. RECONSTRUCCIÓN DEL ÁRBOL DESDE LA FUENTE DE LA VERDAD
    for (const node of this.refs.nodesRef.current) {
      if (node.edges) {
        for (const edge of node.edges) {
          const fwdKey = `${node.id}-${edge.end.id}`;
          const revKey = `${edge.end.id}-${node.id}`;

          // Si es de doble mano y ya dibujamos la vuelta, la saltamos para no clonar la línea
          if (!edge.directed && processedPairs.has(revKey)) {
            continue;
          }

          processedPairs.add(fwdKey);

          newLinks.push({
            source: node,
            target: edge.end,
            value: edge.weight ?? 1,
            directed: edge.directed
          });
        }
      }
    }

    const insertedAlgoKeys = new Set<string>();

    // 3. INYECCIÓN DE LAS ARISTAS TEMPORALES DEL ALGORITMO
    for (const edge of edges) {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      
      if (src && tgt) {
        const edgeKey = `${src.id}->${tgt.id}`;
        
        if (!insertedAlgoKeys.has(edgeKey)) {
          insertedAlgoKeys.add(edgeKey);
          
          newLinks.push({ 
            source: src, 
            target: tgt, 
            value: 1, 
            directed: true,
            type: 'algo-snapshot' as any
          });
        }
      }
    }

    // 4. Asignamos el array reconstruido y sin duplicados
    this.refs.linksRef.current = newLinks;

    // 5. Sincronizamos el motor físico de D3
    this.physics.updateLinks(this.refs.linksRef.current);
    
    // 6. Forzamos al renderizador
    this.renderer.update();
  }

  private invalidateExecutors(): void {
    const allNodes = this.physics.getSimulation().nodes() as CanvasNode[];
    const algoNodes = allNodes.filter((n): n is IAlgorithmNode => n.kind === 'algorithm');
    for (const algoNode of algoNodes) {
      if (algoNode.connectedTo && this.executors.has(algoNode.id)) {
        this.executors.delete(algoNode.id);
        this.stopAutoPlay(algoNode.id);
        algoNode.state = { snapshots: [], currentStep: 0, status: 'idle' };
      }
    }
    this.renderer.setHighlights(undefined);
  }

  private getOrCreateExecutor(algoNode: IAlgorithmNode): AlgorithmExecutor | null {
    if (this.executors.has(algoNode.id)) return this.executors.get(algoNode.id)!;
    if (!algoNode.connectedTo) return null;

    this.saveState();

    const entryNode = this.refs.nodesRef.current.find(n => n.id === algoNode.connectedTo);
    if (!entryNode) return null;

    const algConfig = AVAILABLE_ALGORITHMS.find(a => a.id === algoNode.algorithmId);
    if (algConfig && algConfig.requiredFlags.length > 0) {
      const structure = this.refs.structureManagerRef.current.getStructureForNode(algoNode.connectedTo);
      if (!structure) return null;
      const hasAll = algConfig.requiredFlags.every(f => structure.flags.has(f));
      if (!hasAll) {
        console.warn(`[Algorithm] ${algoNode.label} requires flags [${algConfig.requiredFlags}]`);
        return null;
      }
    }

    const algorithm = this.resolveAlgorithm(algoNode.algorithmId);
    if (!algorithm) return null;

    const executor = new AlgorithmExecutor(algoNode, algorithm);
    executor.init(entryNode);
    this.executors.set(algoNode.id, executor);
    this.renderer.update();
    return executor;
  }

  private resolveAlgorithm(algorithmId: string) {
    if (algorithmId === 'bubble-sort') return new BubbleSort();
    if (algorithmId === 'inorder') return new Inorder();
    if (algorithmId === 'bogo-sort') return new BogoSort();
    if (algorithmId === 'merge-sort') return new MergeSort();
    if (algorithmId === 'dijkstra') return new Dijkstra();
    return null;
  }

  private startAutoPlay(id: string, executor: AlgorithmExecutor, algoNode: IAlgorithmNode): void {
    const step = () => {
      if (!this.autoPlayIntervals.has(id)) return;
      this.animatedStep(algoNode, executor, 'forward', () => {
        if (algoNode.state.status === 'done') { this.stopAutoPlay(id); return; }
        const timeout = window.setTimeout(step, 200);
        this.autoPlayIntervals.set(id, timeout);
      });
    };
    this.autoPlayIntervals.set(id, window.setTimeout(step, 0));
  }

  private stopAutoPlay(id: string): void {
    const timeout = this.autoPlayIntervals.get(id);
    if (timeout != null) { clearTimeout(timeout); this.autoPlayIntervals.delete(id); }
  }

  private clearGhost(): void {
    if (this.ghostLine) { this.ghostLine.remove(); this.ghostLine = null; }
  }

  private cancelPending(): void {
    this.refs.selectedNodeRef.current = null;
    this.refs.pendingPresetRef.current = null;
    this.refs.pendingAlgorithmRef.current = null;
    this.clearGhost();
  }

  saveState(): void {
    const snapshot = JSON.stringify(this.refs.nodesRef.current.map(n => ({
      id: n.id, value: n.value, scale: n.scale, color: n.color,
      x: n.x, y: n.y,
      edges: n.edges.map(e => ({ endId: e.end.id, weight: e.weight, directed: e.directed }))
    })));
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
    this.redoStack = [];
  }

  private restoreState(snapshot: string): void {
    const data = JSON.parse(snapshot) as { id: string; value: number; scale: number; color?: string; x: number; y: number; edges: { endId: string; weight: number; directed: boolean }[] }[];
    const nodes: INode[] = data.map(d => {
      const node = new DefaultNode(d.id, d.value, d.x, d.y);
      node.scale = d.scale;
      if (d.color) node.color = d.color;
      node.x = d.x; node.y = d.y;
      return node;
    });
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    for (let i = 0; i < data.length; i++) {
      for (const e of data[i].edges) {
        const target = nodeMap.get(e.endId);
        if (target) nodes[i].edges.push({ end: target, weight: e.weight, directed: e.directed });
      }
    }
    // Rebuild links
    const links: SimLink[] = [];
    const seen = new Set<string>();
    for (const node of nodes) {
      for (const edge of node.edges) {
        const key = edge.directed ? `${node.id}->${edge.end.id}` : [node.id, edge.end.id].sort().join('--');
        if (!seen.has(key)) {
          seen.add(key);
          links.push({ source: node, target: edge.end, value: edge.weight, directed: edge.directed });
        }
      }
    }
    this.refs.nodesRef.current = nodes;
    this.refs.linksRef.current = links;
    this.physics.updateNodes(nodes);
    this.physics.updateLinks(links);
    this.renderer.update();
    this.applyDrag(false);
    this.refs.structureManagerRef.current.sync(nodes, links);
    this.selectedNodes.clear();
    this.renderer.setSelectedNodes(this.selectedNodes);
  }

  private undo(): void {
    if (this.undoStack.length === 0) return;
    // Save current state to redo
    const current = JSON.stringify(this.refs.nodesRef.current.map(n => ({
      id: n.id, value: n.value, scale: n.scale, color: n.color,
      x: n.x, y: n.y,
      edges: n.edges.map(e => ({ endId: e.end.id, weight: e.weight, directed: e.directed }))
    })));
    this.redoStack.push(current);
    this.restoreState(this.undoStack.pop()!);
  }

  private redo(): void {
    if (this.redoStack.length === 0) return;
    // Save current state to undo
    const current = JSON.stringify(this.refs.nodesRef.current.map(n => ({
      id: n.id, value: n.value, scale: n.scale, color: n.color,
      x: n.x, y: n.y,
      edges: n.edges.map(e => ({ endId: e.end.id, weight: e.weight, directed: e.directed }))
    })));
    this.undoStack.push(current);
    this.restoreState(this.redoStack.pop()!);
  }

  applyDrag(readOnly: boolean = false): void {
    const physics = this.physics;
    const modeRef = this.refs.modeRef;
    const sim = physics.getSimulation();

    const drag = d3.drag<SVGGElement, CanvasNode>()
      .filter(() => readOnly || modeRef.current === 'SELECT')
      .on('start', (event, d) => {
        sim.on('end', null);
        if (!event.active) sim.alphaTarget(0.3).restart();
        if (readOnly) {
          this.refs.nodesRef.current.forEach(n => { n.fx = null; n.fy = null; });
        }
        d.fx = event.x;
        d.fy = event.y;
        // Pin all selected nodes if dragging one from the group
        if (this.selectedNodes.has(d.id) && this.selectedNodes.size > 1) {
          for (const n of this.refs.nodesRef.current) {
            if (this.selectedNodes.has(n.id) && n.id !== d.id) {
              n.fx = n.x;
              n.fy = n.y;
            }
          }
        }
      })
      .on('drag', (event, d) => {
        const dx = event.x - (d.fx ?? event.x);
        const dy = event.y - (d.fy ?? event.y);
        d.fx = event.x;
        d.fy = event.y;
        // Move group together
        if (this.selectedNodes.has(d.id) && this.selectedNodes.size > 1) {
          for (const n of this.refs.nodesRef.current) {
            if (this.selectedNodes.has(n.id) && n.id !== d.id) {
              n.fx = (n.fx ?? n.x ?? 0) + dx;
              n.fy = (n.fy ?? n.y ?? 0) + dy;
            }
          }
        }
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        if (!readOnly) {
          d.fx = null;
          d.fy = null;
          if (this.selectedNodes.has(d.id)) {
            for (const n of this.refs.nodesRef.current) {
              if (this.selectedNodes.has(n.id)) { n.fx = null; n.fy = null; }
            }
          }
        } else {
          d.fx = null;
          d.fy = null;
          sim.on('end', () => {
            this.refs.nodesRef.current.forEach(n => { n.fx = n.x; n.fy = n.y; });
            sim.on('end', null);
            console.log('[D3] Grafo enfriado y congelado dinámicamente en su nueva forma.');
          });
        }
      });

    this.svg.select<SVGGElement>('.layer-nodes')
      .selectAll<SVGGElement, CanvasNode>('g.node')
      .call(drag);
  }

  private getNodeFromTarget(target: Element): INode | null {
    const g = target.closest('g.node');
    if (!g) return null;
    const datum = d3.select<Element, INode>(g).datum();
    return datum ?? null;
  }

  private highlightStructure(nodeId: string | null): void {
    this.svg.select('.layer-nodes').selectAll<SVGGElement, INode>('g.node')
      .select('circle').style('stroke', null).style('stroke-width', null).style('stroke-dasharray', null);

    if (!nodeId) return;

    // Selected node: solid yellow
    this.svg.select('.layer-nodes').selectAll<SVGGElement, INode>('g.node')
      .filter(d => d.id === nodeId)
      .select('circle')
      .style('stroke', '#f1c40f')
      .style('stroke-width', '4px')
      .style('stroke-dasharray', null);

    const structure = this.refs.structureManagerRef.current.getStructureForNode(nodeId);
    if (!structure) return;

    const ids = new Set(structure.nodes.map(n => n.id));
    this.svg.select('.layer-nodes').selectAll<SVGGElement, INode>('g.node')
      .filter(d => ids.has(d.id) && d.id !== nodeId)
      .select('circle')
      .style('stroke', '#f1c40f')
      .style('stroke-width', '3px')
      .style('stroke-dasharray', '4 2');
  }
}