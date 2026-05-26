import type { INode } from '../interfaces';
import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';
import { DefaultNode } from '../DefaultNode';

export interface PresetStructure {
  id: string;
  label: string;
  icon: string;
  generate: (cx: number, cy: number) => { nodes: INode[]; links: SimLink[] };
}

function linkedList(cx: number, cy: number): { nodes: INode[]; links: SimLink[] } {
  const n = 5;
  const nodes: INode[] = [];
  const links: SimLink[] = [];
  for (let i = 0; i < n; i++) {
    nodes.push(new DefaultNode(crypto.randomUUID(), i + 1, cx - 200 + i * 100, cy));
  }
  for (let i = 0; i < n - 1; i++) {
    links.push({ source: nodes[i], target: nodes[i + 1], value: 1, directed: true });
    nodes[i].edges.push({ end: nodes[i + 1], weight: 1, directed: true });
  }
  return { nodes, links };
}

function binaryTree(cx: number, cy: number): { nodes: INode[]; links: SimLink[] } {
  const nodes: INode[] = [];
  const links: SimLink[] = [];
  const values = [4, 2, 6, 1, 3, 5, 7];
  const positions = [
    [0, -90], [-120, 0], [120, 0],
    [-180, 90], [-60, 90], [60, 90], [180, 90]
  ];
  for (let i = 0; i < 7; i++) {
    nodes.push(new DefaultNode(crypto.randomUUID(), values[i], cx + positions[i][0], cy + positions[i][1]));
  }
  const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
  for (const [p, c] of edges) {
    links.push({ source: nodes[p], target: nodes[c], value: 1, directed: false });
    nodes[p].edges.push({ end: nodes[c], weight: 1, directed: false });
    nodes[c].edges.push({ end: nodes[p], weight: 1, directed: false });
  }
  return { nodes, links };
}

function completeGraph(cx: number, cy: number): { nodes: INode[]; links: SimLink[] } {
  const n = 5;
  const nodes: INode[] = [];
  const links: SimLink[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    nodes.push(new DefaultNode(crypto.randomUUID(), i + 1, cx + 100 * Math.cos(angle), cy + 100 * Math.sin(angle)));
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      links.push({ source: nodes[i], target: nodes[j], value: 1, directed: false });
      nodes[i].edges.push({ end: nodes[j], weight: 1, directed: false });
      nodes[j].edges.push({ end: nodes[i], weight: 1, directed: false });
    }
  }
  return { nodes, links };
}

function cycle(cx: number, cy: number): { nodes: INode[]; links: SimLink[] } {
  const n = 6;
  const nodes: INode[] = [];
  const links: SimLink[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    nodes.push(new DefaultNode(crypto.randomUUID(), i + 1, cx + 100 * Math.cos(angle), cy + 100 * Math.sin(angle)));
  }
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    links.push({ source: nodes[i], target: nodes[next], value: 1, directed: true });
    nodes[i].edges.push({ end: nodes[next], weight: 1, directed: true });
  }
  return { nodes, links };
}

export const PRESETS: PresetStructure[] = [
  { id: 'linked-list', label: 'Linked List', icon: '→', generate: linkedList },
  { id: 'binary-tree', label: 'Binary Tree', icon: '🌳', generate: binaryTree },
  { id: 'complete', label: 'Complete K5', icon: '⬡', generate: completeGraph },
  { id: 'cycle', label: 'Cycle', icon: '🔄', generate: cycle },
];
