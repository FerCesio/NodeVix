import type { INode } from '../interfaces';
import { BubbleSort } from './BubbleSort';

export interface AlgorithmConfig {
  id: string;
  label: string;
  icon: string;
  run: (nodes: INode[]) => void;
}

const bubbleSort = new BubbleSort();

export const AVAILABLE_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'bubble-sort', label: 'Bubble Sort', icon: '🫧',
    run: (nodes) => {
      const snapshots = bubbleSort.init(nodes);
      const last = snapshots[snapshots.length - 1];
      if (last) nodes.forEach(n => { if (n.id in last.values) n.value = last.values[n.id]; });
    }
  },
];
