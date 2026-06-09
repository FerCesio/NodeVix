import type { INode, IAlgorithmNode, Algorithm } from './interfaces';

export class AlgorithmExecutor {
  private algoNode: IAlgorithmNode;
  private targetNodes: INode[] = [];
  private algorithm: Algorithm;

  constructor(algoNode: IAlgorithmNode, algorithm: Algorithm) {
    this.algoNode = algoNode;
    this.algorithm = algorithm;
  }

  init(entryNode: INode): void {
    // Discover all reachable nodes from entry point
    this.targetNodes = this.collectReachable(entryNode);
    const snapshots = this.algorithm.init(entryNode);
    this.algoNode.state = { snapshots, currentStep: 0, status: 'idle' };
    this.applyStep(0);
  }

  stepForward(): boolean {
    const { state } = this.algoNode;
    if (state.currentStep >= state.snapshots.length - 1) {
      state.status = 'done';
      return false;
    }
    state.currentStep++;
    state.status = 'paused';
    this.applyStep(state.currentStep);
    return true;
  }

  stepBack(): boolean {
    const { state } = this.algoNode;
    if (state.currentStep <= 0) return false;
    state.currentStep--;
    state.status = 'paused';
    this.applyStep(state.currentStep);
    return true;
  }

  getCurrentStep(): number {
    return this.algoNode.state.currentStep;
  }

  getTotalSteps(): number {
    return this.algoNode.state.snapshots.length;
  }

  private applyStep(step: number): void {
    const snapshot = this.algoNode.state.snapshots[step];
    if (!snapshot) return;
    for (const node of this.targetNodes) {
      if (node.id in snapshot.values) {
        node.value = snapshot.values[node.id];
      }
    }
    if (snapshot.edges) {
      const nodeMap = new Map(this.targetNodes.map(n => [n.id, n]));
      for (const node of this.targetNodes) {
        node.edges = node.edges.filter(e => !e.directed);
      }
      for (const edge of snapshot.edges) {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (src && tgt) {
          src.edges.push({ end: tgt, weight: 1, directed: true });
        }
      }
    }
  }

  private collectReachable(root: INode): INode[] {
    const nodes: INode[] = [];
    const visited = new Set<string>();
    const queue = [root];
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      nodes.push(node);
      for (const edge of node.edges) {
        if (edge.directed) queue.push(edge.end as INode);
      }
    }
    return nodes;
  }
}
