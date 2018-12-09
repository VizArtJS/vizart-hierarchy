import { max } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { format } from 'd3-format';

const commaFormat = format(',');

const drawBars = (state, chosenContext, node, nodeX, nodeY, nodeR) => {
  const { _options, elementsPerBar, _color, showText, textAlpha } = state;

  const barDimVal = d => d[_options.data.x.accessor];
  const barMetVal = d => d[_options.data.y.accessor];

  //The barscale differs per node
  const barScale = scaleLinear()
    .domain([0, max(node.data._data, barMetVal)]) //max value of bar charts in circle
    .range([0, nodeR]);

  //Variables for the bar chart
  const bars = node.data._data;
  const totalOffset = nodeX + -nodeR * 0.3;
  const eachBarHeight =
    ((1 - _options.plots.barChartHeightOffset) *
      2 *
      nodeR *
      _options.plots.barChartHeight) /
    elementsPerBar;
  const barHeight = eachBarHeight * 0.8;

  //Variables for the labels on the bars: Age

  const fontSizeLabels = Math.round(nodeR / 18);
  const drawLabelText = fontSizeLabels >= 6;

  //Variables for the value labels on the end of each bar
  const fontSizeValues = Math.round(nodeR / 22);
  const drawValueText = fontSizeValues >= 6;

  //Only draw the bars and all labels of each bar has a height of at least 1 pixel
  if (Math.round(barHeight) > 1) {
    //Loop over each bar
    for (let j = 0; j < bars.length; j++) {
      const bar = bars[j];

      bar.width = isNaN(barMetVal(bar)) ? 0 : barScale(barMetVal(bar));
      bar.barPiecePosition =
        nodeY +
        _options.plots.barChartHeightOffset * 2 * nodeR +
        j * eachBarHeight -
        _options.plots.barChartHeight * nodeR;

      //Draw the bar
      chosenContext.beginPath();
      chosenContext.fillStyle = _color(barDimVal(bar));
      chosenContext.fillRect(
        nodeX + -nodeR * 0.3,
        bar.barPiecePosition,
        bar.width,
        barHeight
      );
      chosenContext.fill();

      //Only draw the age labels if the font size is big enough
      if (drawLabelText && showText) {
        chosenContext.font = fontSizeLabels + 'px ' + _options.bodyFont;
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
        chosenContext.textAlign = 'right';
        chosenContext.textBaseline = 'middle';
        chosenContext.fillText(
          barDimVal(bar),
          nodeX + -nodeR * 0.35,
          bar.barPiecePosition + 0.5 * barHeight
        );
      } //if

      //Only draw the value labels if the font size is big enough
      if (drawValueText && showText) {
        chosenContext.font = fontSizeValues + 'px ' + _options.bodyFont;
        const txt = commaFormat(barMetVal(bar));
        //Check to see if the bar is big enough to place the text inside it
        //If not, place the text outside the bar
        const textWidth = chosenContext.measureText(txt).width;
        const valuePos =
          textWidth * 1.1 > bar.width - nodeR * 0.03 ? 'left' : 'right';

        //Calculate the x position of the bar value label
        bar.valueLoc =
          nodeX +
          -nodeR * 0.3 +
          bar.width +
          (valuePos === 'left' ? nodeR * 0.03 : -nodeR * 0.03);

        //Draw the text
        chosenContext.fillStyle =
          valuePos === 'left'
            ? 'rgba(51,51,51,' + textAlpha + ')'
            : 'rgba(255,255,255,' + textAlpha + ')'; //#333333 or white
        chosenContext.textAlign = valuePos;
        chosenContext.textBaseline = 'middle';
        chosenContext.fillText(
          txt,
          bar.valueLoc,
          bar.barPiecePosition + 0.5 * barHeight
        );
      } //if
    } //for j
  } //if -> Math.round(barHeight) > 1
};

export default drawBars;
