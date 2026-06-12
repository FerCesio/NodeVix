import type { Algorithm, INode, Snapshot } from '../interfaces';

export class BogoSort implements Algorithm {
  init(entryNode: INode): Snapshot[] {
    const chain = this.walkChain(entryNode);
    const n = chain.length;
    if (n <= 1) return [{ values: Object.fromEntries(chain.map(nd => [nd.id, nd.value])) }];

    let order = chain.map(nd => nd.id);
    let values = chain.map(nd => nd.value);

    const snap = (): Snapshot => ({
      values: Object.fromEntries(order.map((id, i) => [id, values[i]])),
      edges: order.slice(0, -1).map((id, i) => ({ source: id, target: order[i + 1] })),
    });

    const snapshots: Snapshot[] = [snap()];

    // Función auxiliar para chequear si el arreglo actual está ordenado
    const isSorted = (): boolean => {
      for (let i = 0; i < n - 1; i++) {
        if (values[i] > values[i + 1]) return false;
      }
      return true;
    };

    // LÍMITE CRÍTICO DE SEGURIDAD PARA EL BROWSER
    const MAX_ITERATIONS = 100; 
    let iterations = 0;

    // Mientras no esté ordenado y no superemos el límite
    while (!isSorted() && iterations < MAX_ITERATIONS) {
      
      // Mezclamos TODO el arreglo en silencio
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
        [order[i], order[j]] = [order[j], order[i]];
      }

      // SACAMOS UNA SOLA FOTO DEL DESASTRE TOTAL
      snapshots.push({
        ...snap(),
        highlights: { swapping: [...order] } // Le mandamos TODOS los IDs a la vez
      });

      iterations++;
    }

    // Si tuvimos la inmensa suerte de que se ordene, lo pintamos de verde
    if (isSorted()) {
      snapshots.push({ ...snap(), highlights: { sorted: [...order] } });
    }

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