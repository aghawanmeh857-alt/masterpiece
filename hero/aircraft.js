// A gentle flyby that restarts beyond the skyline and camera field of view.
export function sampleAircraftFlight(phase) {
  const progress = ((phase % 1) + 1) % 1;
  const arc = progress * Math.PI;
  const speedX = 820;
  const speedY = 7 * Math.PI * Math.cos(arc);
  const speedZ = 126 * Math.PI * Math.cos(arc);
  return {
    x: -410 + speedX * progress,
    y: 168 + 7 * Math.sin(arc),
    z: -79 + 126 * Math.sin(arc),
    yaw: Math.atan2(speedX, speedZ),
    pitch: -Math.atan2(speedY, Math.hypot(speedX, speedZ)),
    roll: -0.115 * Math.sin(arc)
  };
}

export function createCityAircraft(THREE, scene, reducedMotion = false) {
  const aircraft = new THREE.Group();
  aircraft.name = 'OFOQCityAircraft';
  aircraft.userData.dynamicScene = true;
  const white = new THREE.MeshStandardMaterial({
    color: '#e9eef3',
    roughness: 0.35,
    metalness: 0.35
  });
  const blue = new THREE.MeshStandardMaterial({ color: '#234467', roughness: 0.4, metalness: 0.3 });
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: '#1c3346',
    roughness: 0.18,
    metalness: 0.4
  });
  function sphere(size, position, material) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), material);
    mesh.scale.set(...size);
    mesh.position.set(...position);
    aircraft.add(mesh);
  }
  function wing(points, y, material) {
    const shape = new THREE.Shape();
    points.forEach(([x, z], index) => (index ? shape.lineTo(x, z) : shape.moveTo(x, z)));
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = y;
    aircraft.add(mesh);
  }
  sphere([0.8, 0.85, 6.4], [0, 0, 0], white);
  sphere([0.62, 0.3, 1.1], [0, 0.42, 4.9], windowMaterial);
  wing(
    [
      [-0.4, 1.2],
      [-7.5, -2.8],
      [-7.5, -3.6],
      [-0.4, -1.5]
    ],
    -0.15,
    white
  );
  wing(
    [
      [0.4, 1.2],
      [7.5, -2.8],
      [7.5, -3.6],
      [0.4, -1.5]
    ],
    -0.15,
    white
  );
  wing(
    [
      [-0.3, -3.8],
      [-3.1, -5.2],
      [-3.1, -5.8],
      [-0.3, -5]
    ],
    0.35,
    blue
  );
  wing(
    [
      [0.3, -3.8],
      [3.1, -5.2],
      [3.1, -5.8],
      [0.3, -5]
    ],
    0.35,
    blue
  );
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 2), blue);
  tail.position.set(0, 1.4, -4.7);
  aircraft.add(tail);
  for (const side of [-1, 1]) {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.9, 16), white);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(side * 2.4, -0.65, -0.5);
    aircraft.add(engine);
    const windows = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 5.8), windowMaterial);
    windows.position.set(side * 0.72, 0.23, 0.2);
    aircraft.add(windows);
  }
  scene.add(aircraft);
  let phase = 0.48;
  let disposed = false;
  return {
    async loadModel(loader) {
      const asset = await loader.loadAsync(new URL('../3D/airplane.glb', import.meta.url).href);
      if (disposed) {
        disposeModel(asset.scene);
        return;
      }
      const model = asset.scene;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model),
        size = bounds.getSize(new THREE.Vector3()),
        center = bounds.getCenter(new THREE.Vector3());
      const scale = 16 / Math.max(size.x, size.z);
      model.scale.setScalar(scale);
      // The GLB's nose points towards -Z, while the flight uses +Z forward.
      model.rotation.y = Math.PI;
      model.position.set(center.x * scale, -center.y * scale, center.z * scale);
      aircraft.traverse((node) => node.geometry?.dispose());
      aircraft.clear();
      aircraft.add(model);
      document.documentElement.dataset.aircraftSource = 'sketchfab-gompirulo';
    },
    update(dt, outside = true, enabled = true) {
      aircraft.visible = outside && enabled;
      if (!reducedMotion) phase = (phase + Math.min(dt, 0.15) / 62) % 1;
      if (aircraft.visible) {
        const pose = sampleAircraftFlight(phase);
        aircraft.position.set(pose.x, pose.y, pose.z);
        aircraft.rotation.set(pose.pitch, pose.yaw, pose.roll, 'YXZ');
      }
      document.documentElement.dataset.aircraftFlying = String(aircraft.visible && !reducedMotion);
      document.documentElement.dataset.aircraftPhase = phase.toFixed(5);
    },
    destroy() {
      disposed = true;
      disposeModel(aircraft);
      [white, blue, windowMaterial].forEach((material) => material.dispose());
      scene.remove(aircraft);
    }
  };
}

function disposeModel(root) {
  const materials = new Set();
  root.traverse((node) => {
    node.geometry?.dispose();
    if (node.material) materials.add(node.material);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
    material.dispose();
  }
}
