import type { Algorithm, INode, Snapshot } from '../interfaces';

export class Dijkstra implements Algorithm {
  init(entryNode: INode): Snapshot[] {
    const snapshots: Snapshot[] = [];
    const dist: Record<string, number> = {};
    const visited: Set<string> = new Set();
    const prev: Record<string, string | null> = {};
    
    // Función auxiliar para sacar fotos rápidas
    const snap = (comparing: string[] = [], activeEdges: string[] = [], sorted: string[] = []) => {
      snapshots.push({
        values: { ...dist },
        highlights: { comparing, activeEdges, sorted }
      });
    };

    // 1. Descubrir todos los nodos del grafo conectados a la raíz
    const allNodes = new Map<string, INode>();
    const queue = [entryNode];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (!allNodes.has(curr.id)) {
        allNodes.set(curr.id, curr);
        dist[curr.id] = 999; // 999 actuará como nuestro "Infinito" visual
        curr.edges.forEach(e => queue.push(e.end));
      }
    }
    
    // 2. El nodo inicial arranca con distancia 0
    dist[entryNode.id] = 0;
    snap([entryNode.id]); // Foto inicial

    // 3. Bucle principal de Dijkstra
    while (true) {
      let u: INode | null = null;
      let minDist = Infinity;
      
      // Buscar el nodo no visitado con la menor distancia
      for (const node of allNodes.values()) {
        if (!visited.has(node.id) && dist[node.id] < minDist) {
          minDist = dist[node.id];
          u = node;
        }
      }

      if (!u || minDist === 999) break; // Si no hay más nodos alcanzables, terminamos

      visited.add(u.id);
      snap([u.id]); // Foto analizando el nodo actual

      // Analizar vecinos
      for (const edge of u.edges) {
        const v = edge.end;
        if (!visited.has(v.id)) {
          // El peso por defecto es 1 si no se definió otro
          const weight = edge.weight ?? 1; 
          const alt = dist[u.id] + weight;
          
          if (alt < dist[v.id]) {
            dist[v.id] = alt;
            prev[v.id] = u.id;
            
            // Foto mostrando de dónde viene la actualización
            const currentActiveEdge = `${u.id}-${v.id}`;
            snap([u.id, v.id], [currentActiveEdge]); 
          }
        }
      }
    }

    // 4. Foto final épica: Pintamos de verde los visitados y resaltamos el árbol de caminos
    const finalEdges: string[] = [];
    for (const [nodeId, parentId] of Object.entries(prev)) {
      if (parentId) {
        finalEdges.push(`${parentId}-${nodeId}`);
      }
    }
    snap([], finalEdges, Array.from(visited));

    return snapshots;
  }
}