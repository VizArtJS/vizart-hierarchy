//The draw function of the canvas that gets called on each frame
import { range } from 'd3-array';
import { format } from 'd3-format';
import sameBranch from './branch-checker';
import getLines from './get-lines';
import drawCircularText from './draw-circular-text';
import genColor from './gen-color';
import drawBars from './draw-bars';

const commaFormat = format(',');

//The start angle in degrees for each of the non-node leaf titles
const rotationText = [
  -14,
  4,
  23,
  -18,
  -10.5,
  -20,
  20,
  20,
  46,
  -30,
  -25,
  -20,
  20,
  15,
  -30,
  -15,
  -45,
  12,
  -15,
  -16,
  15,
  15,
  5,
  18,
  5,
  15,
  20,
  -20,
  -25,
]; //The rotation of each arc text

const drawCanvas = (state, chosenContext, hidden = false) => {
  const {
    _hierarchy,
    _options,
    nodes,
    nodeCount,
    colToCircle,
    colorCircle,
    focus,
    zoomInfo,
    centerX,
    centerY,
    showText,
    textAlpha,
    kids,
    rootName,
  } = state;
  const _treeDepth = range(0, _hierarchy.height - 1, 1);
  //Clear canvas
  chosenContext.fillStyle = '#fff';
  chosenContext.rect(
    0,
    0,
    _options.chart.innerWidth,
    _options.chart.innerHeight
  );
  chosenContext.fill();

  //Select our dummy nodes and draw the data to canvas.
  let node = null;
  // It's slightly faster than nodes.forEach()
  for (let i = 0; i < nodeCount; i++) {
    node = nodes[i];

    //If the hidden canvas was send into this function and it does not yet have a color, generate a unique one
    if (hidden) {
      if (node.color == null) {
        // If we have never drawn the node to the hidden canvas get a new color for it and put it in the dictionary.
        node.color = genColor();
        colToCircle[node.color] = node;
      } //if
      // On the hidden canvas each rectangle gets a unique color.
      chosenContext.fillStyle = node.color;
    } else {
      chosenContext.fillStyle = node.children
        ? colorCircle(node.depth)
        : 'white';
    } //else

    const nodeX = (node.x - zoomInfo.centerX) * zoomInfo.scale + centerX,
      nodeY = (node.y - zoomInfo.centerY) * zoomInfo.scale + centerY,
      nodeR = node.r * zoomInfo.scale;

    //Use one node to reset the scale factor for the legend
    if (i === _treeDepth) state.scaleFactor = node.value / (nodeR * nodeR);

    //Draw each circle
    chosenContext.beginPath();
    chosenContext.arc(nodeX, nodeY, nodeR, 0, 2 * Math.PI, true);
    chosenContext.fill();

    //Draw the bars inside the circles (only in the visible canvas)
    //Only draw bars in leaf nodes
    if (node.data.hasOwnProperty('_data')) {
      //Only draw the bars that are in the same parent ID as the clicked on node
      if (sameBranch(node, focus) && !hidden) {
        const fontSizeTitle = Math.round(nodeR / 10);

        //Variables for the bar title
        const drawTitle = fontSizeTitle >= 8;

        //Only draw the title if the font size is big enough
        if (drawTitle && showText) {
          //First the light grey total text
          chosenContext.font =
            (fontSizeTitle * 0.5 <= 5 ? 0 : Math.round(fontSizeTitle * 0.5)) +
            'px ' +
            _options.bodyFont;
          chosenContext.fillStyle = 'rgba(191,191,191,' + textAlpha + ')'; //"#BFBFBF";
          chosenContext.textAlign = 'center';
          chosenContext.textBaseline = 'middle';
          chosenContext.fillText(
            _options.plots.titleFn(commaFormat(node.data.size)),
            nodeX,
            nodeY + -0.75 * nodeR
          );

          //Get the text back in pieces that will fit inside the node
          const titleText = getLines(
            chosenContext,
            node.data.name,
            nodeR * 2 * 0.7,
            fontSizeTitle,
            _options.titleFont
          );
          //Loop over all the pieces and draw each line
          titleText.forEach((txt, iterator) => {
            chosenContext.font = fontSizeTitle + 'px ' + _options.titleFont;
            chosenContext.fillStyle =
              'rgba(' +
              _options.plots.mainTextColor[0] +
              ',' +
              _options.plots.mainTextColor[1] +
              ',' +
              _options.plots.mainTextColor[2] +
              ',' +
              textAlpha +
              ')';
            chosenContext.textAlign = 'center';
            chosenContext.textBaseline = 'middle';
            chosenContext.fillText(
              txt,
              nodeX,
              nodeY + (-0.65 + iterator * 0.125) * nodeR
            );
          }); //forEach
        }

        drawBars(state, chosenContext, node, nodeX, nodeY, nodeR);
      }
    }
  } //for i

  let counter = 0; //Needed for the rotation of the arc titles

  //Do a second loop because the arc titles always have to be drawn on top
  for (let i = 0; i < nodeCount; i++) {
    node = nodes[i];

    const nodeX = (node.x - zoomInfo.centerX) * zoomInfo.scale + centerX,
      nodeY = (node.y - zoomInfo.centerY) * zoomInfo.scale + centerY,
      nodeR = node.r * zoomInfo.scale;

    //Don't draw for leaf-nodes
    //And don't draw the arced label for the largest outer circle
    //And don't draw these things for the hidden layer
    //And only draw these while showText = true (so not during a zoom)
    //And hide those not close the the parent
    if (node.parent !== undefined && node.children !== undefined) {
      if (
        (node.data.name !== rootName) &&
        !hidden &&
        showText &&
        kids.includes(node.data.name)
      ) {
        //Calculate the best font size for the non-leaf nodes
        const fontSizeTitle = Math.round(nodeR / 10);
        if (fontSizeTitle > 4)
          drawCircularText(
            chosenContext,
            node.data.name.replace(/,? and /g, ' & '),
            fontSizeTitle,
            _options.titleFont,
            nodeX,
            nodeY,
            nodeR,
            rotationText[counter],
            0,
            textAlpha
          );
      } //if
      counter = counter + 1;
    } //if
  } //for i
}; //function _drawCanvas

export default drawCanvas;
