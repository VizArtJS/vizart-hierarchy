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
* [Circle Pack](#circle-pack)
* [Weighted Tree](#weighted-tree)
* [Sunburst](#sunburst)
* [Icicle Tree](#icicle-tree)

### Circle Pack
[<img alt="Circle Pack" src="https://github.com/vizartjs/vizartjs.github.io/blob/master/img/charts/circle_pack.jpg">](https://vizartjs.github.io/circle_pack.html)
```javascript
import { CirclePack } from 'vizart-hierarchy';
import 'vizart-hierarchy/dist/vizart-hierarchy.css';

const options = {
	data: {
		x: { name: 'School', type: 'string', accessor: 'MX'},
		y: { name: 'Book Borrowings', type: 'number', accessor: 'MY'},
	},

	plots: {
		titleFn: (d)=> { return 'Total: ' + d + ' borrowings'}
	}
};


let chart = new VizArtHierarchy.CirclePack('#chart', options);
$.getJSON('./data/library.json', function(data){
	chart.render(data);
	chart.createLegend('#legendCircles');
});
	
```
Options sepc
```
{
    chart: {
        type: 'circle-pack',
        margin: NoMargin,
    },
    color: DefaultCategoricalColor,
    renderer: 'canvas',
    data: {
        x:  { name: 'dimension', type: 'string', accessor: 'MX'},
        y: { name: 'metric', type: 'number', accessor: 'MY'},
    },
    plots: {
        padding: 20,
        circleColors: ['#bdd7e7',
            '#6baed6',
            '#3182bd',
            '#08519c'],
        mainTextColor: [74, 74, 74],//"#4A4A4A",
        titleFont: "Oswald",
        titleFn: (d)=> { return 'Total ' + d},
        bodyFont: "Merriweather Sans",
        barChartHeight: 0.7,
        barChartHeightOffset: 0.15
    }
}
```


### Weighted Tree
[<img alt="Weighted Tree" src="https://github.com/vizartjs/vizartjs.github.io/blob/master/img/charts/weighted_tree.jpg">](https://vizartjs.github.io/weighted_tree.html)
```javascript
import { WeightedTree } from 'vizart-hierarchy';
import 'vizart-hierarchy/dist/vizart-hierarchy.css';

d3.json("./data/flare.json", (data)=> {
	let chart = WeightedTree('#chart', {
		chart: {
			margin: {
				top: 40,
				bottom: 40,
				left: 0,
				right: 0
			},
		},
	});

	chart.render(json);
});
	
```
Option spec
```
{
    chart: {
        type: 'weighted-tree',
        margin: NoMargin
    },
    color: DefaultCategoricalColor,
    plots: {
        mode: 'tree',
        branchPadding: -1,
        fixedSpan : -1,
        nodeOpacity: 0.4,
        nodeStrokeOpacity: 0.6,
        linkOpacity: 0.35,
        textOffset: 12
    }
}
```
### Sunburst
[<img alt="Sunburst" src="https://github.com/vizartjs/vizartjs.github.io/blob/master/img/charts/sunburst.jpg">](https://vizartjs.github.io/sunburst.html)
```javascript
import { Sunburst } from 'vizart-hierarchy';
import 'vizart-hierarchy/dist/vizart-hierarchy.css';

d3.json("./data/flare.json", (data)=> {
	let chart = Sunburst('#chart', {
		chart: {
			margin: {
				top: 40,
				bottom: 40,
				left: 0,
				right: 0
			},
		},
	});

	chart.render(json);
});
```

Option spec
```
{
    chart: {
        type: 'sunburst',
        margin: NoMargin
    },
    color: DefaultCategoricalColor,
    plots: {
        drawLabels: true
    }
}
```
### Icicle Tree
[<img alt="Icicle Tree" src="https://github.com/vizartjs/vizartjs.github.io/blob/master/img/charts/icicle_tree.jpg">](https://vizartjs.github.io/icicle_tree.html)
```javascript
import { IcicleTree } from 'vizart-hierarchy';
import 'vizart-hierarchy/dist/vizart-hierarchy.css';

d3.json("./data/flare.json", (data)=> {
	let chart = new IcicleTree('#chart', {
		chart: {
			margin: {
				top: 40,
				bottom: 40,
				left: 0,
				right: 0
			},
		},
	});

	chart.render(json);
});
```

Option spec
```
{
    chart: {
        type: 'icicle-tree',
        margin: NoMargin
    },
    color: DefaultCategoricalColor
}
```
## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
