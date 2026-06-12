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
      if (mode === 'SELECT') {
        const clickedNode = this.getNodeFromTarget(target);
        this.refs.selectedNodeRef.current = clickedNode;
        this.refs.onSelectNode(clickedNode?.id ?? null);
        this.highlightStructure(clickedNode?.id ?? null);
        if (this.refs.onNodeSelected) {
          this.refs.onNodeSelected(clickedNode); 
        }
      }

      // Preset placement
      if (this.refs.pendingPresetRef.current && !target.closest('g.node')) {
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
          };
          (this.refs.nodesRef.current as any[]).push(algoNode);
          this.physics.updateNodes(this.refs.nodesRef.current);
          this.renderer.update();
          this.applyDrag(readOnly);
        }
        return;
      }

      // Add common node
      if (mode === 'ADD_NODE' && !target.closest('g.node')) {
        const [x, y] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);
        const node = new DefaultNode(crypto.randomUUID(), Math.floor(Math.random() * 99) + 1, x, y);
        this.refs.nodesRef.current.push(node);
        this.physics.updateNodes(this.refs.nodesRef.current);
        this.renderer.update();
        this.applyDrag(readOnly);
        this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
        this.invalidateExecutors();
      }

      // Link creation (Link / Arrow)
      if (mode === 'LINK' || mode === 'ARROW') {
        const clickedNode = this.getNodeFromTarget(target);
        if (!clickedNode) { this.refs.selectedNodeRef.current = null; this.clearGhost(); return; }
        if (!this.refs.selectedNodeRef.current) {
          this.refs.selectedNodeRef.current = clickedNode;
        } else {
          const source = this.refs.selectedNodeRef.current;
          if (source.id !== clickedNode.id) {
            const isAlgoSource = (source as any).kind === 'algorithm';
            if (isAlgoSource) {
              const algoNode = source as unknown as IAlgorithmNode;
              this.executors.delete(algoNode.id);
              this.stopAutoPlay(algoNode.id);
              algoNode.state = { snapshots: [], currentStep: 0, status: 'idle' };
              this.refs.linksRef.current = this.refs.linksRef.current.filter(l => !(l.type === 'algorithm' && (l.source as INode).id === algoNode.id));
              algoNode.connectedTo = clickedNode.id;
              this.refs.linksRef.current.push({ source, target: clickedNode, value: 1, directed: true, type: 'algorithm' });
              this.physics.updateLinks(this.refs.linksRef.current);
              this.renderer.update();
              this.applyDrag(readOnly);
            } else {
              const directed = mode === 'ARROW';
              const link: SimLink = { source, target: clickedNode, value: 1, directed };
              this.refs.linksRef.current.push(link);
              source.edges.push({ end: clickedNode, weight: 1, directed });
              if (!directed) clickedNode.edges.push({ end: source, weight: 1, directed: false });
              this.physics.updateLinks(this.refs.linksRef.current);
              this.renderer.update();
              this.applyDrag(readOnly);
              this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
              this.invalidateExecutors();
            }
          }
          this.refs.selectedNodeRef.current = null;
          this.clearGhost();
        }
      }

      // Deletion (Delete elements)
      if (mode === 'DELETE_ANY') {
        const clickedNode = this.getNodeFromTarget(target);
        if (clickedNode) {
          if (this.refs.selectedNodeRef.current?.id === clickedNode.id) this.refs.selectedNodeRef.current = null;
          this.refs.nodesRef.current = this.refs.nodesRef.current.filter(n => n.id !== clickedNode.id);
          this.refs.linksRef.current = this.refs.linksRef.current.filter(l => (l.source as INode).id !== clickedNode.id && (l.target as INode).id !== clickedNode.id);
          for (const n of this.refs.nodesRef.current) n.edges = n.edges.filter(e => e.end.id !== clickedNode.id);
        } else if (target.tagName === 'line') {
          const datum = d3.select<Element, SimLink>(target).datum();
          if (datum) {
            const srcId = (datum.source as INode).id;
            const tgtId = (datum.target as INode).id;
            this.refs.linksRef.current = this.refs.linksRef.current.filter(l => l !== datum);
            const srcNode = this.refs.nodesRef.current.find(n => n.id === srcId);
            const tgtNode = this.refs.nodesRef.current.find(n => n.id === tgtId);
            if (srcNode) srcNode.edges = srcNode.edges.filter(e => e.end.id !== tgtId);
            if (tgtNode && !datum.directed) tgtNode.edges = tgtNode.edges.filter(e => e.end.id !== srcId);
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

      this.refs.linksRef.current = this.refs.linksRef.current.filter(l => (l as any).type !== 'algo-snapshot');
      this.physics.updateLinks(this.refs.linksRef.current);
      this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);

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
    const swaps = diffSnapshots(prev, next);

    this.renderer.setHighlights(next.highlights);
    if (next.edges) this.syncLinksFromEdges(next.edges);

    this.animating = true;
    this.renderer.animateStep(swaps, () => {
      this.animating = false;
      this.renderer.update();
      onDone?.();
    });
  }

  private syncLinksFromEdges(edges: { source: string; target: string }[]): void {
    const nodeMap = new Map(this.refs.nodesRef.current.map(n => [n.id, n]));
    
    // 1. FILTRADO QUIRÚRGICO: Dejamos únicamente el cable azul de control del algoritmo
    const algoControlLinks = this.refs.linksRef.current.filter(l => l.type === 'algorithm');
    
    // Armamos el nuevo array base insertando el control
    const newLinks: SimLink[] = [...algoControlLinks];

    // 2. RECONSTRUCCIÓN DEL ÁRBOL DESDE LA FUENTE DE LA VERDAD
    // Recorremos los nodos reales y volvemos a inyectar sus aristas estructurales (las del árbol/grafo)
    for (const node of this.refs.nodesRef.current) {
      if (node.edges) {
        for (const edge of node.edges) {
          newLinks.push({
            source: node,
            target: edge.end,
            value: edge.weight ?? 1,
            directed: edge.directed
          });
        }
      }
    }

    // Usamos un Set para evitar que el algoritmo duplique flechas en el mismo paso
    const insertedAlgoKeys = new Set<string>();

    // 3. INYECCIÓN DE LAS ARISTAS TEMPORALES DEL BUBBLE SORT
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
            type: 'algo-snapshot' as any // Mantenemos el tag por consistencia con el key function
          });
        }
      }
    }

    // 4. Asignamos el array reconstruido e impecable a la referencia global
    this.refs.linksRef.current = newLinks;

    // 5. Sincronizamos el motor físico de D3 con la nueva estructura limpia
    this.physics.updateLinks(this.refs.linksRef.current);
    
    // 6. Forzamos al renderizador a procesar las Claves Únicas (Key Function) que pusimos en CanvasRenderer
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
    this.refs.linksRef.current = this.refs.linksRef.current.filter(l => (l as any).type !== 'algo-snapshot');
    this.physics.updateLinks(this.refs.linksRef.current);
    this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
  }

  private getOrCreateExecutor(algoNode: IAlgorithmNode): AlgorithmExecutor | null {
    if (this.executors.has(algoNode.id)) return this.executors.get(algoNode.id)!;
    if (!algoNode.connectedTo) return null;

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
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        if (!readOnly) {
          d.fx = null;
          d.fy = null;
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
      .select('circle').style('stroke', null).style('stroke-width', null);

    if (!nodeId) return;
    const structure = this.refs.structureManagerRef.current.getStructureForNode(nodeId);
    if (!structure) return;

    const ids = new Set(structure.nodes.map(n => n.id));
    this.svg.select('.layer-nodes').selectAll<SVGGElement, INode>('g.node')
      .filter(d => ids.has(d.id))
      .select('circle')
      .style('stroke', '#f1c40f')
      .style('stroke-width', '3px');
  }
}