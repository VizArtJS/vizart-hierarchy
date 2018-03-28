//Create the interpolation function between current view and the clicked on node
import { select, selectAll } from 'd3-selection';
import { interpolateZoom } from 'd3-interpolate';

import animate from './animate';

const zoomToCanvas = (state, focusNode) => {
  const { _frontCanvasId, vOld } = state;
  //Temporarily disable click & mouseover events
  select('#' + _frontCanvasId).style('pointer-events', 'none');

  //Remove all previous popovers - if present
  select('.popoverWrapper').remove();
  selectAll('.popover').remove();

  //Set the new focus
  state.focus = focusNode;
  const { focus } = state;
  const v = [focus.x, focus.y, focus.r * 2.05]; //The center and width of the new "viewport"

  //Create interpolation between current and new "viewport"
  state.interpolator = interpolateZoom(vOld, v);

  //Set the needed "zoom" variables
  state.duration = Math.max(1500, state.interpolator.duration); //Interpolation gives back a suggested duration
  state.timeElapsed = 0; //Set the time elapsed for the interpolateZoom function to 0
  state.showText = false; //Don't show text during the zoom
  state.vOld = v; //Save the "viewport" of the next state as the next "old" state

  //Only show the circle legend when not at a leaf node
  if (focusNode.data.hasOwnProperty('_data')) {
    select('#legendRowWrapper').style('opacity', 0);
    select('.legendWrapper')
      .transition()
      .duration(1000)
      .style('opacity', 0);
  } else {
    select('#legendRowWrapper').style('opacity', 1);
    select('.legendWrapper')
      .transition()
      .duration(1000)
      .delay(state.duration)
      .style('opacity', 1);
  } //else

  //Start animation
  state.stopTimer = false;
  animate(state);
}; //function _zoomToCanvas

export default zoomToCanvas;
