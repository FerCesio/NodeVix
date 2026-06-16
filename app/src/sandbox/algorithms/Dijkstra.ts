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
        // Usamos Infinito real para que la matemática no se rompa
        dist[curr.id] = Infinity; 
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

      // Si no hay más nodos alcanzables (o son todos Infinity), terminamos
      if (!u || minDist === Infinity) break; 

      visited.add(u.id);
      snap([u.id]); // Foto analizando el nodo actual

      // Analizar vecinos
      for (const edge of u.edges) {
        const v = edge.end;
        if (!visited.has(v.id)) {
          // --- ESCUDO MATEMÁTICO ---
          // Obligamos a JS a sumar números reales, nada de textos
          const weight = Number(edge.weight ?? 1); 
          const alt = Number(dist[u.id]) + weight;
          
          if (alt < Number(dist[v.id])) {
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