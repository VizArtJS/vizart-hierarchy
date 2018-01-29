import isUndefined from 'lodash-es/isUndefined';
import isNull from 'lodash-es/isNull';

let _checkParent = function(node, focus) {
  if (isUndefined(node.parent) || isNull(node.parent)) {
    return false;
  } else {
    if (node.parent === focus) {
      return true;
    } else {
      return _checkParent(node.parent);
    }
  }

  return false;
};

let sameBranch = function(node, focus) {
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
  return _checkParent(node, focus);
};

export default sameBranch;
