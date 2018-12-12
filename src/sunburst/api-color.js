import { transition } from 'd3-transition';

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

    const { _containerId } = state;
    state._color = state.composers.color(state._options.color);

    transition()
      .selectAll(_containerId + ' .node path')
      .duration(1250)
      .attr('fill', d => state._color(d.data.name));
  },
});

export default apiColor;
