/* -----------
Mapbox Static API demo.
Visualizing 45,716 Meteorite Landings. Data from NASA's Open Data Portal.(https://data.nasa.gov/Space-Science/Meteorite-Landings/gh4g-9sfh) 
----------- */

// API key for Mapbox. Get one here: https://www.mapbox.com/studio/account/tokens/
var key = 'pk.eyJ1IjoibWFwcGF1c2VyIiwiYSI6ImNqNXNrbXIyZDE2a2cyd3J4Ym53YWxieXgifQ.JENDJqKE1SLISxL3Q_T22w'

// Create an instance of Mapbox
var mappa = new Mappa('Mapbox', key);

// Options for map
var options = {
  lat: 0,
  lng: 0,
  zoom: 1,
  width: 640,
  height: 640,
  scale: 1,
  pitch: 0,
  style: 'dark-v9'
}

// Create the static map reference.
var myMap = mappa.staticMap(options);

var img;
var meteorites;

function preload(){
  // Load the image
  img = loadImage(myMap.imgUrl);
  // Load the data
  meteorites = loadTable('../../data/Meteorite_Landings.csv', 'csv', 'header');
}

function setup(){
  createCanvas(640,500);
  noStroke();

  // Display the image
  image(img, 0, 0);

  // Show the Meteorites Landings
  for (var i = 0; i < meteorites.getRowCount(); i++) {
    // Get the lat/lng of each meteorite
    var pos = myMap.latLngToPixel(meteorites.getString(i, 'reclat'), meteorites.getString(i, 'reclong'));
    // Get the size of the meteorite and map it. 60000000 is the mass of the largest meteorite (https://en.wikipedia.org/wiki/Hoba_meteorite)
    var size = meteorites.getString(i, 'mass (g)');
    size = map(size, 0, 60000000, 3, 25);
    fill(random(0,255), random(0,255),random(0,255));
    ellipse(pos.x, pos.y, size, size);
  }
} 

