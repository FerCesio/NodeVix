import type { INode, IAlgorithmNode, Snapshot, Algorithm } from './interfaces';

export class AlgorithmExecutor {
  private algoNode: IAlgorithmNode;
  private targetNodes: INode[] = [];
  private algorithm: Algorithm;

  constructor(algoNode: IAlgorithmNode, algorithm: Algorithm) {
    this.algoNode = algoNode;
    this.algorithm = algorithm;
  }

  init(nodes: INode[]): void {
    this.targetNodes = nodes;
    const snapshots = this.algorithm.init(nodes);
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
  }
}
