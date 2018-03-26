const apiColor = state => ({
    color(colorOptions) {
        const { _options, _svg } = state;
        _options.color = colorOptions;
        state._color = state.composers.color(colorOptions);

        _svg
            .selectAll('.node path')
            .transition()
            .duration(1250)
            .attr('fill', d => state._color(d.data.name));
    }
});

export default apiColor