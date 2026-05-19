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
    this.svg.call(this.zoom);
  }

  zoomTo(x: number, y: number, scale: number): void {
    const transform = d3.zoomIdentity.translate(x, y).scale(scale);
    this.svg.transition().duration(500).call(this.zoom.transform, transform);
  }
}
