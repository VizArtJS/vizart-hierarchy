const apiColor = state => ({
  color(colorOptions) {
    state._options.color = colorOptions;
    state._color = state._composers.color(colorOptions);

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
