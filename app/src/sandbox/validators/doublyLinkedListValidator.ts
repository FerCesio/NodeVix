import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export function validateDoublyLinkedList(nodes: INode[], links: SimLink[]): boolean {
  if (nodes.length === 0) return false;
  if (!links.every(l => !l.directed)) return false;
  if (links.length !== nodes.length - 1) return false;

  // Each node must have degree <= 2 (linear chain)
  const degree = new Map<string, number>();
  for (const node of nodes) degree.set(node.id, 0);
  for (const link of links) {
    const s = (link.source as INode).id;
    const t = (link.target as INode).id;
    degree.set(s, (degree.get(s) ?? 0) + 1);
    degree.set(t, (degree.get(t) ?? 0) + 1);
  }

  for (const d of degree.values()) {
    if (d > 2) return false;
  }
  return true;
}
