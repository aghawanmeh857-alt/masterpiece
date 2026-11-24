import { showsExteriorDetail } from './exterior-lod.js';

// The atlas cells follow the mesh order in the optimized Sketchfab asset.
const verticalPadding = [4, 4, 4, 4, 4, 4, 4, 4, 4, 32, 4, 40];

export function addCityTowers(THREE, parent, blocks, loader) {
  const group = new THREE.Group();
  group.name = 'NeighborhoodTowers';
  parent.add(group);
  const lots = blocks.map((block, index) => ({
    ...block, variant: (index * 7 + block.finish) % 12, model: null
  }));
  const night = { value: 0 };
  const farMaterial = new THREE.MeshBasicMaterial({ alphaTest: 0.32, toneMapped: false });
  const farGeometry = new THREE.BufferGeometry();
  const positions = new THREE.Float32BufferAttribute(lots.length * 12, 3).setUsage(THREE.DynamicDrawUsage);
  const coords = new THREE.Float32BufferAttribute(lots.length * 8, 2).setUsage(THREE.DynamicDrawUsage);
  farGeometry.setAttribute('position', positions);
  farGeometry.setAttribute('uv', coords);
  const indices = [];
  for (let i = 0; i < lots.length * 4; i += 4) indices.push(i, i+1, i+2, i, i+2, i+3);
  farGeometry.setIndex(indices);
  farGeometry.setDrawRange(0, 0);
  const distant = new THREE.Mesh(farGeometry, farMaterial);
  distant.name = 'NeighborhoodTowerAtlas';
  distant.frustumCulled = false;
  group.add(distant);
  let surface, atlasReady = false;
  const textures = new Set();
  const shapes = new Set();
  const imageLoader = new THREE.TextureLoader();
  const maps = ['day', 'night'].map(async phase => {
    const url = new URL(`./assets/sky/harbor-towers-${phase}.webp`, import.meta.url);
    const image = await imageLoader.loadAsync(url.href);
    image.colorSpace = THREE.SRGBColorSpace;
    textures.add(image);
    return image;
  });
  const atlas = Promise.all(maps).then(([day, dark]) => {
    farMaterial.map = day;
    farMaterial.onBeforeCompile = shader => {
      shader.uniforms.towerNight = night;
      shader.uniforms.nightMap = { value: dark };
      shader.fragmentShader = 'uniform float towerNight; uniform sampler2D nightMap;\n' +
        shader.fragmentShader.replace('#include <map_fragment>',
          `vec4 lights = texture2D(nightMap, vMapUv);
          float luminance = dot(lights.rgb, vec3(.2126,.7152,.0722));
          vec3 amber = mix(vec3(.52,.64,.92), vec3(1.52,.85,.43), smoothstep(.018,.15,luminance));
          lights.rgb = luminance * amber;
          diffuseColor *= mix(texture2D(map, vMapUv), lights, towerNight);`);
    };
    atlasReady = true;
  });
  const models = loader.loadAsync(new URL('./assets/3d/neighborhood-towers.glb', import.meta.url).href)
    .then(({ scene }) => {
      const types = scene.children.slice().sort((a, b) => a.name.localeCompare(b.name));
      surface = types[0].material;
      surface.emissive.set('#ffd49d');
      textures.add(surface.map);
      textures.add(surface.emissiveMap);
      surface.emissiveIntensity = night.value;
      for (const lot of lots) {
        const geometry = types[lot.variant].geometry;
        shapes.add(geometry);
        const bounds = geometry.boundingBox;
        const model = new THREE.Mesh(geometry, surface);
        model.scale.set(lot.width / (bounds.max.x - bounds.min.x), lot.height,
          lot.depth / (bounds.max.z - bounds.min.z));
        model.position.set(lot.x, 0, lot.z);
        model.name = types[lot.variant].name;
        model.visible = false;
        group.add(model);
        lot.model = model;
      }
    });
  const ready = Promise.allSettled([models, atlas]).then(results => {
    for (const result of results) if (result.status === 'rejected') console.warn('SAEI: city asset unavailable.', result.reason);
    if (!surface && !atlasReady) throw new Error('City towers could not load.');
  });
  const lastPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
  const replacedLots = new Set();
  return {
    ready,
    replaceLots(indices) {
      indices.forEach(index => replacedLots.add(lots[index]));
      lastPosition.set(Infinity, Infinity, Infinity);
    },
    updateCamera(camera) {
      if (lastPosition.distanceToSquared(camera.position) < 0.4) return;
      lastPosition.copy(camera.position);
      let count = 0;
      for (const lot of lots) {
        if (replacedLots.has(lot)) {
          if (lot.model) lot.model.visible = false;
          continue;
        }
        const dx = camera.position.x - lot.x, dz = camera.position.z - lot.z;
        const dy = camera.position.y - lot.height / 2;
        if (lot.model) {
          lot.model.visible = !atlasReady || showsExteriorDetail(dx*dx + dy*dy + dz*dz, lot.model.visible, 105);
          if (lot.model.visible) continue;
        }
        if (!atlasReady) continue;
        const length = Math.hypot(dx, dz) || 1;
        const rightX = dz / length, rightZ = -dx / length;
        const pad = verticalPadding[lot.variant] / 256;
        const height = lot.height / (1 - 2 * pad);
        const bottom = -height * pad;
        const half = (Math.abs(rightX) * lot.width + Math.abs(rightZ) * lot.depth) * 0.56;
        const x = rightX * half, z = rightZ * half;
        const i = count++ * 4;
        positions.setXYZ(i, lot.x-x, bottom, lot.z-z);
        positions.setXYZ(i+1, lot.x+x, bottom, lot.z+z);
        positions.setXYZ(i+2, lot.x+x, bottom+height, lot.z+z);
        positions.setXYZ(i+3, lot.x-x, bottom+height, lot.z-z);
        const u = lot.variant % 4 / 4, v = (2 - Math.floor(lot.variant / 4)) / 3;
        coords.setXY(i, u, v); coords.setXY(i+1, u+0.25, v);
        coords.setXY(i+2, u+0.25, v+1/3); coords.setXY(i+3, u, v+1/3);
      }
      farGeometry.setDrawRange(0, count * 6);
      positions.needsUpdate = coords.needsUpdate = true;
      document.documentElement.dataset.cityBillboards = String(count);
    },
    setNight(amount) {
      night.value = amount;
      if (surface) surface.emissiveIntensity = THREE.MathUtils.smoothstep(amount, 0.16, 0.86) * 1.15;
    },
    destroy() {
      group.removeFromParent();
      for (const shape of shapes) shape.dispose();
      for (const texture of textures) texture.dispose();
      surface?.dispose();
      farMaterial.dispose();
      farGeometry.dispose();
    }
  };
}
