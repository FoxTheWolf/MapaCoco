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
  features: [], // Start empty, load from API
});

const overlay = new VectorLayer({
  source: overlaySource,
  style: function(feature) {
    labelStyle.getText().setText(feature.get('name'));
    return style;
  },
});
map.addLayer(overlay);

// Helper: Convert API point to ol.Feature
function apiPointToFeature(apiPoint) {
  return new Feature({
    geometry: new Point(apiPoint.coordinates),
    name: apiPoint.name,
    description: apiPoint.description,
    timestamp: apiPoint.timestamp,
    image: apiPoint.image,
    id: apiPoint.id,
    user: apiPoint.user,
  });
}

// Load points from backend
async function loadPoints() {
  if (!jwtToken) {
    jwtToken = localStorage.getItem('jwtToken');
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!jwtToken || !currentUser) {
      showLoginForm();
      return;
    }
  }
  const res = await fetch('http://localhost:3000/api/points', {
    headers: {Authorization: `Bearer ${jwtToken}`},
  });
  const points = await res.json();
  overlaySource.clear();
  points.forEach(p => overlaySource.addFeature(apiPointToFeature(p)));
}
loadPoints();

// Add new point to backend
async function addPoint(pointData) {
  if (!jwtToken) return showLoginForm();
  pointData.user = currentUser.username;
  const res = await fetch('http://localhost:3000/api/points', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify(pointData),
  });
  if (res.ok) loadPoints();
}

// Remove all points from backend
async function removeAllPoints() {
  if (!jwtToken) return showLoginForm();
  await fetch('http://localhost:3000/api/points', {
    method: 'DELETE',
    headers: {Authorization: `Bearer ${jwtToken}`},
  });
  loadPoints();
}

// Utility to close all popups
function closeAllPopups() {
  document.querySelectorAll('.custom-popup').forEach(el => el.remove());
}

// Handle map clicks to show a popup menu
map.on('click', function(evt) {
  closeAllPopups();

  if (evt.originalEvent.target.classList.contains('custom-popup') ||
      evt.originalEvent.target.closest('.custom-popup')) {
    return;
  }

  const clickPixel = evt.pixel; // Capture pixel coordinates

  const popupMenu = document.createElement('div');
  popupMenu.className = 'custom-popup';
  popupMenu.style.position = 'absolute';
  popupMenu.style.left = `${evt.pixel[0]}px`;
  popupMenu.style.top = `${evt.pixel[1]}px`;
  popupMenu.style.backgroundColor = 'white';
  popupMenu.style.padding = '16px';
  popupMenu.style.border = '1px solid #ddd';
  popupMenu.style.borderRadius = '12px';
  popupMenu.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
  popupMenu.style.zIndex = 1000;
  popupMenu.style.minWidth = '220px';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  styleButton(closeButton);
  closeButton.style.background = '#e81123';
  closeButton.onmouseover = () => closeButton.style.background = '#b50f1f';
  closeButton.onmouseout = () => closeButton.style.background = '#e81123';
  closeButton.style.float = 'right';
  closeButton.onclick = () => popupMenu.remove();
  popupMenu.appendChild(closeButton);

  const features = map.getFeaturesAtPixel(evt.pixel);
  if (features.length > 0) {
    const point = features[0];
    if (point.getGeometry().getType() === 'Point') {
      const pointInfo = document.createElement('div');
      pointInfo.style.padding = '10px';
      pointInfo.style.marginBottom = '10px';

      const nameParagraph = document.createElement('p');
      nameParagraph.textContent = `Name: ${point.get('name')}`;
      nameParagraph.style.fontWeight = 'bold';

      const descriptionParagraph = document.createElement('p');
      descriptionParagraph.textContent = `Description: ${point.get('description')}`;

      const timestampParagraph = document.createElement('p');
      timestampParagraph.textContent = `Timestamp: ${point.get('timestamp')}`;
      timestampParagraph.style.fontSize = '12px';
      timestampParagraph.style.color = '#666';

      // Only show user info if current user is admin
      if (currentUser && currentUser.is_admin) {
        const userParagraph = document.createElement('p');
        userParagraph.textContent = `Created by: ${point.get('user') || 'unknown'}`;
        userParagraph.style.fontSize = '12px';
        userParagraph.style.color = '#888';
        pointInfo.appendChild(userParagraph);
      }

      const imageElement = document.createElement('img');
      imageElement.src = point.get('image');
      imageElement.style.maxWidth = '180px';
      imageElement.style.maxHeight = '120px';
      imageElement.style.borderRadius = '8px';
      imageElement.style.border = '1px solid #eee';
      imageElement.style.marginTop = '8px';

      pointInfo.appendChild(nameParagraph);
      pointInfo.appendChild(descriptionParagraph);
      pointInfo.appendChild(timestampParagraph);
      pointInfo.appendChild(imageElement);
      popupMenu.appendChild(pointInfo);
    }
  }

  const optionsList = document.createElement('div');
  optionsList.style.display = 'flex';
  optionsList.style.justifyContent = 'space-between';
  optionsList.style.marginTop = '10px';

  const addPointOption = document.createElement('button');
  addPointOption.textContent = 'Add point';
  styleButton(addPointOption);

  const removeAllPointsOption = document.createElement('button');
  removeAllPointsOption.textContent = 'Remove all points';
  styleButton(removeAllPointsOption);
  removeAllPointsOption.style.background = '#e81123';
  removeAllPointsOption.onmouseover = () => removeAllPointsOption.style.background = '#b50f1f';
  removeAllPointsOption.onmouseout = () => removeAllPointsOption.style.background = '#e81123';

  addPointOption.onclick = () => {
    function showCategoryPopup() {
      const categoryPopup = document.createElement('div');
      categoryPopup.className = 'custom-popup';
      categoryPopup.style.position = 'absolute';
      categoryPopup.style.left = `${clickPixel[0]}px`;
      categoryPopup.style.top = `${clickPixel[1] + 20}px`;
      categoryPopup.style.backgroundColor = 'white';
      categoryPopup.style.padding = '16px';
      categoryPopup.style.border = '1px solid #ddd';
      categoryPopup.style.borderRadius = '12px';
      categoryPopup.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
      categoryPopup.style.zIndex = 1000;
      categoryPopup.style.minWidth = '220px';

      const closeCategoryButton = document.createElement('button');
      closeCategoryButton.textContent = 'Close';
      styleButton(closeCategoryButton);
      closeCategoryButton.style.background = '#e81123';
      closeCategoryButton.onmouseover = () => closeCategoryButton.style.background = '#b50f1f';
      closeCategoryButton.onmouseout = () => closeCategoryButton.style.background = '#e81123';
      closeCategoryButton.style.float = 'right';
      closeCategoryButton.onclick = () => categoryPopup.remove();
      categoryPopup.appendChild(closeCategoryButton);

      const categoryList = document.createElement('div');
      categoryList.style.display = 'flex';
      categoryList.style.justifyContent = 'space-between';
      categoryList.style.marginTop = '10px';

      const categories = ['Reclamação', 'Elogio', 'Sugestão'];
      categories.forEach((category) => {
        const categoryOption = document.createElement('button');
        categoryOption.textContent = category;
        styleButton(categoryOption);
        categoryOption.onclick = () => {
          // Close category popup before showing description popup
          categoryPopup.remove();

          const descriptionPopup = document.createElement('div');
          descriptionPopup.className = 'custom-popup';
          descriptionPopup.style.position = 'absolute';
          descriptionPopup.style.left = `${clickPixel[0]}px`;
          descriptionPopup.style.top = `${clickPixel[1] + 40}px`;
          descriptionPopup.style.backgroundColor = 'white';
          descriptionPopup.style.padding = '16px';
          descriptionPopup.style.border = '1px solid #ddd';
          descriptionPopup.style.borderRadius = '12px';
          descriptionPopup.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
          descriptionPopup.style.zIndex = 1000;
          descriptionPopup.style.minWidth = '220px';

          const closeDescriptionButton = document.createElement('button');
          closeDescriptionButton.textContent = 'Close';
          styleButton(closeDescriptionButton);
          closeDescriptionButton.style.background = '#e81123';
          closeDescriptionButton.onmouseover = () => closeDescriptionButton.style.background = '#b50f1f';
          closeDescriptionButton.onmouseout = () => closeDescriptionButton.style.background = '#e81123';
          closeDescriptionButton.style.float = 'right';
          closeDescriptionButton.onclick = () => descriptionPopup.remove();
          descriptionPopup.appendChild(closeDescriptionButton);

          const descriptionInput = document.createElement('input');
          descriptionInput.type = 'text';
          descriptionInput.placeholder = `Description for ${category}`;
          descriptionInput.style.padding = '8px';
          descriptionInput.style.margin = '8px 0';
          descriptionInput.style.borderRadius = '6px';
          descriptionInput.style.border = '1px solid #ccc';
          descriptionInput.style.width = '95%';

          const imageInput = document.createElement('input');
          imageInput.type = 'file';
          imageInput.accept = 'image/*';
          imageInput.style.margin = '8px 0';

          const confirmButton = document.createElement('button');
          confirmButton.textContent = 'Confirm';
          styleButton(confirmButton);

          confirmButton.onclick = () => {
            const file = imageInput.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
              const pointData = {
                coordinates: map.getCoordinateFromPixel(clickPixel),
                name: category,
                description: descriptionInput.value,
                timestamp: new Date().toLocaleString(),
                image: reader.result || `https://picsum.photos/${Math.floor(Math.random() * 200) + 100}`,
              };
              addPoint(pointData);
              // Only close the description popup after the point is created
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
        };
        categoryList.appendChild(categoryOption);
      });

      categoryPopup.appendChild(categoryList);
      document.body.appendChild(categoryPopup);
      document.body.removeChild(popupMenu);
    }

    if (!jwtToken || !currentUser) {
      showLoginForm(showCategoryPopup);
      return;
    }
    showCategoryPopup();
  };

  removeAllPointsOption.onclick = () => {
    removeAllPoints();
    document.body.removeChild(popupMenu);
  };

  optionsList.appendChild(addPointOption);
  optionsList.appendChild(removeAllPointsOption);
  popupMenu.appendChild(optionsList);
  document.body.appendChild(popupMenu);
});

// Global click handler to close popups when clicking outside
document.addEventListener('mousedown', function(e) {
  if (!e.target.classList.contains('custom-popup') &&
      !e.target.closest('.custom-popup')) {
    closeAllPopups();
  }
});

// Helper function for button styling
function styleButton(btn) {
  btn.style.padding = '8px 16px';
  btn.style.margin = '5px';
  btn.style.border = 'none';
  btn.style.borderRadius = '6px';
  btn.style.background = '#0078d7';
  btn.style.color = '#fff';
  btn.style.cursor = 'pointer';
  btn.style.fontWeight = 'bold';
  btn.onmouseover = () => btn.style.background = '#005fa3';
  btn.onmouseout = () => btn.style.background = '#0078d7';
}

// Add a 'pointermove' event listener to the map
map.on('pointermove', function(evt) {
  const features = map.getFeaturesAtPixel(evt.pixel, {
    layerFilter: layer => layer === zoneamento,
  });

  let hoverText = document.getElementById('hoverText');
  if (!hoverText) {
    hoverText = document.createElement('div');
    hoverText.id = 'hoverText';
    hoverText.style.position = 'absolute';
    hoverText.style.zIndex = 1000;
    hoverText.style.pointerEvents = 'none';
    hoverText.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    hoverText.style.padding = '5px 12px';
    hoverText.style.borderRadius = '8px';
    hoverText.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    hoverText.style.fontWeight = 'bold';
    hoverText.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    document.body.appendChild(hoverText);
  }

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
buttonContainer.style.display = 'flex';
buttonContainer.style.gap = '10px';
document.body.appendChild(buttonContainer);

const toggleZoneamentoButton = document.createElement('button');
toggleZoneamentoButton.textContent = 'Toggle zoneamento';
styleButton(toggleZoneamentoButton);
toggleZoneamentoButton.style.background = '#107c10';
toggleZoneamentoButton.onmouseover = () => toggleZoneamentoButton.style.background = '#0b5c0b';
toggleZoneamentoButton.onmouseout = () => toggleZoneamentoButton.style.background = '#107c10';
toggleZoneamentoButton.onclick = () => {
  zoneamento.setVisible(!zoneamento.getVisible());
};
buttonContainer.appendChild(toggleZoneamentoButton);

const toggleLimitesButton = document.createElement('button');
toggleLimitesButton.textContent = 'Toggle limites';
styleButton(toggleLimitesButton);
toggleLimitesButton.style.background = '#2d7d9a';
toggleLimitesButton.onmouseover = () => toggleLimitesButton.style.background = '#20586c';
toggleLimitesButton.onmouseout = () => toggleLimitesButton.style.background = '#2d7d9a';
toggleLimitesButton.onclick = () => {
  limites.setVisible(!limites.getVisible());
};
buttonContainer.appendChild(toggleLimitesButton);

// Add login button
const loginButton = document.createElement('button');
loginButton.textContent = 'Login';
styleButton(loginButton);
loginButton.style.background = '#444';
loginButton.onmouseover = () => loginButton.style.background = '#222';
loginButton.onmouseout = () => loginButton.style.background = '#444';
loginButton.onclick = () => showLoginForm();
buttonContainer.appendChild(loginButton);

// Login and user management
let currentUser = null;
let jwtToken = null;

// Show login form if not logged in
function showLoginForm(onSuccess) {
  closeAllPopups();
  const loginPopup = document.createElement('div');
  loginPopup.className = 'custom-popup';
  loginPopup.style.position = 'fixed';
  loginPopup.style.left = '50%';
  loginPopup.style.top = '50%';
  loginPopup.style.transform = 'translate(-50%, -50%)';
  loginPopup.style.backgroundColor = 'white';
  loginPopup.style.padding = '24px';
  loginPopup.style.border = '1px solid #ddd';
  loginPopup.style.borderRadius = '12px';
  loginPopup.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
  loginPopup.style.zIndex = 2000;
  loginPopup.style.minWidth = '260px';

  const title = document.createElement('h3');
  title.textContent = 'Login';
  loginPopup.appendChild(title);

  const userInput = document.createElement('input');
  userInput.type = 'text';
  userInput.placeholder = 'Username';
  userInput.style.display = 'block';
  userInput.style.margin = '10px 0';
  userInput.style.width = '100%';

  const passInput = document.createElement('input');
  passInput.type = 'password';
  passInput.placeholder = 'Password';
  passInput.style.display = 'block';
  passInput.style.margin = '10px 0';
  passInput.style.width = '100%';

  const loginBtn = document.createElement('button');
  loginBtn.textContent = 'Login';
  styleButton(loginBtn);

  loginBtn.onclick = async () => {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: userInput.value, password: passInput.value}),
    });
    if (res.ok) {
      const data = await res.json();
      jwtToken = data.token;
      currentUser = data.user;
      localStorage.setItem('jwtToken', jwtToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      loginPopup.remove();
      if (typeof onSuccess === 'function') onSuccess();
      loadPoints();
    } else {
      alert('Login failed');
    }
  };

  loginPopup.appendChild(userInput);
  loginPopup.appendChild(passInput);
  loginPopup.appendChild(loginBtn);
  document.body.appendChild(loginPopup);
}

//# sourceMappingURL=main.js.map}  document.body.appendChild(loginPopup);  loginPopup.appendChild(loginBtn);  loginPopup.appendChild(passInput);  loginPopup.appendChild(userInput);  loginPopup.appendChild(passInput);
  loginPopup.appendChild(loginBtn);
  document.body.appendChild(loginPopup);



