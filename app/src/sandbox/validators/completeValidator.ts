import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export function validateComplete(nodes: INode[], links: SimLink[]): boolean {
  const n = nodes.length;
  if (n < 2) return false;
  if (links.length !== (n * (n - 1)) / 2) return false;

  const degree = new Map<string, number>();
  for (const node of nodes) degree.set(node.id, 0);
  for (const link of links) {
    const s = (link.source as INode).id;
    const t = (link.target as INode).id;
    degree.set(s, (degree.get(s) ?? 0) + 1);
    degree.set(t, (degree.get(t) ?? 0) + 1);
  }

  for (const d of degree.values()) {
    if (d !== n - 1) return false;
  }
  return true;
}
