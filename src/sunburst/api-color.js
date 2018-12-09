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

    const { _svg } = state;
    state._color = state.composers.color(state._options.color);

    _svg
      .selectAll('.node path')
      .transition()
      .duration(1250)
      .attr('fill', d => state._color(d.data.name));
  },
});

export default apiColor;
