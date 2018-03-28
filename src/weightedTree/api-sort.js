const apiSort = state => ({
  sort(field, direction) {
    state._options.ordering = {
      name: field,
      direction: direction,
    };

    state.update();
  },
});

export default apiSort;
