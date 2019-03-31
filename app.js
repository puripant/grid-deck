import React, {Component} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL, {ScreenGridLayer} from 'deck.gl';
import {isWebGL2} from 'luma.gl';

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

// Source data
let random_bangkok_points = [];
for(let i = 0; i < 100; i++) {
  random_bangkok_points.push([100.50 + Math.random()*0.1, 13.70 + Math.random()*0.1, 1]);
}
const DATA = random_bangkok_points;

export const INITIAL_VIEW_STATE = {
  longitude: 100.60,
  latitude: 13.75,
  zoom: 9.0,
  maxZoom: 16,
  pitch: 0,
  bearing: 0
};

const colorRange = [
  [255, 255, 178, 25],
  [254, 217, 118, 85],
  [254, 178, 76, 127],
  [253, 141, 60, 170],
  [240, 59, 32, 212],
  [189, 0, 38, 255]
];

export class App extends Component {
  _renderLayers() {
    const {data = DATA, cellSize = 20, gpuAggregation = true, aggregation = 'Sum'} = this.props;

    return [
      new ScreenGridLayer({
        id: 'grid',
        data,
        getPosition: d => [d[0], d[1]],
        getWeight: d => d[2],
        cellSizePixels: cellSize,
        colorRange,
        gpuAggregation,
        aggregation
      })
    ];
  }

  _onInitialized(gl) {
    if (!isWebGL2(gl)) {
      console.warn('GPU aggregation is not supported'); // eslint-disable-line
      if (this.props.disableGPUAggregation) {
        this.props.disableGPUAggregation();
      }
    }
  }

  render() {
    const {viewState, controller = true, baseMap = true} = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        initialViewState={INITIAL_VIEW_STATE}
        onWebGLInitialized={this._onInitialized.bind(this)}
        viewState={viewState}
        controller={controller}
      >
        {baseMap && (
          <StaticMap
            reuseMaps
            mapStyle="mapbox://styles/mapbox/dark-v9"
            preventStyleDiffing={true}
            mapboxApiAccessToken={MAPBOX_TOKEN}
          />
        )}
      </DeckGL>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
