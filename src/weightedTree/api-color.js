import 'd3-transition';

const apiColor = state => ({
  color(colorOptions) {
    if (!colorOptions) {
      console.warn('color opt is null, either scheme or type is required');
      return;
    } else if (!colorOptions.type && !colorOptions.scheme) {
      console.warn('invalid color opt, either scheme or type is required');
      return;
    }

    if (colorOptions.type) {
      state._options.color.type = colorOptions.type;
    }

    if (colorOptions.scheme) {
      state._options.color.scheme = colorOptions.scheme;
    }

    state._color = state._composers.color(state._options.color);

    const { _options, _svg, _color } = state;

    _svg
      .selectAll('.node circle')
      .transition()
      .duration(duration.general)
      .style('stroke', d => _color(d.data.name))
      .style('stroke-opacity', _options.plots.nodeStrokeOpacity)
      .style('fill', d => _color(d.data.name))
      .style('fill-opacity', _options.plots.nodeOpacity);

    _svg
      .selectAll('.link path')
      .style('stroke', d => _color(d.data.name))
      .style('stroke-opacity', _options.plots.linkOpacity);
  },
});

export default apiColor;
