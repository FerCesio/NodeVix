import type { INode } from '../interfaces';
import type { StructureFlag } from '../../types/structure';
import { BubbleSort } from './BubbleSort';
import { Inorder } from './Inorder';

export interface AlgorithmConfig {
  id: string;
  label: string;
  icon: string;
  requiredFlags: StructureFlag[];
  run: (nodes: INode[]) => void;
}

const bubbleSort = new BubbleSort();
const inorder = new Inorder();

export const AVAILABLE_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'bubble-sort', label: 'Bubble Sort', icon: '🫧',
    requiredFlags: ['LINKED_LIST'],
    run: (nodes) => {
      if (nodes.length === 0) return;
      const snapshots = bubbleSort.init(nodes[0]);
      const last = snapshots[snapshots.length - 1];
      if (last) nodes.forEach(n => { if (n.id in last.values) n.value = last.values[n.id]; });
    }
  },
  {
    id: 'inorder', label: 'Inorder', icon: '🌳',
    requiredFlags: ['BINARY_TREE'],
    run: (nodes) => {
      if (nodes.length === 0) return;
      inorder.init(nodes[0]);
    }
  },
];
