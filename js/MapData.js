import { ImprovedNoise } from './three/examples/jsm/math/ImprovedNoise.js';
import { initTerrain, updateTerrain, initMapContext } from './terrain.js';

//// FOR DEVELOPMENT
import json from "../data/Location History.js";
const DEV_MODE = true;
// var json;

let consoleID = 0;
let MAP_DIM = 1024;
let BIN_S = 4;
let NUM_ROWS = MAP_DIM/BIN_S;
let NUM_COLS = NUM_ROWS;

let elevations = [];
let locations = [];

// const navMapCoords = [];

const key = keys.mapbox;
const mappa = new Mappa('Mapbox', key);
// const mappaNav = new Mappa('Mapbox', key);

let myMap;
let navMap;

let marker = {};

// Options for map
let options = {
  lat: 29.9307079,
  lng: -90.105797,
  zoom: 13,
  width: MAP_DIM,
  height: MAP_DIM,
  scale: 2,
  pitch: 0,
  username: 'jdeboi', // don't include for mapbox styles
  // style: 'ck7efwpg40can1it3rvj6cw5t'
  style: 'ck6cc18vl4wxg1io2bqvk6wj5'
}

let optionsNav = {
  lat: 29.9307079,
  lng: -90.105797,
  zoom: 2,
  studio: true,
  style: 'mapbox://styles/jdeboi/ck6cc18vl4wxg1io2bqvk6wj5',
  username: 'jdeboi', // don't include for mapbox styles
  // style: 'ck7efwpg40can1it3rvj6cw5t'
  // style: 'ck6cc18vl4wxg1io2bqvk6wj5'
}

// figure out how to promisify this
// myMap = mappa.staticMap(options);

if (DEV_MODE) startDevMap();
else {
  document.getElementById( 'myFile' ).addEventListener('input', function (evt) {
    readUploadedFile()
    .then(initMap)
    .then(center => moveMap(center))
    .then(loadMappa)
    .then(prepareData)
    .then((data) => initTerrain(data))
    .then(addNavMap)

    .catch((error) => {
      console.log(error);
    })
  });
}

function startDevMap() {
  console.log("------------dev map");
  const center = initMap();
  moveMap(center);
  loadMappa()
  .then(prepareData)
  .then((data) => initTerrain(data))
  .then(addNavMap)
  .catch((error) => {
    console.log(error);
  })
  
}

// function remap() {
//   console.log("REMAPPING");
//   const center = getCenter2();
//   moveMap(center);
//   initTerrain(prepareData());
// }

function initMap() {
  console.log("--map loading--");
  // bin big square to identify center
  // mappa.staticMap(options)
  // then(this.setCenter)
  // this.setCenter(json);
  let center = getCenter();
  return center;
}

function moveMap(coord)  {
  consoleID = 0;
  console.log((consoleID++), " map moving");
  moveCenter(coord);
  resetMap();
  // myMap = mappa.staticMap(options);

}

export function getImg() {
  return myMap.imgUrl;
}

async function loadMappa() {
  try {
    console.log((consoleID++) + " mappa loading");
    myMap = await mappa.staticMap(options);
    return;
  }
  catch (error) {
    console.log(error);
  }
}

function prepareData() {
  console.log((consoleID++) + " preparing data");
  // this.addNoise(3, .5);
  locations = [];
  
  setLocationBuffer();
  binLocations();
  multiplyElevations(5);
  logElevations();
  smoothElevations(3);
  multiplyElevations(5);
  return getElevationData();
}

function getCenter() {
  let homeLat = 29.9307079;
  let homeLon = -90.105797;
  return {lng: homeLon, lat: homeLat};
}

function getCenter2() {
  let homeLat = 30.1;
  let homeLon = -90.105797;
  return {lng: homeLon, lat: homeLat};
}

function moveCenter(coord) {
  options.lat = coord.lat;
  options.lon = coord.lng;
}

function resetMap() {
  consoleID = 0;
  console.log((consoleID++), "map resetting");
  elevations = [];
  for (let r = 0; r < NUM_ROWS; r++) {
    elevations.push([]);
    for (let c = 0; c < NUM_COLS; c++) {
      elevations[r][c] = 0;
    }

  }
  locations = [];
}

function setLocationBuffer () {
  for (let i = 0; i < json.locations.length; i++) {
    let lat = json.locations[i].latitudeE7/ 10000000.0;
    let lon = json.locations[i].longitudeE7/ 10000000.0;

    // let ts = json.locations[i].timestampMs;
    // let d = new Date(ts);
    let pos = myMap.latLngToPixel(lat, lon);
    pos.x /= options.scale;
    pos.y /= options.scale;
    if(inBounds(pos)) {
      locations.push(pos);
    }
  }
}

function binLocations() {
  var size = 0;
  for (let i = 0; i < locations.length; i++) {
    let r = Math.floor(locations[i].y/BIN_S);
    let c = Math.floor(locations[i].x/BIN_S);

    if (r >= 0 && r < elevations.length && c >= 0 && c < elevations[0].length)
    elevations[r][c]++;
  }
}

function inBounds(coord) {
  return coord.x >= 0 && coord.x < MAP_DIM && coord.y >= 0 && coord.y < MAP_DIM;
}

export function getElevationData() {
  var data = [];
  var size = 0;

  for ( var r = 0; r < NUM_ROWS; r++ ) {
    for ( var c = 0; c < NUM_COLS; c++ ) {


      data[ size++ ] = elevations[r][c];
    }
  }
  return data;

}

function multiplyElevations(mult) {
  for (let r=0; r< elevations.length; r++) {
    for (let c=0; c<elevations[0].length; c++) {
      elevations[r][c] *= mult;
    }
  }
}

function smoothElevations(smoothD) {
  let smoothed = [];
  for (let r=0; r<elevations.length; r++) {
    smoothed.push([]);
    for (let c=0; c<elevations[0].length; c++) {
      smoothed[r][c] = 0;
    }
  }
  for (let r=smoothD; r<elevations.length-smoothD; r++) {
    for (let c=smoothD; c<elevations[0].length-smoothD; c++) {
      smoothed[r][c] = getSmoothedAve(smoothD, r, c);
    }
  }
  for (let r=0; r<elevations.length; r++) {
    for (let c=0; c<elevations[0].length; c++) {
      elevations[r][c] = smoothed[r][c];
    }
  }
}

function getSmoothedAve( d,  row,  col) {
  if (row - d >=0 && row+d < elevations.length && col - d >= 0 && col + d < elevations[0].length) {
    let ave = 0;
    let div = 0;
    for (let r=row-d; r<=row+d; r++) {
      for (let c=col-d; c<=col+d; c++) {

        let dr = r - (row-d);
        let dc = c - (col-d);
        if (withinCircle(dr, dc, d)) {
          let dis = dist(dr, dc, d, d);
          let weight = map(dis, 0, d, 1, .5);
          ave += elevations[r][c]*weight;
          div += weight;
        }
      }
    }
    return ave / div;
  }
}

function logElevations() {
  for (let r=0; r< elevations.length; r++) {
    for (let c=0; c< elevations[0].length; c++) {
      let z = elevations[r][c];
      if (z > 0) {
        z = Math.log(z);
        z = map(z, 0, 4, 1, 30);
        elevations[r][c] = z;
      }
    }
  }
}

function addNoise(amt, noiseScale) {
  let perlin = new ImprovedNoise();
  for (let r=0; r< elevations.length; r++) {
    for (let c=0; c< elevations[0].length; c++) {
      let noisez = perlin.noise(r*noiseScale, c*noiseScale);
      if (elevations[r][c] > 0)
      elevations[r][c] += noisez *amt;
    }
  }
}

function dist(x0, y0, x1, y1) {
  let dx = (x1 - x0);
  let dy = (y1 - y0);
  return Math.sqrt(dx*dx + dy*dy);
}

function map(num, in_min, in_max, out_min, out_max)  {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function withinCircle(dr, dc, rad){
  let dis = dist(dr, dc, rad, rad);
  return Math.floor(dis) <= rad;
}

function getMapURL() {
  return myMap.imgUrl;
}

function addNavMap() {
  mapboxgl.accessToken = keys.mapbox;
  navMap = new mapboxgl.Map({
    container: 'navMap',
    style: 'mapbox://styles/jdeboi/cki7rn91i675t19l7ckudb7e5',
    center: getCenter(),
    zoom: 10
  });

  navMap.on('click', function(e) {
    // e.point
    console.log("MAP CLICKED");
    marker = {lng: e.lngLat.wrap().lng, lat: e.lngLat.wrap().lat};
    // navMapCoords = [marker.lng, marker.lat];
    navMap.flyTo({
      center: [marker.lng, marker.lat],
      zoom: 11,
      bearing: 0,
      pitch: 0,
      essential: true // this animation is considered essential with respect to prefers-reduced-motion
    })
    newMap();
    
    // console.log(e.lngLat.wrap());
    // e.preventDefault();
  });
}

export function setMapRotation(rot) {
  if (navMap) {
    // let rx = mod(rot.x, 2*Math.PI);
    // let ry = mod(rot.y, 2*Math.PI);
    let pitch = getPitch(rot.x);
    let bearing = getBearing(rot.z);
    // let bearing = rot.y/Math.PI*180;
    navMap.setPitch(pitch);
    navMap.setBearing(bearing);
  }
}

function mapVal(num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
function getPitch(rad) {
  let m = mod(rad, 2*Math.PI);
  let d = getDeg(m);
  return mapVal(d, 180, 360, 0, 60);
}

function getBearing(rad) {
  let m = mod(rad, 2*Math.PI);
  let d = getDeg(m);
  return mapVal(d, 360, 0, 0, 360);
}

function mod(a, b) {
  let c = a % b
  return (c < 0) ? c + b : c
}

function getDeg(rad) {
  // 0- 60
  // 0 = top down
  let deg = rad/Math.PI*180;
  return deg;
}

function newMap() {
  console.log("-----------new map");
  moveMap(marker); // includes resettings
  console.log("marker", marker);
  loadMappa()
  .then(prepareData)
  .then((data) => updateTerrain(data))
  .catch((error) => {
    console.log(error);
  })
}

// function makeTerrain() {
//   // let data = getElevationData();
//   // console.log((consoleID++) + " make terrain");
//   // console.log("e", data.length);
//
//   updateTerrain(data);
// }





function readUploadedFile() {
  var promise = new Promise(function(resolve, reject) {
    // do a thing, possibly async, then…
    var x = document.getElementById("myFile");
    if (x.files.length == 0) {
      reject(Error("no file uploaded"));
    }
    else if (x.files[0].name != "Location History.json") {
      reject(Error("file should be named Location History.json"));
    }
    else {
      let file = x.files[0];
      let reader = new FileReader();

      reader.readAsText(file);
      reader.onload = function() {
        json = JSON.parse(reader.result);
        resolve(json);
      };
      reader.onerror = function() {
        reject(Error(reader.error));
      };
    }
  });
  return promise;
}










// var img;
// img = loadImage(myMap.imgUrl);
