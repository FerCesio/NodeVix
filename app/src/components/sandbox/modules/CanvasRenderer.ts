import * as d3 from 'd3';
import type { INode, IAlgorithmNode, CanvasNode, Snapshot } from '../../../sandbox/interfaces';
import type { Swap } from '../../../sandbox/utils/diffSnapshots';
import type { PhysicsEngine, SimLink } from './PhysicsEngine';

type Layers = {
  links: d3.Selection<SVGGElement, unknown, null, undefined>;
  ghost: d3.Selection<SVGGElement, unknown, null, undefined>;
  nodes: d3.Selection<SVGGElement, unknown, null, undefined>;
};

export class CanvasRenderer {
  private layers: Layers;
  private physics: PhysicsEngine;
  private nodeSelection: d3.Selection<SVGGElement, INode, SVGGElement, unknown> | null = null;
  private algoSelection: d3.Selection<SVGGElement, IAlgorithmNode, SVGGElement, unknown> | null = null;
  private linkSelection: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown> | null = null;
  private selectedNodeId: string | null = null;
  private currentHighlights: Snapshot['highlights'] = undefined;
  private pulsedNodes: Set<string> = new Set();
  private linkLabelSelection: d3.Selection<SVGTextElement, SimLink, SVGGElement, unknown> | null = null;
  private multiSelectedNodes: Set<string> = new Set();

  constructor(layers: Layers, physics: PhysicsEngine) {
    this.layers = layers;
    this.physics = physics;
    this.defineMarkers();
    this.physics.onTick(() => this.tick());
  }

  highlight(nodeId: string | null): void {
    this.selectedNodeId = nodeId;
    this.update();
  }

  setSelectedNodes(ids: Set<string>): void {
    this.multiSelectedNodes = ids;
    this.update();
  }

  setHighlights(highlights: Snapshot['highlights']): void {
    if (!highlights) this.pulsedNodes.clear();
    this.currentHighlights = highlights;
  }

  transitionHighlights(onComplete?: () => void): void {
    const duration = 200;
    this.layers.nodes
      .selectAll<SVGGElement, INode>('g.node-data')
      .select('circle')
      .transition().duration(duration)
      .attr('fill', d => this.getNodeColor(d))
      .on('end', () => { onComplete?.(); onComplete = undefined; });
    // Fallback if no nodes to transition
    if (this.layers.nodes.selectAll('g.node-data').empty() && onComplete) onComplete();
  }

  private getNodeColor(d: INode): string {
    const h = this.currentHighlights;
    if (h?.swapping && h.swapping.includes(d.id)) return '#f1c40f';
    if (h?.comparing && h.comparing.includes(d.id)) return '#e67e22';
    if (h?.sorted && h.sorted.includes(d.id)) return '#27ae60';
    return d.color ?? '#ffffff';
  }

  private getAlgoColor(d: IAlgorithmNode): string {
    if (!d.connectedTo) return '#7f8c8d';
    switch (d.state.status) {
      case 'done': return '#27ae60';
      case 'running': case 'paused': return '#2980b9';
      default: return '#3498db';
    }
  }

  private getStepLabel(d: IAlgorithmNode): string {
    const { snapshots, currentStep } = d.state;
    if (snapshots.length === 0) return '';
    return `${currentStep}/${snapshots.length - 1}`;
  }

  private defineMarkers(): void {
    const svg = this.layers.links.select(function() { return this.ownerSVGElement!; });
    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) defs = svg.append('defs') as any;

    // Punta de flecha normal (Ahora es Gris #fa0808 en vez de Roja)
    if (defs.select('#arrowhead').empty()) {
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 10)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
        .attr('fill', '#f00d0d'); 
    }

    // Punta de flecha iluminada para Dijkstra (Cyan)
    if (defs.select('#arrowhead-active').empty()) {
      defs.append('marker')
        .attr('id', 'arrowhead-active')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 10)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
        .attr('fill', '#00e5ff'); 
    }
  }

  update(): void {
    const sim = this.physics.getSimulation();
    const allNodes = sim.nodes() as CanvasNode[];
    const dataNodes = allNodes.filter((n): n is INode => n.kind === 'data');
    const algoNodes = allNodes.filter((n): n is IAlgorithmNode => n.kind === 'algorithm');
    const links = (sim.force('link') as d3.ForceLink<INode, SimLink>).links() as SimLink[];

    // --- NUEVA LÓGICA: Encontrar qué nodos pertenecen al grafo de Dijkstra ---
    const dijkstraConnectedNodes = new Set<string>();
    const dijkstraNodes = algoNodes.filter(a => a.algorithmId === 'dijkstra' && a.connectedTo);
    
    // Agregamos los nodos de entrada
    dijkstraNodes.forEach(d => dijkstraConnectedNodes.add(d.connectedTo!));

    // Expandimos la red para encontrar todos los nodos conectados a ese grafo
    if (dijkstraConnectedNodes.size > 0) {
      let added = true;
      while (added) {
        added = false;
        for (const l of links) {
          if (l.type === 'algorithm') continue;
          const sId = typeof l.source === 'object' ? (l.source as INode).id : l.source as string;
          const tId = typeof l.target === 'object' ? (l.target as INode).id : l.target as string;
          
          if (dijkstraConnectedNodes.has(sId) && !dijkstraConnectedNodes.has(tId)) {
            dijkstraConnectedNodes.add(tId);
            added = true;
          } else if (dijkstraConnectedNodes.has(tId) && !dijkstraConnectedNodes.has(sId)) {
            dijkstraConnectedNodes.add(sId);
            added = true;
          }
        }
      }
    }

    // 1. PRIMERO dibujamos las flechas (líneas)
    this.linkSelection = this.layers.links
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links, d => {
        const sourceId = typeof d.source === 'object' ? (d.source as INode).id : d.source;
        const targetId = typeof d.target === 'object' ? (d.target as INode).id : d.target;
        const linkType = d.type ?? 'normal';
        return `${sourceId}-${targetId}-${linkType}`;
      })
      .join(
        enter => enter.append('line').attr('class', 'entering').each(function() {
          const el = this as SVGLineElement;
          setTimeout(() => el.classList.remove('entering'), 200);
        }),
        update => update,
        exit => {
          exit.filter(d => d.type === 'algo-snapshot' || d.type === 'algorithm').remove();
          exit.filter(d => d.type !== 'algo-snapshot' && d.type !== 'algorithm')
            .transition().duration(200)
            .attr('stroke-opacity', 0)
            .remove();
          return exit;
        }
      )
      .style('stroke', d => {
        const h = this.currentHighlights;
        const sId = typeof d.source === 'object' ? (d.source as INode).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as INode).id : d.target;
        
        if (h?.activeEdges && (h.activeEdges.includes(`${sId}-${tId}`) || h.activeEdges.includes(`${tId}-${sId}`))) {
          return '#00e5ff'; 
        }
        // Flechas ahora son todas grises (#555) por defecto
        return d.type === 'algorithm' ? '#3498db' : '#555';
      })
      .style('stroke-width', '2px') 
      .attr('stroke-dasharray', d => d.type === 'algorithm' ? '6 4' : null)
      .attr('marker-end', d => {
        if (d.type === 'algorithm') return null;
        if (!d.directed) return null;
        
        const h = this.currentHighlights;
        const sId = typeof d.source === 'object' ? (d.source as INode).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as INode).id : d.target;
        
        if (h?.activeEdges && (h.activeEdges.includes(`${sId}-${tId}`) || h.activeEdges.includes(`${tId}-${sId}`))) {
          return 'url(#arrowhead-active)';
        }
        return 'url(#arrowhead)';
      });

    // 2. DESPUÉS dibujamos los textos de los pesos flotando
    this.linkLabelSelection = this.layers.links
      .selectAll<SVGTextElement, SimLink>('text.link-label')
      .data(links, d => {
        const sourceId = typeof d.source === 'object' ? (d.source as INode).id : d.source;
        const targetId = typeof d.target === 'object' ? (d.target as INode).id : d.target;
        const linkType = d.type ?? 'normal';
        return `${sourceId}-${targetId}-${linkType}`;
      })
      .join(
        enter => enter.append('text')
          .attr('class', 'link-label')
          .attr('text-anchor', 'middle')
          .attr('dy', '-6px') 
          .attr('fill', '#bdc3c7') 
          .attr('font-size', '12px')
          .attr('font-weight', 'bold'),
        update => update,
        exit => exit.remove()
      )
      .text(d => {
        if (d.type === 'algorithm') return '';

        const sId = typeof d.source === 'object' ? (d.source as INode).id : (d.source as string);
        
        // Si el origen de esta flecha NO está en la red de Dijkstra, ocultamos el número
        if (!dijkstraConnectedNodes.has(sId)) return '';

        const tId = typeof d.target === 'object' ? (d.target as INode).id : (d.target as string);

        const realSrcNode = dataNodes.find(n => n.id === sId);
        if (realSrcNode && realSrcNode.edges) {
          const edge = realSrcNode.edges.find(e => e.end.id === tId);
          if (edge && edge.weight !== undefined) {
            return edge.weight; 
          }
        }
        return d.value ?? 1;
      });

    // 3. NODOS
    this.nodeSelection = this.layers.nodes
      .selectAll<SVGGElement, INode>('g.node-data')
      .data(dataNodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node node-data node-entering')
            .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
          const circle = g.append('circle')
            .attr('r', 0)
            .attr('fill', d => this.getNodeColor(d))
            .style('stroke', d => this.multiSelectedNodes.has(d.id) ? '#f1c40f' : d.id === this.selectedNodeId ? '#f1c40f' : 'none')
            .style('stroke-width', d => this.multiSelectedNodes.has(d.id) || d.id === this.selectedNodeId ? `${3 * (d.scale ?? 1)}px` : '0px');
          circle.transition().duration(250).ease(d3.easeBackOut)
            .attr('r', (d: INode) => 20 * (d.scale ?? 1))
            .on('end', function() {
              (this.parentNode as Element)?.classList.remove('node-entering');
            });
          g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', '#000')
            .attr('font-size', '12px')
            .text(d => d.value);
          return g;
        },
        update => {
          update.filter(':not(.node-entering)').select('circle')
            .attr('r', d => 20 * (d.scale ?? 1));
          update.select('circle')
            .attr('fill', d => this.getNodeColor(d))
            .style('stroke', d => this.multiSelectedNodes.has(d.id) ? '#f1c40f' : d.id === this.selectedNodeId ? '#f1c40f' : 'none')
            .style('stroke-width', d => this.multiSelectedNodes.has(d.id) || d.id === this.selectedNodeId ? `${3 * (d.scale ?? 1)}px` : '0px');
          update.select('text').text(d => d.value);

          // Pulse highlighted nodes (only once per highlight change)
          if (this.currentHighlights) {
            const highlighted = new Set([
              ...(this.currentHighlights.swapping ?? []),
              ...(this.currentHighlights.comparing ?? []),
              ...(this.currentHighlights.sorted ?? [])
            ]);
            const toPulse = [...highlighted].filter(id => !this.pulsedNodes.has(id));
            if (toPulse.length > 0) {
              const pulseSet = new Set(toPulse);
              toPulse.forEach(id => this.pulsedNodes.add(id));
              update.filter(d => pulseSet.has(d.id))
                .select('circle')
                .transition().duration(150)
                .attr('r', d => 24 * (d.scale ?? 1))
                .transition().duration(150)
                .attr('r', d => 20 * (d.scale ?? 1));
            }
          }

          return update;
        },
        exit => {
          exit.select('circle')
            .transition().duration(200).ease(d3.easeBackIn)
            .attr('r', 0);
          exit.select('text')
            .transition().duration(150)
            .attr('opacity', 0);
          exit.transition().duration(200).remove();
          return exit;
        }
      );

    // 4. Bloques de algoritmos
    this.algoSelection = this.layers.nodes
      .selectAll<SVGGElement, IAlgorithmNode>('g.node-algo')
      .data(algoNodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node node-algo node-entering')
            .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0}) scale(0)`)
            .attr('opacity', 0);
          g.transition().duration(250).ease(d3.easeBackOut)
            .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0}) scale(1)`)
            .attr('opacity', 1)
            .on('end', function() { (this as Element).classList.remove('node-entering'); });
          g.append('rect')
            .attr('x', -60).attr('y', -30)
            .attr('width', 120).attr('height', 60)
            .attr('rx', 8).attr('ry', 8)
            .attr('fill', d => this.getAlgoColor(d));
          g.append('text')
            .attr('class', 'algo-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '-1em')
            .attr('fill', '#000')
            .attr('font-size', '11px')
            .text(d => d.label);
          const btns = g.append('g').attr('class', 'algo-buttons').attr('transform', 'translate(0, 4)');
          btns.append('image').attr('class', 'algo-btn btn-back').attr('x', -47).attr('y', -8).attr('width', 16).attr('height', 16).attr('href', new URL('../../../assets/icons/back.png', import.meta.url).href);
          btns.append('image').attr('class', 'algo-btn btn-play').attr('x', -22).attr('y', -8).attr('width', 16).attr('height', 16).attr('href', new URL('../../../assets/icons/play.png', import.meta.url).href);
          btns.append('image').attr('class', 'algo-btn btn-fwd').attr('x', 3).attr('y', -8).attr('width', 16).attr('height', 16).attr('href', new URL('../../../assets/icons/forward.png', import.meta.url).href);
          btns.append('image').attr('class', 'algo-btn btn-reset').attr('x', 28).attr('y', -8).attr('width', 16).attr('height', 16).attr('href', new URL('../../../assets/icons/reset.png', import.meta.url).href);
          g.append('text')
            .attr('class', 'algo-step')
            .attr('text-anchor', 'middle')
            .attr('dy', '2.2em')
            .attr('fill', '#aaa')
            .attr('font-size', '9px')
            .text(d => this.getStepLabel(d));
          return g;
        },
        update => {
          update.select('.algo-label').text(d => d.label);
          update.select('rect').attr('fill', d => this.getAlgoColor(d));
          update.select('.algo-step').text(d => this.getStepLabel(d));
          return update;
        },
        exit => {
          exit.transition().duration(200).ease(d3.easeBackIn)
            .attr('transform', d => `translate(${(d as any).x ?? 0},${(d as any).y ?? 0}) scale(0)`)
            .attr('opacity', 0)
            .remove();
          return exit;
        }
      );
  }

  animateStep(swaps: Swap[], onComplete: () => void): void {
    if (swaps.length === 0) { onComplete(); return; }

    const sim = this.physics.getSimulation();
    const nodes = sim.nodes() as CanvasNode[];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const processed = new Set<string>();
    let pending = 0;

    const originalPos = new Map<string, { x: number; y: number }>();
    for (const swap of swaps) {
      for (const id of [swap.fromNodeId, swap.toNodeId]) {
        if (!originalPos.has(id)) {
          const n = nodeMap.get(id);
          if (n) originalPos.set(id, { x: n.x ?? 0, y: n.y ?? 0 });
        }
      }
    }

    for (const swap of swaps) {
      const pairKey = [swap.fromNodeId, swap.toNodeId].sort().join('-');
      if (!processed.has(pairKey)) {
        processed.add(pairKey);
        const nodeA = nodeMap.get(swap.fromNodeId);
        const nodeB = nodeMap.get(swap.toNodeId);
        if (nodeA && nodeB) {
          const posA = originalPos.get(swap.fromNodeId)!;
          const posB = originalPos.get(swap.toNodeId)!;
          nodeA.x = posB.x; nodeA.y = posB.y; nodeA.pos = { x: posB.x, y: posB.y };
          nodeB.x = posA.x; nodeB.y = posA.y; nodeB.pos = { x: posA.x, y: posA.y };
        }
      }
    }

    processed.clear();
    for (const swap of swaps) {
      const pairKey = [swap.fromNodeId, swap.toNodeId].sort().join('-');
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const posA = originalPos.get(swap.fromNodeId)!;
      const posB = originalPos.get(swap.toNodeId)!;
      pending += 2;

      this.layers.nodes.selectAll<SVGGElement, INode>('g.node-data')
        .filter(d => d.id === swap.fromNodeId)
        .attr('transform', `translate(${posA.x},${posA.y})`)
        .transition().duration(300)
        .attr('transform', `translate(${posB.x},${posB.y})`)
        .on('end', () => { pending--; if (pending === 0) onComplete(); });

      this.layers.nodes.selectAll<SVGGElement, INode>('g.node-data')
        .filter(d => d.id === swap.toNodeId)
        .attr('transform', `translate(${posB.x},${posB.y})`)
        .transition().duration(300)
        .attr('transform', `translate(${posA.x},${posA.y})`)
        .on('end', () => { pending--; if (pending === 0) onComplete(); });
    }

    this.linkSelection?.transition().duration(300)
      .attr('x1', d => (d.source as INode).x ?? 0)
      .attr('y1', d => (d.source as INode).y ?? 0)
      .attr('x2', d => (d.target as INode).x ?? 0)
      .attr('y2', d => (d.target as INode).y ?? 0);

    if (pending === 0) onComplete();

    this.linkLabelSelection?.transition().duration(300)
      .attr('x', d => (((d.source as INode).x ?? 0) + ((d.target as INode).x ?? 0)) / 2)
      .attr('y', d => (((d.source as INode).y ?? 0) + ((d.target as INode).y ?? 0)) / 2);
  }

  private tick(): void {
    this.linkSelection
      ?.attr('x1', d => (d.source as INode).x ?? 0)
      .attr('y1', d => (d.source as INode).y ?? 0)
      .attr('x2', d => {
        if (!d.directed) return (d.target as INode).x ?? 0;
        const s = d.source as INode, t = d.target as INode;
        const dx = (t.x ?? 0) - (s.x ?? 0), dy = (t.y ?? 0) - (s.y ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const r = 20 * (t.scale ?? 1);
        return (t.x ?? 0) - (dx / dist) * r;
      })
      .attr('y2', d => {
        if (!d.directed) return (d.target as INode).y ?? 0;
        const s = d.source as INode, t = d.target as INode;
        const dx = (t.x ?? 0) - (s.x ?? 0), dy = (t.y ?? 0) - (s.y ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const r = 20 * (t.scale ?? 1);
        return (t.y ?? 0) - (dy / dist) * r;
      });

    this.linkLabelSelection
      ?.attr('x', d => (((d.source as INode).x ?? 0) + ((d.target as INode).x ?? 0)) / 2)
      ?.attr('y', d => (((d.source as INode).y ?? 0) + ((d.target as INode).y ?? 0)) / 2);

    this.nodeSelection
      ?.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

    this.algoSelection?.filter(':not(.node-entering)')
      .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
  }
}