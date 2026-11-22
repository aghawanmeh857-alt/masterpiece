// Generic Sedan Car by MMC Works (CC BY 4.0); see /3D/README.md.
export const TRAFFIC_LANES = [
  { x: 27.5, z: 0, axis: 'z', from: -174, to: 27, direction: 1 },
  { x: 32.5, z: 0, axis: 'z', from: -174, to: 27, direction: -1 },
  { x: 0, z: 45.5, axis: 'x', from: 40, to: 245, direction: 1 },
  { x: 0, z: 50.5, axis: 'x', from: 40, to: 245, direction: -1 }
];

export function lanePosition(lane, distance) {
  const length = lane.to - lane.from;
  const offset = ((distance % length) + length) % length;
  const coordinate = lane.direction > 0 ? lane.from + offset : lane.to - offset;
  return { x: lane.axis === 'x' ? coordinate : lane.x, z: lane.axis === 'z' ? coordinate : lane.z };
}

export async function createCityTraffic(
  THREE,
  scene,
  { loader, mergeGeometries, reducedMotion = false }
) {
  const asset = await loader.loadAsync(
    new URL('../3D/generic-sedan-car.glb', import.meta.url).href
  );
  asset.scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(asset.scene);
  const center = bounds.getCenter(new THREE.Vector3());
  const objectBounds = (pattern) => {
    let found;
    asset.scene.traverse((node) => {
      if (!found && pattern.test(node.name)) found = node;
    });
    return found ? new THREE.Box3().setFromObject(found).getCenter(new THREE.Vector3()) : null;
  };
  const front = objectBounds(/^bumper-front_8$/),
    rear = objectBounds(/^bumper-rear_10$/);
  const heading = front && rear ? Math.atan2(front.x - rear.x, front.z - rear.z) : 0;
  const transform = new THREE.Matrix4()
    .makeRotationY(-heading)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
  const sourcePieces = new Map();
  const sourceGeometries = new Set(),
    sourceMaterials = new Set();
  asset.scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    sourceGeometries.add(mesh.geometry);
    if (Array.isArray(mesh.material)) return;
    sourceMaterials.add(mesh.material);
    if (mesh.material.transparent) mesh.material.forceSinglePass = true;
    let ancestor = mesh,
      wheel = 'body';
    while (ancestor) {
      if (/^DEF-Wheel/.test(ancestor.name)) {
        wheel = ancestor.name;
        break;
      }
      ancestor = ancestor.parent;
    }
    const key = wheel + ':' + mesh.material.uuid;
    const geometry = (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone())
      .applyMatrix4(mesh.matrixWorld)
      .applyMatrix4(transform);
    for (const key of Object.keys(geometry.attributes))
      if (!['position', 'normal', 'uv'].includes(key)) geometry.deleteAttribute(key);
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    if (!geometry.attributes.uv)
      geometry.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(
          new Float32Array(geometry.attributes.position.count * 2),
          2
        )
      );
    if (!sourcePieces.has(key))
      sourcePieces.set(key, { material: mesh.material, wheel, pieces: [] });
    sourcePieces.get(key).pieces.push(geometry);
  });
  const template = new THREE.Group();
  const wheelGroups = new Map();
  const geometries = new Set(),
    ownedMaterials = new Set();
  for (const { material, wheel, pieces } of sourcePieces.values()) {
    const geometry = mergeGeometries(pieces, false);
    pieces.forEach((piece) => piece.dispose());
    if (!geometry) continue;
    geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    if (wheel === 'body') template.add(mesh);
    else {
      if (!wheelGroups.has(wheel)) {
        const group = new THREE.Group();
        group.name = wheel;
        wheelGroups.set(wheel, group);
        template.add(group);
      }
      wheelGroups.get(wheel).add(mesh);
    }
  }
  for (const group of wheelGroups.values()) {
    const position = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
    group.children.forEach((mesh) =>
      mesh.geometry.translate(-position.x, -position.y, -position.z)
    );
    group.position.copy(position);
    group.userData.trafficWheel = true;
  }
  const size = new THREE.Box3().setFromObject(template).getSize(new THREE.Vector3());
  const scale = 4.7 / size.z;
  template.scale.setScalar(scale);
  sourceGeometries.forEach((geometry) => geometry.dispose());
  const root = new THREE.Group();
  root.name = 'OFOQTraffic';
  root.userData.dynamicScene = true;
  scene.add(root);
  const paintColors = ['#dedee0', '#263b55', '#7e1e2a', '#6b747d', '#e7e5dc', '#202b31'];
  const cars = [];
  let nightAmount = 0;
  const lensGeometry = new THREE.SphereGeometry(0.11, 10, 6);
  geometries.add(lensGeometry);
  const headMaterial = new THREE.MeshBasicMaterial({
    color: '#fff4db',
    transparent: true,
    opacity: 0,
    toneMapped: false
  });
  const tailMaterial = new THREE.MeshBasicMaterial({
    color: '#ff2737',
    transparent: true,
    opacity: 0,
    toneMapped: false
  });
  ownedMaterials.add(headMaterial);
  ownedMaterials.add(tailMaterial);
  const distantGeometry = new THREE.PlaneGeometry(1.84, 4.36)
    .rotateX(-Math.PI / 2)
    .translate(0, 0.72, 0);
  geometries.add(distantGeometry);
  function sedanImage(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 104;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(2, 1, 44, 102, [10, 10, 8, 8]);
    ctx.fill();
    ctx.fillStyle = '#273748';
    ctx.beginPath();
    ctx.roundRect(7, 25, 34, 57, [8, 8, 6, 6]);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(10, 39, 28, 30);
    ctx.fillStyle = '#e8edf0';
    ctx.fillRect(6, 6, 9, 4);
    ctx.fillRect(33, 6, 9, 4);
    ctx.fillStyle = '#9c3329';
    ctx.fillRect(6, 94, 8, 4);
    ctx.fillRect(34, 94, 8, 4);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }
  for (let index = 0; index < 6; index++) {
    const car = template.clone(true);
    car.name = 'Sedan-' + (index + 1);
    const paint = new Map(),
      wheels = [];
    car.traverse((node) => {
      if (node.userData.trafficWheel) wheels.push(node);
      if (!node.isMesh || !/Car_Paint/i.test(node.material.name)) return;
      const original = node.material;
      if (!paint.has(original)) {
        const material = original.clone();
        material.color.set(paintColors[index]);
        material.metalness = 0.55;
        material.roughness = 0.3;
        ownedMaterials.add(material);
        paint.set(original, material);
      }
      node.material = paint.get(original);
    });
    const detailedParts = [...car.children];
    const distantPaint = new THREE.MeshBasicMaterial({
      map: sedanImage(paintColors[index]),
      alphaTest: 0.25
    });
    ownedMaterials.add(distantPaint);
    const distant = new THREE.Mesh(distantGeometry, distantPaint);
    distant.name = 'DistantSedanImage';
    distant.scale.setScalar(1 / scale);
    distant.visible = false;
    car.add(distant);
    const lamps = new THREE.Group();
    lamps.name = 'NightDrivingLights';
    lamps.visible = false;
    car.add(lamps);
    const headlights = [];
    for (const side of [-1, 1]) {
      const head = new THREE.Mesh(lensGeometry, headMaterial);
      head.position.set(side * 0.7, 0.62, 2.23);
      head.scale.set(1.25, 0.6, 0.4);
      lamps.add(head);
      const rear = new THREE.Mesh(lensGeometry, tailMaterial);
      rear.position.set(side * 0.72, 0.77, -2.25);
      rear.scale.set(1.5, 0.7, 0.4);
      lamps.add(rear);
      const light = new THREE.SpotLight('#fff1cf', 0, 19, 0.42, 0.7, 2);
      light.position.set(side * 0.7, 0.62, 2.25);
      light.target.position.set(side * 0.9, -0.02, 13);
      light.castShadow = false;
      light.visible = false;
      lamps.add(light, light.target);
      headlights.push(light);
    }
    const lane = TRAFFIC_LANES[index % TRAFFIC_LANES.length];
    const speed = 5.5 + (index % 3) * 0.35;
    cars.push({
      car,
      lane,
      speed,
      distance: index < 4 ? index * 38 : (index - 4) * 38 + 100,
      wheels,
      lamps,
      headlights,
      detailedParts,
      distant
    });
    root.add(car);
  }
  let elapsed = 0;
  document.documentElement.dataset.trafficStatus = 'ready';
  document.documentElement.dataset.trafficCars = String(cars.length);
  document.documentElement.dataset.trafficSource = 'sketchfab-generic-sedan';
  return {
    setNight(amount) {
      nightAmount = Math.max(0, Math.min(1, amount));
      headMaterial.opacity = nightAmount;
      tailMaterial.opacity = nightAmount * 0.9;
      cars.forEach((record) => {
        record.distant.material.color.setScalar(1 - 0.7 * nightAmount);
      });
      if (nightAmount <= 0.001) {
        cars.forEach((record) =>
          record.headlights.forEach((light) => {
            light.visible = false;
            light.intensity = 0;
          })
        );
        document.documentElement.dataset.activeCarHeadlights = '0';
      }
      document.documentElement.dataset.carLightsOn = String(nightAmount > 0.001);
      document.documentElement.dataset.carLightLevel = nightAmount.toFixed(3);
    },
    update(dt, camera, visible = true) {
      const step = reducedMotion ? 0 : Math.max(0, Math.min(dt, 0.05));
      elapsed += step;
      root.visible = visible;
      if (!visible) return;
      for (const record of cars) {
        record.distance += step * record.speed;
        const position = lanePosition(record.lane, record.distance);
        record.car.position.set(position.x, 0.01, position.z);
        record.car.rotation.y =
          record.lane.axis === 'x'
            ? (record.lane.direction * Math.PI) / 2
            : record.lane.direction > 0
              ? 0
              : Math.PI;
        record.wheels.forEach((wheel) => {
          wheel.rotation.x += (step * record.speed) / 0.34;
        });
        const distance = record.car.position.distanceToSquared(camera.position);
        record.car.visible = distance < 90 * 90;
        // Hysteresis prevents flicker when the camera sits near the LOD boundary.
        // Keep the high-poly car for genuinely close views. The tour sees
        // most road traffic from across the plaza or from above.
        const threshold = record.distant.visible ? 18 : 23;
        const detailed = distance < threshold * threshold;
        record.detailedParts.forEach((part) => {
          part.visible = detailed;
        });
        record.distant.visible = !detailed;
        record.lamps.visible = nightAmount > 0.001 && distance < 60 * 60;
      }
      // Emissive lenses remain visible across the plaza. Real beams only
      // matter next to a car, where they will light visible ground.
      let nearest = null,
        nearestDistance = 18 * 18;
      if (camera.position.y < 8 && nightAmount > 0.001) {
        for (const record of cars) {
          const distance = record.car.position.distanceToSquared(camera.position);
          if (distance < nearestDistance) {
            nearest = record;
            nearestDistance = distance;
          }
        }
      }
      for (const record of cars)
        for (const light of record.headlights) {
          light.visible = record === nearest;
          light.intensity = 55 * nightAmount;
        }
      document.documentElement.dataset.activeCarHeadlights = nearest ? '2' : '0';
      document.documentElement.dataset.trafficTime = elapsed.toFixed(2);
      document.documentElement.dataset.trafficPosition = `${cars[0].car.position.x.toFixed(2)},${cars[0].car.position.z.toFixed(2)}`;
    },
    destroy() {
      scene.remove(root);
      geometries.forEach((geometry) => geometry.dispose());
      const textures = new Set();
      [...sourceMaterials, ...ownedMaterials].forEach((material) => {
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
    }
  };
}
