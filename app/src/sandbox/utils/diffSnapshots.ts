import type { Snapshot } from '../interfaces';

export interface Swap {
  fromNodeId: string;
  toNodeId: string;
  value: number;
}

export function diffSnapshots(prev: Snapshot, next: Snapshot): Swap[] {
  const swaps: Swap[] = [];
  const matched = new Set<string>();

  for (const [id, newVal] of Object.entries(next.values)) {
    if (prev.values[id] === newVal) continue;
    // Find where this value came from
    const fromId = Object.keys(prev.values).find(
      k => prev.values[k] === newVal && !matched.has(k) && k !== id
    );
    if (fromId) {
      matched.add(fromId);
      swaps.push({ fromNodeId: fromId, toNodeId: id, value: newVal });
    }
  }
  return swaps;
}
