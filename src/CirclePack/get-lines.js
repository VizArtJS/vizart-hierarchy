//From http://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
let getLines = (ctx, text, maxWidth, fontSize, titleFont) => {
  let words = text.split(' ');
  let lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    let word = words[i];
    ctx.font = fontSize + 'px ' + titleFont;
    let width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}; //function getLines

export default getLines;
