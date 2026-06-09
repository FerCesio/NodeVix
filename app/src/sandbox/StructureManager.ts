import type { INode } from './interfaces';
import type { SimLink } from '../components/sandbox/modules/PhysicsEngine';
import type { StructureFlag } from '../types/structure';
import { Structure } from './Structure';
import { findConnectedComponents } from './utils/connectedComponents';

export interface StructureInfo {
  id: string;
  flags: StructureFlag[];
  nodeIds: string[];
}

export class StructureManager {
  structures: Map<string, Structure> = new Map();
  private onChange?: (infos: StructureInfo[]) => void;

  constructor(onChange?: (infos: StructureInfo[]) => void) {
    this.onChange = onChange;
  }

  sync(nodes: INode[], links: SimLink[]): void {
    const dataNodes = nodes.filter(n => (n as any).kind !== 'algorithm');
    const dataLinks = links.filter(l => l.type !== 'algorithm');
    const components = findConnectedComponents(dataNodes, dataLinks);
    const newStructures = new Map<string, Structure>();

    for (const comp of components) {
      // Try to find existing structure that shares nodes with this component
      const key = this.findExistingKey(comp.nodes);
      const structure = key ? this.structures.get(key)! : new Structure(crypto.randomUUID());
      structure.nodes = comp.nodes;
      structure.links = comp.links;
      structure.recalculate();
      newStructures.set(structure.id, structure);
    }

    this.structures = newStructures;
    this.notify();
  }

  getStructureForNode(nodeId: string): Structure | null {
    for (const structure of this.structures.values()) {
      if (structure.nodes.some(n => n.id === nodeId)) return structure;
    }
    return null;
  }

  private findExistingKey(nodes: INode[]): string | null {
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const [id, structure] of this.structures) {
      if (structure.nodes.some(n => nodeIds.has(n.id))) return id;
    }
    return null;
  }

  private notify(): void {
    const infos: StructureInfo[] = [...this.structures.values()].map(s => ({
      id: s.id,
      flags: [...s.flags],
      nodeIds: s.nodes.map(n => n.id),
    }));
    this.onChange?.(infos);
  }
}
