import type { Algorithm, Node } from '../interfaces';

export class BubbleSort implements Algorithm {
  execute(nodes: Node[]): void {
    const n = nodes.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (nodes[j].value > nodes[j + 1].value) {
          // Lógica de intercambio de valores entre nodos
          const temp = nodes[j].value;
          nodes[j].value = nodes[j + 1].value;
          nodes[j + 1].value = temp;
        }
      }
    }
  }
}