import { svgLayer, factory, DefaultCategoricalColor } from 'vizart-core';
import apiRender from './api-render';
import apiDrawLegend from './api-drawLegend';

const opt = {
  chart: {
    type: 'sequential-sunburst',
  },
  color: DefaultCategoricalColor,
  plots: {
    breadcrumb: { w: 75, h: 30, s: 3, t: 10 },
    legendMargin: { w: 75, h: 30, s: 3, r: 3 },
  },
  uiConfig: {
    sequence: null,
    explanation: null,
    percentage: null,
  },
};

export default factory(svgLayer, { opt }, [apiRender, apiDrawLegend]);
