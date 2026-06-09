import * as d3 from 'd3';
import type { INode, IAlgorithmNode, CanvasNode } from '../../../sandbox/interfaces';
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

    // Links
    this.linkSelection = this.layers.links
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.type === 'algorithm' ? '#3498db' : d.directed ? '#e74c3c' : '#555')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.type === 'algorithm' ? '6 4' : null)
      .attr('marker-end', d => d.type === 'algorithm' ? null : d.directed ? 'url(#arrowhead)' : null);

    // Data nodes (circles)
    this.nodeSelection = this.layers.nodes
      .selectAll<SVGGElement, INode>('g.node-data')
      .data(dataNodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node node-data');
          g.append('circle')
            .attr('r', d => 20 * (d.scale ?? 1))
            .attr('fill', d => d.color ?? '#2ecc71')
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
            .attr('fill', d => d.color ?? '#2ecc71')
            .style('stroke', d => d.id === this.selectedNodeId ? '#4A90E2' : 'none')
            .style('stroke-width', d => d.id === this.selectedNodeId ? '4px' : '0px');
          update.select('text').text(d => d.value);
          return update;
        }
      );

    // Algorithm nodes (rects with buttons)
    this.algoSelection = this.layers.nodes
      .selectAll<SVGGElement, IAlgorithmNode>('g.node-algo')
      .data(algoNodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node node-algo');
          g.append('rect')
            .attr('x', -60).attr('y', -25)
            .attr('width', 120).attr('height', 50)
            .attr('rx', 8).attr('ry', 8)
            .attr('fill', '#3498db');
          g.append('text')
            .attr('class', 'algo-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.4em')
            .attr('fill', '#fff')
            .attr('font-size', '11px')
            .text(d => d.label);
          // Buttons row
          const btns = g.append('g').attr('class', 'algo-buttons').attr('transform', 'translate(0, 12)');
          btns.append('text').attr('class', 'algo-btn btn-back').attr('x', -25).attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '14px').text('⏪');
          btns.append('text').attr('class', 'algo-btn btn-play').attr('x', 0).attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '14px').text('▶️');
          btns.append('text').attr('class', 'algo-btn btn-fwd').attr('x', 25).attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '14px').text('⏩');
          return g;
        },
        update => {
          update.select('.algo-label').text(d => d.label);
          return update;
        }
      );
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

  animateSwaps(swaps: Swap[], onComplete: () => void): void {
    if (swaps.length === 0) { onComplete(); return; }

    const sim = this.physics.getSimulation();
    const nodes = sim.nodes() as CanvasNode[];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    let pending = swaps.length;

    // Hide real texts of involved nodes
    const involvedIds = new Set(swaps.flatMap(s => [s.fromNodeId, s.toNodeId]));
    this.layers.nodes.selectAll<SVGGElement, INode>('g.node-data')
      .filter(d => involvedIds.has(d.id))
      .select('text').attr('opacity', 0);

    for (const swap of swaps) {
      const from = nodeMap.get(swap.fromNodeId);
      const to = nodeMap.get(swap.toNodeId);
      if (!from || !to) { pending--; continue; }

      this.layers.nodes.append('text')
        .attr('class', 'swap-ghost')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .text(swap.value)
        .attr('x', from.x ?? 0)
        .attr('y', from.y ?? 0)
        .transition()
        .duration(300)
        .attr('x', to.x ?? 0)
        .attr('y', to.y ?? 0)
        .on('end', function () {
          d3.select(this).remove();
          pending--;
          if (pending === 0) {
            onComplete();
          }
        });
    }
  }
}