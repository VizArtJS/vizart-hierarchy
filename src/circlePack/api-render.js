import { range } from 'd3-array';
import { scaleOrdinal } from 'd3-scale';
import { hierarchy, pack } from 'd3-hierarchy';
import { easeCubicInOut } from 'd3-ease';
import 'd3-transition';

import { apiRenderCanvas } from 'vizart-core';

import animate from './animate';
import zoomToCanvas from './zoom-to-canvas';
import enableMouseZoom from './enable-mouse-zoom';
import drawCanvas from './draw-canvas';

const apiRender = state => ({
  render(data) {
    apiRenderCanvas(state).render(data);

    const {
      _options,
      _data,
      _color,
      _hiddenContext,
      _frontCanvasId,
      _canvasScale,
    } = state;

    const barDimVal = d => d[_options.data.x.accessor];

    const centerX = _options.chart.innerWidth / 2;
    const centerY = _options.chart.innerHeight / 2;

    state.centerX = centerX;
    state.centerY = centerY;
    state.zoomInfo = {
      centerX: centerX,
      centerY: centerY,
      scale: 1,
    };

    //////////////////////////////////////////////////////////////
    /////////////////////// Create Scales  ///////////////////////
    //////////////////////////////////////////////////////////////

    const diameter = Math.min(
      _options.chart.innerWidth * 0.9,
      _options.chart.innerHeight * 0.9
    );

    //Dataset to swtich between color of a circle (in the hidden canvas) and the node data
    state.colToCircle = {};

    const _hierarchy = hierarchy(_data, d => d.children).sum(d => d.size);

    const _treeDepth = range(0, _hierarchy.height - 1, 1);
    state.colorCircle = scaleOrdinal()
      .domain(_treeDepth)
      .range(_options.plots.circleColors);

    const packLayout = pack()
      .padding(1)
      .size([diameter, diameter]);

    packLayout(_hierarchy);

    const barDimList = _hierarchy
      .leaves()[0]
      .data._data.map(d => barDimVal(d))
      .filter((ele, pos, arr) => arr.indexOf(ele) === pos);
    _color.domain(barDimList);

    const nodes = _hierarchy.descendants();

    //////////////////////////////////////////////////////////////
    ////////////// Create Circle Packing Data ////////////////////
    //////////////////////////////////////////////////////////////

    state = Object.assign(state, {
      _hierarchy,
      nodes,
      root: _hierarchy,
      focus: _hierarchy,
      nodeCount: nodes.length,
      rootName: _hierarchy.data.name,
      nodeByName: {},
      elementsPerBar: barDimList.length,
      kids: [_hierarchy.data.name],
    });

    for (let d of state.nodes) {
      state.nodeByName[d.data.name] = d;
    }

    //Setup the kids variable for the top (root) level
    for (let i = 0; i < state.root.children.length; i++) {
      state.kids.push(state.root.children[i].name);
    }

    //Function to run oif a user clicks on the canvas
    const clickFunction = e => {
      //Figure out where the mouse click occurred.
      const mouseX = e.offsetX * _canvasScale; //e.layerX;
      const mouseY = e.offsetY * _canvasScale; //e.layerY;

      // Get the corresponding pixel color on the hidden canvas and look up the node in our map.
      // This will return that pixel's color
      const col = _hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
      //Our map uses these rgb strings as keys to nodes.
      const colString = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
      let node = state.colToCircle[colString];

      //If there was an actual node clicked on, zoom into this
      if (node) {
        //If the same node is clicked twice, set it to the top (root) level
        if (state.focus === node) node = state.root;

        //Save the names of the circle itself and first children
        //Needed to check which arc titles to show
        state.kids = [node.data.name];
        if (node.children !== undefined) {
          for (let i = 0; i < node.children.length; i++) {
            state.kids.push(node.children[i].data.name);
          } //for i
        } //if

        //Perform the zoom
        zoomToCanvas(state, node);
      } //if -> node
    }; //function clickFunction

    //Listen for clicks on the main canvas
    document
      .getElementById(_frontCanvasId)
      .addEventListener('click', clickFunction);
    // canvas.on("click", clickFunction);
    enableMouseZoom(state);

    //////////////////////////////////////////////////////////////
    ///////////////////// Zoom Function //////////////////////////
    //////////////////////////////////////////////////////////////

    //Based on the generous help by Stephan Smola
    //http://bl.ocks.org/smoli/d7e4f9199c15d71258b5

    state = Object.assign(state, {
      diameter,
      fadeTextDuration: 750,
      fadeText: false,
      textAlpha: 1, //After a zoom is finished fade in the text;
      showText: true, //Only show the text while you're not zooming,
      duration: 1500,
      interpolator: null,
      timeElapsed: 0,
      _cubicEase: easeCubicInOut,
      scaleFactor: 1, //dummy value
      //Start the drawing loop. It will jump out of the loop once stopTimer becomes true
      stopTimer: false,
      vOld: [state.focus.x, state.focus.y, state.focus.r * 2.05],
    });

    //////////////////////////////////////////////////////////////
    /////////////////////// Initiate /////////////////////////////
    //////////////////////////////////////////////////////////////

    //First zoom to get the circles to the right location
    zoomToCanvas(state, state.root);
    //Draw the hidden canvas at least once
    drawCanvas(state, _hiddenContext, true);
    //Draw the legend

    // this.createLegend(scaleFactor);
    animate(state);
  }, //drawAll
});

export default apiRender;
