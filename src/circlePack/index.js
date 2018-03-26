import { canvasLayer, factory, DefaultCategoricalColor } from 'vizart-core';
import apiRender from './api-render';
import apiNodeNames from './api-nodeNames';
import apiSearch from './api-search';
import apiCreateLegend from './api-createLegend';

const DefaultOptions = {
  chart: {
    type: 'circle-pack',
  },
  color: DefaultCategoricalColor,
  renderer: 'canvas',
  data: {
    x: { name: 'dimension', type: 'string', accessor: 'MX' },
    y: { name: 'metric', type: 'number', accessor: 'MY' },
  },
  plots: {
    padding: 20,
    circleColors: ['#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
    mainTextColor: [74, 74, 74], //"#4A4A4A",
    titleFont: 'Oswald',
    titleFn: d => 'Total ' + d,
    bodyFont: 'Merriweather Sans',
    barChartHeight: 0.7,
    barChartHeightOffset: 0.15,
  },
};

export default factory(canvasLayer, { opt: DefaultOptions }, [
  apiRender,
  apiSearch,
  apiCreateLegend,
  apiNodeNames,
]);
