import type { Algorithm, INode, Snapshot } from '../interfaces';

export class Inorder implements Algorithm {
  init(entryNode: INode): Snapshot[] {
    // Collect all nodes reachable from root
    const allNodes = this.collectNodes(entryNode);
    const values = Object.fromEntries(allNodes.map(n => [n.id, n.value]));

    // Inorder traversal from root
    const order: INode[] = [];
    this.visit(entryNode, order);

    // Generate snapshots: one per visit
    const visited: string[] = [];
    const snapshots: Snapshot[] = [{ values: { ...values } }];

    for (const node of order) {
      visited.push(node.id);
      snapshots.push({
        values: { ...values },
        highlights: { comparing: [node.id], sorted: [...visited] },
      });
    }

    snapshots.push({ values: { ...values }, highlights: { sorted: [...visited] } });
    return snapshots;
  }

  private visit(node: INode, order: INode[]): void {
    const children = node.edges.filter(e => e.directed).map(e => e.end as INode);
    // Left child: X position < parent, Right child: X position >= parent
    const left = children.filter(c => (c.x ?? 0) < (node.x ?? 0));
    const right = children.filter(c => (c.x ?? 0) >= (node.x ?? 0));

    // Visit left subtree(s)
    for (const l of left) this.visit(l, order);
    // Visit current
    order.push(node);
    // Visit right subtree(s)
    for (const r of right) this.visit(r, order);
  }

  private collectNodes(root: INode): INode[] {
    const nodes: INode[] = [];
    const visited = new Set<string>();
    const queue = [root];
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      nodes.push(node);
      for (const edge of node.edges) {
        if (edge.directed) queue.push(edge.end as INode);
      }
    }
    return nodes;
  }
}
