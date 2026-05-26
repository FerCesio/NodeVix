import * as d3 from 'd3';
import type { INode } from '../../../sandbox/interfaces';
import type { PhysicsEngine, SimLink } from './PhysicsEngine';

type Layers = {
  links: d3.Selection<SVGGElement, unknown, null, undefined>;
  nodes: d3.Selection<SVGGElement, unknown, null, undefined>;
};

export class CanvasRenderer {
  private layers: Layers;
  private physics: PhysicsEngine;
  private nodeSelection: d3.Selection<SVGGElement, INode, SVGGElement, unknown> | null = null;
  private linkSelection: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown> | null = null;
  private selectedNodeId: string | null = null;

  constructor(layers: Layers, physics: PhysicsEngine) {
    this.layers = layers;
    this.physics = physics;
    this.physics.onTick(() => this.tick());
  }

  highlight(nodeId: string | null): void {
    console.log('[CanvasRenderer] highlight id:', nodeId);
    this.selectedNodeId = nodeId;
    
    this.layers.nodes.selectAll('.node circle')
      .style('stroke', (d: any) => d.id === this.selectedNodeId ? '#4A90E2' : 'none')
      .style('stroke-width', (d: any) => d.id === this.selectedNodeId ? '4px' : '0px');
  }

  update(): void {
    const sim = this.physics.getSimulation();
    const nodes = sim.nodes();
    const links = (sim.force('link') as d3.ForceLink<INode, SimLink>).links() as SimLink[];

    this.linkSelection = this.layers.links
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', '#555')
      .attr('stroke-width', 2);

    this.nodeSelection = this.layers.nodes
      .selectAll<SVGGElement, INode>('g.node')
      .data(nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node');
          
          g.append('circle')
            .attr('r', d => 20 * (d.scale ?? 1))
            // ACÁ: Leemos el color desde el nodo (d.color), si no tiene, usa el verde por defecto
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
            // ACÁ: Refrescamos el color cuando se actualiza el canvas desde el panel
            .attr('fill', d => d.color ?? '#2ecc71')
            .style('stroke', d => d.id === this.selectedNodeId ? '#4A90E2' : 'none')
            .style('stroke-width', d => d.id === this.selectedNodeId ? '4px' : '0px');

          update.select('text')
            .text(d => d.value);
            
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
  }
}