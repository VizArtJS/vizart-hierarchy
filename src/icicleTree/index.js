import { svgLayer, factory, DefaultCategoricalColor } from 'vizart-core';
import apiRender from './api-render';
import apiColor from './api-color';

const opt = {
  chart: {
    type: 'icicle-tree',
  },
  color: DefaultCategoricalColor,
};

export default factory(svgLayer, { opt }, [apiRender, apiColor]);
