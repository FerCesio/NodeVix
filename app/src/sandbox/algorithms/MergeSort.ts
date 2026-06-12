import type { Algorithm, INode, Snapshot } from '../interfaces';

export class MergeSort implements Algorithm {
  init(entryNode: INode): Snapshot[] {
    const chain = this.walkChain(entryNode);
    const n = chain.length;
    if (n <= 1) return [{ values: Object.fromEntries(chain.map(nd => [nd.id, nd.value])) }];

    // Mantenemos el estado actual del orden y los valores
    let currentOrder = chain.map(nd => nd.id);
    let currentValues = chain.map(nd => nd.value);
    const snapshots: Snapshot[] = [];

    // Función auxiliar para capturar el lienzo
    const snap = (highlights?: any): Snapshot => ({
      values: Object.fromEntries(currentOrder.map((id, i) => [id, currentValues[i]])),
      edges: currentOrder.slice(0, -1).map((id, i) => ({ source: id, target: currentOrder[i + 1] })),
      highlights
    });

    // Foto inicial
    snapshots.push(snap());

    // Lógica recursiva del Merge Sort
    const mergeSort = (start: number, end: number) => {
      if (end - start <= 1) return;
      const mid = Math.floor((start + end) / 2);

      // Dividimos
      mergeSort(start, mid);
      mergeSort(mid, end);
      
      // Vencemos (Mezclamos)
      merge(start, mid, end);
    };

    const merge = (start: number, mid: number, end: number) => {
      let leftIdx = start;
      let rightIdx = mid;
      const tempOrder = [];
      const tempValues = [];

      // Resaltamos el bloque entero que estamos a punto de fusionar
      snapshots.push(snap({
        comparing: currentOrder.slice(start, end)
      }));

      while (leftIdx < mid && rightIdx < end) {
        // Mostramos exactamente qué dos nodos estamos comparando
        snapshots.push(snap({
          swapping: [currentOrder[leftIdx], currentOrder[rightIdx]]
        }));

        if (currentValues[leftIdx] <= currentValues[rightIdx]) {
          tempOrder.push(currentOrder[leftIdx]);
          tempValues.push(currentValues[leftIdx]);
          leftIdx++;
        } else {
          tempOrder.push(currentOrder[rightIdx]);
          tempValues.push(currentValues[rightIdx]);
          rightIdx++;
        }
      }

      // Vaciamos los remanentes
      while (leftIdx < mid) {
        tempOrder.push(currentOrder[leftIdx]);
        tempValues.push(currentValues[leftIdx]);
        leftIdx++;
      }
      while (rightIdx < end) {
        tempOrder.push(currentOrder[rightIdx]);
        tempValues.push(currentValues[rightIdx]);
        rightIdx++;
      }

      // Escribimos los cambios en el arreglo principal
      for (let i = 0; i < tempOrder.length; i++) {
        currentOrder[start + i] = tempOrder[i];
        currentValues[start + i] = tempValues[i];
      }

      // Foto de cómo quedó este sub-bloque ordenado
      snapshots.push(snap({
        sorted: currentOrder.slice(start, end)
      }));
    };

    // Disparamos la recursión
    mergeSort(0, n);

    // Foto final de gloria con todo el arreglo en verde
    snapshots.push(snap({ sorted: [...currentOrder] }));
    
    return snapshots;
  }

  private walkChain(head: INode): INode[] {
    const chain: INode[] = [];
    const visited = new Set<string>();
    let current: INode | undefined = head;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      chain.push(current);
      const next = current.edges.find(e => e.directed)?.end;
      current = next as INode | undefined;
    }
    return chain;
  }
}