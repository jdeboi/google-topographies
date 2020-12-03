
import * as THREE from './three/build/three.module.js';

import Stats from './three/examples/jsm/libs/stats.module.js';

// import { FirstPersonControls } from './three/examples/jsm/controls/FirstPersonControls.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from './three/examples/jsm/math/ImprovedNoise.js';
// import { MapData } from './MapData.js';

import { setMapRotation, getMapUrl } from './MapData.js';


var container, stats;

var camera, controls, scene, renderer;

var terrainMesh, texture, terrainGeometry;

var worldWidth = 256, worldDepth = worldWidth,
  worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
var binSize = 4;

var clock = new THREE.Clock();

var isDragging = false;

var customUniforms = {};
var displacement;

export function initTerrain(data) {
  console.log("init terrain")
  container = document.getElementById('threeContainer');

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(0, 1000, 0);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x00);

  addMapImage();
  addTerrain(data);
  addWater();
  prepareScene();
  showMaps();
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
  

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 10000;
  controls.maxPolarAngle = 60 / 180 * Math.PI;
  controls.enablePan = false;

  // stats = new Stats();
  // container.appendChild(stats.dom);
  window.addEventListener('resize', onWindowResize, false);

  // addTestSphere();
  addLights();
}

function addTestSphere() {
  const sphereRadius = 300;
  const sphereWidthDivisions = 32;
  const sphereHeightDivisions = 16;
  const sphereGeo = new THREE.SphereBufferGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
  const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });
  const mesh = new THREE.Mesh(sphereGeo, sphereMat);
  mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
  scene.add(mesh);
}

function addLights() {
  const color = 0xFFFFFF;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(0, 400, 0);
  light.target.position.set(-50, 0, 0);
  scene.add(light);
  scene.add(light.target);

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


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // controls.handleResize();
}

function addTerrain(data) {
  console.log("ADDING TERRAIN");
 
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
    .load(getMapUrl() + "?" + performance.now(), function (image) {

      var texture = new THREE.CanvasTexture(image);
      var material = new THREE.MeshBasicMaterial({ color: 0xff8888, map: texture, opacity: 0.40 });
      addMapPlane(material);

    });

}

function addMapPlane(material) {
  var mapGeo = new THREE.PlaneGeometry(worldWidth * binSize, worldDepth * binSize, 1, 1);
  var mapPlane = new THREE.Mesh(mapGeo, material);
  mapPlane.rotation.x = -Math.PI / 2;
  mapPlane.position.y = 10;
  scene.add(mapPlane);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  if (stats) stats.update();
}

function render() {
  controls.update();
  renderer.render(scene, camera);

  if (isDragging) setMapRotation(camera.rotation);
}
