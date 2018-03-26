import { select } from 'd3-selection';

const enableMouseZoom = state => {
  const {
    _containerId,
    mobileSize,
    root,
    fontCanvasDom,
    colToCircle,
    _hiddenContext,
    zoomInfo,
    centerX,
    centerY,
    _options,
  } = state;
  //////////////////////////////////////////////////////////////
  //////////////// Mousemove functionality /////////////////////
  //////////////////////////////////////////////////////////////

  //Only run this if the user actually has a mouse
  if (!mobileSize) {
    let nodeOld = root;

    //Listen for mouse moves on the main canvas
    const mousemoveFunction = e => {
      if (!e) return;
      //Figure out where the mouse click occurred.
      const mouseX = e.offsetX; //e.layerX;
      const mouseY = e.offsetY; //e.layerY;

      // Get the corresponding pixel color on the hidden canvas and look up the node in our map.
      // This will return that pixel's color
      const col = _hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
      //Our map uses these rgb strings as keys to nodes.
      const colString = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
      const node = colToCircle[colString];

      //Only change the popover if the user mouses over something new
      if (node !== nodeOld) {
        //Remove all previous popovers
        select('.popoverWrapper').remove();
        selectAll('.popover').remove();
        //Only continue when the user mouses over an actual node
        if (node) {
          //Only show a popover for the leaf nodes
          if (node.data.hasOwnProperty('_data')) {
            //Needed for placement
            let nodeX = (node.x - zoomInfo.centerX) * zoomInfo.scale + centerX,
              nodeY = (node.y - zoomInfo.centerY) * zoomInfo.scale + centerY,
              nodeR = node.r * zoomInfo.scale;

            //Create the wrapper div for the popover
            const div = document.createElement('div');
            div.setAttribute('class', 'popoverWrapper');
            document.getElementById(_containerId.substring(1)).appendChild(div);

            //Position the wrapper right above the circle
            select('.popoverWrapper').style({
              position: 'absolute',
              top: nodeY - nodeR,
              left: nodeX + _options.plots.padding * 5 / 4,
            });

            //Show the tooltip
            $('.popoverWrapper').popover({
              placement: 'auto top',
              container: 'body',
              trigger: 'manual',
              html: true,
              animation: false,
              content: () => {
                return (
                  "<span class='nodeTooltip'>" + node.data.name + '</span>'
                );
              },
            });
            $('.popoverWrapper').popover('show');
          }
        }
      }

      nodeOld = node;
    }; //function mousemoveFunction

    //document.getElementById(this._frontCanvasId).addEventListener("mousemove", mousemoveFunction);
    select(fontCanvasDom).on('mousemove', mousemoveFunction);
  } //if !mobileSize
};

export default enableMouseZoom;
