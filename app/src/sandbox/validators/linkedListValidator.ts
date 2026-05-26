import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export function validateLinkedList(nodes: INode[], links: SimLink[]): boolean {
  if (nodes.length === 0 || links.length !== nodes.length - 1) return false;
  if (!links.every(l => l.directed)) return false;

  const inDeg = new Map<string, number>();
  const outDeg = new Map<string, number>();
  for (const node of nodes) { inDeg.set(node.id, 0); outDeg.set(node.id, 0); }

  for (const link of links) {
    const s = (link.source as INode).id;
    const t = (link.target as INode).id;
    outDeg.set(s, (outDeg.get(s) ?? 0) + 1);
    inDeg.set(t, (inDeg.get(t) ?? 0) + 1);
  }

  for (const node of nodes) {
    if ((inDeg.get(node.id) ?? 0) > 1) return false;
    if ((outDeg.get(node.id) ?? 0) > 1) return false;
  }
  return true;
}
