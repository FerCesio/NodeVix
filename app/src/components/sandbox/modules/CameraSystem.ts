import * as d3 from 'd3';

export class CameraSystem {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private container: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;

  constructor(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    container: d3.Selection<SVGGElement, unknown, null, undefined>
  ) {
    this.svg = svg;
    this.container = container;
    this.zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 5]);
  }

  init(): void {
    this.zoom.on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      this.container.attr('transform', event.transform.toString());
    });

    // Only allow zoom via Ctrl+wheel (pinch on trackpad sends ctrlKey=true)
    this.zoom.filter((event: any) => {
      if (event.type === 'wheel') return event.ctrlKey;
      return false;
    });

    this.svg.call(this.zoom);

    // Pan via scroll (no modifier)
    this.svg.on('wheel.pan', (event: WheelEvent) => {
      if (event.ctrlKey) return; // Let zoom handle it
      event.preventDefault();
      const transform = d3.zoomTransform(this.svg.node()!);
      const newTransform = transform.translate(-event.deltaX, -event.deltaY);
      this.svg.call(this.zoom.transform, newTransform);
    });
  }

  zoomTo(x: number, y: number, scale: number): void {
    const transform = d3.zoomIdentity.translate(x, y).scale(scale);
    this.svg.transition().duration(500).call(this.zoom.transform, transform);
  }
}
