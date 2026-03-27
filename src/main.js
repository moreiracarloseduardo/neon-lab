import './style.css'; // Importa o CSS para o Vite processar
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import GUI from 'lil-gui';



// ============ SETUP ============
let scene, camera, renderer, composer;
let objects = [];
let lights = [];
let time = 0;
let frameCount = 0;
let lastTime = Date.now();
let gui, bloomPass, ambientLight;
let settings = {
  bloomStrength: 0.8,
  bloomRadius: 0.5,
  bloomThreshold: 0.9,
  ambientIntensity: 0.05,
  exposure: 0.8,
  redIntensity: 8,
  greenIntensity: 8,
  blueIntensity: 8,
  sphereColor: '#ffffff',
  sphereMetalness: 1.0,
  sphereRoughness: 0.05,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
};


function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 8, 20);
  camera.lookAt(0, 5, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  document.body.appendChild(renderer.domElement);

  // Environment (IBL)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;


  // Post-processing (Bloom)
  const renderPass = new RenderPass(scene, camera);
  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    settings.bloomStrength,
    settings.bloomRadius,
    settings.bloomThreshold
  );

  composer.addPass(bloomPass);


  // Initialize RectAreaLight
  RectAreaLightUniformsLib.init();

  // Setup scene
  createEnvironment();
  createLights();
  createObjects();
  setupGUI();


  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 5, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.update();

  // Event listeners
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();
}

function createEnvironment() {
  // Platform ground
  const platformGeo = new THREE.CylinderGeometry(20, 20, 0.5, 64);
  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    metalness: 0.4,
    roughness: 0.6,
  });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.y = -0.5;
  platform.receiveShadow = true;
  scene.add(platform);

  // Grid pattern on platform
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 16; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 16, 0);
    ctx.lineTo(i * 16, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 16);
    ctx.lineTo(256, i * 16);
    ctx.stroke();
  }

  // Create procedural roughness map for floor
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 256;
  rCanvas.height = 256;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#666666'; // Base roughness
  rCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 1.5;
    rCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
    rCtx.beginPath();
    rCtx.arc(x, y, r, 0, Math.PI * 2);
    rCtx.fill();
  }
  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(8, 8);

  const texture = new THREE.CanvasTexture(canvas);

  texture.repeat.set(8, 8);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const platformTopGeo = new THREE.CircleGeometry(19.8, 64);
  const platformTopMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughnessMap: roughnessMap,
    color: 0x0f0f1e,
    metalness: 0.3,
    roughness: 0.6,
  });

  const platformTop = new THREE.Mesh(platformTopGeo, platformTopMat);
  platformTop.position.y = 0.1;
  platformTop.rotation.x = -Math.PI / 2;
  platformTop.receiveShadow = true;
  scene.add(platformTop);

  // Ambient light - reduced for more contrast
  ambientLight = new THREE.AmbientLight(0x1a1a3a, settings.ambientIntensity);
  scene.add(ambientLight);



  // Subtle directional light for fill
  const fillLight = new THREE.DirectionalLight(0x00ffff, 0.1);
  fillLight.position.set(-20, 15, 20);
  scene.add(fillLight);
}

function createLights() {
  // Red light panel
  const redLight = new THREE.RectAreaLight(0xff0055, 8, 8, 12);
  redLight.position.set(-12, 12, 8);
  redLight.lookAt(0, 5, 0);
  scene.add(redLight);
  lights.push({
    light: redLight,
    basePos: redLight.position.clone(),
    color: 0xff0055,
    speed: 0.8,
    angle: 0,
    radius: 8,
  });
  scene.add(new RectAreaLightHelper(redLight));

  // Green light panel
  const greenLight = new THREE.RectAreaLight(0x00ff88, 8, 8, 12);
  greenLight.position.set(12, 12, 8);
  greenLight.lookAt(0, 5, 0);
  scene.add(greenLight);
  lights.push({
    light: greenLight,
    basePos: greenLight.position.clone(),
    color: 0x00ff88,
    speed: 0.5,
    angle: Math.PI * 0.67,
    radius: 8,
  });
  scene.add(new RectAreaLightHelper(greenLight));

  // Blue light panel
  const blueLight = new THREE.RectAreaLight(0x00aaff, 8, 8, 12);
  blueLight.position.set(0, 12, -12);
  blueLight.lookAt(0, 5, 0);
  scene.add(blueLight);
  lights.push({
    light: blueLight,
    basePos: blueLight.position.clone(),
    color: 0x00aaff,
    speed: 1.1,
    angle: Math.PI,
    radius: 8,
  });
  scene.add(new RectAreaLightHelper(blueLight));
}

function createObjects() {
  // Center: Metallic sphere
  const sphereGeo = new THREE.IcosahedronGeometry(2, 8);
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.0,
  });

  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.y = 4;
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);

  // Add Contact Shadow for sphere
  addContactShadow(sphere, 4);

  objects.push({

    mesh: sphere,
    type: 'sphere',
    baseY: 4,
    bobSpeed: 1.5,
  });

  // Glass cube (transmissive)
  const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
  const cubeMat = new THREE.MeshPhysicalMaterial({
    color: 0x00ffff,
    transparent: true,
    transmission: 1.0, 
    thickness: 2.0,
    metalness: 0.0,
    roughness: 0.1,
    ior: 1.45,
    attenuationColor: 0x00ffff,
    attenuationDistance: 0.5,
  });
  const cube = new THREE.Mesh(cubeGeo, cubeMat);
  cube.position.set(-6, 4, -3);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
  
  // Add Contact Shadow for cube
  addContactShadow(cube, 2.5);

  objects.push({

    mesh: cube,
    type: 'cube',
    basePos: cube.position.clone(),
    speed: 1.2,
    radius: 0.5,
  });

  // Brushed metal cylinder
  const cylGeo = new THREE.CylinderGeometry(1, 1, 3, 32);
  const cylMat = new THREE.MeshStandardMaterial({
    color: 0xff8800,
    metalness: 0.8,
    roughness: 0.3,
  });
  const cylinder = new THREE.Mesh(cylGeo, cylMat);
  cylinder.position.set(6, 3, -4);
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  scene.add(cylinder);
  objects.push({
    mesh: cylinder,
    type: 'cylinder',
    basePos: cylinder.position.clone(),
    speed: 0.8,
    radius: 0.3,
  });

  // Floating pyramids
  for (let i = 0; i < 3; i++) {
    const pyramidGeo = new THREE.TetrahedronGeometry(1.2, 0);
    const pyramidMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(i / 3, 0.8, 0.5),
      metalness: 0.6,
      roughness: 0.4,
      emissive: new THREE.Color().setHSL(i / 3, 0.8, 0.3),
      emissiveIntensity: 0.3,
    });
    const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
    const angle = (i / 3) * Math.PI * 2;
    pyramid.position.set(
      Math.cos(angle) * 8,
      6 + i * 0.5,
      Math.sin(angle) * 8
    );
    pyramid.castShadow = true;
    pyramid.receiveShadow = true;
    scene.add(pyramid);
    objects.push({
      mesh: pyramid,
      type: 'pyramid',
      basePos: pyramid.position.clone(),
      orbitalSpeed: 0.3 + i * 0.1,
      orbitalRadius: 8,
      verticalBob: 0.4,
    });
  }

  // Toroidal ring (different interpretation)
  const torusGeo = new THREE.TorusGeometry(4, 0.8, 16, 100);
  const torusMat = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    metalness: 0.7,
    roughness: 0.2,
    emissive: 0x660099,
    emissiveIntensity: 0.2,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.y = 5;
  torus.rotation.x = Math.PI * 0.3;
  torus.castShadow = true;
  torus.receiveShadow = true;
  scene.add(torus);
  objects.push({
    mesh: torus,
    type: 'torus',
    rotationSpeed: 0.4,
  });

  // Additional small reflective spheres
  for (let i = 0; i < 5; i++) {
    const smallGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const smallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.9, 0.4),
      metalness: 0.9,
      roughness: 0.05,
    });
    const smallSphere = new THREE.Mesh(smallGeo, smallMat);
    const angle = (i / 5) * Math.PI * 2;
    smallSphere.position.set(
      Math.cos(angle) * 10,
      3.5,
      Math.sin(angle) * 10
    );
    smallSphere.castShadow = true;
    smallSphere.receiveShadow = true;
    scene.add(smallSphere);
    objects.push({
      mesh: smallSphere,
      type: 'smallSphere',
      basePos: smallSphere.position.clone(),
      pulsateSpeed: 0.6 + Math.random() * 0.4,
      scale: 0.4,
    });
  }
}

function animate() {
  requestAnimationFrame(animate);
  time += 0.016;
  frameCount++;

  // Update lights with orbital motion
  lights.forEach((lightData) => {
    lightData.angle += lightData.speed * 0.016;
    const x = Math.cos(lightData.angle) * lightData.radius;
    const z = Math.sin(lightData.angle) * lightData.radius;
    lightData.light.position.copy(lightData.basePos);
    lightData.light.position.x += x * 0.5;
    lightData.light.position.z += z * 0.5;
  });

  // Animate objects
  objects.forEach((obj) => {
    switch (obj.type) {
      case 'sphere':
        obj.mesh.position.y =
          obj.baseY + Math.sin(time * obj.bobSpeed) * 0.3;
        obj.mesh.rotation.x += 0.003;
        obj.mesh.rotation.y += 0.004;
        break;

      case 'cube':
        const cubeAngle = time * obj.speed;
        obj.mesh.position.x =
          obj.basePos.x + Math.cos(cubeAngle) * obj.radius;
        obj.mesh.position.z =
          obj.basePos.z + Math.sin(cubeAngle) * obj.radius;
        obj.mesh.rotation.x += 0.002;
        obj.mesh.rotation.y += 0.003;
        break;

      case 'cylinder':
        const cylAngle = time * obj.speed;
        obj.mesh.position.x =
          obj.basePos.x + Math.cos(cylAngle) * obj.radius;
        obj.mesh.position.z =
          obj.basePos.z + Math.sin(cylAngle) * obj.radius;
        obj.mesh.rotation.z += 0.005;
        break;

      case 'pyramid':
        const pyrAngle =
          time * obj.orbitalSpeed +
          Math.atan2(
            obj.basePos.z,
            obj.basePos.x
          );
        obj.mesh.position.x =
          Math.cos(pyrAngle) * obj.orbitalRadius;
        obj.mesh.position.y =
          obj.basePos.y +
          Math.sin(time * 0.8) * obj.verticalBob;
        obj.mesh.position.z =
          Math.sin(pyrAngle) * obj.orbitalRadius;
        obj.mesh.rotation.x += 0.002;
        obj.mesh.rotation.y += 0.003;
        break;

      case 'torus':
        obj.mesh.rotation.x += obj.rotationSpeed * 0.01;
        obj.mesh.rotation.z += obj.rotationSpeed * 0.008;
        break;

      case 'smallSphere':
        const scale = 1 +
          Math.sin(time * obj.pulsateSpeed) * 0.2;
        obj.mesh.scale.set(scale, scale, scale);
        break;
    }
  });

  // Update FPS
  if (frameCount % 10 === 0) {
    const now = Date.now();
    const fps = Math.round(
      (frameCount * 1000) / (now - lastTime)
    );
    document.getElementById('fps').textContent = `FPS: ${fps}`;
    lastTime = now;
    frameCount = 0;
  }

  composer.render();
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
}

// ============ HELPERS ============
function addContactShadow(target, size) {
  const shadowGeo = new THREE.PlaneGeometry(size, size);
  
  // Create a radial gradient for the shadow
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(0,0,0,0.8)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  const shadowTexture = new THREE.CanvasTexture(canvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.6
  });
  
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.15; // Slightly above platform
  scene.add(shadow);
  
  // Link shadow to object in the animation loop
  const originalUpdate = target.onBeforeRender;
  target.onBeforeRender = function() {
    shadow.position.x = target.position.x;
    shadow.position.z = target.position.z;
    // Scale shadow slightly based on height
    const h = target.position.y;
    const s = 1.0 + (h - 2) * 0.2; 
    shadow.scale.set(s, s, s);
    shadow.material.opacity = 0.8 / (1 + (h - 2) * 2);
  };
}

function setupGUI() {
  gui = new GUI();
  gui.title('Neon Lab Controls');

  const bloomFolder = gui.addFolder('Post-Processing (Bloom)');
  bloomFolder.add(settings, 'bloomStrength', 0, 3).name('Strength').onChange((v) => bloomPass.strength = v);
  bloomFolder.add(settings, 'bloomRadius', 0, 1).name('Radius').onChange((v) => bloomPass.radius = v);
  bloomFolder.add(settings, 'bloomThreshold', 0, 1).name('Threshold').onChange((v) => bloomPass.threshold = v);
  bloomFolder.add(settings, 'exposure', 0, 2).name('Exposure').onChange((v) => renderer.toneMappingExposure = v);

  const lightFolder = gui.addFolder('Lights');
  lightFolder.add(settings, 'ambientIntensity', 0, 0.5).name('Ambient').onChange((v) => ambientLight.intensity = v);
  
  // Find light panel data
  const redData = lights.find(l => l.color === 0xff0055);
  const greenData = lights.find(l => l.color === 0x00ff88);
  const blueData = lights.find(l => l.color === 0x00aaff);

  if (redData) lightFolder.add(settings, 'redIntensity', 0, 20).name('Red Panel').onChange((v) => redData.light.intensity = v);
  if (greenData) lightFolder.add(settings, 'greenIntensity', 0, 20).name('Green Panel').onChange((v) => greenData.light.intensity = v);
  if (blueData) lightFolder.add(settings, 'blueIntensity', 0, 20).name('Blue Panel').onChange((v) => blueData.light.intensity = v);

  const matFolder = gui.addFolder('Main Sphere Material');
  const sphere = objects.find(o => o.type === 'sphere')?.mesh;
  if (sphere) {
    matFolder.addColor(settings, 'sphereColor').name('Color').onChange((v) => sphere.material.color.set(v));
    matFolder.add(settings, 'sphereMetalness', 0, 1).name('Metalness').onChange((v) => sphere.material.metalness = v);
    matFolder.add(settings, 'sphereRoughness', 0, 1).name('Roughness').onChange((v) => sphere.material.roughness = v);
    matFolder.add(settings, 'clearcoat', 0, 1).name('Clearcoat').onChange((v) => sphere.material.clearcoat = v);
    matFolder.add(settings, 'clearcoatRoughness', 0, 1).name('C-Roughness').onChange((v) => sphere.material.clearcoatRoughness = v);
  }

  // Neon stying class
  gui.domElement.classList.add('neon-gui');
}

// Initialize
init();