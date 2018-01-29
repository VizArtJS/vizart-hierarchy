import { select, selectAll } from 'd3-selection';
import { scaleOrdinal, scaleLinear } from 'd3-scale';
import { pack, hierarchy } from 'd3-hierarchy';
import { max, range } from 'd3-array';
import { format } from 'd3-format';
import { timer } from  'd3-timer';
import { easeCubicInOut } from 'd3-ease';
import { interpolateZoom } from 'd3-interpolate';

import { AbstractChart, check, uuid, mergeBase, DefaultCategoricalColor } from 'vizart-core';

import isUndefined from 'lodash-es/isUndefined';
import uniq from 'lodash-es/uniq';
import includes from 'lodash-es/includes';
import has from 'lodash-es/has';


import drawCircularText from './draw-circular-text';
import genColor from './gen-color';
import getLines from './get-lines';
import sameBranch from './branch-checker';


const DefaultOptions = {
    chart: {
        type: 'circle-pack',
    },
    color: DefaultCategoricalColor,
    renderer: 'canvas',
    data: {
        x:  { name: 'dimension', type: 'string', accessor: 'MX'},
        y: { name: 'metric', type: 'number', accessor: 'MY'},
    },
    plots: {
        padding: 20,
        circleColors: ['#bdd7e7',
            '#6baed6',
            '#3182bd',
            '#08519c'],
        mainTextColor: [74, 74, 74],//"#4A4A4A",
        titleFont: "Oswald",
        titleFn: (d)=> { return 'Total ' + d},
        bodyFont: "Merriweather Sans",
        barChartHeight: 0.7,
        barChartHeightOffset: 0.15
    }
}

const commaFormat = format(',');
//The start angle in degrees for each of the non-node leaf titles
const rotationText = [-14, 4, 23, -18, -10.5, -20, 20, 20, 46, -30, -25, -20, 20, 15, -30, -15, -45, 12, -15, -16, 15, 15, 5, 18, 5, 15, 20, -20, -25]; //The rotation of each arc text

class CirclePack extends AbstractChart {
    constructor(canvasId, _userOptions) {
        super(canvasId, _userOptions);

        this.barDimVal = (d)=> {  return d[this._options.data.x.accessor]; };
        this.barMetVal = (d)=> {  return d[this._options.data.y.accessor];  };

        this._fontCanvasId = 'canvas-' + uuid();
        this._fontCanvasDom = '#' + this._fontCanvasId;
        this._hiddenCanvasId = "hiddenCanvas-" + uuid();
    }

    render(_data) {
        this.data(_data);
        this._color = this._provideColor();

        let layoutData = this._data;

        //Create the visible canvas and this.context
        let canvas = select(this._containerId)
            .append("canvas")
            .attr("id", this._fontCanvasId)
            .attr("width", this._options.chart.innerWidth)
            .attr("height", this._options.chart.innerHeight);

        this.context = canvas.node().getContext("2d");
        this.context.clearRect(0, 0, this._options.chart.innerWidth, this._options.chart.innerHeight);

        //Create a hidden canvas in which each circle will have a different color
        //We can use this to capture the clicked/hovered over on circle
        let hiddenCanvas = select(this._containerId)
            .append("canvas")
            .attr("id", this._hiddenCanvasId)
            .attr("width", this._options.chart.innerWidth)
            .attr("height", this._options.chart.innerHeight)
            .style("display", "none");

        this.hiddenContext = hiddenCanvas.node().getContext("2d");
        this.hiddenContext.clearRect(0, 0, this._options.chart.innerWidth, this._options.chart.innerHeight);

        this.centerX = this._options.chart.innerWidth / 2;
        this.centerY = this._options.chart.innerHeight / 2;

        //////////////////////////////////////////////////////////////
        /////////////////////// Create Scales  ///////////////////////
        //////////////////////////////////////////////////////////////


        this.diameter = Math.min(this._options.chart.innerWidth * 0.9, this._options.chart.innerHeight * 0.9);
        let radius = this.diameter / 2;

        this.zoomInfo = {
            centerX: this.centerX,
            centerY: this.centerY,
            scale: 1
        };

        //Dataset to swtich between color of a circle (in the hidden canvas) and the node data
        this.colToCircle = {};

        this._hierarchy = hierarchy(layoutData, (d)=> {return d.children; })
            .sum((d)=> { return d.size; });

        const _treeDepth = range(0, this._hierarchy.height - 1, 1);
        this.colorCircle = scaleOrdinal()
            .domain(_treeDepth)
            .range(this._options.plots.circleColors);


        let packLayout = pack()
            .padding(1)
            .size([this.diameter, this.diameter]);

        packLayout(this._hierarchy);

        //////////////////////////////////////////////////////////////
        ////////////// Create Circle Packing Data ////////////////////
        //////////////////////////////////////////////////////////////

        this.nodes = this._hierarchy.descendants();
        this.root = this._hierarchy;
        this.focus = this.root;
        this.nodeCount = this.nodes.length;
        this.rootName = this.root.data.name;

        this.nodeByName = {};
        for (let d of this.nodes) {
            this.nodeByName[d.data.name] = d;
        }

        let sampleLeaf = this._hierarchy.leaves()[0];

        let barDimList = uniq(sampleLeaf.data._data, this.barDimVal);
        this._color.domain(barDimList);
        this.elementsPerBar = barDimList.length;


        //Default values for variables - set to root
        this.kids = [this.rootName]; //needed to check which arced titles to show - only those close to the parent node

        //Setup the kids variable for the top (root) level
        for (let i = 0; i < this.root.children.length; i++) {
            this.kids.push(this.root.children[i].name)
        }

        //Function to run oif a user clicks on the canvas
        let clickFunction = (e)=> {
            //Figure out where the mouse click occurred.
            let mouseX = e.offsetX; //e.layerX;
            let mouseY = e.offsetY; //e.layerY;

            // Get the corresponding pixel color on the hidden canvas and look up the node in our map.
            // This will return that pixel's color
            let col = this.hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
            //Our map uses these rgb strings as keys to nodes.
            let colString = "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
            let node = this.colToCircle[colString];

            //If there was an actual node clicked on, zoom into this
            if (node) {
                //If the same node is clicked twice, set it to the top (root) level
                if (this.focus === node) node = this.root;

                //Save the names of the circle itself and first children
                //Needed to check which arc titles to show
                this.kids = [node.data.name];
                if (!isUndefined(node.children)) {
                    for (let i = 0; i < node.children.length; i++) {
                        this.kids.push(node.children[i].data.name)
                    }//for i
                }//if

                //Perform the zoom
                this._zoomToCanvas(node);
            }//if -> node

        }//function clickFunction

        //Listen for clicks on the main canvas
        document.getElementById(this._fontCanvasId).addEventListener("click", clickFunction);
        // canvas.on("click", clickFunction);
        this._enableMouseZoom();

        //////////////////////////////////////////////////////////////
        ///////////////////// Zoom Function //////////////////////////
        //////////////////////////////////////////////////////////////

        //Based on the generous help by Stephan Smola
        //http://bl.ocks.org/smoli/d7e4f9199c15d71258b5

        this._cubicEase = easeCubicInOut;
        this.timeElapsed = 0;
        this.interpolator = null;
        this.duration = 1500; //Starting duration
        this.vOld = [this.focus.x, this.focus.y, this.focus.r * 2.05];


        //Text fading variables
        this.showText = true; //Only show the text while you're not zooming
        this.textAlpha = 1; //After a zoom is finished fade in the text;
        this.fadeText = false;
        this.fadeTextDuration = 750;


        //////////////////////////////////////////////////////////////
        /////////////////////// Initiate /////////////////////////////
        //////////////////////////////////////////////////////////////

        //First zoom to get the circles to the right location
        this._zoomToCanvas(this.root);
        //Draw the hidden canvas at least once
        this._drawCanvas(this.hiddenContext, true);
        //Draw the legend
        this.scaleFactor = 1; //dummy value
        // this.createLegend(scaleFactor);

        //Start the drawing loop. It will jump out of the loop once stopTimer becomes true
        this.stopTimer = false;
        this._animate();

    }//drawAll


    _enableMouseZoom() {
        //////////////////////////////////////////////////////////////
        //////////////// Mousemove functionality /////////////////////
        //////////////////////////////////////////////////////////////

        //Only run this if the user actually has a mouse
        if (!this.mobileSize) {
            let nodeOld = this.root;

            //Listen for mouse moves on the main canvas
            let mousemoveFunction = (e)=> {
                if (!e)
                    return;
                //Figure out where the mouse click occurred.
                let mouseX = e.offsetX; //e.layerX;
                let mouseY = e.offsetY; //e.layerY;

                // Get the corresponding pixel color on the hidden canvas and look up the node in our map.
                // This will return that pixel's color
                let col = this.hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
                //Our map uses these rgb strings as keys to nodes.
                let colString = "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
                let node = this.colToCircle[colString];

                //Only change the popover if the user mouses over something new
                if (node !== nodeOld) {
                    //Remove all previous popovers
                    select('.popoverWrapper').remove();
                    selectAll('.popover').remove();
                    //Only continue when the user mouses over an actual node
                    if (node) {
                        //Only show a popover for the leaf nodes
                        if (has(node.data, '_data')) {
                            //Needed for placement
                            let nodeX = ((node.x - this.zoomInfo.centerX) * this.zoomInfo.scale) + this.centerX,
                                nodeY = ((node.y - this.zoomInfo.centerY) * this.zoomInfo.scale) + this.centerY,
                                nodeR = node.r * this.zoomInfo.scale;

                            //Create the wrapper div for the popover
                            let div = document.createElement('div');
                            div.setAttribute('class', 'popoverWrapper');
                            document.getElementById(this._containerId.substring(1)).appendChild(div);

                            //Position the wrapper right above the circle
                            select(".popoverWrapper").style({
                                'position': 'absolute',
                                'top': nodeY - nodeR,
                                'left': nodeX + this._options.plots.padding * 5 / 4
                            });

                            //Show the tooltip
                            $(".popoverWrapper").popover({
                                placement: 'auto top',
                                container: 'body',
                                trigger: 'manual',
                                html: true,
                                animation: false,
                                content:  ()=> {
                                    return "<span class='nodeTooltip'>" + node.data.name + "</span>";
                                }
                            });
                            $(".popoverWrapper").popover('show');
                        }
                    }
                }

                nodeOld = node;
            }//function mousemoveFunction

            //document.getElementById(this._frontCanvasId).addEventListener("mousemove", mousemoveFunction);
            select(this._fontCanvasDom).on("mousemove", mousemoveFunction);

        }//if !mobileSize
    }


    //The draw function of the canvas that gets called on each frame
    _drawCanvas(chosenContext, hidden = false) {
        const _treeDepth = range(0, this._hierarchy.height - 1, 1);
        //Clear canvas
        chosenContext.fillStyle = "#fff";
        chosenContext.rect(0, 0, this._options.chart.innerWidth, this._options.chart.innerHeight);
        chosenContext.fill();

        //Select our dummy nodes and draw the data to canvas.
        let node = null;
        // It's slightly faster than nodes.forEach()
        for (let i = 0; i < this.nodeCount; i++) {
            node = this.nodes[i];

            //If the hidden canvas was send into this function and it does not yet have a color, generate a unique one
            if (hidden) {
                if (node.color == null) {
                    // If we have never drawn the node to the hidden canvas get a new color for it and put it in the dictionary.
                    node.color = genColor();
                    this.colToCircle[node.color] = node;
                }//if
                // On the hidden canvas each rectangle gets a unique color.
                chosenContext.fillStyle = node.color;
            } else {
                chosenContext.fillStyle = node.children ? this.colorCircle(node.depth) : "white";
            }//else

            let nodeX = ((node.x - this.zoomInfo.centerX) * this.zoomInfo.scale) + this.centerX,
                nodeY = ((node.y - this.zoomInfo.centerY) * this.zoomInfo.scale) + this.centerY,
                nodeR = node.r * this.zoomInfo.scale;

            //Use one node to reset the scale factor for the legend
            if (i === _treeDepth) this.scaleFactor = node.value / (nodeR * nodeR);

            //Draw each circle
            chosenContext.beginPath();
            chosenContext.arc(nodeX, nodeY, nodeR, 0, 2 * Math.PI, true);
            chosenContext.fill();

            //Draw the bars inside the circles (only in the visible canvas)
            //Only draw bars in leaf nodes
            if (has(node.data, '_data')) {
                //Only draw the bars that are in the same parent ID as the clicked on node
                if (sameBranch(node, this.focus)
                    && !hidden) {

                    //Variables for the bar title
                    let drawTitle = true;
                    let fontSizeTitle = Math.round(nodeR / 10);
                    if (fontSizeTitle < 8) drawTitle = false;

                    //Only draw the title if the font size is big enough
                    if (drawTitle & this.showText) {
                        //First the light grey total text
                        chosenContext.font = (fontSizeTitle * 0.5 <= 5 ? 0 : Math.round(fontSizeTitle * 0.5)) + "px " + this._options.bodyFont;
                        chosenContext.fillStyle = "rgba(191,191,191," + this.textAlpha + ")" //"#BFBFBF";
                        chosenContext.textAlign = "center";
                        chosenContext.textBaseline = "middle";
                        chosenContext.fillText(this._options.plots.titleFn(commaFormat(node.data.size)), nodeX, nodeY + -0.75 * nodeR);

                        //Get the text back in pieces that will fit inside the node
                        let titleText = getLines(chosenContext, node.data.name, nodeR * 2 * 0.7, fontSizeTitle, this._options.titleFont);
                        //Loop over all the pieces and draw each line
                        titleText.forEach( (txt, iterator)=> {
                            chosenContext.font = fontSizeTitle + "px " + this._options.titleFont;
                            chosenContext.fillStyle = "rgba(" + this._options.plots.mainTextColor[0] + "," + this._options.plots.mainTextColor[1] + "," + this._options.plots.mainTextColor[2] + "," + this.textAlpha + ")";
                            chosenContext.textAlign = "center";
                            chosenContext.textBaseline = "middle";
                            chosenContext.fillText(txt, nodeX, nodeY + (-0.65 + iterator * 0.125) * nodeR);
                        })//forEach

                    }

                    this._drawBars(chosenContext, node, nodeX, nodeY, nodeR);

                }
            }

        }//for i

        let counter = 0; //Needed for the rotation of the arc titles

        //Do a second loop because the arc titles always have to be drawn on top
        for (let i = 0; i < this.nodeCount; i++) {
            node = this.nodes[i];

            let nodeX = ((node.x - this.zoomInfo.centerX) * this.zoomInfo.scale) + this.centerX,
                nodeY = ((node.y - this.zoomInfo.centerY) * this.zoomInfo.scale) + this.centerY,
                nodeR = node.r * this.zoomInfo.scale;

            //Don't draw for leaf-nodes
            //And don't draw the arced label for the largest outer circle
            //And don't draw these things for the hidden layer
            //And only draw these while showText = true (so not during a zoom)
            //And hide those not close the the parent
            if (!isUndefined(node.parent) && !isUndefined(node.children)) {
                if (node.data.name !== this.rootName & !hidden & this.showText & includes(this.kids, node.data.name) >= 0) {
                    //Calculate the best font size for the non-leaf nodes
                    let fontSizeTitle = Math.round(nodeR / 10);
                    if (fontSizeTitle > 4) drawCircularText(chosenContext, node.data.name.replace(/,? and /g, ' & '), fontSizeTitle, this._options.titleFont, nodeX, nodeY, nodeR, rotationText[counter], 0, this.textAlpha);
                }//if
                counter = counter + 1;
            }//if

        }//for i

    }//function _drawCanvas

    _drawBars(chosenContext, node, nodeX, nodeY, nodeR) {
        //The barscale differs per node
        let barScale = scaleLinear()
            .domain([0, max(node.data._data, this.barMetVal)]) //max value of bar charts in circle
            .range([0, nodeR]);

        //Variables for the bar chart
        let bars = node.data._data;
        let totalOffset = nodeX + -nodeR * 0.3;
        let eachBarHeight = ((1 - this._options.plots.barChartHeightOffset)
                * 2
                * nodeR
                * this._options.plots.barChartHeight)
                / this.elementsPerBar;
        let barHeight = eachBarHeight * 0.8;

        //Variables for the labels on the bars: Age
        let drawLabelText = true;
        let fontSizeLabels = Math.round(nodeR / 18);
        if (fontSizeLabels < 6) drawLabelText = false;

        //Variables for the value labels on the end of each bar
        let drawValueText = true;
        let fontSizeValues = Math.round(nodeR / 22);
        if (fontSizeValues < 6) drawValueText = false;

        //Only draw the bars and all labels of each bar has a height of at least 1 pixel
        if (Math.round(barHeight) > 1) {
            //Loop over each bar
            for (let j = 0; j < bars.length; j++) {
                let bar = bars[j];

                bar.width = (isNaN(this.barMetVal(bar)) ? 0 : barScale(this.barMetVal(bar)));
                bar.barPiecePosition = nodeY + this._options.plots.barChartHeightOffset * 2 * nodeR + j * eachBarHeight - this._options.plots.barChartHeight * nodeR;

                //Draw the bar
                chosenContext.beginPath();
                chosenContext.fillStyle = this._color(this.barDimVal(bar));
                chosenContext.fillRect(nodeX + -nodeR * 0.3, bar.barPiecePosition, bar.width, barHeight);
                chosenContext.fill();

                //Only draw the age labels if the font size is big enough
                if (drawLabelText & this.showText) {
                    chosenContext.font = fontSizeLabels + "px " + this._options.bodyFont;
                    chosenContext.fillStyle = "rgba(" + this._options.plots.mainTextColor[0] + "," + this._options.plots.mainTextColor[1] + "," + this._options.plots.mainTextColor[2] + "," + this.textAlpha + ")";
                    chosenContext.textAlign = "right";
                    chosenContext.textBaseline = "middle";
                    chosenContext.fillText(this.barDimVal(bar), nodeX + -nodeR * 0.35, bar.barPiecePosition + 0.5 * barHeight);
                }//if

                //Only draw the value labels if the font size is big enough
                if (drawValueText & this.showText) {
                    chosenContext.font = fontSizeValues + "px " + this._options.bodyFont;
                    let txt = commaFormat(this.barMetVal(bar));
                    //Check to see if the bar is big enough to place the text inside it
                    //If not, place the text outside the bar
                    let textWidth = chosenContext.measureText(txt).width;
                    let valuePos = (textWidth * 1.1 > (bar.width - nodeR * 0.03) ? "left" : "right");

                    //Calculate the x position of the bar value label
                    bar.valueLoc = nodeX + -nodeR * 0.3 + bar.width + (valuePos === "left" ? (nodeR * 0.03) : (-nodeR * 0.03));

                    //Draw the text
                    chosenContext.fillStyle = (valuePos === "left" ? "rgba(51,51,51," + this.textAlpha + ")" : "rgba(255,255,255," + this.textAlpha + ")"); //#333333 or white
                    chosenContext.textAlign = valuePos;
                    chosenContext.textBaseline = "middle";
                    chosenContext.fillText(txt, bar.valueLoc, bar.barPiecePosition + 0.5 * barHeight);
                }//if

            }//for j
        }//if -> Math.round(barHeight) > 1
    }


    //Perform the interpolation and continuously change the this.zoomInfo while the "transition" occurs
    _interpolateZoom(dt) {
        if (this.interpolator) {
            this.timeElapsed += dt;
            let t = this._cubicEase(this.timeElapsed / this.duration); //mini this.interpolator that puts 0 - duration into 0 - 1 in a cubic-in-out fashion

            //Set the new zoom variables
            this.zoomInfo.centerX = this.interpolator(t)[0];
            this.zoomInfo.centerY = this.interpolator(t)[1];
            this.zoomInfo.scale = this.diameter / this.interpolator(t)[2];

            //After iteration is done remove the interpolater and set the fade text back into motion
            if (this.timeElapsed >= this.duration) {
                this.interpolator = null;
                this.showText = true;
                this.fadeText = true;
                this.timeElapsed = 0;

                //Draw the hidden canvas again, now that everything is settled in
                //to make sure it is in the same state as the visible canvas
                //This way the tooltip and click work correctly
                this._drawCanvas(this.hiddenContext, true);

                //Update the texts in the legend
                select(".legendWrapper").selectAll(".legendText")
                    .text( (d)=> {
                        return commaFormat(Math.round(this.scaleFactor * d * d / 10) * 10);
                    });

            }//if -> timeElapsed >= duration
        }//if -> this.interpolator
    }//function _zoomToCanvas

    //Function that fades in the text - Otherwise the text will be jittery during the zooming
    _interpolateFadeText(dt) {
        if (this.fadeText) {
            this.timeElapsed += dt;
            this.textAlpha = this._cubicEase(this.timeElapsed / this.fadeTextDuration);
            if (this.timeElapsed >= this.fadeTextDuration) {
                //Enable click & mouseover events again
                select(this._fontCanvasDom).style("pointer-events", "auto");

                this.fadeText = false; //Jump from loop after fade in is done
                this.stopTimer = true; //After the fade is done, stop with the redraws / animation
            }//if
        }//if
    }//function _interpolateFadeText


    //This function runs during changes in the visual - during a zoom
    _animate() {
        let dt = 0;

        let _timer = timer((elapsed) => {
            this._interpolateZoom(elapsed - dt);
            this._interpolateFadeText(elapsed - dt);
            dt = elapsed;

            this._drawCanvas(this.context, false);

            if (this.stopTimer === true) {
                _timer.stop();
            }
        });
    }//function _animate


    //Create the interpolation function between current view and the clicked on node
    _zoomToCanvas(focusNode) {

        //Temporarily disable click & mouseover events
        select(this._fontCanvasDom).style("pointer-events", "none");

        //Remove all previous popovers - if present
        select('.popoverWrapper').remove();
        selectAll('.popover').remove();

        //Set the new focus
        this.focus = focusNode;
        let v = [this.focus.x, this.focus.y, this.focus.r * 2.05]; //The center and width of the new "viewport"

        //Create interpolation between current and new "viewport"
        this.interpolator = interpolateZoom(this.vOld, v);

        //Set the needed "zoom" variables
        this.duration = Math.max(1500, this.interpolator.duration); //Interpolation gives back a suggested duration
        this.timeElapsed = 0; //Set the time elapsed for the interpolateZoom function to 0
        this.showText = false; //Don't show text during the zoom
        this.vOld = v; //Save the "viewport" of the next state as the next "old" state

        //Only show the circle legend when not at a leaf node
        if (has(focusNode.data, '_data')) {
            select("#legendRowWrapper").style("opacity", 0);
            select(".legendWrapper").transition().duration(1000).style("opacity", 0);
        } else {
            select("#legendRowWrapper").style("opacity", 1);
            select(".legendWrapper").transition().duration(1000).delay(this.duration).style("opacity", 1);
        }//else

        //Start animation
        this.stopTimer = false;
        this._animate();

    }//function _zoomToCanvas

    //Needed in the global scope
    search(_name = '') {
        if (!check(_name)) {
            console.log(' search term cannot be empty');
            return;
        }

        let _node = this.nodeByName[_name];

        if (!_node) {
            console.log(' node: ' + _name + ' cannot be found');
            return;
        }

        this._zoomToCanvas(_node);
    };

    nodeNames() {
        let _names = [];

        this._hierarchy.each((d)=>{
            _names.push(d.data.name);
        });

        return _names;
    }


    //////////////////////////////////////////////////////////////
    ///////////// Function | The legend creation /////////////////
    //////////////////////////////////////////////////////////////

    createLegend(legendId, scaleFactor = 1) {
        let legendSizes = [10, 30, 60];

        //select("#legendRowWrapper").style("opacity", 0);

        let width = parseInt(select(legendId).style('width'), 10),
            height = legendSizes[2] * 2 * 1.2;

        let legendCenter = -10,
            legendBottom = height,
            legendLineLength = legendSizes[2] * 1.3,
            textPadding = 5;

        //Create SVG for the legend
        let _legendSvg = select(legendId)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("class", "legendWrapper")
            .attr("transform", "translate(" + width / 2 + "," + 0 + ")")
            .style("opacity", 0);

        //Draw the circles
        _legendSvg.selectAll(".legendCircle")
            .data(legendSizes)
            .enter()
            .append("circle")
            .attr('r', (d)=> { return d; })
            .attr('class', "legendCircle")
            .attr('cx', legendCenter)
            .attr('cy',  (d)=> { return legendBottom - d; });
        //Draw the line connecting the top of the circle to the number
        _legendSvg.selectAll(".legendLine")
            .data(legendSizes)
            .enter().append("line")
            .attr('class', "legendLine")
            .attr('x1', legendCenter)
            .attr('y1', (d)=> { return legendBottom - 2 * d; })
            .attr('x2', legendCenter + legendLineLength)
            .attr('y2', (d)=> { return legendBottom - 2 * d; });
        //Place the value next to the line
        _legendSvg.selectAll(".legendText")
            .data(legendSizes)
            .enter().append("text")
            .attr('class', "legendText")
            .attr('x', legendCenter + legendLineLength + textPadding)
            .attr('y', (d)=> { return legendBottom - 2 * d; })
            .attr('dy', '0.3em')
            .text((d)=> { return commaFormat(Math.round(scaleFactor * d * d / 10) * 10); });


        //Slowly fade in so the scaleFactor is set to the correct value in the mean time :)
        select(".legendWrapper").transition().duration(1000).delay(500).style("opacity", 1);

    }//createLegend

    createOptions(_userOpt) {
        return mergeBase(DefaultOptions, _userOpt);
    };
}

export default CirclePack;