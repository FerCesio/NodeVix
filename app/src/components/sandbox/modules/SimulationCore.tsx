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

      // Grid pattern
      const defs = this.svg.append('defs');
      defs.append('pattern')
        .attr('id', 'grid')
        .attr('width', 40)
        .attr('height', 40)
        .attr('patternUnits', 'userSpaceOnUse')
        .html('<line x1="40" y1="0" x2="40" y2="40" stroke="#2a2a2a" stroke-width="0.5"/><line x1="0" y1="40" x2="40" y2="40" stroke="#2a2a2a" stroke-width="0.5"/>');

      this.container = this.svg.append('g').attr('class', 'container');
      this.container.append('rect')
        .attr('class', 'grid-bg')
        .attr('x', -5000).attr('y', -5000)
        .attr('width', 10000).attr('height', 10000)
        .attr('fill', 'url(#grid)');

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
