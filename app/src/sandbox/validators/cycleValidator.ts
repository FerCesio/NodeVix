import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export function validateCyclic(nodes: INode[], links: SimLink[]): boolean {
  if (nodes.length === 0 || links.length === 0) return false;

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const node of nodes) adj.set(node.id, []);
  for (const link of links) {
    const srcId = (link.source as INode).id;
    const tgtId = (link.target as INode).id;
    adj.get(srcId)?.push(tgtId);
    if (!link.directed) adj.get(tgtId)?.push(srcId);
  }

  // DFS cycle detection
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const node of nodes) color.set(node.id, WHITE);

  for (const node of nodes) {
    if (color.get(node.id) === WHITE) {
      if (dfs(node.id, null)) return true;
    }
  }
  return false;

  function dfs(id: string, parent: string | null): boolean {
    color.set(id, GRAY);
    for (const neighbor of adj.get(id) ?? []) {
      const c = color.get(neighbor)!;
      if (c === GRAY) {
        // For undirected graphs, skip the parent edge
        const allDirected = links.every(l => l.directed);
        if (!allDirected && neighbor === parent) continue;
        return true;
      }
      if (c === WHITE && dfs(neighbor, id)) return true;
    }
    color.set(id, BLACK);
    return false;
  }
}
