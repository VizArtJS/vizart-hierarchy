import { select } from 'd3-selection';
import 'd3-transition';
import { format } from 'd3-format';

const commaFormat = format(',');

const apiCreateLegend = state => ({
  //////////////////////////////////////////////////////////////
  ///////////// Function | The legend creation /////////////////
  //////////////////////////////////////////////////////////////

  createLegend(legendId, scaleFactor = 1) {
    const legendSizes = [10, 30, 60];

    //select("#legendRowWrapper").style("opacity", 0);

    const width = parseInt(select(legendId).style('width'), 10),
      height = legendSizes[2] * 2 * 1.2;

    const legendCenter = -10,
      legendBottom = height,
      legendLineLength = legendSizes[2] * 1.3,
      textPadding = 5;

    //Create SVG for the legend
    const _legendSvg = select(legendId)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('class', 'legendWrapper')
      .attr('transform', 'translate(' + width / 2 + ',' + 0 + ')')
      .style('opacity', 0);

    //Draw the circles
    _legendSvg
      .selectAll('.legendCircle')
      .data(legendSizes)
      .enter()
      .append('circle')
      .attr('r', d => d)
      .attr('class', 'legendCircle')
      .attr('cx', legendCenter)
      .attr('cy', d => legendBottom - d);
    //Draw the line connecting the top of the circle to the number
    _legendSvg
      .selectAll('.legendLine')
      .data(legendSizes)
      .enter()
      .append('line')
      .attr('class', 'legendLine')
      .attr('x1', legendCenter)
      .attr('y1', d => legendBottom - 2 * d)
      .attr('x2', legendCenter + legendLineLength)
      .attr('y2', d => legendBottom - 2 * d);
    //Place the value next to the line
    _legendSvg
      .selectAll('.legendText')
      .data(legendSizes)
      .enter()
      .append('text')
      .attr('class', 'legendText')
      .attr('x', legendCenter + legendLineLength + textPadding)
      .attr('y', d => legendBottom - 2 * d)
      .attr('dy', '0.3em')
      .text(d => commaFormat(Math.round((scaleFactor * d * d) / 10) * 10));

    //Slowly fade in so the scaleFactor is set to the correct value in the mean time :)
    select('.legendWrapper')
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 1);
  }, //createLegend
});

export default apiCreateLegend;
