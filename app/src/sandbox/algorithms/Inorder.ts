import type { Algorithm, INode, Snapshot } from '../interfaces';

export class Inorder implements Algorithm {
  init(nodes: INode[]): Snapshot[] {
    if (nodes.length === 0) return [];

    // Find root: node with no incoming edges
    const hasIncoming = new Set<string>();
    for (const node of nodes) {
      for (const edge of node.edges) {
        if (edge.directed) hasIncoming.add(edge.end.id);
      }
    }
    const root = nodes.find(n => !hasIncoming.has(n.id)) ?? nodes[0];

    // Build children map using X position to determine left/right
    const childrenMap = new Map<string, { left?: INode; right?: INode }>();
    for (const node of nodes) {
      const children = node.edges.filter(e => e.directed).map(e => e.end);
      const left = children.filter(c => (c.x ?? 0) < (node.x ?? 0)).sort((a, b) => (a.x ?? 0) - (b.x ?? 0))[0];
      const right = children.filter(c => (c.x ?? 0) >= (node.x ?? 0)).sort((a, b) => (a.x ?? 0) - (b.x ?? 0))[0];
      childrenMap.set(node.id, { left, right });
    }

    // Inorder traversal
    const order: INode[] = [];
    const visit = (node: INode) => {
      const ch = childrenMap.get(node.id);
      if (ch?.left) visit(ch.left);
      order.push(node);
      if (ch?.right) visit(ch.right);
    };
    visit(root);

    // Generate snapshots: assign sorted values to inorder positions one by one
    const sortedValues = order.map(n => n.value).sort((a, b) => a - b);
    const ids = nodes.map(n => n.id);
    const current = Object.fromEntries(nodes.map(n => [n.id, n.value]));
    const snapshots: Snapshot[] = [{ values: { ...current } }];

    for (let i = 0; i < order.length; i++) {
      const targetId = order[i].id;
      const targetVal = sortedValues[i];
      if (current[targetId] !== targetVal) {
        // Find node that currently holds targetVal and swap
        const holderId = Object.keys(current).find(k => current[k] === targetVal)!;
        const tmp = current[targetId];
        current[targetId] = targetVal;
        current[holderId] = tmp;
        snapshots.push({ values: { ...current } });
      }
    }
    return snapshots;
  }
}
