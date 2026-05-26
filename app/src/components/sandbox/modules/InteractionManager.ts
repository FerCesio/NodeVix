import * as d3 from 'd3';
import type { INode } from '../../../sandbox/interfaces';
import type { ToolMode } from '../../../types/tools';
import { DefaultNode } from '../../../sandbox/DefaultNode';
import type { StructureManager } from '../../../sandbox/StructureManager';
import type { PhysicsEngine, SimLink } from './PhysicsEngine';
import type { CanvasRenderer } from './CanvasRenderer';

export interface InteractionRefs {
  modeRef: React.MutableRefObject<ToolMode>;
  nodesRef: React.MutableRefObject<INode[]>;
  linksRef: React.MutableRefObject<SimLink[]>;
  selectedNodeRef: React.MutableRefObject<INode | null>;
  structureManagerRef: React.MutableRefObject<StructureManager>;
  onSelectNode: (nodeId: string | null) => void;
}

export class InteractionManager {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private physics: PhysicsEngine;
  private renderer: CanvasRenderer;
  private refs!: InteractionRefs;

  constructor(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    physics: PhysicsEngine,
    renderer: CanvasRenderer
  ) {
    this.svg = svg;
    this.physics = physics;
    this.renderer = renderer;
  }

  bindContext(refs: InteractionRefs): void {
    this.refs = refs;
  }

  setupListeners(): void {
    this.svg.on('click.interaction', (event: MouseEvent) => {
      const target = event.target as Element;
      const mode = this.refs.modeRef.current;
      console.log('[Interaction] click | mode:', mode, '| target:', target.tagName);

      if (mode === 'ADD_NODE' && !target.closest('g.node')) {
        const [x, y] = d3.pointer(event, this.svg.select<SVGGElement>('.container').node()!);
        const node = new DefaultNode(crypto.randomUUID(), 0, x, y);
        this.refs.nodesRef.current.push(node);
        this.physics.updateNodes(this.refs.nodesRef.current);
        this.renderer.update();
        this.applyDrag();
        this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
      }

      if (mode === 'CONNECT') {
        const clickedNode = this.getNodeFromTarget(target);
        if (!clickedNode) {
          this.refs.selectedNodeRef.current = null;
          return;
        }
        if (!this.refs.selectedNodeRef.current) {
          this.refs.selectedNodeRef.current = clickedNode;
        } else {
          const source = this.refs.selectedNodeRef.current;
          if (source.id !== clickedNode.id) {
            const directed = event.shiftKey;
            const link: SimLink = { source, target: clickedNode, value: 1, directed };
            this.refs.linksRef.current.push(link);
            source.edges.push({ end: clickedNode, weight: 1, directed });
            if (!directed) {
              clickedNode.edges.push({ end: source, weight: 1, directed: false });
            }
            this.physics.updateLinks(this.refs.linksRef.current);
            this.renderer.update();
            this.applyDrag();
            this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
          }
          this.refs.selectedNodeRef.current = null;
        }
      }

      if (mode === 'DELETE_ANY') {
        const clickedNode = this.getNodeFromTarget(target);
        if (clickedNode) {
          // Remove node and its edges
          this.refs.nodesRef.current = this.refs.nodesRef.current.filter(n => n.id !== clickedNode.id);
          this.refs.linksRef.current = this.refs.linksRef.current.filter(
            l => (l.source as INode).id !== clickedNode.id && (l.target as INode).id !== clickedNode.id
          );
          // Clean edges from other nodes
          for (const n of this.refs.nodesRef.current) {
            n.edges = n.edges.filter(e => e.end.id !== clickedNode.id);
          }
        } else if (target.tagName === 'line') {
          // Remove clicked link
          const datum = d3.select<Element, SimLink>(target).datum();
          if (datum) {
            const srcId = (datum.source as INode).id;
            const tgtId = (datum.target as INode).id;
            this.refs.linksRef.current = this.refs.linksRef.current.filter(l => l !== datum);
            // Clean edges from nodes
            const srcNode = this.refs.nodesRef.current.find(n => n.id === srcId);
            const tgtNode = this.refs.nodesRef.current.find(n => n.id === tgtId);
            if (srcNode) srcNode.edges = srcNode.edges.filter(e => e.end.id !== tgtId);
            if (tgtNode && !datum.directed) tgtNode.edges = tgtNode.edges.filter(e => e.end.id !== srcId);
          }
        } else {
          return;
        }
        this.physics.updateNodes(this.refs.nodesRef.current);
        this.physics.updateLinks(this.refs.linksRef.current);
        this.renderer.update();
        this.applyDrag();
        this.refs.structureManagerRef.current.sync(this.refs.nodesRef.current, this.refs.linksRef.current);
        return;
      }

      if (mode === 'SELECT') {
        const clickedNode = this.getNodeFromTarget(target);
        this.refs.selectedNodeRef.current = clickedNode;
        this.refs.onSelectNode(clickedNode?.id ?? null);
      }
    });

    this.applyDrag();
  }

  destroy(): void {
    this.svg.on('click.interaction', null);
  }

  private applyDrag(): void {
    const physics = this.physics;
    const modeRef = this.refs.modeRef;

    const drag = d3.drag<SVGGElement, INode>()
      .filter(() => modeRef.current === 'SELECT')
      .on('start', (event, d) => {
        if (!event.active) physics.getSimulation().alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) physics.getSimulation().alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    this.svg.select<SVGGElement>('.layer-nodes')
      .selectAll<SVGGElement, INode>('g.node')
      .call(drag);
  }

  private getNodeFromTarget(target: Element): INode | null {
    const g = target.closest('g.node');
    if (!g) return null;
    const datum = d3.select<Element, INode>(g).datum();
    return datum ?? null;
  }
}
