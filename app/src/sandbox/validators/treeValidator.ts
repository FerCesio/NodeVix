import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export function validateTree(nodes: INode[], links: SimLink[]): boolean {
  if (nodes.length === 0) return false;
  if (links.length !== nodes.length - 1) return false;

  // Check connectivity via BFS
  const adj = new Map<string, string[]>();
  for (const node of nodes) adj.set(node.id, []);
  for (const link of links) {
    const s = (link.source as INode).id;
    const t = (link.target as INode).id;
    adj.get(s)?.push(t);
    adj.get(t)?.push(s);
  }

  const visited = new Set<string>();
  const queue = [nodes[0].id];
  visited.add(nodes[0].id);
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const neighbor of adj.get(curr) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited.size === nodes.length;
}
