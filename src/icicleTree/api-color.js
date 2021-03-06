import { transition } from 'd3-transition';

const apiColor = state => ({
  color(colorOpt) {
    if (!colorOpt) {
      console.warn('color opt is null, either scheme or type is required');
      return;
    } else if (!colorOpt.type && !colorOpt.scheme) {
      console.warn('invalid color opt, either scheme or type is required');
      return;
    }

    if (colorOpt.type) {
      state._options.color.type = colorOpt.type;
    }

    if (colorOpt.scheme) {
      state._options.color.scheme = colorOpt.scheme;
    }

    const { _options, _composers, _containerId, _color } = state;
    state._color = _composers.color(state._options.color);

    transition()
      .selectAll(_containerId + ' .icicle-slice')
      .duration(_options.animation.duration.update)
      .attr('fill', d => _color(d.name));
  },
});

export default apiColor;
