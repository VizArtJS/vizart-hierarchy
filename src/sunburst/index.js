import { svgLayer, factory, DefaultCategoricalColor } from 'vizart-core';
import apiRender from './api-render';
import apiColor from './api-color';

const DefaultOptions = {
  chart: {
    type: 'sunburst',
  },
  color: DefaultCategoricalColor,
  plots: {
    drawLabels: true,
  },
};

export default factory(
    svgLayer, { opt: DefaultOptions }, [apiRender, apiColor]
);

