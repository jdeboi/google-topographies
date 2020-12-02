
import * as THREE from './three/build/three.module.js';

import Stats from './three/examples/jsm/libs/stats.module.js';

// import { FirstPersonControls } from './three/examples/jsm/controls/FirstPersonControls.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from './three/examples/jsm/math/ImprovedNoise.js';
// import { MapData } from './MapData.js';

import { setMapRotation, getImg, getElevationData } from './MapData.js';


var container, stats;

var camera, controls, scene, renderer;

var terrainMesh, texture, terrainGeometry;

var worldWidth = 256, worldDepth = worldWidth,
  worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
var binSize = 4;

var clock = new THREE.Clock();

var canvas, canvasScaled, context, contextScaled, image, imageData, mapCanvas, mapContext;
var isDragging = false;

var customUniforms = {};
var displacement;

export function initTerrain(data) {
  console.log("init terrain")
  container = document.getElementById('container');

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(0, 1000, 0);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  addTerrain(data);
  addWater();
  prepareScene();
  addMapImage();
  animate();
}

function prepareScene() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  container.addEventListener('mousedown', e => {
    isDragging = true;
  });
  container.addEventListener('mouseup', e => {
    isDragging = false;
  });


  // controls = new FirstPersonControls( camera, renderer.domElement );
  // controls.movementSpeed = 1000;
  // controls.lookSpeed = 0.1;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 10000;
  controls.maxPolarAngle = 60 / 180 * Math.PI;
  controls.enablePan = false;

  stats = new Stats();
  container.appendChild(stats.dom);
  window.addEventListener('resize', onWindowResize, false);

  // const sphereRadius = 300;
  // const sphereWidthDivisions = 32;
  // const sphereHeightDivisions = 16;
  // const sphereGeo = new THREE.SphereBufferGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
  // const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });
  // const mesh = new THREE.Mesh(sphereGeo, sphereMat);
  // mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
  // scene.add(mesh);


  const color = 0xFFFFFF;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(0, 400, 0);
  light.target.position.set(-50, 0, 0);
  scene.add(light);
  scene.add(light.target);

  //

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(- 1, -100, 1);
  dirLight.position.multiplyScalar(30);
  scene.add(dirLight);

}

export function updateTerrain(data) {
  for (var i = 0, j = 0, l = displacement.length; i < l; i++, j += 3) {
    displacement[i] = data[i];
  }
  terrainMesh.geometry.attributes.displacement.needsUpdate = true;
  addMapImage();
  camera.position.set(0, 1000, 0);
}

export function updateTerrainOG(data) {
  console.log("updating terrain");
  camera.position.set(0, 0, 0);

  var vertices = terrainGeometry.attributes.position.array;
  for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
    vertices[j + 1] = data[i];
  }
  generateTexture(data, worldWidth, worldDepth);
  // generateMapTexture(data, worldWidth, worldDepth);

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  var mat = new THREE.MeshBasicMaterial({ map: texture });


  terrainMesh = new THREE.Mesh(terrainGeometry, mat);
  terrainMesh.geometry.dynamic = true;

  terrainMesh.geometry.vertices = vertices;
  terrainMesh.geometry.verticesNeedUpdate = true;
  terrainMesh.geometry.attributes.position.needsUpdate = true;


  addMapImage();

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  controls.handleResize();

}

function addTerrain(data) {
  console.log("ADDING TERRAIN");
  // terrainGeometry = new THREE.PlaneBufferGeometry(worldWidth * binSize, worldDepth * binSize, worldWidth - 1, worldDepth - 1);
  // terrainGeometry.rotateX(- Math.PI / 2);

  // var vertices = terrainGeometry.attributes.position.array;
  // for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
  //   vertices[j + 1] = data[i];
  // }
  // initCanvas(worldWidth, worldDepth);
  // generateTexture(data, worldWidth, worldDepth);
  // texture = new THREE.CanvasTexture(canvasScaled);
  // var mat = new THREE.MeshBasicMaterial({ map: texture });
  // terrainMesh = new THREE.Mesh(terrainGeometry, mat);
  // terrainMesh.geometry.dynamic = true;
  // scene.add(terrainMesh);

  // texture used to generate "bumpiness"
  var bumpTexture = new THREE.ImageUtils.loadTexture('images/heightmap.png');
  bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;
  // magnitude of normal displacement
  var bumpScale = 200.0;

  var oceanTexture = new THREE.ImageUtils.loadTexture('images/dirt-512.jpg');
  oceanTexture.wrapS = oceanTexture.wrapT = THREE.RepeatWrapping;

  var sandyTexture = new THREE.ImageUtils.loadTexture('images/sand-512.jpg');
  sandyTexture.wrapS = sandyTexture.wrapT = THREE.RepeatWrapping;

  var grassTexture = new THREE.ImageUtils.loadTexture('images/grass-512.jpg');
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;

  var rockyTexture = new THREE.ImageUtils.loadTexture('images/rock-512.jpg');
  rockyTexture.wrapS = rockyTexture.wrapT = THREE.RepeatWrapping;

  var snowyTexture = new THREE.ImageUtils.loadTexture('images/snow-512.jpg');
  snowyTexture.wrapS = snowyTexture.wrapT = THREE.RepeatWrapping;


  customUniforms = {
    oceanTexture: { type: "t", value: oceanTexture },
    sandyTexture: { type: "t", value: sandyTexture },
    grassTexture: { type: "t", value: grassTexture },
    rockyTexture: { type: "t", value: rockyTexture },
    snowyTexture: { type: "t", value: snowyTexture },
  };
  var uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib['lights'],
    { customUniforms }
  ]);
  var customMaterial = new THREE.ShaderMaterial(
    {
      uniforms: customUniforms,
      vertexShader: document.getElementById('vertexShader').textContent,
      fragmentShader: document.getElementById('fragmentShader').textContent,
      // side: THREE.DoubleSide
      // lights: true
    });


  terrainGeometry = new THREE.PlaneBufferGeometry(worldWidth * binSize, worldDepth * binSize, worldWidth - 1, worldDepth - 1);

  displacement = new Float32Array(terrainGeometry.attributes.position.count);
  for (var i = 0; i < displacement.length; i++) {
    displacement[i] = data[i];
  }
  terrainGeometry.setAttribute('displacement', new THREE.BufferAttribute(displacement, 1));

  terrainMesh = new THREE.Mesh(terrainGeometry, customMaterial);
  terrainMesh.geometry.dynamic = true;
  terrainMesh.geometry.attributes.displacement.needsUpdate = true;
  terrainMesh.rotation.x = -Math.PI / 2;
  terrainMesh.position.y = 0;
  scene.add(terrainMesh);



}



function addWater() {
  var waterGeo = new THREE.PlaneGeometry(worldWidth * binSize, worldDepth * binSize, 1, 1);
  var waterTex = new THREE.ImageUtils.loadTexture('../images/water512.jpg');
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
  waterTex.repeat.set(5, 5);
  var waterMat = new THREE.MeshBasicMaterial({ map: waterTex, transparent: true, opacity: 0.40 });
  var water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 15;
  scene.add(water);
}


function addMapImage() {

  new THREE.ImageLoader()
    .setCrossOrigin('*')
    .load(getImg() + "?" + performance.now(), function (image) {

      var texture = new THREE.CanvasTexture(image);
      var material = new THREE.MeshBasicMaterial({ color: 0xff8888, map: texture, opacity: 0.40 });
      addMapPlane(material);

    });

}

function addMapPlane(material) {
  var mapGeo = new THREE.PlaneGeometry(worldWidth * binSize, worldDepth * binSize, 1, 1);
  // mapTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
  // waterTex.repeat.set(5,5);
  // var waterMat = new THREE.MeshBasicMaterial( {map: waterTex, transparent:true, opacity:0.40} );
  var mapPlane = new THREE.Mesh(mapGeo, material);
  mapPlane.rotation.x = -Math.PI / 2;
  mapPlane.position.y = 10;
  scene.add(mapPlane);
}


// function generateHeight(width, height) {

//   var size = width * height, data = new Uint8Array(size),
//     perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

//   for (var j = 0; j < 4; j++) {

//     for (var i = 0; i < size; i++) {

//       var x = i % width, y = ~ ~(i / width);
//       data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);

//     }

//     quality *= 5;

//   }

//   return data;

// }


function initCanvas(width, height) {
  console.log("INIT CANVAS");
  // canvas = document.createElement('canvas');
  canvas = document.getElementById('canvas0');
  canvas.width = width;
  canvas.height = height;
  context = canvas.getContext('2d');

  // canvasScaled = document.createElement('canvas');
  canvasScaled = document.getElementById('canvas1');
  canvasScaled.width = width * 4;
  canvasScaled.height = height * 4;

  contextScaled = canvasScaled.getContext('2d');
  contextScaled.scale(4, 4);
}

export function initMapContext() {
  // console.log("map context created?");
  // mapCanvas = document.getElementsByClassName('mapboxgl-canvas');
  // mapContext = mapCanvas.getContext('2d');
  // console.log("map context created?", mapCanvas);
}

function generateMapTexture(data, width, height) {
  var vector3 = new THREE.Vector3(0, 0, 0);
  var sun = new THREE.Vector3(1, 1, 1);
  sun.normalize();

  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);

  image = context.getImageData(0, 0, canvas.width, canvas.height);
  var imageMapSrc = getImg(); //mapContext.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
  var imageMap = new Image();
  imageMap.onload = () => {
    console.log("IMG", imageMap);
    context.drawImage(imageMap, -500, 0);

    contextScaled.drawImage(canvas, 0, 0);

    image = contextScaled.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
    imageData = image.data;

    for (var i = 0, l = imageData.length; i < l; i += 4) {
      var v = ~ ~(Math.random() * 5);
      imageData[i] += v;
      imageData[i + 1] += v;
      imageData[i + 2] += v;
    }
    contextScaled.putImageData(image, 0, 0);
  }
  imageMap.src = imageMapSrc;

}

function generateTexture(data, width, height) {

  var vector3 = new THREE.Vector3(0, 0, 0);
  var sun = new THREE.Vector3(1, 1, 1);
  sun.normalize();

  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);

  image = context.getImageData(0, 0, canvas.width, canvas.height);
  imageData = image.data;

  // let hasPrinted0 = false;
  // let hasPrinted1 = false
  for (var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
    // if (data[j] !== 0 && !hasPrinted1) {
    //   console.log("dat", i, j, data[j]);
    //   hasPrinted1 = true;
    // }
    vector3.x = data[j - 2] - data[j + 2];
    vector3.y = 2;
    vector3.z = data[j - width * 2] - data[j + width * 2];
    vector3.normalize();

    var shade = vector3.dot(sun);

    imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
    imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
    imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);
  }

  context.putImageData(image, 0, 0);

  // Scaled 4x
  contextScaled.drawImage(canvas, 0, 0);

  image = contextScaled.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
  imageData = image.data;

  for (var i = 0, l = imageData.length; i < l; i += 4) {
    var v = ~ ~(Math.random() * 5);
    imageData[i] += v;
    imageData[i + 1] += v;
    imageData[i + 2] += v;
  }
  contextScaled.putImageData(image, 0, 0);
  return canvasScaled;
}

// function generateTextureOG(data, width, height) {

//   var canvas, canvasScaled, context, image, imageData, vector3, sun, shade;

//   vector3 = new THREE.Vector3(0, 0, 0);

//   sun = new THREE.Vector3(1, 1, 1);
//   sun.normalize();

//   canvas = document.createElement('canvas');
//   canvas.id = "textureCanvas";
//   canvas.width = width;
//   canvas.height = height;

//   context = canvas.getContext('2d');
//   context.fillStyle = '#000';
//   context.fillRect(0, 0, width, height);

//   image = context.getImageData(0, 0, canvas.width, canvas.height);
//   imageData = image.data;

//   for (var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {

//     vector3.x = data[j - 2] - data[j + 2];
//     vector3.y = 2;
//     vector3.z = data[j - width * 2] - data[j + width * 2];
//     vector3.normalize();

//     shade = vector3.dot(sun);

//     imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
//     imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
//     imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);

//   }

//   context.putImageData(image, 0, 0);

//   // Scaled 4x

//   canvasScaled = document.createElement('canvas');
//   canvasScaled.width = width * 4;
//   canvasScaled.height = height * 4;

//   context = canvasScaled.getContext('2d');
//   context.scale(4, 4);
//   context.drawImage(canvas, 0, 0);

//   image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
//   imageData = image.data;

//   for (var i = 0, l = imageData.length; i < l; i += 4) {

//     var v = ~ ~(Math.random() * 5);

//     imageData[i] += v;
//     imageData[i + 1] += v;
//     imageData[i + 2] += v;

//   }

//   context.putImageData(image, 0, 0);

//   return canvasScaled;

// }

//

function animate() {

  requestAnimationFrame(animate);

  render();
  stats.update();


}

function render() {

  controls.update();
  renderer.render(scene, camera);

  if (isDragging) setMapRotation(camera.rotation);
}
