const apiNodeNames = state => ({
  nodeNames() {
    const { _hierarchy } = state;
    let _names = [];

    _hierarchy.each(d => {
      _names.push(d.data.name);
    });

    return _names;
  },
});

export default apiNodeNames;
