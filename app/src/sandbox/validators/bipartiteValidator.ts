import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export function validateBipartite(nodes: INode[], links: SimLink[]): boolean {
  if (nodes.length < 2 || links.length === 0) return false;

  const adj = new Map<string, string[]>();
  for (const node of nodes) adj.set(node.id, []);
  for (const link of links) {
    const s = (link.source as INode).id;
    const t = (link.target as INode).id;
    adj.get(s)?.push(t);
    adj.get(t)?.push(s);
  }

  const color = new Map<string, number>();

  for (const node of nodes) {
    if (color.has(node.id)) continue;
    const queue = [node.id];
    color.set(node.id, 0);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const c = color.get(curr)!;
      for (const neighbor of adj.get(curr) ?? []) {
        if (!color.has(neighbor)) {
          color.set(neighbor, 1 - c);
          queue.push(neighbor);
        } else if (color.get(neighbor) === c) {
          return false;
        }
      }
    }
  }
  return true;
}
