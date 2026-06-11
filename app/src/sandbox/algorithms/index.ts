import type { INode } from '../interfaces';
import type { StructureFlag } from '../../types/structure';
import { BubbleSort } from './BubbleSort';
import { Inorder } from './Inorder';
import { BogoSort } from './BogoSort'; 
import { MergeSort } from './MergeSort';

export interface AlgorithmConfig {
  id: string;
  label: string;
  icon: string;
  requiredFlags: StructureFlag[];
  run: (nodes: INode[]) => void;
}

const bubbleSort = new BubbleSort();
const inorder = new Inorder();
const bogoSort = new BogoSort(); 
const mergeSort = new MergeSort();

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
  {
    id: 'bogo-sort', label: 'Bogo Sort', icon: '🎲', // <-- Agregado al catálogo
    requiredFlags: ['LINKED_LIST'],
    run: (nodes) => {
      if (nodes.length === 0) return;
      const snapshots = bogoSort.init(nodes[0]);
      const last = snapshots[snapshots.length - 1];
      // Aplicamos el estado final (ya sea que se ordenó por milagro o cortó por el límite)
      if (last) nodes.forEach(n => { if (n.id in last.values) n.value = last.values[n.id]; });
    }
  },
  {
    id: 'merge-sort', 
    label: 'Merge Sort', 
    icon: '✂️', // Unas tijeras porque "divide y vencerás"
    requiredFlags: ['LINKED_LIST'],
    run: (nodes) => {
      if (nodes.length === 0) return;
      const snapshots = mergeSort.init(nodes[0]);
      const last = snapshots[snapshots.length - 1];
      if (last) nodes.forEach(n => { if (n.id in last.values) n.value = last.values[n.id]; });
    }
  },
];