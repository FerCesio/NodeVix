import type { Node, Edge } from './interfaces';

export class DefaultNode implements Node {
  id: string;
  pos: { x: number; y: number };
  scale: number;
  value: number;
  edges: Edge[];

  constructor(id: string, value: number, x: number = 0, y: number = 0) {
    this.id = id;
    this.value = value;
    this.pos = { x, y };
    this.scale = 1;
    this.edges = [];
  }

  addEdge(target: Node, weight: number = 1): void {
    this.edges.push({ end: target, weight });
  }
}