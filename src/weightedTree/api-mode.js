import { transition } from 'd3-transition';
import diagonalHorizontal from '../util/diagonal-horizontal';
import { cluster } from 'd3-hierarchy';

const apiMode = state => ({
  mode(_mode) {
    const { _options, node, link, root, _containerId } = state;
    _options.mode = _mode;

    const _tree =
      _options.mode === 'tree'
        ? tree().size([_options.chart.innerHeight, _options.chart.innerWidth])
        : cluster().size([
            _options.chart.innerHeight,
            _options.chart.innerWidth,
          ]);

    _tree(root);

    const t = transition().duration(750);
    t.selectAll(_containerId + ' .node').attr(
      'transform',
      d => 'translate(' + d.y + ',' + d.x + ')'
    );
    t.selectAll(_containerId + ' .link').attr('d', diagonalHorizontal);
  },
});

export default apiMode;
