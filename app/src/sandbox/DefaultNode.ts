import type { INode, Edge } from './interfaces';

export class DefaultNode implements INode {
  kind: 'data' = 'data';
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  pos: { x: number; y: number };
  scale: number;
  value: number;
  edges: Edge[];

  color?: string;
  fx?: number | null;
  fy?: number | null;

  constructor(id: string, value: number, x: number = 0, y: number = 0) {
    this.id = id;
    this.value = value;
    this.x = x;
    this.y = y;
    this.pos = { x, y };
    this.scale = 1;
    this.edges = [];
  }

  addEdge(target: INode, weight: number = 1, directed: boolean = false): void {
    this.edges.push({ end: target, weight, directed });
  }
}