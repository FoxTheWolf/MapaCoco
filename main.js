import Map from 'ol/Map.js';
import View from 'ol/View.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Link from 'ol/interaction/Link';
import {Style, Fill, Stroke} from 'ol/style';
import * as olExtent from 'ol/extent';
import {fromLonLat} from 'ol/proj.js';

const cocoLonLat = [ -38.47378,-3.76714];
const cocoWebMercator = fromLonLat(cocoLonLat);



const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new VectorLayer({
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
    }),
  ],
  
  view: new View({
    center: [-4285254.941253,-418266.908882],
    zoom: 13,
    minZoom: 12.5,
    //extent: [-4295302.367457,-414097.600735,-4265912.330082,-436531.868537],
    //constrainOnlyCenter: true
  }),
  target: 'map',
});
