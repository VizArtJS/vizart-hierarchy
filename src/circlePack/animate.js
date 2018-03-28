import { timer } from 'd3-timer';
import { select } from 'd3-selection';

import drawCanvas from './draw-canvas';
import { format } from 'd3-format';

const commaFormat = format(',');

//Perform the interpolation and continuously change the zoomInfo while the "transition" occurs
const interpolateZoom = (state, dt) => {
  const {
    interpolator,
    _cubicEase,
    duration,
    zoomInfo,
    diameter,
    _hiddenContext,
    scaleFactor,
  } = state;
  if (interpolator) {
    state.timeElapsed += dt;
    const t = _cubicEase(state.timeElapsed / duration); //mini this.interpolator that puts 0 - duration into 0 - 1 in a cubic-in-out fashion

    //Set the new zoom variables
    zoomInfo.centerX = interpolator(t)[0];
    zoomInfo.centerY = interpolator(t)[1];
    zoomInfo.scale = diameter / interpolator(t)[2];

    //After iteration is done remove the interpolater and set the fade text back into motion
    if (state.timeElapsed >= duration) {
      state.interpolator = null;
      state.showText = true;
      state.fadeText = true;
      state.timeElapsed = 0;

      //Draw the hidden canvas again, now that everything is settled in
      //to make sure it is in the same state as the visible canvas
      //This way the tooltip and click work correctly
      drawCanvas(state, _hiddenContext, true);

      //Update the texts in the legend
      select('.legendWrapper')
        .selectAll('.legendText')
        .text(d => commaFormat(Math.round(scaleFactor * d * d / 10) * 10));
    } //if -> timeElapsed >= duration
  } //if -> this.interpolator
}; //function _zoomToCanvas

//Function that fades in the text - Otherwise the text will be jittery during the zooming
const interpolateFadeText = (state, dt) => {
  const { fadeText, fadeTextDuration, _cubicEase, _frontCanvasId } = state;

  if (fadeText) {
    state.timeElapsed += dt;
    state.textAlpha = _cubicEase(state.timeElapsed / fadeTextDuration);
    if (state.timeElapsed >= fadeTextDuration) {
      //Enable click & mouseover events again
      select('#' + _frontCanvasId).style('pointer-events', 'auto');

      state.fadeText = false; //Jump from loop after fade in is done
      state.stopTimer = true; //After the fade is done, stop with the redraws / animation
    } //if
  } //if
}; //function _interpolateFadeText

const animate = state => {
  const { _frontContext } = state;
  //This function runs during changes in the visual - during a zoom
  let dt = 0;

  const _timer = timer(elapsed => {
    interpolateZoom(state, elapsed - dt);
    interpolateFadeText(state, elapsed - dt);
    dt = elapsed;

    drawCanvas(state, _frontContext, false);

    if (state.stopTimer === true) {
      _timer.stop();
    }
  });
};

export default animate;
