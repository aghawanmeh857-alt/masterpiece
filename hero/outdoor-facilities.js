// Fixed furniture, pavement and lighting around the entrance plaza.
export function createOutdoorFacilities(THREE, scene) {
  const park = new THREE.Group();
  park.name = 'OFOQOutdoorFacilities';
  scene.add(park);

  const material = (color, roughness = 0.8, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const stone = material('#c9ccca');
  const darkStone = material('#77868c');
  const grass = material('#568068');
  const bark = material('#796049');
  const foliage = [material('#365f4b'), material('#47745a'), material('#608268')];
  const wood = material('#ad8660');
  const metal = material('#354b58', 0.35, 0.65);
  const streetLights = [];
  const lampHalos = [];
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 64;
  const haloContext = haloCanvas.getContext('2d');
  const haloGradient = haloContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  haloGradient.addColorStop(0, '#fff4cc');
  haloGradient.addColorStop(0.2, '#ffcc7bcc');
  haloGradient.addColorStop(1, '#ffae4200');
  haloContext.fillStyle = haloGradient;
  haloContext.fillRect(0, 0, 64, 64);
  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  const haloMaterial = new THREE.SpriteMaterial({
    map: haloTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  const glow = new THREE.MeshStandardMaterial({
    color: '#fff1d5',
    emissive: '#fff1d5',
    emissiveIntensity: 0
  });

  function mesh(geometry, surface, position, parent = park) {
    const item = new THREE.Mesh(geometry, surface);
    item.position.set(...position);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  const box = (size, position, surface, parent) =>
    mesh(new THREE.BoxGeometry(...size), surface, position, parent);
  const cylinder = (top, bottom, height, position, surface, parent) =>
    mesh(new THREE.CylinderGeometry(top, bottom, height, 16), surface, position, parent);

  // Raised paving and planted beds leave the central entrance path clear.
  box([46, 0.08, 34], [0, 0.1, 18], stone);
  box([46, 0.06, 2.4], [0, 0.16, 32], darkStone);
  for (const side of [-1, 1]) {
    box([11, 0.2, 20], [side * 13.5, 0.16, 17], darkStone);
    box([10.5, 0.14, 19.5], [side * 13.5, 0.28, 17], grass);
    box([2, 0.05, 30], [side * 6.6, 0.16, 17], stone);
    box([8, 0.16, 44], [side * 17, 0.08, -21], grass);
  }
  // Paving joints give the plaza scale without adding a texture download.
  for (let z = 5; z <= 31; z += 3) {
    box([10, 0.015, 0.045], [0, 0.19, z], darkStone);
  }
  for (const x of [-3.4, 3.4]) box([0.045, 0.015, 28], [x, 0.19, 18], darkStone);

  // Shared leaf geometry keeps the trees light enough for mobile devices.
  const leafGeometry = new THREE.SphereGeometry(1, 14, 10);
  function tree(x, z, scale, index) {
    const group = new THREE.Group();
    group.userData.autumnReplacement = z > 0 && Math.abs(x) < 20;
    group.visible = !(
      group.userData.autumnReplacement && document.documentElement.dataset.autumnWalk === 'ready'
    );
    group.position.set(x, 0.35, z);
    group.scale.setScalar(scale);
    park.add(group);
    cylinder(0.13, 0.25, 3.3, [0, 1.65, 0], bark, group);
    for (const [dx, y, dz, radius] of [
      [0, 4.4, 0, 1.5],
      [-0.85, 3.65, 0.1, 1.15],
      [0.8, 3.8, -0.15, 1.2],
      [0, 3.8, 0.75, 1.1],
      [0, 5.1, 0, 0.95]
    ]) {
      const leaf = mesh(leafGeometry, foliage[(index + Math.round(y)) % 3], [dx, y, dz], group);
      leaf.scale.set(radius, radius * 0.85, radius);
    }
    const ring = mesh(new THREE.TorusGeometry(0.75, 0.08, 8, 24), stone, [0, 0.02, 0], group);
    ring.rotation.x = Math.PI / 2;
  }
  let count = 0;
  for (const side of [-1, 1]) {
    for (const [x, z, size] of [
      [13, 9, 1],
      [16, 18, 1.15],
      [12, 26, 0.95],
      [22, 30, 1.1]
    ]) {
      tree(side * x, z, size, count++);
    }
    for (const z of [-8, -23, -38]) tree(side * 17, z, 1.1, count++);
  }

  function bench(x, z, rotation) {
    const group = new THREE.Group();
    group.position.set(x, 0.18, z);
    group.rotation.y = rotation;
    park.add(group);
    for (const dz of [-0.2, 0, 0.2]) box([2.7, 0.09, 0.16], [0, 0.55, dz], wood, group);
    for (const y of [0.9, 1.15]) box([2.7, 0.17, 0.08], [0, y, -0.36], wood, group);
    for (const dx of [-1.05, 1.05]) {
      box([0.1, 0.55, 0.65], [dx, 0.27, 0], metal, group);
      box([0.1, 0.8, 0.09], [dx, 0.8, -0.36], metal, group);
    }
  }
  for (const side of [-1, 1]) {
    bench(side * 9.8, 14, (side * Math.PI) / 2);
    bench(side * 10, 23, (side * Math.PI) / 2);
    for (const z of [8, 20, 30]) {
      cylinder(0.08, 0.12, 3.8, [side * 5.5, 2.05, z], metal);
      box([0.7, 0.12, 0.7], [side * 5.5, 4, z], metal);
      box([0.55, 0.08, 0.55], [side * 5.5, 3.92, z], glow);
      const lamp = new THREE.PointLight('#ffc27b', 0, 14, 2);
      lamp.position.set(side * 5.5, 3.75, z);
      park.add(lamp);
      streetLights.push(lamp);
      const halo = new THREE.Sprite(haloMaterial);
      halo.position.set(side * 5.5, 4.08, z);
      halo.scale.set(1.2, 1.2, 1);
      park.add(halo);
      lampHalos.push(halo);
    }
    cylinder(0.34, 0.3, 0.9, [side * 7, 0.62, 25], metal);
    cylinder(0.37, 0.37, 0.08, [side * 7, 1.11, 25], darkStone);
  }

  // A small fountain sits to the side, away from the door and camera route.
  const fountainFallback = new THREE.Group();
  fountainFallback.name = 'OFOQFountainFallback';
  fountainFallback.userData.dynamicScene = true;
  fountainFallback.visible = document.documentElement.dataset.plazaFountain !== 'ready';
  park.add(fountainFallback);
  cylinder(3.5, 3.5, 0.28, [-24, 0.24, 15], stone, fountainFallback);
  const rim = mesh(
    new THREE.TorusGeometry(3.15, 0.18, 10, 40),
    darkStone,
    [-24, 0.45, 15],
    fountainFallback
  );
  rim.rotation.x = Math.PI / 2;
  const water = new THREE.MeshPhysicalMaterial({
    color: '#6bafb9',
    roughness: 0.15,
    metalness: 0.15,
    clearcoat: 1
  });
  cylinder(2.98, 2.98, 0.035, [-24, 0.39, 15], water, fountainFallback);
  cylinder(0.28, 0.45, 1.25, [-24, 0.98, 15], stone, fountainFallback);
  cylinder(1.15, 1.15, 0.12, [-24, 1.62, 15], darkStone, fountainFallback);
  cylinder(1.02, 1.02, 0.03, [-24, 1.7, 15], water, fountainFallback);

  // Visitor bicycle parking on the opposite side of the plaza.
  box([5, 0.1, 2.4], [24, 0.1, 14], stone);
  for (const x of [22.5, 24, 25.5]) {
    cylinder(0.055, 0.055, 0.8, [x - 0.35, 0.55, 14], metal);
    cylinder(0.055, 0.055, 0.8, [x + 0.35, 0.55, 14], metal);
    box([0.8, 0.11, 0.11], [x, 0.95, 14], metal);
  }
  document.documentElement.dataset.outdoorTrees = String(count);
  document.documentElement.dataset.outdoorFacilities =
    'benches,lights,fountain,bicycle-parking,gardens';
  park.userData.setNight = (amount) => {
    const level = Math.max(0, Math.min(1, Number(amount)));
    glow.emissiveIntensity = 2.8 * level;
    streetLights.forEach((light) => {
      light.intensity = 45 * level;
    });
    haloMaterial.opacity = level;
    lampHalos.forEach((halo) => {
      halo.visible = level > 0.001;
    });
    document.documentElement.dataset.streetLightsOn = String(level > 0.001);
    document.documentElement.dataset.streetLightLevel = level.toFixed(4);
    document.documentElement.dataset.streetLightCount = String(streetLights.length);
  };
  return park;
}
