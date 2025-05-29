// Import necessary modules from OpenLayers for map creation and interactions
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Link from 'ol/interaction/Link';
import {Style, Fill, Stroke, Icon, Text} from 'ol/style';
import {fromLonLat} from 'ol/proj.js';
import Draw from 'ol/interaction/Draw';
import KML from 'ol/format/KML.js';
import {Feature} from 'ol';
import {Point} from 'ol/geom';

// Create a point feature for a specific location
const p1 = new Feature({
  geometry: new Point([-4286218.991500869, -419618.8159614294]), // Coordinates in Web Mercator
  name: 'Reclamação', // Name of the point
  description: 'Um ponto de Reclamaçãoe', // Description of the point
  timestamp: new Date().toISOString(), // Current timestamp
});

// Initialize the map with a TileLayer using OSM source
const map = new Map({
  target: 'map', // The target HTML element ID where the map will be rendered
  layers: [
    new TileLayer({
      source: new OSM(), // OpenStreetMap as the base map
    }),
  ],
  view: new View({
    center: [-4285254.941253, -418266.908882], // Map's center in Web Mercator projection
    projection: 'EPSG:3857', // Web Mercator projection
    zoom: 13, // Initial zoom level
    minZoom: 12.5, // Minimum zoom level
  }),
});

// Define styles for features on the map
var iconStyle = new Style({
  image: new Icon({
    anchor: [0.5, 20], // Icon anchor position
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    src: './data/point.png', // Image source path for the icon
    scale: 1,
  }),
});

var labelStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif', // Font settings for text
    overflow: true,
    fill: new Fill({
      color: '#000', // Text color
    }),
    stroke: new Stroke({
      color: '#fff', // Outline color for better readability
      width: 3,
    }),
    offsetY: -12, // Vertical offset for text
  }),
});

// Combine icon and label styles
var style = [iconStyle, labelStyle];

// Add a KML layer for zoneamento
const zoneamento = new VectorLayer({
  source: new VectorSource({
    url: './data/Zoneamento/Zoneamento_Terrestre_Aquatico_Parque_do_Coco/PEC_Zoneamento_Terrestre_Aquático.kml',
    format: new KML(), // KML format for the vector source
  }),
});
zoneamento.setOpacity(0.5); // Set layer opacity
map.addLayer(zoneamento); // Add to the map

// Add a GeoJSON layer for limites
const limites = new VectorLayer({
  source: new VectorSource({
    url: './data/coco.json',
    format: new GeoJSON(), // GeoJSON format for the vector source
  }),
  style: new Style({
    fill: new Fill({
      color: 'rgba(0, 217, 255, 0.03)', // Fill color with transparency
    }),
    stroke: new Stroke({
      color: 'rgb(255, 0, 0)', // Stroke color
      width: 3, // Stroke width
    }),
  }),
});
map.addLayer(limites); // Add to the map

// Initialize a source and layer for overlay features (e.g., points of interest)
var overlaySource = new VectorSource({
  features: [p1], // Initial features
});

const overlay = new VectorLayer({
  source: overlaySource,
  style: function(feature) {
    labelStyle.getText().setText(feature.get('name')); // Set text for the label style
    return style; // Return combined styles
  },
});
map.addLayer(overlay); // Add overlay to the map

// Handle map clicks to show a popup menu
map.on('click', function(evt) {
  // Create a popup menu at the click location
  const popupMenu = document.createElement('div');
  popupMenu.style.position = 'absolute';
  popupMenu.style.left = `${evt.pixel[0]}px`;
  popupMenu.style.top = `${evt.pixel[1]}px`;
  popupMenu.style.backgroundColor = 'white';
  popupMenu.style.padding = '10px';
  popupMenu.style.border = '1px solid black';
  popupMenu.style.zIndex = 1000;

  // Add a close button to the popup
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.onclick = () => document.body.removeChild(popupMenu);
  popupMenu.appendChild(closeButton);

  // Check for features at the clicked location
  const features = map.getFeaturesAtPixel(evt.pixel);
  if (features.length > 0) {
    const point = features[0];
    if (point.getGeometry().getType() === 'Point') {
      // Display point information if a point feature is clicked
      const pointInfo = document.createElement('div');
      pointInfo.style.padding = '10px';

      const nameParagraph = document.createElement('p');
      nameParagraph.textContent = `Name: ${point.get('name')}`;

      const descriptionParagraph = document.createElement('p');
      descriptionParagraph.textContent = `Description: ${point.get('description')}`;

      const timestampParagraph = document.createElement('p');
      timestampParagraph.textContent = `Timestamp: ${point.get('timestamp')}`;

      const imageElement = document.createElement('img');
      imageElement.src = point.get('image');

      pointInfo.appendChild(nameParagraph);
      pointInfo.appendChild(descriptionParagraph);
      pointInfo.appendChild(timestampParagraph);
      pointInfo.appendChild(imageElement);
      popupMenu.appendChild(pointInfo);
    }
  }

  // Create options for adding or removing points
  const optionsList = document.createElement('ul');
  optionsList.style.listStyle = 'none';
  optionsList.style.padding = 0;

  const addPointOption = document.createElement('li');
  addPointOption.textContent = 'Add point';

  const removeAllPointsOption = document.createElement('li');
  removeAllPointsOption.textContent = 'Remove all points';

  // Handle adding a new point
  addPointOption.onclick = () => {
    const categoryPopup = document.createElement('div');
    categoryPopup.style.position = 'absolute';
    categoryPopup.style.left = `${evt.pixel[0]}px`;
    categoryPopup.style.top = `${evt.pixel[1] + 20}px`;
    categoryPopup.style.backgroundColor = 'white';
    categoryPopup.style.padding = '10px';
    categoryPopup.style.border = '1px solid black';
    categoryPopup.style.zIndex = 1000;

    const closeCategoryButton = document.createElement('button');
    closeCategoryButton.textContent = 'Close';
    closeCategoryButton.onclick = () => document.body.removeChild(categoryPopup);
    categoryPopup.appendChild(closeCategoryButton);

    const categoryList = document.createElement('ul');
    categoryList.style.listStyle = 'none';
    categoryList.style.padding = 0;

    const categories = ['Reclamação', 'Elogio', 'Sugestão'];
    categories.forEach((category) => {
      const categoryOption = document.createElement('li');
      categoryOption.textContent = category;

      categoryOption.onclick = () => {
        const descriptionPopup = document.createElement('div');
        descriptionPopup.style.position = 'absolute';
        descriptionPopup.style.left = `${evt.pixel[0]}px`;
        descriptionPopup.style.top = `${evt.pixel[1] + 40}px`;
        descriptionPopup.style.backgroundColor = 'white';
        descriptionPopup.style.padding = '10px';
        descriptionPopup.style.border = '1px solid black';
        descriptionPopup.style.zIndex = 1000;

        const closeDescriptionButton = document.createElement('button');
        closeDescriptionButton.textContent = 'Close';
        closeDescriptionButton.onclick = () => document.body.removeChild(descriptionPopup);
        descriptionPopup.appendChild(closeDescriptionButton);

        const descriptionInput = document.createElement('input');
        descriptionInput.type = 'text';
        descriptionInput.placeholder = `Description for ${category}`;

        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';

        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';

        confirmButton.onclick = () => {
          const file = imageInput.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
            const clickEvt = new Feature({
              geometry: new Point([
                map.getCoordinateFromPixel(evt.pixel)[0],
                map.getCoordinateFromPixel(evt.pixel)[1],
              ]),
              name: category,
              description: descriptionInput.value,
              timestamp: new Date().toLocaleString(),
              image: reader.result || `https://picsum.photos/${Math.floor(Math.random() * 200) + 100}`,
            });
            overlaySource.addFeature(clickEvt);
            document.body.removeChild(descriptionPopup);
          };
          if (file) {
            reader.readAsDataURL(file);
          } else {
            reader.onloadend();
          }
        };

        descriptionPopup.appendChild(descriptionInput);
        descriptionPopup.appendChild(imageInput);
        descriptionPopup.appendChild(confirmButton);
        document.body.appendChild(descriptionPopup);
        document.body.removeChild(categoryPopup);
      };

      categoryList.appendChild(categoryOption);
    });

    categoryPopup.appendChild(categoryList);
    document.body.appendChild(categoryPopup);
    document.body.removeChild(popupMenu);
  };

  // Handle removing all points
  removeAllPointsOption.onclick = () => {
    overlaySource.clear(); // Clear all features from the overlay source
    document.body.removeChild(popupMenu); // Remove the popup menu
  };

  optionsList.appendChild(addPointOption);
  optionsList.appendChild(removeAllPointsOption);
  popupMenu.appendChild(optionsList);
  document.body.appendChild(popupMenu);
});




