import { select } from 'd3-selection';

const apiDrawLegend = state => ({
  drawLegend(_domId) {
    const { _options, _color } = state;
    const _legendMargin = _options.plots.legendMargin;
    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    let legend = select(_domId)
      .append('svg:svg')
      .attr('width', _legendMargin.w)
      .attr(
        'height',
        _color.domain().length * (_legendMargin.h + _legendMargin.s)
      );

    const g = legend
      .selectAll('g')
      .data(_color.domain())
      .enter()
      .append('svg:g')
      .attr(
        'transform',
        (d, i) => 'translate(0,' + i * (_legendMargin.h + _legendMargin.s) + ')'
      );

    g.append('svg:rect')
      .attr('rx', _legendMargin.r)
      .attr('ry', _legendMargin.r)
      .attr('width', _legendMargin.w)
      .attr('height', _legendMargin.h)
      .style('fill', d => _color(d));

    g.append('svg:text')
      .attr('x', _legendMargin.w / 2)
      .attr('y', _legendMargin.h / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text(d => d);
  },
});

export default apiDrawLegend;
