import * as d3 from 'd3';
import type { INode, IAlgorithmNode, CanvasNode, Snapshot } from '../../../sandbox/interfaces';
import type { Swap } from '../../../sandbox/utils/diffSnapshots';
import type { PhysicsEngine, SimLink } from './PhysicsEngine';

type Layers = {
  links: d3.Selection<SVGGElement, unknown, null, undefined>;
  ghost: d3.Selection<SVGGElement, unknown, null, undefined>;
  nodes: d3.Selection<SVGGElement, unknown, null, undefined>;
};

export class CanvasRenderer {
  private layers: Layers;
  private physics: PhysicsEngine;
  private nodeSelection: d3.Selection<SVGGElement, INode, SVGGElement, unknown> | null = null;
  private algoSelection: d3.Selection<SVGGElement, IAlgorithmNode, SVGGElement, unknown> | null = null;
  private linkSelection: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown> | null = null;
  private selectedNodeId: string | null = null;
  private currentHighlights: Snapshot['highlights'] = undefined;
  private pulsedNodes: Set<string> = new Set();
  private linkLabelSelection: d3.Selection<SVGTextElement, SimLink, SVGGElement, unknown> | null = null;
  private multiSelectedNodes: Set<string> = new Set();

  constructor(layers: Layers, physics: PhysicsEngine) {
    this.layers = layers;
    this.physics = physics;
    this.defineMarkers();
    this.physics.onTick(() => this.tick());
  }

  highlight(nodeId: string | null): void {
    this.selectedNodeId = nodeId;
    this.update();
  }

  setSelectedNodes(ids: Set<string>): void {
    this.multiSelectedNodes = ids;
    this.update();
  }

  setHighlights(highlights: Snapshot['highlights']): void {
    if (!highlights) this.pulsedNodes.clear();
    this.currentHighlights = highlights;
  }

  transitionHighlights(onComplete?: () => void): void {
    const duration = 200;
    this.layers.nodes
      .selectAll<SVGGElement, INode>('g.node-data')
      .select('circle')
      .transition().duration(duration)
      .attr('fill', d => this.getNodeColor(d))
      .on('end', () => { onComplete?.(); onComplete = undefined; });
    
    if (this.layers.nodes.selectAll('g.node-data').empty() && onComplete) onComplete();
  }

  private getNodeColor(d: INode): string {
    const h = this.currentHighlights;
    if (h?.swapping && h.swapping.includes(d.id)) return '#f1c40f';
    if (h?.comparing && h.comparing.includes(d.id)) return '#e67e22';
    if (h?.sorted && h.sorted.includes(d.id)) return '#27ae60';
    return d.color ?? '#ffffff';
  }

  private getAlgoColor(d: IAlgorithmNode): string {
    if (!d.connectedTo) return '#7f8c8d';
    switch (d.state.status) {
      case 'done': return '#27ae60';
      case 'running': case 'paused': return '#2980b9';
      default: return '#3498db';
    }
  }

  private getStepLabel(d: IAlgorithmNode): string {
    const { snapshots, currentStep } = d.state;
    if (snapshots.length === 0) return '';
    return `${currentStep}/${snapshots.length - 1}`;
  }

  private defineMarkers(): void {
    const svg = this.layers.links.select(function() { return this.ownerSVGElement!; });
    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) defs = svg.append('defs') as any;

    if (defs.select('#arrowhead').empty()) {
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 10)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
        .attr('fill', '#f00d0d'); 
    }

    if (defs.select('#arrowhead-active').empty()) {
      defs.append('marker')
        .attr('id', 'arrowhead-active')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 10)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
        .attr('fill', '#00e5ff'); 
    }
  }

  update(): void {
    const sim = this.physics.getSimulation();
    const allNodes = sim.nodes() as CanvasNode[];
    
    // --- EL FILTRO ARREGLADO (AHORA DEJA PASAR STACKS Y QUEUES) ---
    const dataNodes = allNodes.filter((n): n is INode => n.kind === 'data' || n.kind === 'stack' || n.kind === 'queue' || !n.kind);
    const algoNodes = allNodes.filter((n): n is IAlgorithmNode => n.kind === 'algorithm');
    const links = (sim.force('link') as d3.ForceLink<INode, SimLink>).links() as SimLink[];

    const dijkstraConnectedNodes = new Set<string>();
    const dijkstraNodes = algoNodes.filter(a => a.algorithmId === 'dijkstra' && a.connectedTo);
    
    dijkstraNodes.forEach(d => dijkstraConnectedNodes.add(d.connectedTo!));

    if (dijkstraConnectedNodes.size > 0) {
      let added = true;
      while (added) {
        added = false;
        for (const l of links) {
          if (l.type === 'algorithm') continue;
          const sId = typeof l.source === 'object' ? (l.source as INode).id : l.source as string;
          const tId = typeof l.target === 'object' ? (l.target as INode).id : l.target as string;
          
          if (dijkstraConnectedNodes.has(sId) && !dijkstraConnectedNodes.has(tId)) {
            dijkstraConnectedNodes.add(tId);
            added = true;
          } else if (dijkstraConnectedNodes.has(tId) && !dijkstraConnectedNodes.has(sId)) {
            dijkstraConnectedNodes.add(sId);
            added = true;
          }
        }
      }
    }

    // 1. FLECHAS
    this.linkSelection = this.layers.links
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links, d => {
        const sourceId = typeof d.source === 'object' ? (d.source as INode).id : d.source;
        const targetId = typeof d.target === 'object' ? (d.target as INode).id : d.target;
        const linkType = d.type ?? 'normal';
        return `${sourceId}-${targetId}-${linkType}`;
      })
      .join(
        enter => enter.append('line').attr('class', 'entering').each(function() {
          const el = this as SVGLineElement;
          setTimeout(() => el.classList.remove('entering'), 200);
        }),
        update => update,
        exit => {
          exit.filter(d => d.type === 'algo-snapshot' || d.type === 'algorithm').remove();
          exit.filter(d => d.type !== 'algo-snapshot' && d.type !== 'algorithm')
            .transition().duration(200)
            .attr('stroke-opacity', 0)
            .remove();
          return exit;
        }
      )
      .style('stroke', d => {
        const h = this.currentHighlights;
        const sId = typeof d.source === 'object' ? (d.source as INode).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as INode).id : d.target;
        
        if (h?.activeEdges && (h.activeEdges.includes(`${sId}-${tId}`) || h.activeEdges.includes(`${tId}-${sId}`))) {
          return '#00e5ff'; 
        }
        return d.type === 'algorithm' ? '#3498db' : '#555';
      })
      .style('stroke-width', '2px') 
      .attr('stroke-dasharray', d => d.type === 'algorithm' ? '6 4' : null)
      .attr('marker-end', d => {
        if (d.type === 'algorithm') return null;
        if (!d.directed) return null;
        
        const h = this.currentHighlights;
        const sId = typeof d.source === 'object' ? (d.source as INode).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as INode).id : d.target;
        
        if (h?.activeEdges && (h.activeEdges.includes(`${sId}-${tId}`) || h.activeEdges.includes(`${tId}-${sId}`))) {
          return 'url(#arrowhead-active)';
        }
        return 'url(#arrowhead)';
      });

    // 2. TEXTOS DE LOS PESOS
    this.linkLabelSelection = this.layers.links
      .selectAll<SVGTextElement, SimLink>('text.link-label')
      .data(links, d => {
        const sourceId = typeof d.source === 'object' ? (d.source as INode).id : d.source;
        const targetId = typeof d.target === 'object' ? (d.target as INode).id : d.target;
        const linkType = d.type ?? 'normal';
        return `${sourceId}-${targetId}-${linkType}`;
      })
      .join(
        enter => enter.append('text')
          .attr('class', 'link-label')
          .attr('text-anchor', 'middle')
          .attr('dy', '-6px') 
          .attr('fill', '#bdc3c7') 
          .attr('font-size', '12px')
          .attr('font-weight', 'bold'),
        update => update,
        exit => exit.remove()
      )
      .text(d => {
        if (d.type === 'algorithm') return '';

        const sId = typeof d.source === 'object' ? (d.source as INode).id : (d.source as string);
        
        if (!dijkstraConnectedNodes.has(sId)) return '';

        const tId = typeof d.target === 'object' ? (d.target as INode).id : (d.target as string);

        const realSrcNode = dataNodes.find(n => n.id === sId);
        if (realSrcNode && realSrcNode.edges) {
          const edge = realSrcNode.edges.find(e => e.end.id === tId);
          if (edge && edge.weight !== undefined) {
            return edge.weight; 
          }
        }
        return d.value ?? 1;
      });

    // 3. NODOS
    this.nodeSelection = this.layers.nodes
      .selectAll<SVGGElement, INode>('g.node-data')
      .data(dataNodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node node-data node-entering')
            .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
          
          // --- A. NODOS NORMALES (Círculos) ---
          const normalNodes = g.filter(d => d.kind === 'data' || !d.kind);
          const circle = normalNodes.append('circle')
            .attr('r', 0)
            .attr('fill', d => this.getNodeColor(d))
            .style('stroke', d => this.multiSelectedNodes.has(d.id) ? '#f1c40f' : d.id === this.selectedNodeId ? '#f1c40f' : 'none')
            .style('stroke-width', d => this.multiSelectedNodes.has(d.id) || d.id === this.selectedNodeId ? `${3 * (d.scale ?? 1)}px` : '0px');
          
          circle.transition().duration(250).ease(d3.easeBackOut)
            .attr('r', (d: INode) => 20 * (d.scale ?? 1))
            .on('end', function() {
              (this.parentNode as Element)?.classList.remove('node-entering');
            });
          
          normalNodes.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', '#000')
            .attr('font-size', '12px')
            .text(d => d.value);

          // --- B. NODOS DE ESTRUCTURA (Stack/Queue) ---
          const structNodes = g.filter(d => d.kind === 'stack' || d.kind === 'queue');

          // Definición del filtro glow en defs (solo una vez)
          const svgEl = this.layers.nodes.select(function() { return this.ownerSVGElement!; });
          let defs2 = svgEl.select<SVGDefsElement>('defs');
          if (defs2.empty()) defs2 = svgEl.append('defs') as any;
          if (defs2.select('#struct-glow').empty()) {
            const f = defs2.append('filter').attr('id', 'struct-glow').attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
            f.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
            f.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', d => d);
          }

          // Capas del struct
          structNodes.append('rect').attr('class', 'struct-bg');
          structNodes.append('rect').attr('class', 'struct-border');
          structNodes.append('g').attr('class', 'struct-elements');
          structNodes.append('text')
            .attr('class', 'struct-label')
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('letter-spacing', '1.5px')
            .attr('font-family', 'monospace');

          // Dibujamos inmediatamente con la misma lógica que update
          const self0 = this;
          structNodes.each(function(d: any) { self0.renderStructNode(d3.select(this), d); });

          structNodes
            .attr('opacity', 0)
            .transition().duration(250).ease(d3.easeBackOut)
            .attr('opacity', 1)
            .on('end', function() { (this as Element).classList.remove('node-entering'); });

          return g;
        },
        update => {
          // --- ACTUALIZAR NODOS NORMALES ---
          const normalNodes = update.filter(d => d.kind === 'data' || !d.kind);
          normalNodes.filter(':not(.node-entering)').select('circle')
            .attr('r', d => 20 * (d.scale ?? 1));
          
          normalNodes.select('circle')
            .attr('fill', d => this.getNodeColor(d))
            .style('stroke', d => this.multiSelectedNodes.has(d.id) ? '#f1c40f' : d.id === this.selectedNodeId ? '#f1c40f' : 'none')
            .style('stroke-width', d => this.multiSelectedNodes.has(d.id) || d.id === this.selectedNodeId ? `${3 * (d.scale ?? 1)}px` : '0px');
          
          normalNodes.select('text').text(d => d.value);

          // Pulso de Dijkstra para nodos normales
          if (this.currentHighlights) {
            const highlighted = new Set([
              ...(this.currentHighlights.swapping ?? []),
              ...(this.currentHighlights.comparing ?? []),
              ...(this.currentHighlights.sorted ?? [])
            ]);
            const toPulse = [...highlighted].filter(id => !this.pulsedNodes.has(id));
            if (toPulse.length > 0) {
              const pulseSet = new Set(toPulse);
              toPulse.forEach(id => this.pulsedNodes.add(id));
              normalNodes.filter(d => pulseSet.has(d.id))
                .select('circle')
                .transition().duration(150)
                .attr('r', d => 24 * (d.scale ?? 1))
                .transition().duration(150)
                .attr('r', d => 20 * (d.scale ?? 1));
            }
          }

          // --- ACTUALIZAR NODOS DE ESTRUCTURA ---
          const structNodes = update.filter(d => d.kind === 'stack' || d.kind === 'queue');
          const self = this;
          structNodes.each(function(d: any) { self.renderStructNode(d3.select(this), d); });

          return update;
        },
        exit => {
          exit.select('circle').transition().duration(200).ease(d3.easeBackIn).attr('r', 0);
          exit.select('text').transition().duration(150).attr('opacity', 0);
          exit.select('rect.struct-bg').transition().duration(200).attr('opacity', 0);
          exit.select('rect.struct-border').transition().duration(200).attr('opacity', 0);
          exit.select('g.struct-elements').transition().duration(200).attr('opacity', 0);
          exit.transition().duration(200).remove();
          return exit;
        }
      );

    // 4. Bloques de algoritmos
    this.algoSelection = this.layers.nodes
      .selectAll<SVGGElement, IAlgorithmNode>('g.node-algo')
      .data(algoNodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node node-algo node-entering')
            .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0}) scale(0)`)
            .attr('opacity', 0);
          g.transition().duration(250).ease(d3.easeBackOut)
            .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0}) scale(1)`)
            .attr('opacity', 1)
            .on('end', function() { (this as Element).classList.remove('node-entering'); });
          g.append('rect')
            .attr('x', -60).attr('y', -30)
            .attr('width', 120).attr('height', 60)
            .attr('rx', 8).attr('ry', 8)
            .attr('fill', d => this.getAlgoColor(d));
          g.append('text')
            .attr('class', 'algo-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '-1em')
            .attr('fill', '#000')
            .attr('font-size', '11px')
            .text(d => d.label);
          const btns = g.append('g').attr('class', 'algo-buttons').attr('transform', 'translate(0, 4)');
          btns.append('image').attr('class', 'algo-btn btn-back').attr('x', -47).attr('y', -8).attr('width', 16).attr('height', 16).attr('href', new URL('../../../assets/icons/back.svg', import.meta.url).href);
          btns.append('image').attr('class', 'algo-btn btn-play').attr('x', -22).attr('y', -8).attr('width', 16).attr('height', 16).attr('href', new URL('../../../assets/icons/play.svg', import.meta.url).href);
          btns.append('image').attr('class', 'algo-btn btn-fwd').attr('x', 3).attr('y', -8).attr('width', 16).attr('height', 16).attr('href', new URL('../../../assets/icons/forward.svg', import.meta.url).href);
          btns.append('image').attr('class', 'algo-btn btn-reset').attr('x', 28).attr('y', -8).attr('width', 16).attr('height', 16).attr('href', new URL('../../../assets/icons/reset.svg', import.meta.url).href);
          g.append('text')
            .attr('class', 'algo-step')
            .attr('text-anchor', 'middle')
            .attr('dy', '2.2em')
            .attr('fill', '#aaa')
            .attr('font-size', '9px')
            .text(d => this.getStepLabel(d));
          return g;
        },
        update => {
          update.select('.algo-label').text(d => d.label);
          update.select('rect').attr('fill', d => this.getAlgoColor(d));
          update.select('.algo-step').text(d => this.getStepLabel(d));
          return update;
        },
        exit => {
          exit.transition().duration(200).ease(d3.easeBackIn)
            .attr('transform', d => `translate(${(d as any).x ?? 0},${(d as any).y ?? 0}) scale(0)`)
            .attr('opacity', 0)
            .remove();
          return exit;
        }
      );
  }

  animateStep(swaps: Swap[], onComplete: () => void): void {
    if (swaps.length === 0) { onComplete(); return; }

    const sim = this.physics.getSimulation();
    const nodes = sim.nodes() as CanvasNode[];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const processed = new Set<string>();
    let pending = 0;

    const originalPos = new Map<string, { x: number; y: number }>();
    for (const swap of swaps) {
      for (const id of [swap.fromNodeId, swap.toNodeId]) {
        if (!originalPos.has(id)) {
          const n = nodeMap.get(id);
          if (n) originalPos.set(id, { x: n.x ?? 0, y: n.y ?? 0 });
        }
      }
    }

    for (const swap of swaps) {
      const pairKey = [swap.fromNodeId, swap.toNodeId].sort().join('-');
      if (!processed.has(pairKey)) {
        processed.add(pairKey);
        const nodeA = nodeMap.get(swap.fromNodeId);
        const nodeB = nodeMap.get(swap.toNodeId);
        if (nodeA && nodeB) {
          const posA = originalPos.get(swap.fromNodeId)!;
          const posB = originalPos.get(swap.toNodeId)!;
          nodeA.x = posB.x; nodeA.y = posB.y; nodeA.pos = { x: posB.x, y: posB.y };
          nodeB.x = posA.x; nodeB.y = posA.y; nodeB.pos = { x: posA.x, y: posA.y };
        }
      }
    }

    processed.clear();
    for (const swap of swaps) {
      const pairKey = [swap.fromNodeId, swap.toNodeId].sort().join('-');
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const posA = originalPos.get(swap.fromNodeId)!;
      const posB = originalPos.get(swap.toNodeId)!;
      pending += 2;

      this.layers.nodes.selectAll<SVGGElement, INode>('g.node-data')
        .filter(d => d.id === swap.fromNodeId)
        .attr('transform', `translate(${posA.x},${posA.y})`)
        .transition().duration(300)
        .attr('transform', `translate(${posB.x},${posB.y})`)
        .on('end', () => { pending--; if (pending === 0) onComplete(); });

      this.layers.nodes.selectAll<SVGGElement, INode>('g.node-data')
        .filter(d => d.id === swap.toNodeId)
        .attr('transform', `translate(${posB.x},${posB.y})`)
        .transition().duration(300)
        .attr('transform', `translate(${posA.x},${posA.y})`)
        .on('end', () => { pending--; if (pending === 0) onComplete(); });
    }

    this.linkSelection?.transition().duration(300)
      .attr('x1', d => (d.source as INode).x ?? 0)
      .attr('y1', d => (d.source as INode).y ?? 0)
      .attr('x2', d => (d.target as INode).x ?? 0)
      .attr('y2', d => (d.target as INode).y ?? 0);

    if (pending === 0) onComplete();

    this.linkLabelSelection?.transition().duration(300)
      .attr('x', d => (((d.source as INode).x ?? 0) + ((d.target as INode).x ?? 0)) / 2)
      .attr('y', d => (((d.source as INode).y ?? 0) + ((d.target as INode).y ?? 0)) / 2);
  }

  /** Dibuja / actualiza un nodo struct (stack o queue) a partir de su grupo SVG y su datum. */
  private renderStructNode(el: d3.Selection<SVGGElement, unknown, null, undefined>, d: any): void {
    const scale    = d.scale ?? 1.5;
    const isStack  = d.kind === 'stack';
    // Stack: vertical — Queue: horizontal
    // w = dimensión corta (ancho del vaso / alto del tubo)
    // h = dimensión larga (alto del vaso / largo del tubo)
    const w        = 56 * scale;
    const h        = 110 * scale;
    const rx       = 8 * scale;            // border-radius de las esquinas
    const color    = d.color ?? (isStack ? '#8e44ad' : '#2980b9');
    const isSelected = this.multiSelectedNodes.has(d.id) || this.selectedNodeId === d.id;

    // Coordenadas del rect según orientación
    const bx = isStack ? -w / 2 : -h / 2;
    const by = isStack ? -h / 2 : -w / 2;
    const bw = isStack ? w      : h;
    const bh = isStack ? h      : w;

    // ─── Fondo semitransparente ───
    el.select<SVGRectElement>('rect.struct-bg')
      .attr('x', bx).attr('y', by)
      .attr('width', bw).attr('height', bh)
      .attr('rx', rx).attr('ry', rx)
      .attr('fill', color)
      .attr('fill-opacity', 0.12);

    // ─── Borde con glow ───
    el.select<SVGRectElement>('rect.struct-border')
      .attr('x', bx).attr('y', by)
      .attr('width', bw).attr('height', bh)
      .attr('rx', rx).attr('ry', rx)
      .attr('fill', 'none')
      .attr('stroke', isSelected ? '#f1c40f' : color)
      .attr('stroke-width', isSelected ? 3 : 2)
      .style('filter', isSelected ? `drop-shadow(0 0 8px #f1c40f)` : `drop-shadow(0 0 6px ${color})`);

    // ─── Label ───
    const labelOffset = isStack ? by - 14 : by - 14;
    el.select<SVGTextElement>('text.struct-label')
      .attr('y', labelOffset)
      .attr('fill', color)
      .text((d.kind as string).toUpperCase());

    // ─── Elementos internos ───
    const elementsGroup = el.select<SVGGElement>('g.struct-elements');
    const arr  = d.elements || [];
    const n    = Math.max(arr.length, 1);   // evitar división por cero

    // Padding interior desde cada borde y gap entre celdas
    const pad  = 8 * scale;
    const gap  = 3 * scale;
    // Espacio disponible en la dirección larga del contenedor (h en ambos casos)
    const available = h - 2 * pad;

    // Celda en la dirección de apilamiento: siempre cabe exactamente dentro
    const cellLong  = Math.max(10, (available - gap * (n - 1)) / n);
    // Celda en la dirección perpendicular: ocupa el ancho interior
    const cellShort = w - 2 * pad;

    // Stack: apila verticalmente  → eh = largo, ew = corto
    // Queue: apila horizontalmente → ew = largo, eh = corto
    const ew = isStack ? cellShort : cellLong;
    const eh = isStack ? cellLong  : cellShort;

    elementsGroup.selectAll<SVGGElement, number>('g.struct-item')
      .data(arr)
      .join(
        enter => {
          const ig = enter.append('g').attr('class', 'struct-item').attr('opacity', 0);
          ig.append('rect').attr('rx', 4).attr('ry', 4);
          ig.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-family', 'monospace')
            .attr('font-weight', '700');
          ig.transition().duration(180).ease(d3.easeBackOut).attr('opacity', 1);
          return ig;
        },
        upd => upd,
        exit => exit.transition().duration(120).attr('opacity', 0).remove()
      )
      .attr('transform', (_val, i) => {
        if (isStack) {
          // el último elemento (tope lógico) va arriba
          const startY = -h / 2 + pad + eh / 2;
          const ey = startY + (arr.length - 1 - i) * (eh + gap);
          return `translate(0, ${ey})`;
        } else {
          // arr[0] = frente (dequeue) → izquierda
          const startX = -h / 2 + pad + ew / 2;
          const ex = startX + i * (ew + gap);
          return `translate(${ex}, 0)`;
        }
      })
      .each(function(val) {
        const ig   = d3.select(this);
        const fill = color;
        ig.select('rect')
          .attr('x', -ew / 2).attr('y', -eh / 2)
          .attr('width', ew).attr('height', eh)
          .attr('fill', fill)
          .attr('fill-opacity', 0.3)
          .attr('stroke', fill)
          .attr('stroke-width', 1.5);
        ig.select('text')
          .attr('fill', '#ecf0f1')
          .attr('font-size', `${Math.max(10, 12 * scale)}px`)
          .text(String(val));
      });
  }

  private tick(): void {
    this.linkSelection
      ?.attr('x1', d => (d.source as INode).x ?? 0)
      .attr('y1', d => (d.source as INode).y ?? 0)
      .attr('x2', d => {
        if (!d.directed) return (d.target as INode).x ?? 0;
        const s = d.source as INode, t = d.target as INode;
        const dx = (t.x ?? 0) - (s.x ?? 0), dy = (t.y ?? 0) - (s.y ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const r = 20 * (t.scale ?? 1);
        return (t.x ?? 0) - (dx / dist) * r;
      })
      .attr('y2', d => {
        if (!d.directed) return (d.target as INode).y ?? 0;
        const s = d.source as INode, t = d.target as INode;
        const dx = (t.x ?? 0) - (s.x ?? 0), dy = (t.y ?? 0) - (s.y ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const r = 20 * (t.scale ?? 1);
        return (t.y ?? 0) - (dy / dist) * r;
      });

    this.linkLabelSelection
      ?.attr('x', d => (((d.source as INode).x ?? 0) + ((d.target as INode).x ?? 0)) / 2)
      ?.attr('y', d => (((d.source as INode).y ?? 0) + ((d.target as INode).y ?? 0)) / 2);

    this.nodeSelection
      ?.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

    this.algoSelection?.filter(':not(.node-entering)')
      .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
  }
}