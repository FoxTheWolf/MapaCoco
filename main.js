// Import necessary modules from OpenLayers for map creation and interactions
import Map from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import View from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import OSM from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import TileLayer from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import VectorLayer from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import VectorSource from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import GeoJSON from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import Link from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import {Style, Fill, Stroke, Icon, Text} from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import {fromLonLat} from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import Draw from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import KML from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import {Feature} from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';
import {Point} from 'https://cdn.jsdelivr.net/npm/ol@v7.0.0/dist/ol.js';

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
  // The popup menu is an HTML div element that is positioned absolutely at the click location
  // We set its style to have a white background, padding, and a solid black border
  // We also set its z-index to 1000 so it appears on top of the map
  const popupMenu = document.createElement('div');
  popupMenu.style.position = 'absolute';
  popupMenu.style.left = `${evt.pixel[0]}px`;
  popupMenu.style.top = `${evt.pixel[1]}px`;
  popupMenu.style.backgroundColor = 'white';
  popupMenu.style.padding = '10px';
  popupMenu.style.border = '1px solid black';
  popupMenu.style.zIndex = 1000;

  // Add a close button to the popup
  // The close button is a simple HTML button element that when clicked, removes the popup menu from the document
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.onclick = () => document.body.removeChild(popupMenu);
  popupMenu.appendChild(closeButton);

  // Check for features at the clicked location
  // Get the features at the pixel location of the click event
  // If there are any features, loop through them and check if the first feature is a point
  // If it is, display point information in the popup
  const features = map.getFeaturesAtPixel(evt.pixel);
  if (features.length > 0) {
    const point = features[0];
    if (point.getGeometry().getType() === 'Point') {
      // Display point information if a point feature is clicked
      // Create an HTML div element that will contain the point information
      // Set its style to have padding and add it to the popup menu
      const pointInfo = document.createElement('div');
      pointInfo.style.padding = '10px';

      // Create HTML paragraphs for the point's name, description, and timestamp
      // Set their text content to the point's corresponding properties
      // Add the paragraphs to the point information div
      const nameParagraph = document.createElement('p');
      nameParagraph.textContent = `Name: ${point.get('name')}`;

      const descriptionParagraph = document.createElement('p');
      descriptionParagraph.textContent = `Description: ${point.get('description')}`;

      const timestampParagraph = document.createElement('p');
      timestampParagraph.textContent = `Timestamp: ${point.get('timestamp')}`;

      // Create an HTML image element for the point's image
      // Set its source to the point's image property
      // Add the image to the point information div
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
  // Create an HTML unordered list element that will contain the options
  // Set its style to have no list style and padding
  // Add the options list to the popup menu
  const optionsList = document.createElement('ul');
  optionsList.style.listStyle = 'none';
  optionsList.style.padding = 0;

  // Create an HTML list item element for adding a new point
  // Set its text content to "Add point"
  // Add an event listener to the list item that will handle adding a new point
  const addPointOption = document.createElement('li');
  addPointOption.textContent = 'Add point';

  // Create an HTML list item element for removing all points
  // Set its text content to "Remove all points"
  // Add an event listener to the list item that will handle removing all points
  const removeAllPointsOption = document.createElement('li');
  removeAllPointsOption.textContent = 'Remove all points';

  // Handle adding a new point
  // When the add point list item is clicked, create a new popup menu
  // This menu will allow the user to select a category for the new point
  // The menu is positioned 20 pixels below the click location
  addPointOption.onclick = () => {
    const categoryPopup = document.createElement('div');
    categoryPopup.style.position = 'absolute';
    categoryPopup.style.left = `${evt.pixel[0]}px`;
    categoryPopup.style.top = `${evt.pixel[1] + 20}px`;
    categoryPopup.style.backgroundColor = 'white';
    categoryPopup.style.padding = '10px';
    categoryPopup.style.border = '1px solid black';
    categoryPopup.style.zIndex = 1000;

    // Add a close button to the category popup
    // The close button is a simple HTML button element that when clicked, removes the category popup from the document
    const closeCategoryButton = document.createElement('button');
    closeCategoryButton.textContent = 'Close';
    closeCategoryButton.onclick = () => document.body.removeChild(categoryPopup);
    categoryPopup.appendChild(closeCategoryButton);

    // Create an HTML unordered list element that will contain the categories
    // Set its style to have no list style and padding
    // Add the categories list to the category popup
    const categoryList = document.createElement('ul');
    categoryList.style.listStyle = 'none';
    categoryList.style.padding = 0;

    // Loop through the categories array and create an HTML list item element for each category
    // Set its text content to the category name
    // Add an event listener to the list item that will handle adding a new point with the selected category
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

        // Add a close button to the description popup
        // The close button is a simple HTML button element that when clicked, removes the description popup from the document
        const closeDescriptionButton = document.createElement('button');
        closeDescriptionButton.textContent = 'Close';
        closeDescriptionButton.onclick = () => document.body.removeChild(descriptionPopup);
        descriptionPopup.appendChild(closeDescriptionButton);

        // Create an HTML input element for the description
        // Set its type to text and add it to the description popup
        const descriptionInput = document.createElement('input');
        descriptionInput.type = 'text';
        descriptionInput.placeholder = `Description for ${category}`;

        // Create an HTML input element for the image
        // Set its type to file and add it to the description popup
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';

        // Create an HTML button element for confirming the new point
        // Set its text content to "Confirm"
        // Add an event listener to the button that will handle adding a new point with the selected category and description
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';

        // Add an event listener to the button that will handle adding a new point with the selected category and description
        // The event listener will be called when the button is clicked
        // The event listener will first get the file that was selected by the user
        // If the user selected a file, the event listener will read the file as a data URL
        // The event listener will then create a new ol.Feature with the selected category, description, timestamp, and image
        // The event listener will then add the new feature to the overlay source
        // The event listener will then remove the description popup from the document
        confirmButton.onclick = () => {
          const file = imageInput.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
            const clickEvt = new Feature({
              // The geometry of the feature is the point where the user clicked
              // The point is in the coordinate system of the map
              geometry: new Point([
                map.getCoordinateFromPixel(evt.pixel)[0],
                map.getCoordinateFromPixel(evt.pixel)[1],
              ]),
              // The name of the feature is the category that the user selected
              name: category,
              // The description of the feature is the text that the user entered
              description: descriptionInput.value,
              // The timestamp of the feature is the current time
              timestamp: new Date().toLocaleString(),
              // The image of the feature is the image that the user selected, or a random image if the user did not select an image
              image: reader.result || `https://picsum.photos/${Math.floor(Math.random() * 200) + 100}`,
            });
            // Add the new feature to the overlay source
            overlaySource.addFeature(clickEvt);
            // Remove the description popup from the document
            document.body.removeChild(descriptionPopup);
          };
          // If the user selected a file, read the file as a data URL
          if (file) {
            reader.readAsDataURL(file);
          } else {
            // If the user did not select a file, call the onloadend event handler with a null result
            reader.onloadend();
          }
        };

        // Add the description input, image input, and confirm button to the description popup
        descriptionPopup.appendChild(descriptionInput);
        descriptionPopup.appendChild(imageInput);
        descriptionPopup.appendChild(confirmButton);
        // Add the description popup to the document
        document.body.appendChild(descriptionPopup);
        // Remove the category popup from the document
        document.body.removeChild(categoryPopup);
      };

      // Add the category option to the categories list
      categoryList.appendChild(categoryOption);
    });

    // Add the categories list to the category popup
    categoryPopup.appendChild(categoryList);
    // Add the category popup to the document
    document.body.appendChild(categoryPopup);
    // Remove the popup menu from the document
    document.body.removeChild(popupMenu);
  };

  // Handle removing all points
  // When the remove all points list item is clicked, clear all features from the overlay source
  // Remove the popup menu from the document
  removeAllPointsOption.onclick = () => {
    overlaySource.clear(); // Clear all features from the overlay source
    document.body.removeChild(popupMenu); // Remove the popup menu
  };

  optionsList.appendChild(addPointOption);
  optionsList.appendChild(removeAllPointsOption);
  popupMenu.appendChild(optionsList);
  document.body.appendChild(popupMenu);
});

// Add a 'pointermove' event listener to the map
map.on('pointermove', function(evt) {
  const features = map.getFeaturesAtPixel(evt.pixel, {
    layerFilter: layer => layer === zoneamento, // Filter to use the zoneamento overlay
  });

  // Create or update the hover text element
  let hoverText = document.getElementById('hoverText');
  if (!hoverText) {
    hoverText = document.createElement('div');
    hoverText.id = 'hoverText';
    hoverText.style.position = 'absolute';
    hoverText.style.zIndex = 1000;
    hoverText.style.pointerEvents = 'none';
    hoverText.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    hoverText.style.padding = '5px';
    hoverText.style.borderRadius = '5px';
    document.body.appendChild(hoverText);
  }

  // If a feature is hovered, display its name
  if (features.length > 0) {
    const feature = features[0];
    hoverText.textContent = feature.get('name') || 'Unnamed';
    hoverText.style.left = `${evt.pixel[0] + 10}px`;
    hoverText.style.top = `${evt.pixel[1] + 10}px`;
    hoverText.style.display = 'block';
  } else {
    hoverText.style.display = 'none';
  }
});

// Add buttons to toggle the zoneamento and limites overlays
const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'absolute';
buttonContainer.style.bottom = '10px';
buttonContainer.style.left = '50%';
buttonContainer.style.transform = 'translateX(-50%)';
document.body.appendChild(buttonContainer);

const toggleZoneamentoButton = document.createElement('button');
toggleZoneamentoButton.textContent = 'Toggle zoneamento';
toggleZoneamentoButton.onclick = () => {
  zoneamento.setVisible(!zoneamento.getVisible());
};
buttonContainer.appendChild(toggleZoneamentoButton);

const toggleLimitesButton = document.createElement('button');
toggleLimitesButton.textContent = 'Toggle limites';
toggleLimitesButton.onclick = () => {
  limites.setVisible(!limites.getVisible());
};
buttonContainer.appendChild(toggleLimitesButton);


