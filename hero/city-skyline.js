import { addCityTowers } from './city-towers.js';
import { createCityNeighborhood } from './night-neighborhood.js';

const eastAvenues = [71, 105, 139, 173];
const crossStreets = [-31, -65, -99, -133, -167, -201, -235];
const rearAvenues = [-26, 8];

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
        finish: (row + column) % 3,
        setback: height > 30 && random() > 0.3
      });
      if (random() > 0.17)
        blocks.push({
          x: avenue + 10.3 + (random() - 0.5) * 1.3,
          z: street - 12 + (random() - 0.5) * 2,
          width: 8.7 + random() * 2.5,
          depth: 9 + random() * 5,
          height: 8 + random() * (row === 0 ? 12 : 23),
          finish: (row + column + 1) % 3,
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

export function addCitySkyline(THREE, city, loader) {
  const drawGroup = new THREE.Group();
  drawGroup.name = 'SAEICitySkyline';
  drawGroup.userData.dynamicScene = true;
  city.add(drawGroup);
  const blocks = skylineBlocks();
  const textures = [];
  const ridgeReady = loader.loadAsync(new URL('./assets/3d/coastal-ridge.glb', import.meta.url).href)
    .then(({ scene }) => {
      const ridge = scene.getObjectByName('DistantCoastalRidge');
      const imported = ridge.material;
      textures.push(imported.map);
      ridge.material = new THREE.MeshLambertMaterial({ map: imported.map, color: '#b5bab6' });
      imported.dispose();
      // Haze grows with distance. Keep enough contrast to read the gullies from above.
      ridge.material.onBeforeCompile = shader => {
        shader.vertexShader = 'varying float ridgeHeight;\n' + shader.vertexShader.replace(
          '#include <begin_vertex>', '#include <begin_vertex>\n ridgeHeight = position.y;');
        shader.fragmentShader = 'varying float ridgeHeight;\n' + shader.fragmentShader.replace('#include <fog_fragment>',
          '#ifdef USE_FOG\nfloat haze = smoothstep(fogNear, fogFar * 1.35, vFogDepth);\n' +
          'float foot = (1.0-smoothstep(0.0,24.0,ridgeHeight))*smoothstep(fogNear,fogFar,vFogDepth);\n' +
          'gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, mix(haze * 0.48, 1.0, foot));\n#endif');
      };
      drawGroup.add(ridge);
    }).catch(error => console.warn('SAEI: coastal ridge unavailable.', error));
  function quad(batch, vertices, width = 1, height = 1, u = 0, v = 0) {
    const first = batch.positions.length / 3;
    batch.positions.push(...vertices.flat());
    batch.uvs.push(u, v, u + width, v, u + width, v + height, u, v + height);
    batch.indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
  }

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
  const ground = new THREE.MeshStandardMaterial({ color: '#788472', roughness: 0.98 });
  meshFrom(groundBatch, ground).receiveShadow = true;
  const road = new THREE.MeshStandardMaterial({ color: '#333b49', roughness: 0.94 });
  const roadNight = { value: 0 };
  // The same road surface carries its verge lights when seen from the air.
  road.onBeforeCompile = shader => {
    shader.uniforms.roadNight = roadNight;
    shader.vertexShader = 'varying vec2 streetUv;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\n streetUv = uv;');
    shader.fragmentShader = 'uniform float roadNight; varying vec2 streetUv;\n' +
      shader.fragmentShader.replace('#include <emissivemap_fragment>', `
        #include <emissivemap_fragment>
        if (roadNight > 0.001) {
          float across = streetUv.x;
          float along = streetUv.y;
          float edge = abs(min(across, 1.0-across) - 0.09);
          float footprint = clamp(fwidth(across), 0.012, 0.22);
          float strip = (1.0 - smoothstep(0.014, 0.014 + footprint, edge))
            * min(1.0, 0.06 / footprint);
          float pool = 0.46 + 0.54 * pow(abs(cos(along * 0.25)), 4.0);
          totalEmissiveRadiance += roadNight * strip * pool * vec3(1.0, 0.43, 0.10);
        }`);
  };
  function avenue(x, start, end) {
    quad(streetBatch, [[x-3.5, 0.042, end], [x+3.5, 0.042, end],
      [x+3.5, 0.042, start], [x-3.5, 0.042, start]], 1, end-start);
  }
  for (const x of eastAvenues) avenue(x, -270, 43);
  for (const x of rearAvenues) avenue(x, -270, -180);
  for (const [row, z] of crossStreets.entries()) {
    const start = row < 3 ? 36 : -43;
    quad(streetBatch, [[start, 0.041, z-3.2], [start, 0.041, z+3.2],
      [205, 0.041, z+3.2], [205, 0.041, z-3.2]], 1, 205-start);
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
  // Ground the towers with pavement and a soft contact shadow in two instanced draws.
  const lotGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const pavingMaterial = new THREE.MeshStandardMaterial({ color: '#92958b', roughness: 0.96 });
  const plazas = new THREE.InstancedMesh(lotGeometry, pavingMaterial, blocks.length);
  const contact = new THREE.InstancedMesh(lotGeometry.clone(), new THREE.MeshBasicMaterial({
    map: poolMap, color: '#141c1a', transparent: true, opacity: 0.58, depthWrite: false
  }), blocks.length);
  const lotTransform = new THREE.Object3D();
  blocks.forEach((block, index) => {
    lotTransform.position.set(block.x, 0.029, block.z);
    lotTransform.scale.set(block.width + 3, 1, block.depth + 3);
    lotTransform.updateMatrix();
    plazas.setMatrixAt(index, lotTransform.matrix);
    lotTransform.position.y = 0.034;
    lotTransform.scale.set(block.width + 5, 1, block.depth + 5);
    lotTransform.updateMatrix();
    contact.setMatrixAt(index, lotTransform.matrix);
  });
  drawGroup.add(plazas, contact);
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

  const beaconGeometry = new THREE.BufferGeometry();
  const beaconPositions = blocks.filter(block => block.height > 31)
    .flatMap(block => [block.x, block.height + 0.15, block.z]);
  beaconGeometry.setAttribute('position', new THREE.Float32BufferAttribute(beaconPositions, 3));
  const beacons = new THREE.Points(beaconGeometry, new THREE.PointsMaterial({
    map: poolMap, color: '#ff7158', size: 0.39, transparent: true, depthWrite: false,
    opacity: 0, toneMapped: false
  }));
  beacons.name = 'CityRoofBeacons';
  beacons.visible = false;
  drawGroup.add(beacons);

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
      zenith: { value: new THREE.Color('#080d2c') },
      horizon: { value: new THREE.Color('#3f376a') },
      glow: { value: new THREE.Color('#a16b65') },
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
        float band = exp(-abs(direction.y - 0.015) * 5.6);
        float cityward = smoothstep(-0.28, 0.95, dot(direction.xz, normalize(vec2(0.44, -1.0))));
        vec3 night = mix(zenith, horizon, band);
        night = mix(night, glow, cityward * 0.54 * band * band * band);
        night = mix(distanceTint, night, smoothstep(-0.25, -0.025, direction.y));
        gl_FragColor = vec4(mix(day, night, amount), 1.0);
        #include <colorspace_fragment>
      }`
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.renderOrder = -1000;
  sky.frustumCulled = false;
  drawGroup.add(sky);

  const towers = addCityTowers(THREE, drawGroup, blocks, loader);
  const districtMaterials = new Set();
  let districtNight = 0;
  let disposed = false;
  const districtsReady = loader.loadAsync(
    new URL('./assets/3d/environment/night-city-districts.glb', import.meta.url).href
  ).then(({ scene }) => {
    scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      if (disposed) {
        mesh.geometry.dispose();
        mesh.material.map?.dispose();
        mesh.material.emissiveMap?.dispose();
        mesh.material.dispose();
        return;
      }
      if (districtMaterials.has(mesh.material)) return;
      districtMaterials.add(mesh.material);
      for (const texture of [mesh.material.map, mesh.material.emissiveMap]) {
        if (texture && !textures.includes(texture)) textures.push(texture);
      }
      mesh.material.emissiveIntensity = districtNight;
    });
    if (disposed) return;
    towers.replaceLots(scene.userData.lots);
    scene.name = 'SketchfabCityDistricts';
    drawGroup.add(scene);
  }).catch(error => console.warn('SAEI: Sketchfab city districts unavailable.', error));
  const neighborhood = createCityNeighborhood(THREE, blocks, seededRandom(8412));
  drawGroup.add(neighborhood.mesh);
  textures.push(neighborhood.windows);
  const dayGround = ground.color.clone(), nightGround = new THREE.Color('#222633');
  const dayRoad = road.color.clone(), nightRoad = new THREE.Color('#1c2230');
  const dayPaving = pavingMaterial.color.clone(), nightPaving = new THREE.Color('#30353b');

  return {
    ready: Promise.all([towers.ready, ridgeReady, districtsReady]),
    count: blocks.length,
    rearCount: blocks.filter((block) => block.z < -110).length,
    updateCamera(camera) {
      sky.position.copy(camera.position);
      towers.updateCamera(camera);
    },
    setNight(amount) {
      towers.setNight(amount);
      neighborhood.setNight(amount);
      ground.color.copy(dayGround).lerp(nightGround, amount);
      road.color.copy(dayRoad).lerp(nightRoad, amount);
      pavingMaterial.color.copy(dayPaving).lerp(nightPaving, amount);
      const lights = THREE.MathUtils.smoothstep(amount, 0.16, 0.86);
      districtNight = lights * 1.3;
      for (const material of districtMaterials) material.emissiveIntensity = districtNight;
      roadNight.value = lights;
      poolMaterial.opacity = lights * 0.87;
      lampMaterial.opacity = lights;
      pools.visible = lamps.visible = lights > 0.001;
      beacons.visible = lights > 0.001;
      beacons.material.opacity = lights * 0.87;
      skyMaterial.uniforms.amount.value = amount;
      sky.visible = amount > 0.002;
    },
    destroy() {
      disposed = true;
      towers.destroy();
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
