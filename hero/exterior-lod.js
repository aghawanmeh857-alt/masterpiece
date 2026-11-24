export function showsExteriorDetail(distanceSquared, wasDetailed, distance) {
  const threshold = distance * (wasDetailed ? 1.08 : 0.92);
  return distanceSquared < threshold * threshold;
}

export function bakeExteriorImage(THREE, renderer, source) {
  const studio = new THREE.Scene();
  const model = source.clone();
  studio.add(model);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const width = Math.hypot(size.x, size.z) * 1.07;
  const height = (size.y + size.z * 0.16) * 1.1;
  const view = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    0.1,
    300
  );
  view.position.copy(center).add(new THREE.Vector3(2, 5, 32));
  view.lookAt(center);
  const sun = new THREE.DirectionalLight('#fff2de', 2.1);
  sun.position.set(-6, 12, 8);
  studio.add(sun, new THREE.HemisphereLight('#d7e8ff', '#7a796b', 1.2));
  const image = new THREE.WebGLRenderTarget(128, 128);
  const previous = renderer.getRenderTarget();
  const color = renderer.getClearColor(new THREE.Color());
  const alpha = renderer.getClearAlpha();
  const shadow = renderer.shadowMap.needsUpdate;
  try {
    renderer.setRenderTarget(image);
    renderer.setClearColor(0, 0);
    renderer.render(studio, view);
  } finally {
    renderer.setRenderTarget(previous);
    renderer.setClearColor(color, alpha);
    renderer.shadowMap.needsUpdate = shadow;
  }
  const material = new THREE.SpriteMaterial({
    map: image.texture,
    alphaTest: 0.24,
    transparent: false
  });
  return {
    material,
    addTo(subject, parent, targetHeight) {
      const picture = new THREE.Sprite(material);
      const scale = targetHeight / size.y;
      picture.position.copy(subject.position);
      picture.position.y += targetHeight * 0.5;
      picture.scale.set(width * scale, height * scale, 1);
      parent.add(picture);
      return picture;
    },
    destroy() {
      material.dispose();
      image.dispose();
    }
  };
}

export function addTowerBillboard(THREE, renderer, tower, scene, wordmark, setFacadeNight, initialNight, reducedMotion) {
  const bounds = new THREE.Box3().setFromObject(tower);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const bottom = 4.9;
  center.y = (bottom + bounds.max.y) / 2;
  const width = Math.hypot(size.x, size.z) * 1.02;
  const height = bounds.max.y - bottom + 2.5;
  const capture = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    1,
    230
  );
  capture.position.copy(center).add(new THREE.Vector3(21, 19, 112));
  capture.lookAt(center);
  const studio = new THREE.Scene();
  studio.environment = scene.environment;
  const towerCopy = tower.clone();
  studio.add(towerCopy, wordmark.clone());
  const light = new THREE.DirectionalLight('#fff0de', 3.5);
  light.position.set(-30, 65, 30);
  const fill = new THREE.HemisphereLight('#d5e6ff', '#747568', 1.65);
  studio.add(light, fill);
  const targetDay = new THREE.WebGLRenderTarget(256, 512);
  const targetNight = new THREE.WebGLRenderTarget(256, 512);
  const previousTarget = renderer.getRenderTarget();
  const previousClear = renderer.getClearColor(new THREE.Color());
  const previousAlpha = renderer.getClearAlpha();
  const previousShadowUpdate = renderer.shadowMap.needsUpdate;

  try {
    renderer.setClearColor(0, 0);
    renderer.setRenderTarget(targetDay);
    setFacadeNight(0);
    renderer.render(studio, capture);
    renderer.setRenderTarget(targetNight);
    setFacadeNight(1);
    light.intensity = 0.38;
    fill.intensity = 0.59;
    studio.environmentIntensity = 0.16;
    renderer.render(studio, capture);
  } finally {
    renderer.setRenderTarget(previousTarget);
    renderer.setClearColor(previousClear, previousAlpha);
    renderer.shadowMap.needsUpdate = previousShadowUpdate;
    setFacadeNight(initialNight);
  }

  const night = { value: initialNight };
  const material = new THREE.MeshBasicMaterial({
    map: targetDay.texture,
    alphaTest: 0.32,
    toneMapped: false
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.nightMap = { value: targetNight.texture };
    shader.uniforms.towerNight = night;
    shader.fragmentShader =
      'uniform sampler2D nightMap; uniform float towerNight;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      'diffuseColor *= mix(texture2D(map, vMapUv), texture2D(nightMap, vMapUv), towerNight);'
    );
  };
  material.customProgramCacheKey = () => 'saei-tower-impostor';
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  plane.name = 'DistantHeadquartersPhotograph';
  plane.position.copy(center);
  scene.add(plane);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, '#ffe9dd');
  glow.addColorStop(0.13, '#ff6951');
  glow.addColorStop(0.31, '#ff3027b0');
  glow.addColorStop(0.62, '#ff241732');
  glow.addColorStop(1, '#ff241700');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  const beaconTexture = new THREE.CanvasTexture(canvas);
  beaconTexture.colorSpace = THREE.SRGBColorSpace;
  const beaconMaterial = new THREE.SpriteMaterial({
    map: beaconTexture, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending
  });
  const beacon = new THREE.Sprite(beaconMaterial);
  beacon.name = 'SaeiRoofAviationBeacon';
  beacon.visible = false;
  beacon.position.set(center.x, bounds.max.y + 0.45, center.z);
  scene.add(beacon);
  let detailed = false;

  return {
    update(camera, outside, amount) {
      detailed = showsExteriorDetail(camera.position.distanceToSquared(center), detailed, 118);
      tower.visible = outside && detailed;
      wordmark.visible = tower.visible;
      plane.visible = outside && !detailed;
      if (plane.visible) {
        plane.rotation.y = Math.atan2(camera.position.x - center.x, camera.position.z - center.z);
      }
      night.value = amount;
      const phase = (performance.now() % 2400) / 2400;
      const flash = THREE.MathUtils.smoothstep(phase, 0, 0.07)
        * (1 - THREE.MathUtils.smoothstep(phase, 0.28, 0.46));
      beaconMaterial.opacity = THREE.MathUtils.smoothstep(amount, 0.18, 0.8)
        * (reducedMotion ? 0.75 : flash);
      beacon.visible = outside && beaconMaterial.opacity > 0.01;
      if (beacon.visible) {
        const size = THREE.MathUtils.clamp(camera.position.distanceTo(beacon.position) * 0.017, 0.75, 5);
        beacon.scale.set(size, size, 1);
      }
    },
    destroy() {
      plane.removeFromParent();
      plane.geometry.dispose();
      material.dispose();
      targetDay.dispose();
      targetNight.dispose();
      beacon.removeFromParent();
      beaconTexture.dispose();
      beaconMaterial.dispose();
    }
  };
}
