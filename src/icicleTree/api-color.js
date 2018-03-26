const apiColor = state => ({
    color(colorOpt) {
        const { _options, _composers, _svg, _color } = state;
        _options.color = colorOpt;
        state._color = _composers.color(colorOpt);

        _svg
            .selectAll('.icicle-slice')
            .transition()
            .duration(_options.animation.duration.update)
            .attr('fill', d => _color(d.name));
    }
})

export default apiColor;