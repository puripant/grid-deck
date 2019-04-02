import React, {Component} from 'react';
import reactCSS from 'reactcss'
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL, {ScreenGridLayer} from 'deck.gl';
import {isWebGL2} from 'luma.gl';
import { SketchPicker } from 'react-color';
import { AST_LabelRef } from 'terser';

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

// Source data
let random_bangkok_points = [];
for(let i = 0; i < 1000; i++) {
  random_bangkok_points.push([100.50 + Math.random()*0.1, 13.70 + Math.random()*0.1, 1]);
}
const DATA = random_bangkok_points;

export const INITIAL_VIEW_STATE = {
  longitude: 100.55,
  latitude: 13.75,
  zoom: 9.0,
  minZoom: 10,
  maxZoom: 12,
  pitch: 0,
  bearing: 0
};

// function hexToRGB(hex) {
//   return [
//     parseInt(hex.substring(1, 3), 16),
//     parseInt(hex.substring(3, 5), 16),
//     parseInt(hex.substring(5, 7), 16),
//     255
//   ];
// }
function interpolateColors(start, end, num) {
  let result = [];
  for(let i = 0; i < num; i++) {
    let color = {};
    for(let key in start) {
      color[key] = (start[key] * (num - i - 1) / (num - 1)) + (end[key] * i / (num - 1));
    }
    result.push(color);
  }
  return result;
}
// function sixColorsFromInputs() {
//   let colors = interpolateColors(
//     hexToRGB(document.getElementById("color-min").value),
//     hexToRGB(document.getElementById("color-max").value),
//     6
//   )
//   // this.setState({
//   //   colorRange: colors
//   // })
//   return colors;
// }
// let sixColors = sixColorsFromInputs();
// document.getElementById("color-min").oninput = sixColorsFromInputs;
// document.getElementById("color-max").oninput = sixColorsFromInputs;

export class App extends Component {
  constructor() {
    super();

    this.handleClick = (event) => {
      switch (event.target.id) {
        case 'picker0': this.setState({ displayColorPicker0: !this.state.displayColorPicker0 }); break;
        case 'picker1': this.setState({ displayColorPicker1: !this.state.displayColorPicker1 }); break;
      }
    };
    this.handleClose = () => {
      this.setState({
        displayColorPicker0: false,
        displayColorPicker1: false,
      });
    };

    this.handleChange0 = (color) => {
      let rgba = color.rgb;
      rgba.a *= 255;
      this.setState({ color0: rgba });
    };
    this.handleChange1 = (color) => {
      let rgba = color.rgb;
      rgba.a *= 255;
      this.setState({ color1: rgba });
    };

    this.state = {
      displayColorPicker0: false,
      color0: {
        r: 241,
        g: 112,
        b: 19,
        a: 0,
      },
      displayColorPicker1: false,
      color1: {
        r: 241,
        g: 112,
        b: 19,
        a: 255,
      },
    };
  }

  _renderLayers() {
    const {data = DATA, cellSize = 20, colorRange, gpuAggregation = true, aggregation = 'Sum'} = this.props;

    return [
      new ScreenGridLayer({
        id: 'grid',
        data,
        getPosition: d => [d[0], d[1]],
        getWeight: d => d[2],
        cellSizePixels: cellSize,
        colorRange: interpolateColors(
          Object.values(this.state.color0),
          Object.values(this.state.color1),
          6
        ),
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

    const styles = reactCSS({
      'default': {
        color0: {
          background: `rgba(${this.state.color0.r}, ${this.state.color0.g}, ${this.state.color0.b}, ${this.state.color0.a})`,
        },
        color1: {
          background: `rgba(${this.state.color1.r}, ${this.state.color1.g}, ${this.state.color1.b}, ${this.state.color1.a})`,
        }
      },
    });

    return (
      <div>
        <div id="control-panel">
          <div>
            <label>Color for min value: </label>
            <div className="color-picker" id="picker0" onClick={this.handleClick}>
              <div className="color-picker-preview" style={styles.color0} />
            </div>
            {this.state.displayColorPicker0 ? <div className="popover">
              <div className="cover" onClick={this.handleClose} />
              <SketchPicker color={this.state.color0} onChange={this.handleChange0} />
            </div> : null}
          </div>
          <div>
            <label>Color for max value: </label>
            <div className="color-picker" id="picker1" onClick={this.handleClick}>
              <div className="color-picker-preview" style={styles.color1} />
            </div>
            {this.state.displayColorPicker1 ? <div className="popover">
              <div className="cover" onClick={this.handleClose} />
              <SketchPicker color={this.state.color1} onChange={this.handleChange1} />
            </div> : null}
          </div>
        </div>
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
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
