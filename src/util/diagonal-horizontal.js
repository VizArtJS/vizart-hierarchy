const diagonalHorizontal = d =>
  'M' +
  d.y +
  ',' +
  d.x +
  'C' +
  (d.parent.y + 100) +
  ',' +
  d.x +
  ' ' +
  (d.parent.y + 100) +
  ',' +
  d.parent.x +
  ' ' +
  d.parent.y +
  ',' +
  d.parent.x;

export default diagonalHorizontal;
