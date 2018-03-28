import { svgLayer, factory, DefaultCategoricalColor } from 'vizart-core';
import apiRender from './api-render';
import apiMode from './api-mode';
import apiSort from './api-sort';
import apiUpdate from './api-update';
import apiColor from './api-color';

const DefaultOptions = {
  chart: {
    type: 'weighted-tree',
  },
  color: DefaultCategoricalColor,
  plots: {
    mode: 'tree',
    branchPadding: -1,
    fixedSpan: -1,
    nodeOpacity: 0.4,
    nodeStrokeOpacity: 0.6,
    linkOpacity: 0.35,
    textOffset: 12,
  },
};

export default factory(svgLayer, { opt: DefaultOptions }, [
  apiRender,
  apiUpdate,
  apiColor,
  apiMode,
  apiSort,
]);
