import React, { Component } from 'react';
import reactCSS from 'reactcss'
import { render } from 'react-dom';
import { StaticMap } from 'react-map-gl';
import DeckGL, { GridLayer, IconLayer } from 'deck.gl';
import { isWebGL2 } from 'luma.gl';
import { SketchPicker } from 'react-color';
import { Checkbox } from 'semantic-ui-react'

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

function interpolateColorPair(start, end, num) {
  let result = [];
  for(let i = 0; i < num; i++) {
    let color = [];
    for(let j = 0; j < start.length; j++) {
      color.push((start[j] * (num - i - 1) / (num - 1)) + (end[j] * i / (num - 1)));
    }
    result.push(color);
  }
  return result;
}
function interpolateColors(start, mid, end, num) { // start, mid, and end are RGBA arrays
  // TODO currently assume num is an even number
  return interpolateColorPair(start, mid, num/2).concat(interpolateColorPair(mid, end, num/2));
}

export class App extends Component {
  constructor() {
    super();

    this.toggleIcons = (event, data) => {
      this.setState({
        visibleIcons: data.checked
      });
    }
    this.toggleGrid = (event, data) => {
      this.setState({
        visibleGrid: data.checked
      });
    }

    this.handleClick = (event) => {
      switch (event.target.id) {
        case 'picker0': this.setState({ displayColorPicker0: !this.state.displayColorPicker0 }); break;
        case 'picker1': this.setState({ displayColorPicker1: !this.state.displayColorPicker1 }); break;
        case 'picker2': this.setState({ displayColorPicker2: !this.state.displayColorPicker2 }); break;
      }
    };
    this.handleClose = () => {
      this.setState({
        displayColorPicker0: false,
        displayColorPicker1: false,
        displayColorPicker2: false,
      });
    };

    this.handleChange0 = (color) => {
      this.setState({ color0: color.rgb });
    };
    this.handleChange1 = (color) => {
      this.setState({ color1: color.rgb });
    };
    this.handleChange2 = (color) => {
      this.setState({ color2: color.rgb });
    };

    this.state = {
      visibleGrid: true,
      visibleIcons: true,
      gridCellSize: 250,
      displayColorPicker0: false,
      color0: { r: 0, g: 112, b: 19, a: 1 },
      displayColorPicker1: false,
      color1: { r: 255, g: 255, b: 255, a: 0.2 },
      displayColorPicker2: false,
      color2: { r: 241, g: 112, b: 19, a: 1 },
      tooltipText: '',
    };
  }

  _renderColorPicker(index, style) {
    return [
      <div className="color-picker" id={'picker' + index} onClick={this.handleClick}>
        <div className="color-picker-preview" style={style} />
      </div>,
      this.state['displayColorPicker' + index] ?
        (<div className="popover">
          <div className="cover" onClick={this.handleClose} />
          <SketchPicker color={this.state['color' + index]} onChange={this['handleChange' + index]} />
        </div>) : null
    ];
  }

  _renderLayers() {
    const {
      iconMapping = 'data/location-icon-mapping.json',
      iconAtlas = 'data/location-icon-atlas.png',
    } = this.props;
    let color0 = Object.values(this.state.color0);
    color0[3] *= 255;
    let color1 = Object.values(this.state.color1);
    color1[3] *= 255;
    let color2 = Object.values(this.state.color2);
    color2[3] *= 255;

    return [
      new GridLayer({
        visible: this.state.visibleGrid,
        id: 'grid',
        data: many_random_points,
        pickable: true,
        autoHighlight: true,
        cellSize: this.state.gridCellSize,
        extruded: false,
        colorRange: interpolateColors(color0, color1, color2, 6),
        getPosition: d => d,
        onHover: d => {
          this.setState({
            tooltipText: d.object.count,
          })
        }
      }),
      new IconLayer({
        visible: this.state.visibleIcons,
        id: 'icon',
        data: few_random_points,
        pickable: true,
        autoHighlight: true,
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

  _onViewStateChange({ viewState, interactionState, oldViewState }) {
    if (viewState.zoom < 11) {
      this.setState({ gridCellSize: 500 });
    } else {
      this.setState({ gridCellSize: 250 });
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
        color2: {
          background: `rgba(${this.state.color2.r}, ${this.state.color2.g}, ${this.state.color2.b}, ${this.state.color2.a})`,
        },
      },
    });

    return (
      <div>
        <div id="control-panel">
          <div>
            <Checkbox toggle defaultChecked label={{ children: 'Show POIs' }} onChange={this.toggleIcons} />
          </div>
          <div>
            <Checkbox toggle defaultChecked label={{ children: 'Show heatmap' }} onChange={this.toggleGrid} />
          </div>
          <div>
            {this._renderColorPicker(0, styles.color0)}
            {this._renderColorPicker(1, styles.color1)}
            {this._renderColorPicker(2, styles.color2)}
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
          onViewStateChange={this._onViewStateChange.bind(this)}
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
