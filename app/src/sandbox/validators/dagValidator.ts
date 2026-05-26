import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';

export function validateDAG(links: SimLink[], hasCycle: boolean): boolean {
  if (links.length === 0) return false;
  return links.every(l => l.directed) && !hasCycle;
}
