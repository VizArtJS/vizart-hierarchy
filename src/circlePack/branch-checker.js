const checkParent = (node, focus) => {
  if (node.parent === undefined || node.parent === null) {
    return false;
  } else {
    if (node.parent === focus) {
      return true;
    } else {
      return checkParent(node.parent);
    }
  }
};

const sameBranch = (node, focus) => {
  // no check on root node
  if (focus.parent === null) {
    return true;
  }

  // same node
  if (node === focus) {
    return true;
  }

  // same parent
  if (node.parent === focus.parent) {
    return true;
  }

  // descendant of focus
  return checkParent(node, focus);
};

export default sameBranch;
