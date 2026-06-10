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

  setHighlights(highlights: Snapshot['highlights']): void {
    this.currentHighlights = highlights;
    this.update();
  }

  private getNodeColor(d: INode): string {
    const h = this.currentHighlights;
    if (h?.swapping && h.swapping.includes(d.id)) return '#f1c40f';
    if (h?.comparing && h.comparing.includes(d.id)) return '#e67e22';
    if (h?.sorted && h.sorted.includes(d.id)) return '#27ae60';
    return d.color ?? '#2ecc71';
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

    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 28)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
      .attr('fill', '#e74c3c');
  }

  update(): void {
    const sim = this.physics.getSimulation();
    const allNodes = sim.nodes() as CanvasNode[];
    const dataNodes = allNodes.filter((n): n is INode => n.kind === 'data');
    const algoNodes = allNodes.filter((n): n is IAlgorithmNode => n.kind === 'algorithm');
    const links = (sim.force('link') as d3.ForceLink<INode, SimLink>).links() as SimLink[];

    this.linkSelection = this.layers.links
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.type === 'algorithm' ? '#3498db' : d.directed ? '#e74c3c' : '#555')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.type === 'algorithm' ? '6 4' : null)
      .attr('marker-end', d => d.type === 'algorithm' ? null : d.directed ? 'url(#arrowhead)' : null);

    this.nodeSelection = this.layers.nodes
      .selectAll<SVGGElement, INode>('g.node-data')
      .data(dataNodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node node-data');
          g.append('circle')
            .attr('r', d => 20 * (d.scale ?? 1))
            .attr('fill', d => this.getNodeColor(d))
            .style('stroke', d => d.id === this.selectedNodeId ? '#4A90E2' : 'none')
            .style('stroke-width', d => d.id === this.selectedNodeId ? '4px' : '0px');
          g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', '#fff')
            .attr('font-size', '12px')
            .text(d => d.value);
          return g;
        },
        update => {
          update.select('circle')
            .attr('r', d => 20 * (d.scale ?? 1))
            .attr('fill', d => this.getNodeColor(d))
            .style('stroke', d => d.id === this.selectedNodeId ? '#4A90E2' : 'none')
            .style('stroke-width', d => d.id === this.selectedNodeId ? '4px' : '0px');
          update.select('text').text(d => d.value);
          return update;
        }
      );

    this.algoSelection = this.layers.nodes
      .selectAll<SVGGElement, IAlgorithmNode>('g.node-algo')
      .data(algoNodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node node-algo');
          g.append('rect')
            .attr('x', -60).attr('y', -30)
            .attr('width', 120).attr('height', 60)
            .attr('rx', 8).attr('ry', 8)
            .attr('fill', d => this.getAlgoColor(d));
          g.append('text')
            .attr('class', 'algo-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '-1em')
            .attr('fill', '#fff')
            .attr('font-size', '11px')
            .text(d => d.label);
          const btns = g.append('g').attr('class', 'algo-buttons').attr('transform', 'translate(0, 4)');
          btns.append('text').attr('class', 'algo-btn btn-back').attr('x', -35).attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '14px').text('⏪');
          btns.append('text').attr('class', 'algo-btn btn-play').attr('x', -10).attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '14px').text('▶️');
          btns.append('text').attr('class', 'algo-btn btn-fwd').attr('x', 15).attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '14px').text('⏩');
          btns.append('text').attr('class', 'algo-btn btn-reset').attr('x', 40).attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '14px').text('🔄');
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

    // Capture original positions before mutation
    const originalPos = new Map<string, { x: number; y: number }>();
    for (const swap of swaps) {
      for (const id of [swap.fromNodeId, swap.toNodeId]) {
        if (!originalPos.has(id)) {
          const n = nodeMap.get(id);
          if (n) originalPos.set(id, { x: n.x ?? 0, y: n.y ?? 0 });
        }
      }
    }

    // Mutate node positions immediately so links (tick) follow smoothly
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

    // Visually animate the <g> elements from old pos to new pos
    processed.clear();
    for (const swap of swaps) {
      const pairKey = [swap.fromNodeId, swap.toNodeId].sort().join('-');
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const posA = originalPos.get(swap.fromNodeId)!;
      const posB = originalPos.get(swap.toNodeId)!;
      pending += 2;

      // Node A: starts at posA visually, transitions to posB
      this.layers.nodes.selectAll<SVGGElement, INode>('g.node-data')
        .filter(d => d.id === swap.fromNodeId)
        .attr('transform', `translate(${posA.x},${posA.y})`)
        .transition().duration(300)
        .attr('transform', `translate(${posB.x},${posB.y})`)
        .on('end', () => { pending--; if (pending === 0) onComplete(); });

      // Node B: starts at posB visually, transitions to posA
      this.layers.nodes.selectAll<SVGGElement, INode>('g.node-data')
        .filter(d => d.id === swap.toNodeId)
        .attr('transform', `translate(${posB.x},${posB.y})`)
        .transition().duration(300)
        .attr('transform', `translate(${posA.x},${posA.y})`)
        .on('end', () => { pending--; if (pending === 0) onComplete(); });
    }

    // Also transition links smoothly
    this.linkSelection?.transition().duration(300)
      .attr('x1', d => (d.source as INode).x ?? 0)
      .attr('y1', d => (d.source as INode).y ?? 0)
      .attr('x2', d => (d.target as INode).x ?? 0)
      .attr('y2', d => (d.target as INode).y ?? 0);

    if (pending === 0) onComplete();
  }

  private tick(): void {
    this.linkSelection
      ?.attr('x1', d => (d.source as INode).x ?? 0)
      .attr('y1', d => (d.source as INode).y ?? 0)
      .attr('x2', d => (d.target as INode).x ?? 0)
      .attr('y2', d => (d.target as INode).y ?? 0);

    this.nodeSelection
      ?.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

    this.algoSelection
      ?.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
  }
}
