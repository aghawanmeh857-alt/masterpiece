export function sampleCelestialOrbit(amount) {
  const arc = Math.sin(amount * Math.PI) * 15;
  return {
    sun: [-65 - arc, 24 - 94 * amount, -172],
    moon: [-62 + arc, -48 + 77 * amount, -184]
  };
}

function radialTexture(THREE, stops) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [distance, color] of stops) gradient.addColorStop(distance, color);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCelestialDiscs(THREE, sky) {
  const seaLine = new THREE.Plane(new THREE.Vector3(0, 1, 0));
  const solarMap = radialTexture(THREE, [
    [0, '#fffefa'],
    [0.46, '#fffdf2'],
    [0.51, '#fff8e6'],
    [0.53, 'rgba(255,239,208,.92)'],
    [0.565, 'rgba(255,226,181,.34)'],
    [0.68, 'rgba(255,223,169,.13)'],
    [0.84, 'rgba(255,215,156,.035)'],
    [1, 'rgba(255,215,156,0)']
  ]);
  const sun = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: solarMap,
      transparent: true,
      toneMapped: false,
      fog: false,
      clippingPlanes: [seaLine],
      depthWrite: false
    })
  );
  sun.scale.set(25, 25, 1);
  sky.add(sun);

  const moon = new THREE.Group();
  // Three.js starts a new transparent sort group at every Group, including this
  // one. Keep the lunar disc and halo in the sky pass, behind the cloud banks.
  moon.renderOrder = sky.renderOrder;
  sky.add(moon);
  const coronaMap = radialTexture(THREE, [
    [0, 'rgba(255,190,150,.21)'],
    [0.33, 'rgba(255,190,150,.13)'],
    [0.64, 'rgba(255,174,137,.04)'],
    [1, 'rgba(255,174,137,0)']
  ]);
  const corona = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: coronaMap,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
      clippingPlanes: [seaLine],
      blending: THREE.AdditiveBlending
    })
  );
  corona.scale.set(43, 43, 1);
  moon.add(corona);

  // NASA's LRO mosaic supplies the real maria, crater rays and albedo.
  // The geometry clips the dark corners without adding an alpha texture.
  const lunarMaterial = new THREE.MeshBasicMaterial({
    color: '#ffd9c1',
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    clippingPlanes: [seaLine],
    fog: false
  });
  let disposed = false;
  const lunarMap = new THREE.TextureLoader().load(
    new URL('./assets/sky/moon-mosaic-nasa.jpg', import.meta.url).href,
    (texture) => {
      if (disposed) return;
      lunarMaterial.map = texture;
      lunarMaterial.needsUpdate = true;
    }
  );
  lunarMap.colorSpace = THREE.SRGBColorSpace;
  lunarMap.repeat.set(0.946, 0.946);
  lunarMap.offset.set(0.027, 0.027);
  const lunarFace = new THREE.Mesh(new THREE.CircleGeometry(9.4, 64), lunarMaterial);
  moon.add(lunarFace);
  // Keep the orbital projection and sea clipping while testing against all city geometry.
  for (const material of [sun.material, corona.material, lunarMaterial]) {
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <clipping_planes_vertex>',
        '#include <clipping_planes_vertex>\n gl_Position.z = gl_Position.w * 0.999999;');
    };
  }
  const front = new THREE.Vector3(0, 0, 1);
  const facing = new THREE.Vector3();

  return {
    sun,
    moon,
    setSeaLine(height) {
      seaLine.constant = -height;
    },
    update(sunOpacity, moonOpacity) {
      sun.visible = sunOpacity > 0.001;
      sun.material.opacity = sunOpacity;
      moon.visible = moonOpacity > 0.001;
      lunarMaterial.opacity = moonOpacity;
      corona.material.opacity = moonOpacity;
      // The sky travels with the camera. The face keeps its celestial bearing.
      facing.copy(moon.position).negate().normalize();
      lunarFace.quaternion.setFromUnitVectors(front, facing);
    },
    dispose() {
      disposed = true;
      moon.removeFromParent();
      sun.removeFromParent();
      solarMap.dispose();
      coronaMap.dispose();
      lunarMap.dispose();
      lunarFace.geometry.dispose();
      lunarMaterial.dispose();
      corona.material.dispose();
      sun.material.dispose();
    }
  };
}
