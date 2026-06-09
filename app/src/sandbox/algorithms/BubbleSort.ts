import type { Algorithm, INode, Snapshot } from '../interfaces';

export class BubbleSort implements Algorithm {
  init(entryNode: INode): Snapshot[] {
    // Walk the chain from head following directed edges
    const chain = this.walkChain(entryNode);
    const n = chain.length;
    if (n <= 1) return [{ values: Object.fromEntries(chain.map(nd => [nd.id, nd.value])) }];

    const order = chain.map(nd => nd.id);
    const values = chain.map(nd => nd.value);
    const sorted: string[] = [];

    const snap = (): Snapshot => ({
      values: Object.fromEntries(order.map((id, i) => [id, values[i]])),
      edges: order.slice(0, -1).map((id, i) => ({ source: id, target: order[i + 1] })),
    });

    const snapshots: Snapshot[] = [snap()];

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        snapshots.push({
          ...snap(),
          highlights: { comparing: [order[j], order[j + 1]], sorted: [...sorted] },
        });
        if (values[j] > values[j + 1]) {
          [values[j], values[j + 1]] = [values[j + 1], values[j]];
          [order[j], order[j + 1]] = [order[j + 1], order[j]];
          snapshots.push({
            ...snap(),
            highlights: { swapping: [order[j], order[j + 1]], sorted: [...sorted] },
          });
        }
      }
      sorted.push(order[n - 1 - i]);
    }
    sorted.push(order[0]);
    snapshots.push({ ...snap(), highlights: { sorted: [...sorted] } });
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
