import { select } from 'd3-selection';
import { scaleLinear, scaleSqrt } from 'd3-scale'
import { partition, hierarchy } from 'd3-hierarchy';
import { arc } from 'd3-shape';
import { interpolateArray, interpolateObject } from 'd3-interpolate';
import 'd3-transition';

import {
    AbstractChart,
    DefaultCategoricalColor,
    NoMargin,
    mergeBase
} from 'vizart-core';

const DefaultOptions = {
    chart: {
        type: 'sunburst',
        margin: NoMargin
    },
    color: DefaultCategoricalColor,
    plots: {
        drawLabels: true
    }
};

class Sunburst extends AbstractChart {

    constructor(canvasId, _userOptions) {
        super(canvasId, _userOptions);

        this.radius = Math.min(this._options.chart.innerWidth, this._options.chart.innerHeight) / 2;
    }

    render(_data) {
        super.render(_data);

        this._svg.attr("transform", "translate(" + this._options.chart.width / 2 + "," + this._options.chart.height / 2 + ")");


        // D3 Global Variables
        let root = hierarchy(this._data)
            .sum( (d)=> { return d.size; });
        let node = root; // Save root for tweening
        let x = scaleLinear().range([0, 2 * Math.PI]);
        let y = scaleSqrt().range([0, this.radius]);
        let _svg = this._svg;
        let _colorScale = this._colorScale;
        let radius = this.radius;
        let that = this;
        // Calculate the d path for each slice.

        let _partition = partition();
        let _arc = arc()
            .startAngle((d)=> { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
            .endAngle((d)=> { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
            .innerRadius((d)=> { return Math.max(0, y(d.y0)); })
            .outerRadius((d)=> { return Math.max(0, y(d.y1)); });


        // When switching data: interpolate the arcs in data space.
        let arcTweenData =(a, i)=> {
            // (a.x0s ? a.x0s : 0) -- grab the prev saved x0 or set to 0 (for 1st time through)
            // avoids the stash() and allows the sunburst to grow into being
            let oi = interpolateObject({ x0: (a.x0s ? a.x0s : 0), x1: (a.x1s ? a.x1s : 0) }, a);
            function tween(t) {
                let b = oi(t);
                a.x0s = b.x0;
                a.x1s = b.x1;
                return _arc(b);
            }
            if (i === 0) {
                // If we are on the first arc, adjust the x domain to match the root node
                // at the current zoom level. (We only need to do this once.)
                let xd = interpolateArray(x.domain(), [node.x0, node.x1]);
                return function (t) {
                    x.domain(xd(t));
                    return tween(t);
                };
            } else {
                return tween;
            }
        }


        // When zooming: interpolate the scales.
        function arcTweenZoom(d) {
            let xd = interpolateArray(x.domain(), [d.x0, d.x1]);
            let yd = interpolateArray(y.domain(), [d.y0, 1]); // [d.y0, 1]
            let yr = interpolateArray(y.range(), [d.y0 ? 40 : 0, radius]);

            return (d, i)=> {
                return i
                    ? (t)=> { return _arc(d); }
                    : (t)=> { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return _arc(d); };
            };
        }


        // Respond to slice click.
        function click(d) {
            //Hide text while Sunburst transitions
            _svg.selectAll(".node text").transition().attr("opacity", 0);
            node = d;
            let updateTrans =_svg.transition()
                .duration(1000)
                .selectAll(".node path")
                .attrTween("d", arcTweenZoom(d));

            if (that._options.plots.drawLabels === true) {
                updateTrans
                    .on("end", function(e, i) {
                        // check if the animated element's data e lies within the visible angle span given in d
                        if (e.x0 > d.x0 && e.x0 < d.x1) {
                            // get a selection of the associated text element
                            let arcText = select(this.parentNode).select("text");
                            // fade in the text element and recalculate positions
                            arcText.transition().duration(750)
                                .attr("opacity", 1)
                                .attr("class", "visible")
                                .attr("transform", ()=> { return "rotate(" + computeTextRotation(e) + ")" })
                                .attr("x", (d)=> { return y(d.y0); })
                                .text((d)=> {
                                    return d.data.name === "root" ? "" : d.data.name
                                });
                        }
                    });
            }
        }

        function computeTextRotation(d) {
            return (x((d.x0 + d.x1)/2) - Math.PI / 2) / Math.PI * 180;
        }



        // Build the sunburst.
        let first_build = true;
        function _update() {
            // todo: Determine how to size the slices.

            if (first_build) {
                // Add a <path d="[shape]" style="fill: [color];"><title>[popup text]</title></path>
                //   to each <g> element; add click handler; save slice widths for tweening
                _svg.selectAll(".node").data(_partition(root).descendants()).enter().append("g").attr('class', 'node');
                _svg.selectAll(".node")
                    .append("path")
                    .style("fill",  (d)=> {
                        return d.parent
                            ? _colorScale(d.data.name)
                            : "white"; })  // Return white for root.
                    .on("click", click);

                _svg.selectAll(".node").append("title").text( (d)=> { return d.data.name; });

                first_build = false;
            } else {
                _svg.selectAll(".node path").data(_partition(root).descendants());
            }

            let tweenTrans = _svg.transition()
                .duration(1000)
                .selectAll(".node path")
                .attrTween("d", arcTweenData);

            if (that._options.plots.drawLabels === true) {
                tweenTrans.on('end', function(d, i){
                    select(this.parentNode)
                        .append("text")
                        .attr("transform", (d)=> {
                            return "rotate(" + computeTextRotation(d) + ")";
                        })
                        .attr("x", (d)=> {
                            return y(d.y0);
                        })
                        .attr("dx", "6") // margin
                        .attr("dy", ".35em") // vertical-align
                        .text((d)=> {
                            return d.data.name === "root" ? "" : d.data.name
                        });
                } );
            }



        }

        _update(); // GO!
    };

    update() {
        super.update();

        if (this._data) {
            this._colorScale.domain(this._data.map(function(d){
                return d.name;
            }));
        }
    };

    transitionColor(colorOptions) {
        super.transitionColor(colorOptions)

        this._svg.selectAll(".node path")
            .transition()
            .duration(1250)
            .attr("fill", (d)=> {
                return this._colorScale(d.data.name);
            });
    };

    createOptions(_userOpt) {
        return mergeBase(DefaultOptions, _userOpt);
    };
};

export default Sunburst