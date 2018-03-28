//From http://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
const getLines = (ctx, text, maxWidth, fontSize, titleFont) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    ctx.font = fontSize + 'px ' + titleFont;
    const width = ctx.measureText(currentLine + ' ' + word).width;
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
