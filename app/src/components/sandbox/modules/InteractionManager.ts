import * as d3 from 'd3';
import type { INode } from '../../../sandbox/interfaces';
import type { ToolMode } from '../../../types/tools';
import { DefaultNode } from '../../../sandbox/DefaultNode';
import type { PhysicsEngine, SimLink } from './PhysicsEngine';
import type { CanvasRenderer } from './CanvasRenderer';

export interface InteractionRefs {
  modeRef: React.MutableRefObject<ToolMode>;
  nodesRef: React.MutableRefObject<INode[]>;
  linksRef: React.MutableRefObject<SimLink[]>;
  selectedNodeRef: React.MutableRefObject<INode | null>;
}

export class InteractionManager {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private physics: PhysicsEngine;
  private renderer: CanvasRenderer;
  private refs!: InteractionRefs;
  private onCanvasClick: ((e: MouseEvent) => void) | null = null;

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
    const svgEl = this.svg.node()!;

    this.onCanvasClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const mode = this.refs.modeRef.current;

      if (mode === 'ADD_NODE' && target === svgEl) {
        const [x, y] = d3.pointer(e, svgEl);
        const node = new DefaultNode(crypto.randomUUID(), 0, x, y);
        this.refs.nodesRef.current.push(node);
        this.physics.updateNodes(this.refs.nodesRef.current);
        this.renderer.update();
        this.applyDrag();
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
            const link: SimLink = { source, target: clickedNode, value: 1 };
            this.refs.linksRef.current.push(link);
            this.physics.updateLinks(this.refs.linksRef.current);
            this.renderer.update();
            this.applyDrag();
          }
          this.refs.selectedNodeRef.current = null;
        }
      }

      if (mode === 'SELECT') {
        const clickedNode = this.getNodeFromTarget(target);
        this.refs.selectedNodeRef.current = clickedNode;
      }
    };

    svgEl.addEventListener('click', this.onCanvasClick);
    this.applyDrag();
  }

  destroy(): void {
    const svgEl = this.svg.node();
    if (svgEl && this.onCanvasClick) {
      svgEl.removeEventListener('click', this.onCanvasClick);
    }
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
