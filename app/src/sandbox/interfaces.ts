import * as d3 from 'd3';

export interface Entity {
  id: string;
  pos: { x: number; y: number };
  scale: number;
}

export interface Edge {
  end: INode;
  weight: number;
  directed: boolean;
}

export interface INode extends Entity, d3.SimulationNodeDatum {
  kind: 'data';
  value: number;
  edges: Edge[];
  color?: string;
}

export interface Algorithm {
  init(entryNode: INode): Snapshot[];
}

export type Snapshot = {
  values: Record<string, number>;
  edges?: { source: string; target: string }[];
  highlights?: {
    comparing?: string[];
    sorted?: string[];
    swapping?: [string, string];
  };
};

export type AlgorithmStatus = 'idle' | 'running' | 'paused' | 'done';

export interface AlgorithmState {
  snapshots: Snapshot[];
  currentStep: number;
  status: AlgorithmStatus;
}

export interface IAlgorithmNode extends Entity, d3.SimulationNodeDatum {
  kind: 'algorithm';
  algorithmId: string;
  label: string;
  connectedTo: string | null;
  state: AlgorithmState;
}

export type CanvasNode = INode | IAlgorithmNode;