import type { SimLink } from '../../components/sandbox/modules/PhysicsEngine';
import type { StructureFlag } from '../../types/structure';

export function validateDirection(links: SimLink[]): StructureFlag | null {
  if (links.length === 0) return null;
  const allDirected = links.every(l => l.directed);
  const allUndirected = links.every(l => !l.directed);
  if (allDirected) return 'DIRECTED';
  if (allUndirected) return 'UNDIRECTED';
  return null;
}
