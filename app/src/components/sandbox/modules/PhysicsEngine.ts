import * as d3 from 'd3';
import type { INode } from '../../../sandbox/interfaces';

export type SimLink = { source: INode; target: INode; value: number; directed: boolean; type?: 'algorithm' | 'algo-snapshot' };

export class PhysicsEngine {
  private simulation: d3.Simulation<INode, SimLink>;

  constructor(nodes: INode[], links: SimLink[]) {
    const MIN_DIST = 60;
    const MAX_DIST = 260;
    const LINK_STRENGTH = 0.05;

    // Calcula el radio de colisión real según el tipo de nodo
    const collisionRadius = (node: INode): number => {
      const scale = node.scale ?? 1;
      if ((node as any).kind === 'stack') return (60 * scale) / 2 + 8; // mayor semi-eje + padding
      if ((node as any).kind === 'queue') return (130 * scale) / 2 + 8;
      return 20 * scale + 6; // nodo normal
    };

    this.simulation = d3.forceSimulation<INode>(nodes)
      .force('link', d3.forceLink<INode, SimLink>(links).distance(120).strength(0))
      .force('charge', d3.forceManyBody().strength(-80).distanceMin(40).distanceMax(200))
      .force('collide', d3.forceCollide<INode>(collisionRadius).iterations(2))
      .force('rangeLink', () => {
        const currentLinks = (this.simulation.force('link') as d3.ForceLink<INode, SimLink>).links() as SimLink[];
        for (const link of currentLinks) {
          const s = link.source as INode;
          const t = link.target as INode;
          const dx = (t.x ?? 0) - (s.x ?? 0);
          const dy = (t.y ?? 0) - (s.y ?? 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          let force = 0;
          if (dist < MIN_DIST) force = (dist - MIN_DIST) * LINK_STRENGTH;
          else if (dist > MAX_DIST) force = (dist - MAX_DIST) * LINK_STRENGTH;
          else continue;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          s.vx = (s.vx ?? 0) + fx;
          s.vy = (s.vy ?? 0) + fy;
          t.vx = (t.vx ?? 0) - fx;
          t.vy = (t.vy ?? 0) - fy;
        }
      })
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
    this.simulation.on('tick.custom', callback);
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
