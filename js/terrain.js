
import * as THREE from './three/build/three.module.js';

import Stats from './three/examples/jsm/libs/stats.module.js';

// import { FirstPersonControls } from './three/examples/jsm/controls/FirstPersonControls.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from './three/examples/jsm/math/ImprovedNoise.js';
import { DEV_MODE } from './MapData.js';
import { Water } from './three/examples/jsm/objects/Water2.js';

import { setMapRotation, getMapUrl } from './MapData.js';


var container, stats;

var camera, controls, scene, renderer, water;

var terrainMesh, texture, terrainGeometry, mapPlane;

var worldWidth = 256, worldDepth = worldWidth,
  worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
var binSize = 4;

var isDragging = false;

var customUniforms = {};
var displacement;

var loadingMappa = true;

export function initTerrain(data) {
  console.log("init terrain")
  container = document.getElementById('threeContainer');

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(0, 1000, 0);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfff1c2);//cyan 0x3b6763

  addTerrain(data);
  addWater();
  prepareScene();
  addMapImage();
  showMaps();
  animate();
  // .then(showMaps)
  // .then(animate)
  // .catch((err) => {
  //   console.log(err);
  // })
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
  controls.minDistance = 50;
  controls.maxDistance = 8000;
  controls.maxPolarAngle = 60 / 180 * Math.PI;
  if (!DEV_MODE) controls.enablePan = false;

  if (DEV_MODE) {
    stats = new Stats();
    container.appendChild(stats.dom);
  }


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
  updateMapImage()
    .then(() => {
      for (var i = 0, j = 0, l = displacement.length; i < l; i++, j += 3) {
        displacement[i] = data[i];
      }
      terrainMesh.geometry.attributes.displacement.needsUpdate = true;
      camera.position.set(0, 1000, 0);
    });

}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // controls.handleResize();
}

function addTerrain(data) {
  console.log("ADDING TERRAIN");

  var oceanTexture = new THREE.ImageUtils.loadTexture('textures/terrain/dirt-512.jpg');
  oceanTexture.wrapS = oceanTexture.wrapT = THREE.RepeatWrapping;

  var sandyTexture = new THREE.ImageUtils.loadTexture('textures/terrain/sand-512.jpg');
  sandyTexture.wrapS = sandyTexture.wrapT = THREE.RepeatWrapping;

  var grassTexture = new THREE.ImageUtils.loadTexture('textures/terrain/grass-512.jpg');
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;

  var rockyTexture = new THREE.ImageUtils.loadTexture('textures/terrain/rock-512.jpg');
  rockyTexture.wrapS = rockyTexture.wrapT = THREE.RepeatWrapping;

  var snowyTexture = new THREE.ImageUtils.loadTexture('textures/terrain/snow-512.jpg');
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
  // var waterGeo = new THREE.PlaneGeometry(worldWidth * binSize, worldDepth * binSize, 1, 1);
  // var waterTex = new THREE.ImageUtils.loadTexture('../images/water512.jpg');
  // waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
  // waterTex.repeat.set(5, 5);
  // var waterMat = new THREE.MeshBasicMaterial({ map: waterTex, transparent: true, opacity: 0.40 });
  // var water = new THREE.Mesh(waterGeo, waterMat);
  // water.rotation.x = -Math.PI / 2;
  // water.position.y = 15;
  // scene.add(water);

  const waterGeometry = new THREE.PlaneBufferGeometry(worldWidth * binSize, worldDepth * binSize);
  water = new Water(waterGeometry, {
    color: 0xffffff,
    scale: 1,
    flowDirection: new THREE.Vector2(.3, .3),
    textureWidth: 1024,
    textureHeight: 1024
  });

  water.position.y = 15;
  water.rotation.x = Math.PI * - 0.5;
  scene.add(water);

}


function addMapImage() {
  return getMappaImg()
    .then((image) => {
      var texture = new THREE.CanvasTexture(image);
      var material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, opacity: .5, transparent: true });
      addMapPlane(material);
    })
    .catch((err) => {
      console.log(err);
    })
}

function getMappaImg() {
  showLoading();
  return new Promise((resolve, reject) => {
    new THREE.ImageLoader()
      .setCrossOrigin('*')
      .load(getMapUrl() + "?" + performance.now(),
        function (image) {
          hideLoading();
          resolve(image);
        },
        undefined, //on progress not currently supported
        function (err) {
          hideLoading();
          reject(err);
        }
      );
  })
}

function updateMapImage() {
  showLoading();
  return getMappaImg()
    .then((image) => {
      var texture = new THREE.CanvasTexture(image);
      var material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, opacity: .5, transparent: true });
      mapPlane.material = material;
      mapPlane.material.needsUpdate = true;
      hideLoading();
    })
    .catch((err) => {
      console.log(err);
      hideLoading();
    })
}


function addMapPlane(material) {
  var mapGeo = new THREE.PlaneGeometry(worldWidth * binSize, worldDepth * binSize, 1, 1);
  mapPlane = new THREE.Mesh(mapGeo, material);
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
