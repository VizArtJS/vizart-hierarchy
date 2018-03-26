import { cluster, hierarchy, tree } from 'd3-hierarchy';
import { scaleSqrt } from 'd3-scale';
import { max, min } from 'd3-array';
import diagonalHorizontal from '../util/diagonal-horizontal';

const draw = state => {
  const { _options, _svg, _color, _data } = state;

  const _tree =
    _options.plots.mode === 'tree'
      ? tree().size([_options.chart.innerHeight, _options.chart.innerWidth])
      : cluster().size([_options.chart.innerHeight, _options.chart.innerWidth]);

  const minValues = [];
  const maxValues = [];
  const nodeScale = scaleSqrt();
  const nodeRadius = node => {
    //Set max for root node.
    if (node.depth === 0) {
      return nodeScale.range()[1];
    }

    // only one node in this depth
    if (minValues[node.depth] === maxValues[node.depth]) {
      return nodeScale.range()[1];
    }

    nodeScale.domain([minValues[node.depth], maxValues[node.depth]]);
    return nodeScale(node.value);
  };

  const root = hierarchy(_data)
    .sum(d => d.size)
    .sort(
      (a, b) => a.height - b.height || a.data.name.localeCompare(b.data.name)
    );

  const maxDepth = root.height;

  _tree(root);

  //We dynamically size based on how many first level nodes we have
  const scale =
    _options.plots.branchPadding === -1
      ? Math.min(_options.chart.innerHeight, _options.chart.innerWidth) /
        root.descendants().length
      : Math.min(_options.chart.innerHeight, _options.chart.innerWidth) *
        _options.plots.branchPadding;

  nodeScale.range([1.5, scale / 2]);

  _tree.nodeSize([scale, 0]);
  const depthSpan =
    _options.plots.fixedSpan > 0
      ? _options.plots.fixedSpan
      : _options.width / (maxDepth + 1);

  //Set max/min values
  for (let i = 1; i < maxDepth + 1; i++) {
    const vals = root.descendants().filter(d => d.depth === i);
    maxValues[i] = max(vals, d => d.value);
    minValues[i] = min(vals, d => d.value);
  }

  const link = _svg
    .selectAll('.link')
    .data(root.descendants().slice(1))
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', diagonalHorizontal)
    .style('fill', 'none')
    .style('stroke-linecap', 'round')
    .style('stroke-width', d => nodeRadius(d) * 2)
    .style('stroke', d => _color(d.data.name))
    .style('stroke-opacity', _options.plots.linkOpacity);

  const node = _svg
    .selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr(
      'class',
      d => 'node' + (d.children ? ' node--internal' : ' node--leaf')
    )
    .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');

  node
    .append('circle')
    .attr('r', nodeRadius)
    .style('stroke', d => _color(d.data.name))
    .style('stroke-opacity', _options.plots.nodeStrokeOpacity)
    .style('fill', d => _color(d.data.name))
    .style('fill-opacity', _options.plots.nodeOpacity);

  node
    .append('text')
    .attr('dy', 4)
    .attr(
      'x',
      d => (d.children ? -_options.plots.textOffset : _options.plots.textOffset)
    )
    .style('text-anchor', d => (d.children ? 'end' : 'start'))
    .text(d => d.data.name);

  state.node = node;
  state.link = link;
  state.root = root;
};

export default draw;
