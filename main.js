import Map from 'ol/Map.js';
import View from 'ol/View.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Link from 'ol/interaction/Link';
import {Style, Fill, Stroke, Icon,Text} from 'ol/style';
import * as olExtent from 'ol/extent';
import {fromLonLat} from 'ol/proj.js';
import Draw from 'ol/interaction/Draw';
import KML from 'ol/format/KML.js';
import { Feature } from 'ol';
import {Point} from 'ol/geom';

const p1 = new Feature({
  geometry: new Point([-4286218.991500869, -419618.8159614294]),
  name: 'Reclamação',
  description: 'Um ponto de Reclamaçãoe',
  timestamp: new Date().toISOString(),
});
// const cocoLonLat = [-38.47378, -3.76714];
// const cocoWebMercator = fromLonLat(cocoLonLat);

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    })
  ],
  view: new View({
    center: [-4285254.941253, -418266.908882],
    projection: 'EPSG:3857',
    zoom: 13,
    minZoom: 12.5,
  }),
  target: 'map',
});

var iconStyle = new Style({
  image: new Icon({
    anchor: [0.5, 20],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    src: './data/point.png',
    scale: 1
  })

});
var labelStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    overflow: true,
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3
    }),
    offsetY: -12
  })
});
var style = [iconStyle, labelStyle];

const zoneamento = new VectorLayer({
  source: new VectorSource({
    url: './data/Zoneamento/Zoneamento_Terrestre_Aquatico_Parque_do_Coco/PEC_Zoneamento_Terrestre_Aquático.kml',
    format: new KML(),
  }),
});

zoneamento.setOpacity(0.7);
map.addLayer(zoneamento);

const limites = new VectorLayer({
  source: new VectorSource({
    url: './data/coco.json',
    format: new GeoJSON(),
  }),
  style: new Style({
    fill: new Fill({
      color: 'rgba(0, 217, 255, 0.03)',
    }),
    stroke: new Stroke({
      color: 'rgb(255, 0, 0)',
      width: 3,
    }),
  }),
});

map.addLayer(limites);

var overlaySource = new VectorSource({
    features: [p1]
});

const overlay = new VectorLayer({
  source: overlaySource,
  style: function(feature) {
        labelStyle.getText().setText(feature.get('name'));
        return style;
      },

});

map.addLayer(overlay);

// const draw = new Draw({
//   type: 'Point',
//   source: overlaySource,
//   style: style,
//   name: 'Reclamação',
// });

// draw.on('drawend', function () {
//   map.removeInteraction(draw);
// });

// document.getElementById('draw').addEventListener('click', function () {
//   map.addInteraction(draw);
// });

map.on('click', function(evt) {

  if (map.hasFeatureAtPixel(evt.pixel) && map.forEachFeatureAtPixel(evt.pixel, feature => feature.get('name') === 'Reclamação')) {
    const info = [];
    map.forEachFeatureAtPixel(evt.pixel, feature => {
      if (feature.get('name') === 'Reclamação') {
        info.push(`${feature.get('name')}: ${feature.get('description')} at ${feature.get('timestamp')}, image: ${feature.get('image')}`);
      }
    });
    const message = info.join('\n');
    
    // Create popup element
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.left = `${evt.pixel[0]}px`;
    popup.style.top = `${evt.pixel[1]}px`;
    popup.style.backgroundColor = 'white';
    popup.style.padding = '10px';
    popup.style.border = '1px solid black';
    popup.style.zIndex = 1000;
    popup.innerHTML = `<pre>${message}</pre><img src="${info[0].split('image: ')[1]}" alt="Feature Image" style="max-width:100%;">`;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => document.body.removeChild(popup);
    popup.appendChild(closeButton);

    // Append popup to body
    document.body.appendChild(popup);
  } else {
    const clickEvt = new Feature({
      geometry: new Point([map.getCoordinateFromPixel(evt.pixel)[0], map.getCoordinateFromPixel(evt.pixel)[1]]),
      name: "Reclamação",
      description: "Muito lixo",
      timestamp: new Date().toLocaleString(),
      image: `https://picsum.photos/${Math.floor(Math.random() * 200) + 100}`,
    })
    overlaySource.addFeature(clickEvt);
  }
});

