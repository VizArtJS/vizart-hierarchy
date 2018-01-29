import { AbstractChart, DefaultCategoricalColor, mergeBase } from 'vizart-core';
import { tree, cluster, hierarchy } from 'd3-hierarchy';
import { transition } from 'd3-transition';
import { scaleSqrt } from 'd3-scale';
import { max, min } from 'd3-array';
import diagonalHorizontal from '../util/diagonal-horizontal';
import elbow from '../util/elbow';

const DefaultOptions = {
    chart: {
        type: 'weighted-tree',
    },
    color: DefaultCategoricalColor,
    plots: {
        mode: 'tree',
        branchPadding: -1,
        fixedSpan : -1,
        nodeOpacity: 0.4,
        nodeStrokeOpacity: 0.6,
        linkOpacity: 0.35,
        textOffset: 12
    }
};

const duration = {
    general: 1250,
    easing: 750,
    axis: 750
};

// Collapse the node and all it's children
const collapse =(d)=> {
    if(d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null
    }
};

class WeightedTree extends AbstractChart {

    constructor(canvasId, _userOptions) {
        super(canvasId, _userOptions);


        this._tree = tree()
            .size([this._options.chart.innerHeight, this._options.chart.innerWidth]);

        this._cluster = cluster()
            .size([this._options.chart.innerHeight, this._options.chart.innerWidth]);

        this.root;
        this.node;
        this.link;

        this.minValues = [];
        this.maxValues = [];
        this.nodeScale = scaleSqrt();
        this.nodeRadius = (node)=> {
            //Set max for root node.
            if (node.depth === 0){
                return this.nodeScale.range()[1];
            }

            // only one node in this depth
            if (this.minValues[node.depth] === this.maxValues[node.depth]) {
                return this.nodeScale.range()[1];
            }

            this.nodeScale.domain([this.minValues[node.depth], this.maxValues[node.depth]]);
            return this.nodeScale(node.value);
        }

        this.depthSpan;
        this.maxDepth;
    }

    layoutTree() {
        this.root = hierarchy(this._data)
            .sum((d)=> { return d.size; })
            .sort((a, b)=> { return (a.height - b.height) || a.data.name.localeCompare(b.data.name); });

        this.maxDepth = this.root.height;

        this._tree(this.root);

        //We dynamically size based on how many first level nodes we have
        let scale;
        if (this._options.plots.branchPadding == -1) {
            scale = Math.min(this._options.chart.innerHeight,this._options.chart.innerWidth)/this.root.descendants().length;
            console.log("scale = " + scale);
        }
        else {
            scale = Math.min(this._options.chart.innerHeight,this._options.chart.innerWidth) * this._options.plots.branchPadding;
        }

        this.nodeScale.range([1.5,scale/2]);

        this._tree.nodeSize([scale,0]);
        this.depthSpan = (this._options.plots.fixedSpan > 0) ? this._options.plots.fixedSpan : this._options.width/(this.maxDepth+1);

        //Set max/min values
        for (let i=1; i < this.maxDepth+1; i++) {
            let vals = this.root.descendants().filter( (d)=> { return d.depth === i });
            this.maxValues[i] = max(vals, (d)=> { return d.value });
            this.minValues[i] = min(vals, (d)=> { return d.value });
        }
    }

    render(_data) {
        super.render(_data);

        this.update();
    };

    update () {
        super.update();
        this.layoutTree();

        this.link = this._svg.selectAll(".link")
            .data(this.root.descendants().slice(1))
            .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonalHorizontal)
            .style('fill', 'none')
            .style("stroke-linecap", "round")
            .style("stroke-width", (d)=> {
                return this.nodeRadius(d) * 2;
            })
            .style("stroke",(d)=> { return this._color(d.data.name) })
            .style("stroke-opacity", this._options.plots.linkOpacity);

        this.node = this._svg.selectAll(".node")
            .data(this.root.descendants())
            .enter().append("g")
            .attr("class", (d)=> { return "node" + (d.children ? " node--internal" : " node--leaf"); })
            .attr("transform", (d)=> { return "translate(" + d.y + "," + d.x + ")"; });

        this.node.append("circle")
            .attr("r", this.nodeRadius)
            .style("stroke", (d)=> { return this._color(d.data.name) })
            .style("stroke-opacity", this._options.plots.nodeStrokeOpacity)
            .style("fill", (d)=> { return this._color(d.data.name) })
            .style("fill-opacity",  this._options.plots.nodeOpacity);

        this.node.append("text")
            .attr("dy", 4)
            .attr("x", (d)=> { return d.children ? -this._options.plots.textOffset : this._options.plots.textOffset; })
            .style("text-anchor", (d)=> { return d.children ? "end" : "start"; })
            .text((d)=> { return d.data.name; });
    };


    mode(_mode) {
        this._options.mode = _mode;

        (_mode === "tree" ? this._tree : this._cluster)(this.root);

        const t = transition().duration(750);
        this.node.transition(t).attr("transform", (d)=> { return "translate(" + d.y + "," + d.x + ")"; });
        this.link.transition(t).attr("d", diagonalHorizontal);
    }

    sort(field, direction) {
        this._options.ordering = {
            name: field,
            direction: direction
        };

        self.update();
    };


    // Toggle children on click.
    _clickNode(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        this._update(d);
    }


    transitionColor(colorOptions) {
        super.transitionColor(colorOptions);

        this._svg.selectAll('.node circle')
            .transition()
            .duration(duration.general)
            .style("stroke", (d)=> { return this._color(d.data.name) })
            .style("stroke-opacity", this._options.plots.nodeStrokeOpacity)
            .style("fill", (d)=> { return this._color(d.data.name) })
            .style("fill-opacity",  this._options.plots.nodeOpacity);

        this._svg.selectAll(".link path")
            .style("stroke",(d)=> { return this._color(d.data.name) })
            .style("stroke-opacity", this._options.plots.linkOpacity);
    };


    createOptions(_userOpt) {
        return mergeBase(DefaultOptions, _userOpt);
    };
};

export default WeightedTree

