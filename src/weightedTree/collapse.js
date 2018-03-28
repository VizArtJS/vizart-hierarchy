// Collapse the node and all it's children
const collapse = d => {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
};

export default collapse;
