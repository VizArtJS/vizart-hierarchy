# vizart-hierarchy

* [Demo](https://vizartjs.github.io/demo.html) quick reference with source code
* [Documentation](https://github.com/VizArtJS/vizart-hierarchy/wiki)



## Usage:

1. Install

```
npm install vizart-hierarchy --save
```

2. ES6 Usage

```
import 'vizart-hierarchy/dist/vizart-hierarchy.css';
import { WeightedTree } from 'vizart-hierarchy';

const _weightedTree = new WeightedTree(_domId, _opt)....
```

## Three steps to use a chart
1. initialize a chart with domId and declarative options
```
let _opt = {
  ...
};
const _chart = new Chord('#chart', _opt)
```
You only need to provide essential options. [Demo](https://vizartjs.github.io/demo.html) is a good place to check essential options for all charts. You may check up Documentation of each component for full option spec so as to control more chart behaviours.

2. Render a chart with data
```
_chart.render(data) // this should be called only once
```
3. Change a chart on the fly
```
let _opt = _chart.options();
_opt.plots.opacityArea = o.4
_chart.options(_opt);

_chart.update();
```


## Development
1. Clone repository
2. Run commands
```
npm install         // install dependencies
npm run dev         // view demos in web browser at localhost:3005
npm run build       // build
npm run test        // run tests only
npm run test:cover  // run tests and view coverage report
```

## API
* [Circle Pack](https://github.com/VizArtJS/vizart-hierarchy/wiki/circle-pack)
* [Weighted Tree](https://github.com/VizArtJS/vizart-hierarchy/wiki/weighted-tree)
* [Sunburst](https://github.com/VizArtJS/vizart-hierarchy/wiki/sunburst)
* [Sequential Sunburst](https://github.com/VizArtJS/vizart-hierarchy/wiki/sequential-sunburst)
* [Icicle Tree](https://github.com/VizArtJS/vizart-hierarchy/wiki/icicle-tree)

## Credits
This library based on other people's awesome visualizations:
* Circle Pack is based on Nadieh Bremer's [A closer look at labor](https://www.visualcinnamon.com/occupations)
* Weighted Tree is inspired from vizuly's [weighted tree](http://vizuly.io/product/weighted-tree/)
* Sequential Sunburst is based on Kerry Rodden's [Sequential Sunburst](https://bl.ocks.org/kerryrodden/7090426)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
