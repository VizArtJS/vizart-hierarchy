import { AbstractChart, DefaultCategoricalColor, uuid, mergeBase } from 'vizart-core';

import { select, selectAll } from 'd3-selection';
import { partition, hierarchy } from 'd3-hierarchy'
import { arc } from 'd3-shape';

const DefaultOptions = {
    chart: {
        type: 'sequential-sunburst',
    },
    color: DefaultCategoricalColor,
    plots: {
        breadcrumb: {w: 75, h: 30, s: 3, t: 10},
        legendMargin: {w: 75, h: 30, s: 3, r: 3}
    }
};

class SequentialSunburst extends AbstractChart {
    constructor(canvasId, _userOptions, uiConfig) {
        super(canvasId, _userOptions);

        this.outerRadius = Math.min(this._options.chart.innerWidth, this._options.chart.innerHeight) / 2;
        this._radius = this.outerRadius;

        const _uuid =  uuid();
        // id generation
        this._trailId = '#trail-' +_uuid
        this._endLabelId = '#end-label-' + _uuid;
        this._uiConfig = uiConfig;
    }

    createOptions(_userOpt) {
        return mergeBase(DefaultOptions, _userOpt);
    };

    render(_data) {
        super.render(_data);

        this._container.attr("preserveAspectRatio", "xMinYMin")
            .attr("viewBox", "0 0 " + this._options.chart.width + " " + this._options.chart.height);
        this._svg.attr("transform", "translate(" + this._options.chart.width / 2 + "," + this._options.chart.height / 2 + ")");

        // Bounding circle underneath the sunburst, to make it easier to detect
        // when the mouse leaves the parent g.
        this._svg.append("svg:circle")
            .attr("r", this._radius)
            .style("opacity", 0);

        // Total size of all segments; we set this later, after loading the data.
        let totalSize = 0;
        const _partition = partition()
            .size([2 * Math.PI, this._radius * this._radius]);

        let _arc = arc()
            .startAngle((d) => { return d.x0; })
            .endAngle((d) => { return d.x1; })
            .innerRadius((d) => { return Math.sqrt(d.y0); })
            .outerRadius((d) => { return Math.sqrt(d.y1); });

        // Basic setup of page elements.
        this._initializeBreadcrumbTrail();

        // Turn the data into a d3 hierarchy and calculate the sums.
        let root = hierarchy(this._data)
            .sum((d)=> { return d.size; })
            .sort( (a, b)=> { return b.value - a.value; });

        // For efficiency, filter nodes to keep only those large enough to see.
        let nodes = _partition(root).descendants()
            .filter( (d)=> {
                return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
            });

        let path = this._svg.data([this._data])
            .selectAll("path")
            .data(nodes)
            .enter().append("svg:path")
            .attr("display",  (d)=> {
                return d.depth ? null : "none";
            })
            .attr("d", _arc)
            .attr("fill-rule", "evenodd")
            .style("fill",  (d)=> {
                return this._colorScale(d.data.name); })
            .style("opacity", 1)
            .on("mouseover", mouseover);

        // Add the mouseleave handler to the bounding circle.
        this._svg.on("mouseleave", mouseleave);

        // Get total size of the tree = value of root node from partition.
        totalSize = path.datum().value;

        let that = this;

        const trailId = this._trailId;
        const endLabelId = this._endLabelId;
        const breadcrumbs = this._options.plots.breadcrumb;
        const uiConfig = this._uiConfig;

        // Generate a string that describes the points of a breadcrumb polygon.
        function _breadcrumbPoints(d, i) {
            let points = [];

            points.push("0,0");
            points.push(breadcrumbs.w + ",0");
            points.push(breadcrumbs.w + breadcrumbs.t + "," + (breadcrumbs.h / 2));
            points.push(breadcrumbs.w + "," + breadcrumbs.h);
            points.push("0," + breadcrumbs.h);
            if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
                points.push(breadcrumbs.t + "," + (breadcrumbs.h / 2));
            }
            return points.join(" ");
        }

        // Update the breadcrumb trail to show the current sequence and percentage.
        function _updateBreadcrumbs(nodeArray, percentageString) {
            // Data join; key function combines name and depth (= position in sequence).
            let trail = select(trailId)
                .selectAll("g")
                .data(nodeArray, (d)=> {
                    return d.data.name + d.depth;
                });

            // Remove exiting nodes.
            trail.exit().remove();

            // Add breadcrumb and label for entering nodes.
            let entering = trail.enter().append("svg:g");

            entering.append("svg:polygon")
                .attr("points", _breadcrumbPoints)
                .style("fill",  (d)=> { return that._colorScale(d.data.name); })

            entering.append("svg:text")
                .attr("x", (breadcrumbs.w + breadcrumbs.t) / 2)
                .attr("y", breadcrumbs.h / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .text( (d)=> {
                    return d.data.name;
                });

            // Merge enter and update selections; set position for all nodes.
            entering.merge(trail).attr("transform",  (d, i)=> {
                return "translate(" + i * (breadcrumbs.w + breadcrumbs.s) + ", 0)";
            });

            // Now move and update the percentage at the end.
            select(trailId).select(endLabelId)
                .attr("x", (nodeArray.length + 0.5) * (breadcrumbs.w + breadcrumbs.s))
                .attr("y", breadcrumbs.h / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .text(percentageString);

            // Make the breadcrumb trail visible, if it's hidden.
            select(trailId).style("visibility", "");
        }

        // Fade all but the current sequence, and show it in the breadcrumb trail.
        function mouseover(d) {
            let percentage = (100 * d.value / totalSize).toPrecision(3);
            let percentageString = percentage + "%";
            if (percentage < 0.1) {
                percentageString = "< 0.1%";
            }

            select(uiConfig.percentage)
                .text(percentageString);

            select(uiConfig.explanation)
                .style("visibility", "");

            let sequenceArray = d.ancestors().reverse();
            sequenceArray.shift(); // remove root node from the array
            _updateBreadcrumbs(sequenceArray, percentageString);

            // Fade all the segments.
            selectAll("path").style("opacity", 0.3);

            // Then highlight only those that are an ancestor of the current segment.
            that._svg.selectAll("path")
                .filter( (node)=> { return (sequenceArray.indexOf(node) >= 0); })
                .style("opacity", 1);
        }

        // Restore everything to full opacity when moving off the visualization.
        function mouseleave(d) {
            // Hide the breadcrumb trail
            select(trailId)
                .style("visibility", "hidden");

            // Deactivate all segments during transition.
            selectAll("path").on("mouseover", null);

            // Transition each segment to full opacity and then reactivate it.
            selectAll("path")
                .transition()
                .duration(1000)
                .style("opacity", 1)
                .on("end", function () {
                    select(this).on("mouseover", mouseover);
                });

            select(uiConfig.explanation)
                .style("visibility", "hidden");
        }


    }

    _initializeBreadcrumbTrail() {
        // Add the svg area.
        let trail = select(this._uiConfig.sequence).append("svg:svg")
            .attr("width", this._options.chart.width)
            .attr("height", 50)
            .attr("id", this._trailId.substr(1, this._trailId.length - 1));
        // Add the label at the end, for the percentage.
        trail.append("svg:text")
            .attr("id", this._endLabelId.substr(1, this._endLabelId.length - 1))
            .style("fill", "#000");
    }



    drawLegend(_domId) {
        const _legendMargin = this._options.plots.legendMargin;
        // Dimensions of legend item: width, height, spacing, radius of rounded rect.
        let legend = select(_domId)
            .append("svg:svg")
            .attr("width", _legendMargin.w)
            .attr("height", this._colorScale.domain().length * (_legendMargin.h + _legendMargin.s));

        let g = legend.selectAll("g")
            .data(this._colorScale.domain())
            .enter().append("svg:g")
            .attr("transform", (d, i) => {
                return "translate(0," + i * (_legendMargin.h + _legendMargin.s) + ")";
            });

        g.append("svg:rect")
            .attr("rx", _legendMargin.r)
            .attr("ry", _legendMargin.r)
            .attr("width", _legendMargin.w)
            .attr("height", _legendMargin.h)
            .style("fill", (d) => {
                return this._colorScale(d);
            });

        g.append("svg:text")
            .attr("x", _legendMargin.w / 2)
            .attr("y", _legendMargin.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text((d) => { return d; });
    }
}

export default SequentialSunburst