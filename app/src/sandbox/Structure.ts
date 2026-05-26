import type { INode } from './interfaces';
import type { SimLink } from '../components/sandbox/modules/PhysicsEngine';
import type { StructureFlag } from '../types/structure';
import { validateDirection } from './validators/directionValidator';
import { validateCyclic } from './validators/cycleValidator';
import { validateTree } from './validators/treeValidator';
import { validateBinaryTree } from './validators/binaryTreeValidator';
import { validateBST } from './validators/bstValidator';
import { validateLinkedList } from './validators/linkedListValidator';
import { validateDoublyLinkedList } from './validators/doublyLinkedListValidator';
import { validateDAG } from './validators/dagValidator';
import { validateComplete } from './validators/completeValidator';
import { validateBipartite } from './validators/bipartiteValidator';

type ChangeType = 'addNode' | 'removeNode' | 'addEdge' | 'removeEdge';

// Flags that each change type invalidates
const INVALIDATION_MAP: Record<ChangeType, StructureFlag[]> = {
  addNode: ['TREE', 'BINARY_TREE', 'BST', 'LINKED_LIST', 'DOUBLY_LINKED_LIST', 'COMPLETE', 'BIPARTITE'],
  removeNode: ['DIRECTED', 'UNDIRECTED', 'CYCLIC', 'DAG', 'TREE', 'BINARY_TREE', 'BST', 'LINKED_LIST', 'DOUBLY_LINKED_LIST', 'COMPLETE', 'BIPARTITE'],
  addEdge: ['DIRECTED', 'UNDIRECTED', 'CYCLIC', 'DAG', 'TREE', 'BINARY_TREE', 'BST', 'LINKED_LIST', 'DOUBLY_LINKED_LIST', 'COMPLETE', 'BIPARTITE'],
  removeEdge: ['DIRECTED', 'UNDIRECTED', 'CYCLIC', 'DAG', 'TREE', 'BINARY_TREE', 'BST', 'LINKED_LIST', 'DOUBLY_LINKED_LIST', 'COMPLETE', 'BIPARTITE'],
};

export class Structure {
  id: string;
  nodes: INode[];
  links: SimLink[];
  flags: Set<StructureFlag>;
  private dirty: Set<StructureFlag>;
  private onChange?: (flags: StructureFlag[]) => void;

  constructor(id: string, onChange?: (flags: StructureFlag[]) => void) {
    this.id = id;
    this.nodes = [];
    this.links = [];
    this.flags = new Set(['GRAPH']);
    this.dirty = new Set();
    this.onChange = onChange;
  }

  addNode(node: INode): void {
    this.nodes.push(node);
    this.invalidate('addNode');
  }

  removeNode(nodeId: string): void {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.links = this.links.filter(
      l => (l.source as INode).id !== nodeId && (l.target as INode).id !== nodeId
    );
    this.invalidate('removeNode');
  }

  addEdge(link: SimLink): void {
    this.links.push(link);
    this.invalidate('addEdge');
  }

  removeEdge(sourceId: string, targetId: string): void {
    this.links = this.links.filter(
      l => !((l.source as INode).id === sourceId && (l.target as INode).id === targetId)
    );
    this.invalidate('removeEdge');
  }

  private invalidate(change: ChangeType): void {
    for (const flag of INVALIDATION_MAP[change]) {
      this.dirty.add(flag);
      this.flags.delete(flag);
    }
    this.recalculate();
  }

  recalculate(): void {
    if (this.dirty.size === 0) return;

    const needsDirection = this.dirty.has('DIRECTED') || this.dirty.has('UNDIRECTED');
    const needsCycle = this.dirty.has('CYCLIC');
    const needsDAG = this.dirty.has('DAG');
    const needsTree = this.dirty.has('TREE');
    const needsLinked = this.dirty.has('LINKED_LIST');
    const needsDoubly = this.dirty.has('DOUBLY_LINKED_LIST');
    const needsComplete = this.dirty.has('COMPLETE');
    const needsBipartite = this.dirty.has('BIPARTITE');

    let hasCycle: boolean | undefined;

    if (needsDirection) {
      const dir = validateDirection(this.links);
      if (dir) this.flags.add(dir);
    }

    if (needsCycle || needsDAG) {
      hasCycle = validateCyclic(this.nodes, this.links);
      if (hasCycle) this.flags.add('CYCLIC');
    }

    if (needsDAG) {
      if (validateDAG(this.links, hasCycle ?? validateCyclic(this.nodes, this.links))) {
        this.flags.add('DAG');
      }
    }

    if (needsTree) {
      if (validateTree(this.nodes, this.links)) {
        this.flags.add('TREE');
        if (this.dirty.has('BINARY_TREE') && validateBinaryTree(this.nodes, this.links)) {
          this.flags.add('BINARY_TREE');
          if (this.dirty.has('BST') && validateBST(this.nodes, this.links)) {
            this.flags.add('BST');
          }
        }
      }
    }

    if (needsLinked && validateLinkedList(this.nodes, this.links)) this.flags.add('LINKED_LIST');
    if (needsDoubly && validateDoublyLinkedList(this.nodes, this.links)) this.flags.add('DOUBLY_LINKED_LIST');
    if (needsComplete && validateComplete(this.nodes, this.links)) this.flags.add('COMPLETE');
    if (needsBipartite && validateBipartite(this.nodes, this.links)) this.flags.add('BIPARTITE');

    this.dirty.clear();
    this.onChange?.([...this.flags]);
  }
}
