import { apiRenderSVG } from 'vizart-core';
import { scaleLinear } from 'd3-scale';
import { hierarchy, partition } from 'd3-hierarchy';
import 'd3-transition';

const apiRender = state => ({
  render(data) {
    apiRenderSVG(state).render(data);

    const { _options, _data, _svg, _color } = state;

    const _height = _options.chart.innerHeight;

    const xScale = scaleLinear().range([0, _options.chart.innerWidth]);
    const yScale = scaleLinear().range([0, _options.chart.innerHeight]);

    const _partition = partition()
      .size([_options.chart.innerWidth, _options.chart.innerHeight])
      .padding(0)
      .round(true);

    const _tree = hierarchy(_data).sum(d => d.size);
    const _root = _partition(_tree);

    const rect = _svg.selectAll('.icicle-slice');
    const label = _svg.selectAll('.icicle-label');

    const clicked = d => {
      xScale.domain([d.x0, d.x1]);
      yScale.domain([d.y0, _height]).range([d.depth ? 20 : 0, _height]);

      _svg
        .selectAll('.icicle-slice')
        .transition()
        .duration(750)
        .attr('x', d => xScale(d.x0))
        .attr('y', d => yScale(d.y0))
        .attr('width', d => xScale(d.x1) - xScale(d.x0))
        .attr('height', d => yScale(d.y1) - yScale(d.y0));

      _svg
        .selectAll('.icicle-label')
        .transition()
        .duration(_options.animation.duration.quickUpdate)
        .attr('x', d => xScale(d.x0))
        .attr('y', d => yScale(d.y0))
        .attr('dx', 5)
        .attr('dy', 20);
    };

    rect
      .data(_root.descendants())
      .enter()
      .append('rect')
      .attr('class', 'icicle-slice')
      .attr('stroke', '#fff')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => _color(d.data.name))
      .on('click', clicked);

    label
      .data(_root.descendants())
      .enter()
      .append('text')
      .attr('class', 'icicle-label')
      .attr('x', d => xScale(d.x0))
      .attr('y', d => yScale(d.y0))
      .attr('dx', 5)
      .attr('dy', 20)
      .attr('text-anchor', 'start')
      .text(d => d.data.name)
      .style('color', 'white')
      .style('font-size', '12px')
      .on('click', clicked);
  },
});

export default apiRender;
