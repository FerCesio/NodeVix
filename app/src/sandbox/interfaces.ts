import * as d3 from 'd3';

export interface Entity {
  id: string;
  pos: { x: number; y: number };
  scale: number;
}

export interface Edge {
  end: INode;
  weight: number;
}

export interface INode extends Entity, d3.SimulationNodeDatum {
  value: number;
  edges: Edge[];
  color?: string;
}

export interface Algorithm {
  execute(nodes: Node[]): void;
}