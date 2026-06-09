import type { Algorithm, INode, Snapshot } from '../interfaces';

export class BubbleSort implements Algorithm {
  init(nodes: INode[]): Snapshot[] {
    const values = nodes.map(n => n.value);
    const ids = nodes.map(n => n.id);
    const snapshots: Snapshot[] = [{ values: Object.fromEntries(ids.map((id, i) => [id, values[i]])) }];

    const n = values.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (values[j] > values[j + 1]) {
          [values[j], values[j + 1]] = [values[j + 1], values[j]];
          snapshots.push({ values: Object.fromEntries(ids.map((id, k) => [id, values[k]])) });
        }
      }
    }
    return snapshots;
  }
}