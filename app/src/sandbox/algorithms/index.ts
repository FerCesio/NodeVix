import type { INode } from '../interfaces';
import type { StructureFlag } from '../../types/structure';
import { BubbleSort } from './BubbleSort';
import { Inorder } from './Inorder';
import { BogoSort } from './BogoSort'; 
import { MergeSort } from './MergeSort';
import { Dijkstra } from './Dijkstra';

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
const dijkstra = new Dijkstra();

import bubbleSortIcon from '../../assets/icons/bubble-sort.png';
import inorderIcon from '../../assets/icons/inorder.png';
import bogoSortIcon from '../../assets/icons/bogo-sort.png';
import mergeSortIcon from '../../assets/icons/merge-sort.png';
import dijkstraIcon from '../../assets/icons/dijkstra.png';

export const AVAILABLE_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'bubble-sort', label: 'Bubble Sort', icon: bubbleSortIcon,
    requiredFlags: ['LINKED_LIST'],
    run: (nodes) => {
      if (nodes.length === 0) return;
      const snapshots = bubbleSort.init(nodes[0]);
      const last = snapshots[snapshots.length - 1];
      if (last) nodes.forEach(n => { if (n.id in last.values) n.value = last.values[n.id]; });
    }
  },
  {
    id: 'inorder', label: 'Inorder', icon: inorderIcon,
    requiredFlags: ['BINARY_TREE'],
    run: (nodes) => {
      if (nodes.length === 0) return;
      inorder.init(nodes[0]);
    }
  },
  {
    id: 'bogo-sort', label: 'Bogo Sort', icon: bogoSortIcon,
    requiredFlags: ['LINKED_LIST'],
    run: (nodes) => {
      if (nodes.length === 0) return;
      const snapshots = bogoSort.init(nodes[0]);
      const last = snapshots[snapshots.length - 1];
      if (last) nodes.forEach(n => { if (n.id in last.values) n.value = last.values[n.id]; });
    }
  },
  {
    id: 'merge-sort', 
    label: 'Merge Sort', 
    icon: mergeSortIcon,
    requiredFlags: ['LINKED_LIST'],
    run: (nodes) => {
      if (nodes.length === 0) return;
      const snapshots = mergeSort.init(nodes[0]);
      const last = snapshots[snapshots.length - 1];
      if (last) nodes.forEach(n => { if (n.id in last.values) n.value = last.values[n.id]; });
    }
  },
  {
    id: 'dijkstra', 
    label: 'Dijkstra', 
    icon: dijkstraIcon,
    requiredFlags: [], // Funciona sobre grafos libres, no exige lista ni árbol
    run: (nodes) => {
      if (nodes.length === 0) return;
      const snapshots = dijkstra.init(nodes[0]);
      const last = snapshots[snapshots.length - 1];
      // Actualiza los nodos visualmente a sus distancias finales
      if (last) nodes.forEach(n => { if (n.id in last.values) n.value = last.values[n.id]; });
    }
  }
];