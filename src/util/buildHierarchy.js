// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how
// often that sequence occurred.

const buildHierarchy = csv => {
  const root = { name: 'root', children: [] };

  for (let i = 0; i < csv.length; i++) {
    let sequence = csv[i][0];
    let size = +csv[i][1];

    if (isNaN(size)) {
      // e.g. if this is a header row
      continue;
    }
    let parts = sequence.split('-');
    let currentNode = root;
    for (let j = 0; j < parts.length; j++) {
      let children = currentNode['children'];
      let nodeName = parts[j];
      let childNode;
      if (j + 1 < parts.length) {
        // Not yet at the end of the sequence; move down the tree.
        let foundChild = false;
        for (let k = 0; k < children.length; k++) {
          if (children[k]['name'] == nodeName) {
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        // If we don't already have a child node for this branch, create it.
        if (!foundChild) {
          childNode = { name: nodeName, children: [] };
          children.push(childNode);
        }
        currentNode = childNode;
      } else {
        // Reached the end of the sequence; create a leaf node.
        childNode = { name: nodeName, size: size };
        children.push(childNode);
      }
    }
  }

  return root;
};

export default buildHierarchy;
