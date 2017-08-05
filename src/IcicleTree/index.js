import {AbstractChart, DefaultCategoricalColor, mergeBase } from 'vizart-core'

import { scaleLinear } from 'd3-scale';
import { partition, hierarchy } from 'd3-hierarchy';

const DefaultOptions = {
    chart: {
        type: 'icicle-tree',
    },
    color: DefaultCategoricalColor
};

class IcicleTree extends AbstractChart {
    constructor(canvasId, _userOptions) {
        super(canvasId, _userOptions);
    }

    render(_data) {
        super.render(_data);
        let _height = this._options.chart.innerHeight;
        let that = this;

        let xScale = scaleLinear()
            .range([0, this._options.chart.innerWidth]);

        let yScale = scaleLinear()
            .range([0, this._options.chart.innerHeight]);

        let _partition = partition()
            .size([this._options.chart.innerWidth, this._options.chart.innerHeight])
            .padding(0)
            .round(true);

        let _tree = hierarchy(this._data)
            .sum( (d)=> { return d.size; });
        let _root = _partition(_tree);

        let rect = this._svg.selectAll('.icicle-slice');
        let label = this._svg.selectAll(".icicle-label");

        function clicked (d) {
            xScale.domain([d.x0, d.x1]);
            yScale.domain([d.y0, _height]).range([d.depth ? 20 : 0, _height]);

            that._svg.selectAll('.icicle-slice')
                .transition()
                .duration(750)
                .attr("x", (d)=> { return xScale(d.x0); })
                .attr("y", (d)=> { return yScale(d.y0); })
                .attr("width", (d)=> { return xScale(d.x1) - xScale(d.x0); })
                .attr("height", (d)=> { return yScale(d.y1) - yScale(d.y0); });

            that._svg.selectAll('.icicle-label')
                .transition()
                .duration(that._options.animation.duration.quickUpdate)
                .attr("x", (d)=> { return xScale(d.x0); })
                .attr("y", (d)=> { return yScale(d.y0); })
                .attr("dx", 5)
                .attr("dy", 20) ;

        };

        rect
            .data(_root.descendants())
            .enter()
            .append('rect')
            .attr('class', 'icicle-slice')
            .attr('stroke', '#fff')
            .attr("x", (d)=> { return d.x0; })
            .attr("y", (d)=> { return d.y0; })
            .attr("width", (d)=> { return d.x1 - d.x0; })
            .attr("height", (d)=> { return d.y1 - d.y0; })
            .attr('fill', (d) => { return this._color(d.data.name); })
            .on("click", clicked);

        label
            .data(_root.descendants())
            .enter()
            .append("text")
            .attr('class', 'icicle-label')
            .attr("x", (d) => { return xScale(d.x0); })
            .attr("y", (d) => { return yScale(d.y0); })
            .attr("dx", 5)
            .attr("dy", 20)
            .attr("text-anchor", "start")
            .text((d) => { return d.data.name })
            .style("color", "white")
            .style('font-size', "12px")
            .on("click", clicked);

    }

    update() {
        throw new Error('No function yet.')
    }

    transitionColor(colorOptions) {
        super.transitionColor(colorOptions);

        this._svg.selectAll('.icicle-slice')
            .transition()
            .duration(this._options.animation.duration.update)
            .attr('fill', (d) => {
                return this._color(d.name);
            });
    };


    createOptions(_userOpt) {
        return mergeBase(DefaultOptions, _userOpt);
    };

}

export default IcicleTree;