import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStaticMeshes } from './static-meshes.js';
import { createBeachLife } from './beach-life.js';
import { createCelestialDiscs, sampleCelestialOrbit } from './celestial-discs.js';
import { bakeExteriorImage, showsExteriorDetail } from './exterior-lod.js';

export async function createCoastalEnvironment(
  THREE,
  scene,
  { renderer, sun, ambient, outdoor, reducedMotion }
) {
  const coast = new THREE.Group();
  coast.name = 'OFOQCoast';
  scene.add(coast);
  const sandMaterial = new THREE.MeshStandardMaterial({
    color: '#e2cfa7',
    roughness: 0.94,
    vertexColors: true
  });
  const shoreX = (z) => -63 + Math.sin((z + 5) * 0.045) * 2.6 + Math.sin(z * 0.13) * 0.66;
  const pathMaterial = new THREE.MeshStandardMaterial({ color: '#d8d5ca', roughness: 0.85 });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: '#a97c50', roughness: 0.8 });

  function box(size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.receiveShadow = true;
    coast.add(mesh);
    return mesh;
  }

  // Curved sand strip to the left of the entrance plaza.
  const sand = new THREE.PlaneGeometry(36, 150, 18, 55);
  sand.rotateX(-Math.PI / 2);
  const sandPositions = sand.attributes.position;
  const sandColors = [];
  for (let i = 0; i < sandPositions.count; i++) {
    const z = sandPositions.getZ(i) - 5;
    const ratio = (sandPositions.getX(i) + 18) / 36;
    const shore = shoreX(z);
    const x = shore + ratio * (-28 - shore);
    const dune = Math.sin(z * 0.096) * Math.sin(x * 0.22) * 0.09 * ratio;
    sandPositions.setXYZ(i, x, -0.1 + ratio * 0.34 + dune, z);
    const dry = THREE.MathUtils.smoothstep(ratio, 0.014, 0.17);
    const grain = Math.sin(i * 1.73) * 0.03 + Math.sin(z * 0.45 + x * 0.8) * 0.026;
    sandColors.push(
      0.62 + 0.36 * dry + grain,
      0.51 + 0.46 * dry + grain,
      0.43 + 0.53 * dry + grain
    );
  }
  sand.setAttribute('color', new THREE.Float32BufferAttribute(sandColors, 3));
  sand.computeVertexNormals();
  const beach = new THREE.Mesh(sand, sandMaterial);
  beach.receiveShadow = true;
  coast.add(beach);
  const beachLife = createBeachLife(THREE, coast, { reducedMotion, mergeGeometries });

  // Promenade and a short boardwalk link the coast to the existing plaza.
  box([4, 0.16, 148], [-28, 0.2, -5], pathMaterial);
  box([18, 0.12, 3.2], [-31, 0.26, 26], woodMaterial);
  for (let x = -39; x <= -23; x += 1) box([0.035, 0.02, 3.2], [x, 0.33, 26], pathMaterial);

  const waterGeometry = new THREE.PlaneGeometry(245, 320, 44, 36);
  waterGeometry.rotateX(-Math.PI / 2);
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: '#147d9a',
    roughness: 0.33,
    metalness: 0.16
  });
  const offshoreMaterial = waterMaterial.clone();
  offshoreMaterial.roughness = 0.62;
  offshoreMaterial.metalness = 0.06;
  const waveTime = { value: 0 };
  const shallows = { value: new THREE.Color('#38ac9f') };
  waterMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.waveTime = waveTime;
    shader.uniforms.shallows = shallows;
    shader.vertexShader =
      'uniform float waveTime; varying vec2 coastPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      transformed.y += sin(position.x * .18 + waveTime * .8) * .062
        + sin(position.z * .16 - waveTime * .65) * .046;
      coastPosition = (modelMatrix * vec4(transformed, 1.0)).xz;
    `
    );
    shader.fragmentShader =
      'uniform vec3 shallows; varying vec2 coastPosition;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      float edge = -63.0 + sin((coastPosition.y + 5.0) * .045) * 2.6 + sin(coastPosition.y * .13) * .66;
      float nearShore = 1.0 - smoothstep(0.0, 23.0, edge - coastPosition.x);
      diffuseColor.rgb = mix(diffuseColor.rgb, shallows, nearShore * .78);
    `
    );
  };
  waterMaterial.customProgramCacheKey = () => 'saei-coastal-waves-v2';
  const ocean = new THREE.Mesh(waterGeometry, waterMaterial);
  ocean.name = 'OFOQOcean';
  ocean.position.set(-180, -0.05, -5);
  ocean.receiveShadow = true;
  coast.add(ocean);
  const offshore = new THREE.Mesh(new THREE.PlaneGeometry(480, 720), offshoreMaterial);
  offshore.rotation.x = -Math.PI / 2;
  offshore.position.set(-301.25, -0.165, -54);
  coast.add(offshore);

  // One thin, transparent ribbon carries the two spreading foam crests.
  const foamGeometry = new THREE.PlaneGeometry(6, 148, 1, 86).rotateX(-Math.PI / 2);
  const foamPositions = foamGeometry.attributes.position;
  for (let i = 0; i < foamPositions.count; i++) {
    const z = foamPositions.getZ(i) - 5;
    foamPositions.setXYZ(i, shoreX(z) - 1.2 + foamPositions.getX(i), 0.001, z);
  }
  const foamAmount = { value: 0.76 };
  const foamMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: { waveTime, foamAmount, foamColor: { value: new THREE.Color('#d9f0e6') } },
    vertexShader: `
      varying vec2 ribbon;
      varying float distanceFromCamera;
      void main() {
        ribbon = uv;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        distanceFromCamera = -viewPosition.z;
        gl_Position = projectionMatrix * viewPosition;
      }`,
    fragmentShader: `
      uniform float waveTime, foamAmount;
      uniform vec3 foamColor;
      varying vec2 ribbon;
      varying float distanceFromCamera;
      float crest(float distance, float width) {
        return 1.0 - smoothstep(0.0, width, abs(distance));
      }
      void main() {
        float y = ribbon.y * 149.0;
        float edge = .51 + sin(y * .31 + waveTime * .82) * .059
          + sin(y * .67 - waveTime * 1.4) * .021;
        float lace = .66 + .34 * sin(y * 9.6 + sin(y * 3.0) * 1.8 + ribbon.x * 39.0);
        float opacity = (crest(ribbon.x - edge, .075)
          + .27 * crest(ribbon.x - edge + .21 + sin(y * .28) * .045, .054))
          * lace * foamAmount * (1.0 - smoothstep(90.0, 300.0, distanceFromCamera));
        gl_FragColor = vec4(foamColor, opacity);
        #include <colorspace_fragment>
      }`
  });
  const foam = new THREE.Mesh(foamGeometry, foamMaterial);
  coast.add(foam);

  const loader = new GLTFLoader();
  const root = new URL('./assets/3d/environment/', import.meta.url).href;
  const [palmAsset, tableAsset] = await Promise.all([
    loader.loadAsync(root + 'palm-tree.glb'),
    loader.loadAsync(root + 'beach-table.glb')
  ]);
  const palmImage = bakeExteriorImage(THREE, renderer, palmAsset.scene);
  const tableImage = bakeExteriorImage(THREE, renderer, tableAsset.scene);
  const shoreProps = [];

  function placeModel(source, image, height, x, z, rotation = 0) {
    const holder = new THREE.Group();
    holder.userData.dynamicScene = true;
    const model = source.clone(true);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = height / size.y;
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          material.metalness = Math.min(material.metalness || 0, 0.1);
          material.roughness = Math.max(material.roughness || 0.8, 0.65);
        });
      }
    });
    holder.add(model);
    holder.position.set(x, 0.23, z);
    holder.rotation.y = rotation;
    coast.add(holder);
    const sprite = image.addTo(holder, coast, height);
    shoreProps.push({ holder, sprite });
  }

  for (let i = 0; i < 9; i++) {
    placeModel(palmAsset.scene, palmImage, 7 + (i % 3), -34 - (i % 2) * 3, -55 + i * 14, i * 0.8);
  }
  for (let i = 0; i < 5; i++) {
    placeModel(tableAsset.scene, tableImage, 3.5, -45 - (i % 2) * 4, -39 + i * 20, i * 0.65);
  }

  // A single scene background controls the entire sky in both modes.
  // No dome material can retain a different color above this background.

  const celestialSky = new THREE.Group();
  celestialSky.name = 'SAEICelestialSky';
  celestialSky.renderOrder = -1;
  scene.add(celestialSky);
  const discs = createCelestialDiscs(THREE, celestialSky);
  const { sun: sunDisc, moon } = discs;

  const starsGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 180; i++) {
    const angle = i * 2.39996;
    const elevation = 0.12 + ((i % 67) / 67) * 0.85;
    const radius = Math.sqrt(1 - elevation * elevation) * 195;
    starPositions.push(Math.cos(angle) * radius, elevation * 195, Math.sin(angle) * radius);
  }
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({
      color: '#d5e3ff',
      size: 0.65,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false
    })
  );
  celestialSky.add(stars);

  const moonLight = new THREE.DirectionalLight('#ffe0d0', 0.53);
  moonLight.position.copy(moon.position);
  scene.add(moonLight);

  // One value controls the whole scene: 0 is day, 1 is night.
  const transitionDuration = 6;
  let nightAmount = 0;
  let transitionStart = 0;
  let transitionTarget = 0;
  let transitionTime = transitionDuration;
  let transitionStartedAt = 0;
  let destroyed = false;
  const dayAmbient = new THREE.Color('#d5e6ff');
  const nightAmbient = new THREE.Color('#9db7e2');
  const dayFog = new THREE.Color('#87ceeb');
  const nightFog = new THREE.Color('#080f20');
  const daySky = new THREE.Color('#87ceeb');
  const nightSky = new THREE.Color('#080f20');
  const dayWater = new THREE.Color('#147d9a');
  const nightWater = new THREE.Color('#164466');
  const dayShallows = new THREE.Color('#38ac9f');
  const nightShallows = new THREE.Color('#2e5c67');
  function updateCelestialPositions(amount) {
    const orbit = sampleCelestialOrbit(amount);
    sunDisc.position.fromArray(orbit.sun);
    moon.position.fromArray(orbit.moon);
    const sunOpacity = THREE.MathUtils.smoothstep(sunDisc.position.y, -5, 10);
    const moonOpacity = THREE.MathUtils.smoothstep(moon.position.y, -5, 10);
    discs.update(sunOpacity, moonOpacity);
    moonLight.position.copy(moon.position);
  }

  function applyTimeOfDay(amount) {
    nightAmount = amount;
    const daylight = 1 - amount;

    updateCelestialPositions(amount);
    sun.intensity = 3.5 * daylight;
    moonLight.intensity = 0.53 * amount;
    stars.material.opacity = amount;
    ambient.intensity = THREE.MathUtils.lerp(1.65, 0.45, amount);
    ambient.color.copy(dayAmbient).lerp(nightAmbient, amount);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.15, 1.05, amount);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.85, 0.16, amount);
    scene.fog.color.copy(dayFog).lerp(nightFog, amount);
    // Match every uncovered part of the sky to the same day/night transition.
    scene.background.copy(daySky).lerp(nightSky, amount);
    waterMaterial.color.copy(dayWater).lerp(nightWater, amount);
    offshoreMaterial.color.copy(waterMaterial.color);
    shallows.value.copy(dayShallows).lerp(nightShallows, amount);
    foamAmount.value = THREE.MathUtils.lerp(0.77, 0.25, amount);
    palmImage.material.color.setScalar(1 - amount * 0.76);
    tableImage.material.color.copy(palmImage.material.color);
    // Optional street-light integration must never stop the sky transition.
    if (typeof outdoor?.userData?.setNight === 'function') {
      outdoor.userData.setNight(amount);
    }

    const state = document.documentElement.dataset;
    state.dayNightProgress = amount.toFixed(4);
    state.dayNightTransitioning = String(transitionTime < transitionDuration);
    state.sunVisible = String(sunDisc.visible);
    state.moonVisible = String(moon.visible);
    state.sunHeight = sunDisc.position.y.toFixed(2);
    state.moonHeight = moon.position.y.toFixed(2);
  }

  function advanceTransition() {
    transitionTime = Math.min((performance.now() - transitionStartedAt) / 1000, transitionDuration);
    const progress = transitionTime / transitionDuration;
    const eased = progress * progress * (3 - 2 * progress);
    applyTimeOfDay(THREE.MathUtils.lerp(transitionStart, transitionTarget, eased));
  }

  function setNight(night, immediate = false) {
    if (destroyed) return;
    const target = night ? 1 : 0;
    // The button and theme observer can request the same state in one turn.
    if (!immediate && target === transitionTarget) return;
    transitionStart = nightAmount;
    transitionStartedAt = performance.now();
    transitionTarget = target;
    transitionTime =
      immediate || reducedMotion || transitionStart === target ? transitionDuration : 0;
    document.documentElement.dataset.timeOfDay = night ? 'night' : 'day';
    applyTimeOfDay(transitionTime === transitionDuration ? target : nightAmount);
  }

  function update(dt, camera, outside = true, peopleVisible = true) {
    if (destroyed) return;
    if (outside) {
      const seaDistance = camera.far - 12;
      const waterHorizon = -Math.atan2(camera.position.y + 0.16, seaDistance);
      discs.setSeaLine(camera.position.y + 202 * Math.sin(waterHorizon));
    }
    // Reconcile both directions with the visible page, including late model loading.
    const nightRequested = document.documentElement.dataset.theme === 'dark';
    if (Number(nightRequested) !== transitionTarget) setNight(nightRequested);
    if (transitionTime < transitionDuration) advanceTransition();
    coast.visible = outside;
    celestialSky.visible = outside;
    // Keep distant sky objects at the same bearing while the camera descends.
    if (outside) {
      celestialSky.position.copy(camera.position);
      // Keep the same left-side composition on narrow phones.
      celestialSky.position.x += 18 * (1 - THREE.MathUtils.smoothstep(camera.aspect, 0.56, 1.08));
      for (const { holder, sprite } of shoreProps) {
        holder.visible = showsExteriorDetail(
          camera.position.distanceToSquared(holder.position),
          holder.visible,
          55
        );
        sprite.visible = !holder.visible;
      }
    }
    const nearWater = outside && camera.position.y < 34 && camera.position.z > 12;
    beachLife.update(dt, nearWater, peopleVisible);

    if (reducedMotion || !nearWater) return;
    waveTime.value += dt;
  }

  // Follow the visible page mode even when models finish loading later.
  setNight(document.documentElement.dataset.theme === 'dark', true);
  const themeObserver = new MutationObserver(() => {
    setNight(document.documentElement.dataset.theme === 'dark');
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
  const coastalBatches = mergeStaticMeshes(
    THREE,
    coast,
    mergeGeometries,
    new Set([ocean, beachLife.group])
  ).geometries;
  document.documentElement.dataset.coastalModels = 'palm-tree,beach-table';
  document.documentElement.dataset.beachPalms = '9';
  document.documentElement.dataset.beachTables = '5';
  return {
    setNight,
    update,
    destroy() {
      destroyed = true;
      discs.dispose();
      celestialSky.traverse((object) => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      celestialSky.removeFromParent();
      beachLife.destroy();
      palmImage.destroy();
      tableImage.destroy();
      coastalBatches.forEach((geometry) => geometry.dispose());
      themeObserver.disconnect();
    }
  };
}
