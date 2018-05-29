import zoomToCanvas from './zoom-to-canvas';

const apiSearch = state => ({
  //Needed in the global scope
  search(_name = '') {
    const { nodeByName } = state;
    if (!_name) {
      console.log(' search term cannot be empty');
      return;
    }

    const _node = nodeByName[_name];

    if (!_node) {
      console.log(' node: ' + _name + ' cannot be found');
      return;
    }

    zoomToCanvas(state, _node);
  },
});

export default apiSearch;
