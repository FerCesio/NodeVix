import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export function validateBinaryTree(nodes: INode[], links: SimLink[]): boolean {
  if (nodes.length === 0) return false;

  // Build degree map (undirected view)
  const degree = new Map<string, number>();
  for (const node of nodes) degree.set(node.id, 0);
  for (const link of links) {
    const s = (link.source as INode).id;
    const t = (link.target as INode).id;
    degree.set(s, (degree.get(s) ?? 0) + 1);
    degree.set(t, (degree.get(t) ?? 0) + 1);
  }

  // In a binary tree: max degree 3 (1 parent + 2 children)
  // Root has max degree 2 (no parent)
  for (const d of degree.values()) {
    if (d > 3) return false;
  }
  return true;
}
