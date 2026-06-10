import * as d3 from 'd3';


export class SimulationCore {
    private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private container: d3.Selection<SVGGElement, unknown, null, undefined>;
    private layers: {
      links: d3.Selection<SVGGElement, unknown, null, undefined>;
      ghost: d3.Selection<SVGGElement, unknown, null, undefined>;
      nodes: d3.Selection<SVGGElement, unknown, null, undefined>;
    };

    constructor(svgEl: SVGSVGElement | null) {
      if (!svgEl) throw new Error('SVG element is required');

      this.svg = d3.select(svgEl);

      this.svg.selectAll('*').remove();

      this.container = this.svg.append('g').attr('class', 'container');

      this.layers = {
        links: this.container.append('g').attr('class', 'layer-links'),
        ghost: this.container.append('g').attr('class', 'layer-ghost'),
        nodes: this.container.append('g').attr('class', 'layer-nodes'),
      };
    }

    getInfrastructure() {
      return {
        svg: this.svg,
        container: this.container,
        layers: this.layers,
      };
    }
}
