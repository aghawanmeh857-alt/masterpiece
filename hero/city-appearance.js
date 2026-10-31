// Static surface and lighting details only. No camera, traffic or crowd paths.
export function addCityAppearance(THREE, city) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  let seed = 94017;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function texture(draw) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    draw(canvas.getContext('2d'));
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 4;
    textures.add(map); return map;
  }
  const asphaltMap = texture(context => {
    context.fillStyle = '#363d45'; context.fillRect(0, 0, 256, 256);
    for (let index = 0; index < 14000; index++) {
      const value = 35 + Math.floor(random() * 44);
      context.fillStyle = `rgba(${value},${value + 5},${value + 10},.32)`;
      context.fillRect(random() * 256, random() * 256, .7 + random(), .7 + random());
    }
  });
  const pavementMap = texture(context => {
    context.fillStyle = '#a4adb6'; context.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const shade = Math.floor(164 + random() * 20);
      context.fillStyle = `rgb(${shade},${shade + 5},${shade + 9})`;
      context.fillRect(x * 64 + 1, y * 64 + 1, 62, 62);
    }
    for (let i = 0; i < 4000; i++) {
      context.fillStyle = random() > .5 ? '#ffffff0c' : '#00000009';
      context.fillRect(random() * 256, random() * 256, 1, 1);
    }
  });
  function box(size, position, material) {
    const geometry = new THREE.BoxGeometry(...size); geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); mesh.receiveShadow = true; city.add(mesh);
    return mesh;
  }
  const metal = new THREE.MeshStandardMaterial({ color: '#445364', metalness: .8, roughness: .32 });
  const lamp = new THREE.MeshBasicMaterial({ color: '#ffe6bd', transparent: true, opacity: 0, toneMapped: false });
  materials.add(metal); materials.add(lamp);
  const poolMap = texture(context => {
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255,232,180,.45)'); gradient.addColorStop(.35, 'rgba(255,225,164,.2)'); gradient.addColorStop(1, 'rgba(255,221,160,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, 256, 256);
  });
  const pool = new THREE.MeshBasicMaterial({ map: poolMap, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  materials.add(pool);
  const poles = [[24, -65], [24, -35], [24, -5], [24, 24], [62, 40], [105, 40], [150, 40], [195, 40]];
  for (const [x, z] of poles) {
    const horizontal = z === 40;
    box([.12, 5.4, .12], [x, 2.72, z], metal);
    box(horizontal ? [.12, .1, 2.8] : [2.8, .1, .12], [x + (horizontal ? 0 : 1.3), 5.4, z + (horizontal ? 1.3 : 0)], metal);
    const lampX = x + (horizontal ? 0 : 2.5), lampZ = z + (horizontal ? 2.5 : 0);
    box([.7, .12, .38], [lampX, 5.36, lampZ], metal);
    box([.58, .035, .29], [lampX, 5.28, lampZ], lamp);
    const geometry = new THREE.PlaneGeometry(12, 18); geometries.add(geometry);
    const glow = new THREE.Mesh(geometry, pool); glow.rotation.x = -Math.PI / 2;
    glow.position.set(lampX, .04, lampZ); city.add(glow);
  }
  // Contact shadows ground the imported buildings without more shadow lights.
  const shadowMap = texture(context => {
    const gradient = context.createRadialGradient(128, 128, 20, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(15,24,33,.24)'); gradient.addColorStop(.65, 'rgba(15,24,33,.15)'); gradient.addColorStop(1, 'rgba(15,24,33,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, 256, 256);
  });
  const shadow = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false }); materials.add(shadow);
  city.updateMatrixWorld(true);
  const buildingNames = /^(Plane057|Plane056|Cube009|Cube|Plane001|Plane036|Cube192|Plane048|Cube002)$/;
  const contacts = [];
  city.traverse(node => {
    if (!buildingNames.test(node.name)) return;
    const bounds = new THREE.Box3().setFromObject(node), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    contacts.push({ bounds, size, center });
  });
  contacts.forEach(({ bounds, size, center }) => {
    const geometry = new THREE.PlaneGeometry(size.x * 1.15, size.z * 1.15); geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, shadow); mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(center.x, bounds.min.y + .045, center.z); city.add(mesh);
  });
  document.documentElement.dataset.cityAppearance = 'pbr-textured-streets';
  document.documentElement.dataset.cityStreetLamps = String(poles.length);
  return {
    asphaltMap, pavementMap,
    setNight(amount) { lamp.opacity = amount; pool.opacity = amount * .75; },
    destroy() { geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose()); }
  };
}
