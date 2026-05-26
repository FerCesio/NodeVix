import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export function validateBST(nodes: INode[], links: SimLink[]): boolean {
  if (nodes.length <= 1) return nodes.length === 1;

  // Build adjacency with positional info (left/right based on x coordinate)
  const adj = new Map<string, INode[]>();
  const nodeMap = new Map<string, INode>();
  for (const node of nodes) {
    adj.set(node.id, []);
    nodeMap.set(node.id, node);
  }
  for (const link of links) {
    const s = (link.source as INode).id;
    const t = (link.target as INode).id;
    adj.get(s)?.push(nodeMap.get(t)!);
    adj.get(t)?.push(nodeMap.get(s)!);
  }

  // Find root: node with lowest y (top of canvas) or degree 1 with min y
  const root = nodes.reduce((a, b) => ((a.y ?? a.pos.y) < (b.y ?? b.pos.y) ? a : b));

  // Inorder traversal using spatial position (left child = smaller x)
  const inorder: number[] = [];
  const visited = new Set<string>();

  function traverse(node: INode): void {
    visited.add(node.id);
    const children = (adj.get(node.id) ?? []).filter(n => !visited.has(n.id));
    // Sort by x: left child first
    children.sort((a, b) => (a.x ?? a.pos.x) - (b.x ?? b.pos.x));

    if (children.length > 0) traverse(children[0]); // left
    inorder.push(node.value);
    if (children.length > 1) traverse(children[1]); // right
  }

  traverse(root);
  if (visited.size !== nodes.length) return false;

  // Check strictly increasing
  for (let i = 1; i < inorder.length; i++) {
    if (inorder[i] <= inorder[i - 1]) return false;
  }
  return true;
}
