const elbow = (d, i) => {
  return 'M' + d.parent.y + ',' + d.parent.x + 'V' + d.x + 'H' + (d.y - 0);
};

export default elbow;
