import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export interface Component {
  nodes: INode[];
  links: SimLink[];
}

export function findConnectedComponents(nodes: INode[], links: SimLink[]): Component[] {
  if (nodes.length === 0) return [];

  const adj = new Map<string, string[]>();
  for (const node of nodes) adj.set(node.id, []);
  for (const link of links) {
    const s = (link.source as INode).id;
    const t = (link.target as INode).id;
    adj.get(s)?.push(t);
    adj.get(t)?.push(s);
  }

  const visited = new Set<string>();
  const components: Component[] = [];

  for (const node of nodes) {
    if (visited.has(node.id)) continue;

    const compNodeIds = new Set<string>();
    const queue = [node.id];
    visited.add(node.id);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      compNodeIds.add(curr);
      for (const neighbor of adj.get(curr) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    const compNodes = nodes.filter(n => compNodeIds.has(n.id));
    const compLinks = links.filter(l =>
      compNodeIds.has((l.source as INode).id) && compNodeIds.has((l.target as INode).id)
    );
    components.push({ nodes: compNodes, links: compLinks });
  }

  return components;
}
