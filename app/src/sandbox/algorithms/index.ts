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
  { id: 'bubble-sort', label: 'Bubble Sort', icon: '🫧', run: (nodes) => bubbleSort.execute(nodes) },
];
