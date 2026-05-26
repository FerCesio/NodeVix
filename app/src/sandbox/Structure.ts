import type { INode } from './interfaces';
import type { SimLink } from '../components/sandbox/modules/PhysicsEngine';
import type { StructureFlag } from '../types/structure';

export class Structure {
  id: string;
  nodes: INode[];
  links: SimLink[];
  flags: Set<StructureFlag>;

  constructor(id: string) {
    this.id = id;
    this.nodes = [];
    this.links = [];
    this.flags = new Set(['GRAPH']);
  }

  addNode(node: INode): void {
    this.nodes.push(node);
  }

  removeNode(nodeId: string): void {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.links = this.links.filter(
      l => (l.source as INode).id !== nodeId && (l.target as INode).id !== nodeId
    );
  }

  addEdge(link: SimLink): void {
    this.links.push(link);
  }

  removeEdge(sourceId: string, targetId: string): void {
    this.links = this.links.filter(
      l => !((l.source as INode).id === sourceId && (l.target as INode).id === targetId)
    );
  }
}
