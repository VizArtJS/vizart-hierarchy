import { hierarchy, partition } from 'd3-hierarchy';
import { select, selectAll } from 'd3-selection';
import { arc } from 'd3-shape';
import { apiRenderSVG, uuid } from 'vizart-core';

const apiRender = state => ({
  render(data) {
      apiRenderSVG(state).render(data);
      
      const { _options, _container, _svg, _data, _color } = state;

    const _radius =
      Math.min(
        _options.chart.innerWidth,
        _options.chart.innerHeight
      ) / 2;

    const _uuid = uuid();
    
    // id generation
    const _trailId = '#trail-' + _uuid;
    const _endLabelId = '#end-label-' + _uuid;

    const _uiConfig = _options.uiConfig;

    _container
      .attr('preserveAspectRatio', 'xMinYMin')
      .attr(
        'viewBox',
        '0 0 ' + _options.chart.width + ' ' + _options.chart.height
      );
    _svg.attr(
      'transform',
      'translate(' +
        _options.chart.width / 2 +
        ',' +
        _options.chart.height / 2 +
        ')'
    );

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    _svg
      .append('svg:circle')
      .attr('r', _radius)
      .style('opacity', 0);


    const _partition = partition().size([
      2 * Math.PI,
      _radius * _radius,
    ]);

    const _arc = arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => Math.sqrt(d.y0))
      .outerRadius(d => Math.sqrt(d.y1));

    // Basic setup of page elements.
      // Add the svg area.
    const trail = select(_uiConfig.sequence)
        .append('svg:svg')
        .attr('width', _options.chart.width)
        .attr('height', 50)
        .attr('id', _trailId.substr(1, _trailId.length - 1));
    // Add the label at the end, for the percentage.
    trail
        .append('svg:text')
        .attr('id', _endLabelId.substr(1, _endLabelId.length - 1))
        .style('fill', '#000');

    // Turn the data into a d3 hierarchy and calculate the sums.
    const root = hierarchy(_data)
      .sum(d => d.size)
      .sort((a, b) => b.value - a.value);

    // For efficiency, filter nodes to keep only those large enough to see.
    const nodes = _partition(root)
      .descendants()
      .filter(d => d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees

    const path = _svg
      .data([_data])
      .selectAll('path')
      .data(nodes)
      .enter()
      .append('svg:path')
      .attr('display', d => d.depth ? null : 'none')
      .attr('d', _arc)
      .attr('fill-rule', 'evenodd')
      .style('fill', d => _color(d.data.name))
      .style('opacity', 1)
      .on('mouseover', mouseover);


    // Add the mouseleave handler to the bounding circle.
    _svg.on('mouseleave', mouseleave);

    // Total size of all segments; we set this later, after loading the data.
    // Get total size of the tree = value of root node from partition.
    const totalSize = path.datum().value;
    const breadcrumbs = _options.plots.breadcrumb;

    // Generate a string that describes the points of a breadcrumb polygon.
    function _breadcrumbPoints(d, i) {
      const points = [];

      points.push('0,0');
      points.push(breadcrumbs.w + ',0');
      points.push(breadcrumbs.w + breadcrumbs.t + ',' + breadcrumbs.h / 2);
      points.push(breadcrumbs.w + ',' + breadcrumbs.h);
      points.push('0,' + breadcrumbs.h);
      if (i > 0) {
        // Leftmost breadcrumb; don't include 6th vertex.
        points.push(breadcrumbs.t + ',' + breadcrumbs.h / 2);
      }
      return points.join(' ');
    }

    // Update the breadcrumb trail to show the current sequence and percentage.
    function _updateBreadcrumbs(nodeArray, percentageString) {
      // Data join; key function combines name and depth (= position in sequence).
      const trail = select(_trailId)
        .selectAll('g')
        .data(nodeArray, d => d.data.name + d.depth);

      // Remove exiting nodes.
      trail.exit().remove();

      // Add breadcrumb and label for entering nodes.
      let entering = trail.enter().append('svg:g');

      entering
        .append('svg:polygon')
        .attr('points', _breadcrumbPoints)
        .style('fill', d => _color(d.data.name));

      entering
        .append('svg:text')
        .attr('x', (breadcrumbs.w + breadcrumbs.t) / 2)
        .attr('y', breadcrumbs.h / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(d => d.data.name);

      // Merge enter and update selections; set position for all nodes.
      entering.merge(trail).attr('transform', (d, i) => 'translate(' + i * (breadcrumbs.w + breadcrumbs.s) + ', 0)');

      // Now move and update the percentage at the end.
      select(_trailId)
        .select(_endLabelId)
        .attr('x', (nodeArray.length + 0.5) * (breadcrumbs.w + breadcrumbs.s))
        .attr('y', breadcrumbs.h / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(percentageString);

      // Make the breadcrumb trail visible, if it's hidden.
      select(_trailId).style('visibility', '');
    }

    // Fade all but the current sequence, and show it in the breadcrumb trail.
    function mouseover(d) {
      const percentage = (100 * d.value / totalSize).toPrecision(3);
      let percentageString = percentage + '%';
      if (percentage < 0.1) {
        percentageString = '< 0.1%';
      }

      select(_uiConfig.percentage).text(percentageString);

      select(_uiConfig.explanation).style('visibility', '');

      const sequenceArray = d.ancestors().reverse();
      sequenceArray.shift(); // remove root node from the array
      _updateBreadcrumbs(sequenceArray, percentageString);

      // Fade all the segments.
      selectAll('path').style('opacity', 0.3);

      // Then highlight only those that are an ancestor of the current segment.
      _svg
        .selectAll('path')
        .filter(node => sequenceArray.indexOf(node) >= 0)
        .style('opacity', 1);
    }

      // Restore everything to full opacity when moving off the visualization.
      function mouseleave(d) {
          // Hide the breadcrumb trail
          select(_trailId).style('visibility', 'hidden');

          // Deactivate all segments during transition.
          selectAll('path').on('mouseover', null);

          // Transition each segment to full opacity and then reactivate it.
          selectAll('path')
              .transition()
              .duration(1000)
              .style('opacity', 1)
              .on('end', function() {
                  select(this).on('mouseover', mouseover);
              });

          select(_uiConfig.explanation).style('visibility', 'hidden');
      }
  },
});

export default apiRender;
