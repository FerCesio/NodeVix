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

export class Structure {
  id: string;
  nodes: INode[];
  links: SimLink[];
  flags: Set<StructureFlag>;

  constructor(id: string) {
    this.id = id;
    this.nodes = [];
    this.links = [];
    this.flags = new Set(['GRAPH']);
  }

  addNode(node: INode): void {
    this.nodes.push(node);
    this.recalculate();
  }

  removeNode(nodeId: string): void {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.links = this.links.filter(
      l => (l.source as INode).id !== nodeId && (l.target as INode).id !== nodeId
    );
    this.recalculate();
  }

  addEdge(link: SimLink): void {
    this.links.push(link);
    this.recalculate();
  }

  removeEdge(sourceId: string, targetId: string): void {
    this.links = this.links.filter(
      l => !((l.source as INode).id === sourceId && (l.target as INode).id === targetId)
    );
    this.recalculate();
  }

  recalculate(): void {
    this.flags = new Set(['GRAPH']);

    const dir = validateDirection(this.links);
    if (dir) this.flags.add(dir);

    const hasCycle = validateCyclic(this.nodes, this.links);
    if (hasCycle) this.flags.add('CYCLIC');

    if (validateDAG(this.links, hasCycle)) this.flags.add('DAG');

    if (validateTree(this.nodes, this.links)) {
      this.flags.add('TREE');
      if (validateBinaryTree(this.nodes, this.links)) {
        this.flags.add('BINARY_TREE');
        if (validateBST(this.nodes, this.links)) this.flags.add('BST');
      }
    }

    if (validateLinkedList(this.nodes, this.links)) this.flags.add('LINKED_LIST');
    if (validateDoublyLinkedList(this.nodes, this.links)) this.flags.add('DOUBLY_LINKED_LIST');
  }
}
