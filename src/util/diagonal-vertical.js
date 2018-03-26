const diagonalVertical = d => 'M' +
    d.source.x +
    ',' +
    d.source.y +
    'C' +
    (d.source.x + d.target.x) / 2 +
    ',' +
    d.source.y +
    ' ' +
    (d.source.x + d.target.x) / 2 +
    ',' +
    d.target.y +
    ' ' +
    d.target.x +
    ',' +
    d.target.y;

export default diagonalVertical;
