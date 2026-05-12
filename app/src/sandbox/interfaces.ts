export interface Entity {
  id: string;
  pos: { x: number; y: number };
  scale: number;
}

export interface Edge {
  end: Node;
  weight: number;
}

export interface Node extends Entity {
  value: number;
  edges: Edge[];
}

export interface Algorithm {
  execute(nodes: Node[]): void;
}