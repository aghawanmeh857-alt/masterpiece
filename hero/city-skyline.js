import { showsExteriorDetail } from './exterior-lod.js';

const eastAvenues = [71, 105, 139, 173];
const crossStreets = [-31, -65, -99, -133, -167, -201, -235];
const rearAvenues = [-26, 8];

const finishes = [
  ['#655f5a', '#638192', '#23313b', [255, 211, 159]],
  ['#394956', '#7593a2', '#182c39', [198, 225, 246]],
  ['#7b695e', '#737c80', '#303438', [255, 224, 184]]
];

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function skylineBlocks() {
  const random = seededRandom(8818);
  const blocks = [];
  // A low waterfront edge opens towards the tower. Taller buildings stand
  // farther back, leaving the existing roads and the approach in sight.
  for (const [row, street] of crossStreets.entries()) {
    const avenues = row < 3 ? eastAvenues : [...rearAvenues, ...eastAvenues];
    for (const [column, avenue] of avenues.entries()) {
      const height = (row === 0 ? 9 : 14) + random() * (row === 0 ? 15 : 32);
      blocks.push({
        x: avenue - 10.3 + (random() - 0.5) * 1.3,
        z: street - 12 + (random() - 0.5) * 2,
        width: 9.2 + random() * 2.5,
        depth: 10 + random() * 5,
        height,
        finish: (row + column) % finishes.length,
        setback: height > 30 && random() > 0.3
      });
      if (random() > 0.17)
        blocks.push({
          x: avenue + 10.3 + (random() - 0.5) * 1.3,
          z: street - 12 + (random() - 0.5) * 2,
          width: 8.7 + random() * 2.5,
          depth: 9 + random() * 5,
          height: 8 + random() * (row === 0 ? 12 : 23),
          finish: (row + column + 1) % finishes.length,
          setback: false
        });
    }
  }
  // A few distinct silhouettes near the centre of the aerial composition.
  blocks.push(
    { x: 52, z: -2, width: 13.3, depth: 14, height: 23, finish: 0, setback: true },
    { x: 88.5, z: 10, width: 16, depth: 15, height: 16, finish: 2, setback: false },
    { x: 48, z: -111, width: 11, depth: 13, height: 43, finish: 1, setback: true },
    { x: 20, z: -117, width: 12.6, depth: 16, height: 34, finish: 0, setback: true },
    { x: -33, z: -108, width: 14, depth: 16, height: 28, finish: 2, setback: false }
  );
  return blocks;
}

function facadeTextures(THREE, finish, variant) {
  const [wall, glass, recess, light] = finish;
  const surface = document.createElement('canvas');
  const emission = document.createElement('canvas');
  surface.width = surface.height = emission.width = emission.height = 384;
  const base = surface.getContext('2d');
  const glow = emission.getContext('2d');
  const random = seededRandom(611 + variant * 317);
  base.fillStyle = wall;
  base.fillRect(0, 0, 384, 384);
  glow.fillStyle = '#000';
  glow.fillRect(0, 0, 384, 384);
  for (let row = 0; row < 12; row++) {
    const y = row * 32;
    base.fillStyle = recess;
    base.fillRect(0, y + 28, 384, 2);
    base.fillStyle = 'rgba(244,232,214,.13)';
    base.fillRect(0, y + 30, 384, 1);
    const occupiedFloor = random() > 0.36;
    for (let column = 0; column < 12; column++) {
      const x = column * 32;
      const wide = [22, 29, 19][variant];
      const start = x + (32 - wide) / 2;
      base.fillStyle = recess;
      base.fillRect(start - 2, y + 2, wide + 4, 25);
      const pane = base.createLinearGradient(start, y + 4, start, y + 26);
      pane.addColorStop(0, glass);
      pane.addColorStop(0.43, glass);
      pane.addColorStop(1, recess);
      base.fillStyle = pane;
      base.fillRect(start, y + 4, wide, 21);
      base.fillStyle = wall;
      base.fillRect(x + 15, y + 4, variant === 2 ? 3 : 1, 21);
      base.fillStyle = 'rgba(188,215,222,.22)';
      base.fillRect(start, y + 5, wide, 1);
      if (variant === 2) {
        base.fillStyle = 'rgba(44,28,24,.24)';
        for (let dy = 2; dy < 26; dy += 5) base.fillRect(x, y + dy, 5, 1);
      }

      if (random() > (occupiedFloor ? 0.78 : 0.2)) continue;
      const brightness = 0.36 + random() * 0.64;
      const color = light.map((channel) => Math.round(channel * brightness));
      glow.fillStyle = `rgb(${color.join(',')})`;
      const paneCount = random() > 0.28 ? 2 : 1;
      const sill = random() > 0.7 ? 17 : 20;
      for (let paneIndex = 0; paneIndex < paneCount; paneIndex++) {
        glow.fillRect(start + paneIndex * (wide / 2 + 1), y + 5, wide / 2 - 1, sill);
      }
      glow.fillStyle = 'rgba(15,20,31,.28)';
      glow.fillRect(start, y + 17, wide, 2);
      if (random() > 0.57) {
        glow.fillStyle = 'rgba(67,49,39,.36)';
        glow.fillRect(start, y + 8, wide, 6);
      }
    }
  }
  return [surface, emission].map((canvas) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  });
}

export function addCitySkyline(THREE, city) {
  const drawGroup = new THREE.Group();
  drawGroup.name = 'SAEICitySkyline';
  drawGroup.userData.dynamicScene = true;
  city.add(drawGroup);
  const blocks = skylineBlocks();
  const textures = [];
  const makeBatch = () => ({ positions: [], uvs: [], indices: [] });
  let facadeBatch;
  let roofBatch;
  const markerPositions = [];
  const dayRoof = new THREE.Color('#425367');
  const nightRoof = new THREE.Color('#253651');

  function quad(batch, vertices, width = 1, height = 1, u = 0, v = 0) {
    const first = batch.positions.length / 3;
    batch.positions.push(...vertices.flat());
    batch.uvs.push(u, v, u + width, v, u + width, v + height, u, v + height);
    batch.indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
  }

  function volumeSides(
    batch,
    a,
    b,
    c,
    d,
    bottom,
    top,
    wide = 1,
    deep = 1,
    levels = 1,
    u = 0,
    v = 0
  ) {
    quad(
      batch,
      [
        [a, bottom, d],
        [b, bottom, d],
        [b, top, d],
        [a, top, d]
      ],
      wide,
      levels,
      u,
      v
    );
    quad(
      batch,
      [
        [b, bottom, d],
        [b, bottom, c],
        [b, top, c],
        [b, top, d]
      ],
      deep,
      levels,
      u + 0.25,
      v
    );
    quad(
      batch,
      [
        [b, bottom, c],
        [a, bottom, c],
        [a, top, c],
        [b, top, c]
      ],
      wide,
      levels,
      u + 0.5,
      v
    );
    quad(
      batch,
      [
        [a, bottom, c],
        [a, bottom, d],
        [a, top, d],
        [a, top, c]
      ],
      deep,
      levels,
      u + 0.75,
      v
    );
  }

  function roofVolume(x, z, width, depth, bottom, height) {
    const a = x - width / 2,
      b = x + width / 2;
    const c = z - depth / 2,
      d = z + depth / 2;
    const top = bottom + height;
    volumeSides(roofBatch, a, b, c, d, bottom, top);
    quad(roofBatch, [
      [a, top, d],
      [b, top, d],
      [b, top, c],
      [a, top, c]
    ]);
  }

  function storeys(block, bottom, height, width, depth, variation) {
    const a = block.x - width / 2,
      b = block.x + width / 2;
    const c = block.z - depth / 2,
      d = block.z + depth / 2;
    const top = bottom + height;
    const u = variation / 12;
    const v = Math.floor((variation * 7) % 12) / 12;
    const levels = Math.max(1, Math.round(height / 3.25)) / 12;
    const wide = Math.max(1, Math.floor(width / 2.15)) / 12;
    const deep = Math.max(1, Math.floor(depth / 2.15)) / 12;
    volumeSides(facadeBatch, a, b, c, d, bottom, top, wide, deep, levels, u, v);
    roofVolume(block.x, block.z, width + 0.12, depth + 0.12, top - 0.13, 0.26);
  }

  const detailedBlocks = blocks.map((block, index) => {
    facadeBatch = makeBatch();
    roofBatch = makeBatch();
    const podium = block.finish === 2 ? 4.0 : 3.6;
    const shoulder = block.setback ? block.height * (index % 2 ? 0.64 : 0.76) : block.height;
    const upperWidth = block.setback ? block.width * (index % 3 ? 0.76 : 0.62) : block.width * 0.93;
    const upperDepth = block.depth * (block.setback ? 0.83 : 0.94);
    const upper = { ...block, x: block.x + (index % 2 ? 0.28 : -0.28), z: block.z - 0.3 };
    storeys(block, 0, podium, block.width, block.depth, (index + 7) % 12);
    storeys(upper, podium, shoulder - podium, block.width * 0.93, block.depth * 0.94, index % 12);
    if (block.setback)
      storeys(upper, shoulder, block.height - shoulder, upperWidth, upperDepth, (index + 5) % 12);
    if (block.height > 25) {
      const x = upper.x - upperWidth * 0.12,
        z = upper.z - upperDepth * 0.12;
      roofVolume(x, z, upperWidth * 0.37, upperDepth * 0.32, block.height, 1.36);
      roofVolume(
        upper.x + upperWidth * 0.23,
        upper.z + upperDepth * 0.17,
        1.5,
        1.8,
        block.height,
        0.54
      );
      if (block.height > 31) markerPositions.push([x, block.height + 1.42, z]);
    }
    return { facadeBatch, roofBatch };
  });

  function meshFrom(batch, material) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(batch.positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(batch.uvs, 2));
    geometry.setIndex(batch.indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    drawGroup.add(mesh);
    return mesh;
  }

  const windows = finishes.map((finish, index) => {
    const [map, emissiveMap] = facadeTextures(THREE, finish, index);
    textures.push(map, emissiveMap);
    const material = new THREE.MeshStandardMaterial({
      map,
      emissiveMap,
      emissive: '#fff3df',
      emissiveIntensity: 0,
      roughness: 0.82,
      metalness: 0.05
    });
    return material;
  });
  const roof = new THREE.MeshStandardMaterial({ color: dayRoof, roughness: 0.9 });
  const billboardGeometry = new THREE.PlaneGeometry(1, 1);
  const billboards = windows.map((material, finish) => {
    const count = blocks.filter((block) => block.finish === finish).length;
    const batch = new THREE.InstancedMesh(billboardGeometry, material, count);
    batch.name = 'DistantCityFacade';
    batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    batch.frustumCulled = false;
    batch.count = 0;
    drawGroup.add(batch);
    return batch;
  });
  const buildingModels = detailedBlocks.map(({ facadeBatch, roofBatch }, index) => {
    const facade = meshFrom(facadeBatch, windows[blocks[index].finish]);
    const top = meshFrom(roofBatch, roof);
    facade.visible = top.visible = false;
    return { facade, top };
  });
  const billboardPose = new THREE.Object3D();
  const lastPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
  let priorCount = -1;

  function updateBuildings(camera) {
    if (lastPosition.distanceToSquared(camera.position) < 0.4) return;
    lastPosition.copy(camera.position);
    billboards.forEach((batch) => (batch.count = 0));
    let distant = 0;
    blocks.forEach((block, index) => {
      const { facade, top } = buildingModels[index];
      const dx = camera.position.x - block.x;
      const dy = camera.position.y - block.height / 2;
      const dz = camera.position.z - block.z;
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      facade.visible = top.visible = showsExteriorDetail(distanceSquared, facade.visible, 105);
      if (facade.visible) return;
      const batch = billboards[block.finish];
      const heading = Math.atan2(dx, dz);
      const width =
        Math.abs(Math.cos(heading)) * block.width + Math.abs(Math.sin(heading)) * block.depth;
      billboardPose.position.set(block.x, block.height / 2, block.z);
      billboardPose.rotation.y = heading;
      billboardPose.scale.set(width, block.height, 1);
      billboardPose.updateMatrix();
      batch.setMatrixAt(batch.count++, billboardPose.matrix);
      distant++;
    });
    billboards.forEach((batch) => (batch.instanceMatrix.needsUpdate = true));
    if (priorCount !== distant) document.documentElement.dataset.cityBillboards = String(distant);
    priorCount = distant;
  }

  const groundBatch = { positions: [], uvs: [], indices: [] };
  const streetBatch = { positions: [], uvs: [], indices: [] };
  function groundQuad(batch, x1, x2, z1, z2, y) {
    quad(batch, [
      [x1, y, z2],
      [x2, y, z2],
      [x2, y, z1],
      [x1, y, z1]
    ]);
  }
  groundQuad(groundBatch, 39, 360, -377, 70, -0.195);
  groundQuad(groundBatch, -61, 39, -377, -108, -0.195);
  const ground = new THREE.MeshStandardMaterial({ color: '#667b73', roughness: 0.98 });
  meshFrom(groundBatch, ground).receiveShadow = true;
  const road = new THREE.MeshStandardMaterial({ color: '#333b49', roughness: 0.94 });
  for (const x of eastAvenues) groundQuad(streetBatch, x - 3.5, x + 3.5, -270, 43, 0.042);
  for (const x of rearAvenues) groundQuad(streetBatch, x - 3.5, x + 3.5, -270, -180, 0.042);
  for (const [row, z] of crossStreets.entries()) {
    groundQuad(streetBatch, row < 3 ? 36 : -43, 205, z - 3.2, z + 3.2, 0.041);
  }
  meshFrom(streetBatch, road).receiveShadow = true;

  const pool = document.createElement('canvas');
  pool.width = pool.height = 64;
  const ctx = pool.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,224,163,.78)');
  gradient.addColorStop(0.21, 'rgba(237,163,79,.34)');
  gradient.addColorStop(0.62, 'rgba(225,130,42,.10)');
  gradient.addColorStop(1, 'rgba(225,130,42,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const poolMap = new THREE.CanvasTexture(pool);
  poolMap.colorSpace = THREE.SRGBColorSpace;
  textures.push(poolMap);
  const poolMaterial = new THREE.MeshBasicMaterial({
    map: poolMap,
    depthWrite: false,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  const streetlights = [];
  for (const x of eastAvenues) {
    for (let z = 31; z > -251; z -= 12.7) streetlights.push([x - 3.9, z]);
  }
  for (const [row, z] of crossStreets.entries()) {
    for (let x = row < 3 ? 43 : -39; x < 196; x += 12.7) streetlights.push([x, z + 3.66]);
  }
  const poolGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const pools = new THREE.InstancedMesh(poolGeometry, poolMaterial, streetlights.length);
  const lampGeometry = new THREE.BoxGeometry(0.24, 0.15, 0.32);
  const lampMaterial = new THREE.MeshBasicMaterial({
    color: '#ffd599',
    toneMapped: false,
    transparent: true,
    opacity: 0
  });
  const lamps = new THREE.InstancedMesh(lampGeometry, lampMaterial, streetlights.length);
  const poleGeometry = new THREE.BoxGeometry(0.1, 3.7, 0.1);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: '#484f61', roughness: 0.74 });
  const poles = new THREE.InstancedMesh(poleGeometry, poleMaterial, streetlights.length);
  const transform = new THREE.Object3D();
  streetlights.forEach(([x, z], index) => {
    transform.position.set(x, 0.053, z);
    transform.scale.set(12, 1, 12);
    transform.updateMatrix();
    pools.setMatrixAt(index, transform.matrix);
    transform.position.y = 3.7;
    transform.scale.set(1, 1, 1);
    transform.updateMatrix();
    lamps.setMatrixAt(index, transform.matrix);
    transform.position.y = 1.85;
    transform.updateMatrix();
    poles.setMatrixAt(index, transform.matrix);
  });
  drawGroup.add(pools, lamps, poles);

  const markerGeometry = new THREE.BufferGeometry();
  markerGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(markerPositions.flat(), 3)
  );
  const markerMaterial = new THREE.PointsMaterial({
    color: '#ff7158',
    size: 0.39,
    map: poolMap,
    transparent: true,
    depthWrite: false,
    opacity: 0,
    toneMapped: false
  });
  const markers = new THREE.Points(markerGeometry, markerMaterial);
  drawGroup.add(markers);

  // A gradient behind the moon and clouds adds an amber haze near the built
  // horizon, with no bloom pass and no additional scene lights.
  const skyGeometry = new THREE.SphereGeometry(325, 24, 12);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: false,
    uniforms: {
      amount: { value: 0 },
      day: { value: new THREE.Color('#87ceeb') },
      zenith: { value: new THREE.Color('#0a1630') },
      horizon: { value: new THREE.Color('#26384f') },
      glow: { value: new THREE.Color('#4a414c') },
      distanceTint: { value: new THREE.Color('#080f20') }
    },
    vertexShader: `
      varying vec3 skyDirection;
      void main() {
        skyDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 skyDirection;
      uniform float amount;
      uniform vec3 day, zenith, horizon, glow, distanceTint;
      void main() {
        vec3 direction = normalize(skyDirection);
        float band = exp(-abs(direction.y - 0.04) * 3.4);
        float cityward = smoothstep(-0.28, 0.95, dot(direction.xz, normalize(vec2(0.44, -1.0))));
        vec3 night = mix(zenith, mix(horizon, glow, cityward * 0.46), band);
        night = mix(distanceTint, night, smoothstep(-0.24, 0.03, direction.y));
        gl_FragColor = vec4(mix(day, night, amount), 1.0);
        #include <colorspace_fragment>
      }`
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.renderOrder = -1000;
  sky.frustumCulled = false;
  drawGroup.add(sky);

  return {
    count: blocks.length,
    rearCount: blocks.filter((block) => block.z < -110).length,
    updateCamera(camera) {
      sky.position.copy(camera.position);
      updateBuildings(camera);
    },
    setNight(amount) {
      const lights = THREE.MathUtils.smoothstep(amount, 0.16, 0.86);
      windows.forEach((material, i) => {
        material.emissiveIntensity = lights * (i === 1 ? 1.55 : 1.95);
      });
      roof.color.copy(dayRoof).lerp(nightRoof, amount);
      poolMaterial.opacity = lights * 0.87;
      lampMaterial.opacity = lights;
      markerMaterial.opacity = lights * 0.87;
      pools.visible = lamps.visible = markers.visible = lights > 0.001;
      skyMaterial.uniforms.amount.value = amount;
      sky.visible = amount > 0.002;
    },
    destroy() {
      drawGroup.removeFromParent();
      drawGroup.traverse((mesh) => {
        mesh.geometry?.dispose();
        mesh.material?.dispose();
        if (mesh.isInstancedMesh) mesh.dispose();
      });
      textures.forEach((texture) => texture.dispose());
    }
  };
}
