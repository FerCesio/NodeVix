import * as d3 from 'd3';
import type { INode } from '../../../sandbox/interfaces';

export type SimLink = { source: INode; target: INode; value: number; directed: boolean; type?: 'algorithm' };

export class PhysicsEngine {
  private simulation: d3.Simulation<INode, SimLink>;

  constructor(nodes: INode[], links: SimLink[]) {
    this.simulation = d3.forceSimulation<INode>(nodes)
      .force('link', d3.forceLink<INode, SimLink>(links).distance(120).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-80))
      .force('collide', d3.forceCollide(35))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    this.simulation.on('tick', () => {
      nodes.forEach(n => {
        n.pos.x = n.x ?? n.pos.x;
        n.pos.y = n.y ?? n.pos.y;
      });
    });
  }

  onTick(callback: () => void): void {
    const current = this.simulation.on('tick');
    this.simulation.on('tick', () => {
      if (typeof current === 'function') current();
      callback();
    });
  }

  restart(): void {
    this.simulation.alpha(0.3).restart();
  }

  stop(): void {
    this.simulation.stop();
  }

  updateNodes(nodes: INode[]): void {
    this.simulation.nodes(nodes);
    this.restart();
  }

  updateLinks(links: SimLink[]): void {
    (this.simulation.force('link') as d3.ForceLink<INode, SimLink>).links(links);
    this.restart();
  }

  getSimulation(): d3.Simulation<INode, SimLink> {
    return this.simulation;
  }
}
