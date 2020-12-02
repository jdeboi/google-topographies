import { ImprovedNoise } from './three/examples/jsm/math/ImprovedNoise.js';
import { initTerrain, updateTerrain } from './terrain.js';

//// FOR DEVELOPMENT
import json from "../data/Location History.js";
const DEV_MODE = false;
let consoleID = 0;

let MAP_DIM = 1024;
let BIN_S = 4;
let NUM_ROWS = MAP_DIM / BIN_S;
let NUM_COLS = NUM_ROWS;

let elevations = [];
let locations = [];

const key = keys.mapbox;
const mappa = new Mappa('Mapbox', key);

let myMap;
let navMap;
let center;

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


////////////////////////////////////////////////////////////////////////////////////
// INIT
////////////////////////////////////////////////////////////////////////////////////

if (DEV_MODE) startDevMap();
else {
  document.getElementById('myFile').addEventListener('input', function (evt) {
    readUploadedFile()
      .then(getCenter)
      .then((center) => moveMap(center))
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
  if (DEV_MODE) console.log("------------dev map");
  getCenter()
    .then((center) => moveMap(center))
    .then(loadMappa)
    .then(prepareData)
    .then((data) => initTerrain(data))
    .then(addNavMap)
    .catch((error) => {
      console.log(error);
    })

}

////////////////////////////////////////////////////////////////////////////////////
// MAP CENTER
////////////////////////////////////////////////////////////////////////////////////

// try to get browser gps
// otherwise, return NOLA coords
async function getCenter() {
  // Will resolve after 5s
  let promiseTimeout = new Promise((resolve, reject) => {
    let wait = setTimeout(() => {
      clearTimeout(wait);
      setNolaCenter();
      resolve(center);
    }, 5000)
  })

  return Promise.race([
    promiseTimeout,
    getBrowserCenter()
  ]);
}

async function getBrowserCenter() {
  try {
    let position = await getPosition();
    if (DEV_MODE) console.log("POS", position);
    center = { lng: position.coords.longitude, lat: position.coords.latitude };
    return center;
  }
  catch (error) {
    console.log(error);
    return setNolaCenter();
  }
}

function getPosition(options) {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function setNolaCenter() {
  let homeLat = 29.9307079;
  let homeLon = -90.105797;
  center = { lng: homeLon, lat: homeLat };
  return center;
}

function moveMap(coord) {
  consoleID = 0;
  if (DEV_MODE) console.log((consoleID++), " map moving");
  moveCenter(coord);
  resetMap();
  // myMap = mappa.staticMap(options);
}

function moveCenter(coord) {
  options.lat = coord.lat;
  options.lon = coord.lng;
}


////////////////////////////////////////////////////////////////////////////////////
// MAP DATA CRUNCHING
////////////////////////////////////////////////////////////////////////////////////
function prepareData() {
  if (DEV_MODE) console.log((consoleID++) + " preparing data");
  locations = [];
  setLocationBuffer();
  binLocations();
  multiplyElevations(5);
  logElevations();
  smoothElevations(3);
  multiplyElevations(5);
  // addNoise(23, .1);
  return getElevationData();
}

function resetMap() {
  consoleID = 0;
  if (DEV_MODE) console.log((consoleID++), "map resetting");
  elevations = [];
  for (let r = 0; r < NUM_ROWS; r++) {
    elevations.push([]);
    for (let c = 0; c < NUM_COLS; c++) {
      elevations[r][c] = 0;
    }
  }
  locations = [];
}

function setLocationBuffer() {
  for (let i = 0; i < json.locations.length; i++) {
    let lat = json.locations[i].latitudeE7 / 10000000.0;
    let lon = json.locations[i].longitudeE7 / 10000000.0;

    let pos = myMap.latLngToPixel(lat, lon);
    pos.x /= options.scale;
    pos.y /= options.scale;
    if (inBounds(pos)) {
      locations.push(pos);
    }
  }
}

function binLocations() {
  var size = 0;
  for (let i = 0; i < locations.length; i++) {
    let r = Math.floor(locations[i].y / BIN_S);
    let c = Math.floor(locations[i].x / BIN_S);

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

  for (var r = 0; r < NUM_ROWS; r++) {
    for (var c = 0; c < NUM_COLS; c++) {


      data[size++] = elevations[r][c];
    }
  }
  return data;

}

function multiplyElevations(mult) {
  for (let r = 0; r < elevations.length; r++) {
    for (let c = 0; c < elevations[0].length; c++) {
      elevations[r][c] *= mult;
    }
  }
}

function smoothElevations(smoothD) {
  let smoothed = [];
  for (let r = 0; r < elevations.length; r++) {
    smoothed.push([]);
    for (let c = 0; c < elevations[0].length; c++) {
      smoothed[r][c] = 0;
    }
  }
  for (let r = smoothD; r < elevations.length - smoothD; r++) {
    for (let c = smoothD; c < elevations[0].length - smoothD; c++) {
      smoothed[r][c] = getSmoothedAve(smoothD, r, c);
    }
  }
  for (let r = 0; r < elevations.length; r++) {
    for (let c = 0; c < elevations[0].length; c++) {
      elevations[r][c] = smoothed[r][c];
    }
  }
}

function getSmoothedAve(d, row, col) {
  if (row - d >= 0 && row + d < elevations.length && col - d >= 0 && col + d < elevations[0].length) {
    let ave = 0;
    let div = 0;
    for (let r = row - d; r <= row + d; r++) {
      for (let c = col - d; c <= col + d; c++) {

        let dr = r - (row - d);
        let dc = c - (col - d);
        if (withinCircle(dr, dc, d)) {
          let dis = dist(dr, dc, d, d);
          let weight = map(dis, 0, d, 1, .5);
          ave += elevations[r][c] * weight;
          div += weight;
        }
      }
    }
    return ave / div;
  }
}

function logElevations() {
  for (let r = 0; r < elevations.length; r++) {
    for (let c = 0; c < elevations[0].length; c++) {
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
  for (let r = 0; r < elevations.length; r++) {
    for (let c = 0; c < elevations[0].length; c++) {
      let p = perlin.noise(r * noiseScale, c * noiseScale, 1.0);
      let noisez = perlin.noise(r * noiseScale, c * noiseScale, 1.0);
      if (elevations[r][c] > 0)
        elevations[r][c] += noisez * amt;
    }
  }
}


////////////////////////////////////////////////////////////////////////////////////
// MAPBOX / MAPPA
////////////////////////////////////////////////////////////////////////////////////
async function loadMappa() {
  try {
    if (DEV_MODE) console.log((consoleID++) + " mappa loading");
    myMap = await mappa.staticMap(options);
    return;
  }
  catch (error) {
    console.log(error);
  }
}

export function getMapUrl() {
  return myMap.imgUrl;
}

function addNavMap() {
  mapboxgl.accessToken = keys.mapbox;
  navMap = new mapboxgl.Map({
    container: 'navMap',
    style: 'mapbox://styles/jdeboi/cki7rn91i675t19l7ckudb7e5',
    center: center,
    zoom: 10
  });

  navMap.on('click', function (e) {
    center = { lng: e.lngLat.wrap().lng, lat: e.lngLat.wrap().lat };
    navMap.flyTo({
      center: [center.lng, center.lat],
      zoom: 11,
      bearing: 0,
      pitch: 0,
      essential: true // this animation is considered essential with respect to prefers-reduced-motion
    })
    newMap();
  });
}

export function setMapRotation(rot) {
  if (navMap) {
    let pitch = getPitch(rot.x);
    let bearing = getBearing(rot.z);
    navMap.setPitch(pitch);
    navMap.setBearing(bearing);
  }
}

function newMap() {
  console.log("-----------new map");
  moveMap(center); // includes resettings
  console.log("marker", center);
  loadMappa()
    .then(prepareData)
    .then((data) => updateTerrain(data))
    .catch((error) => {
      console.log(error);
    })
}

////////////////////////////////////////////////////////////////////////////////////
// LOADING JSON
////////////////////////////////////////////////////////////////////////////////////

function readUploadedFile() {
  loadingMapPage();
  var promise = new Promise(function (resolve, reject) {
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
      reader.onload = function () {
        var json = JSON.parse(reader.result);
        resolve(json);
      };
      reader.onerror = function () {
        reject(Error(reader.error));
      };
    }
  });
  return promise;
}


function loadingMapPage() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("landingPage").style.display = "none";
}

////////////////////////////////////////////////////////////////////////////////////
// HELPERS
////////////////////////////////////////////////////////////////////////////////////

function dist(x0, y0, x1, y1) {
  let dx = (x1 - x0);
  let dy = (y1 - y0);
  return Math.sqrt(dx * dx + dy * dy);
}

function map(num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function withinCircle(dr, dc, rad) {
  let dis = dist(dr, dc, rad, rad);
  return Math.floor(dis) <= rad;
}


function getPitch(rad) {
  let m = mod(rad, 2 * Math.PI);
  let d = getDeg(m);
  return map(d, 180, 360, 0, 60);
}

function getBearing(rad) {
  let m = mod(rad, 2 * Math.PI);
  let d = getDeg(m);
  return map(d, 360, 0, 0, 360);
}

function mod(a, b) {
  let c = a % b
  return (c < 0) ? c + b : c
}

function getDeg(rad) {
  // 0- 60
  // 0 = top down
  let deg = rad / Math.PI * 180;
  return deg;
}






