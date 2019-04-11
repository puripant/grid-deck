import React, {Component} from 'react';
import reactCSS from 'reactcss'
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL, {GridLayer, IconLayer} from 'deck.gl';
import {isWebGL2} from 'luma.gl';
import {SketchPicker} from 'react-color';
import {AST_LabelRef} from 'terser';

// Mapbox token
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

// Data
let many_random_points = [];
for(let i = 0; i < 50000; i++) {
  many_random_points.push([100.50 + Math.random()*0.1, 13.70 + Math.random()*0.1, 1]);
}
let few_random_points = [];
for (let i = 0; i < 100; i++) {
  few_random_points.push([100.50 + Math.random() * 0.1, 13.70 + Math.random() * 0.1, 1]);
}

export const INITIAL_VIEW_STATE = {
  longitude: 100.55,
  latitude: 13.75,
  zoom: 11.0,
  minZoom: 9,
  maxZoom: 20,
  pitch: 0,
  bearing: 0
};

const white = [255, 255, 255, 100];
function interpolateToWhite(start, num, reversed) {
  let result = [];
  for (let i = 0; i < num; i++) {
    let color = [];
    for (let j = 0; j < start.length; j++) {
      color.push((start[j] * (num - i - 1) / (num - 1)) + (white[j] * i / (num - 1)));
    }
    result.push(color);
  }
  return reversed ? result.reverse() : result;
}
function interpolateColors(start, end, num) { // start & end are RGBA arrays
  return interpolateToWhite(start, num/2, false).concat(interpolateToWhite(end, num/2, true));
  // let result = [];
  // for(let i = 0; i < num; i++) {
  //   let color = [];
  //   for(let j = 0; j < start.length; j++) {
  //     color.push((start[j] * (num - i - 1) / (num - 1)) + (end[j] * i / (num - 1)));
  //   }
  //   result.push(color);
  // }
  // return result;
}

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
      this.setState({ color0: color.rgb });
    };
    this.handleChange1 = (color) => {
      this.setState({ color1: color.rgb });
    };

    this.state = {
      displayColorPicker0: false,
      color0: { r: 0, g: 112, b: 19, a: 1 },
      displayColorPicker1: false,
      color1: { r: 241, g: 112, b: 19, a: 1 },
      tooltipText: '',
    };
  }

  _renderLayers() {
    const {
      cellSize = 250,
      iconMapping = 'data/location-icon-mapping.json',
      iconAtlas = 'data/location-icon-atlas.png',
    } = this.props;
    let color0 = Object.values(this.state.color0);
    color0[3] *= 255;
    let color1 = Object.values(this.state.color1);
    color1[3] *= 255;

    return [
      new GridLayer({
        id: 'grid',
        data: many_random_points,
        pickable: true,
        cellSize: cellSize,
        extruded: false,
        getPosition: d => d,
        colorRange: interpolateColors(color0, color1, 8),
        onHover: d => {
          this.setState({
            tooltipText: d.object.count,
          })
        }
      }),
      new IconLayer({
        id: 'icon',
        data: few_random_points,
        pickable: true,
        iconAtlas,
        iconMapping,
        getIcon: d => 'marker-1',
        getPosition: d => d,
        getSize: d => 50,
        onHover: d => {
          this.setState({
            tooltipText: `${d.object[0].toFixed(2)}, ${d.object[1].toFixed(2)}`,
          })
        }
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
        },
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
          <div>
            Current value: {this.state.tooltipText ? this.state.tooltipText : ''}
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
              mapStyle="mapbox://styles/itwasup/cjttj9web0vp71fql3gcugusz"
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
