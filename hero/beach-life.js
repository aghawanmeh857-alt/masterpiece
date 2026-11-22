import { mergeStaticMeshes } from './static-meshes.js';
// Lightweight jointed beach visitors and a timber pier; no extra model downloads.
export function createBeachLife(THREE, coast, { reducedMotion = false, mergeGeometries } = {}) {
  const group = new THREE.Group();
  group.name = 'OFOQBeachLife';
  group.userData.dynamicScene = true;
  coast.add(group);
  const materials = new Map(),
    geometries = new Set();
  const material = (color) => {
    if (!materials.has(color))
      materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
    return materials.get(color);
  };
  function mesh(parent, geometry, color, position) {
    geometries.add(geometry);
    const item = new THREE.Mesh(geometry, material(color));
    item.position.set(...position);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  const box = (parent, size, position, color) =>
    mesh(parent, new THREE.BoxGeometry(...size), color, position);
  const sphere = (parent, radius, position, color) =>
    mesh(parent, new THREE.SphereGeometry(radius, 10, 8), color, position);
  const sandHeight = (x, z) => {
    const shore = -63 + Math.sin((z + 5) * 0.045) * 2.6;
    return -0.1 + ((x - shore) / (-28 - shore)) * 0.34;
  };
  const people = [];
  function person(name, x, z, shirt, angle = 0) {
    const root = new THREE.Group();
    root.name = name;
    root.position.set(x, sandHeight(x, z), z);
    root.rotation.y = angle;
    group.add(root);
    const skin = '#c99573';
    box(root, [0.48, 0.6, 0.27], [0, 1.12, 0], shirt);
    sphere(root, 0.2, [0, 1.66, 0], skin);
    const hair = sphere(root, 0.205, [0, 1.75, -0.025], '#473a32');
    hair.scale.y = 0.5;
    function limb(x, y, length, color) {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      root.add(pivot);
      box(pivot, [0.14, length, 0.16], [0, -length / 2, 0], color);
      return pivot;
    }
    const arms = [-1, 1].map((side) => limb(side * 0.32, 1.39, 0.56, skin));
    const legs = [-1, 1].map((side) => limb(side * 0.14, 0.84, 0.76, '#40566b'));
    const visitor = { root, arms, legs, baseY: root.position.y };
    people.push(visitor);
    return visitor;
  }

  // The pier crosses the shoreline and ends over the water. Keep the boardwalk clear.
  const pier = new THREE.Group();
  pier.name = 'OFOQBeachPier';
  group.add(pier);
  const timber = '#b78b60',
    rail = '#d4b38a';
  for (let x = -35; x >= -87; x -= 0.8) box(pier, [0.74, 0.22, 3.6], [x, 0.67, 8], timber);
  for (const z of [6.35, 9.65]) {
    box(pier, [53, 0.16, 0.16], [-61, 1.8, z], rail);
    box(pier, [53, 0.1, 0.12], [-61, 1.28, z], rail);
    for (let x = -35; x >= -87; x -= 4) {
      box(pier, [0.2, 4, 0.2], [x, -0.1, z], timber);
    }
  }
  box(pier, [5, 0.22, 7], [-88, 0.67, 8], timber);
  box(pier, [0.16, 0.16, 7], [-90.4, 1.8, 8], rail);
  for (const z of [4.6, 11.4]) {
    box(pier, [5, 0.16, 0.16], [-88, 1.8, z], rail);
    for (const x of [-85.6, -90.4]) box(pier, [0.22, 4, 0.22], [x, -0.1, z], timber);
  }
  // Three shallow steps connect the sand to the raised deck.
  for (let i = 0; i < 3; i++)
    box(pier, [0.65, 0.18 + i * 0.17, 3.6], [-33.1 - i * 0.65, 0.23 + i * 0.085, 8], timber);

  if (mergeGeometries)
    mergeStaticMeshes(THREE, pier, mergeGeometries).geometries.forEach((geometry) =>
      geometries.add(geometry)
    );

  const volleyballZ = -15,
    volleyballDistance = 5;
  const players = [
    person('Beach volleyball A', -49, volleyballZ, '#d87759', Math.PI),
    person('Beach volleyball B', -49, volleyballZ - volleyballDistance, '#568e9c')
  ];
  const ball = sphere(group, 0.25, [-49, 2.4, volleyballZ], '#f3d58a');
  const painter = person('Painting by the sea', -51, 30, '#6c9d88', -Math.PI / 2);
  const easel = new THREE.Group();
  easel.position.set(-52, sandHeight(-52, 30), 30);
  easel.rotation.y = -Math.PI / 2;
  group.add(easel);
  for (const x of [-0.4, 0.4]) {
    const leg = box(easel, [0.09, 1.8, 0.09], [x, 0.9, 0], timber);
    leg.rotation.z = x < 0 ? -0.12 : 0.12;
  }
  box(easel, [1.05, 0.8, 0.08], [0, 1.35, 0.05], '#faf1da');
  box(easel, [0.86, 0.28, 0.02], [0, 1.18, 0.1], '#66a8b8');
  sphere(easel, 0.12, [0.25, 1.53, 0.11], '#eac581').scale.z = 0.1;
  const fisher = person('Fishing from the pier', -88, 7.6, '#deb76a', -Math.PI / 2);
  fisher.root.position.y = 0.78;
  fisher.baseY = 0.78;
  fisher.arms.forEach((arm) => {
    arm.rotation.x = -1;
  });
  const rod = box(fisher.arms[1], [0.035, 2.7, 0.035], [0, -0.9, 0.1], '#495650');
  rod.rotation.x = -0.4;
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-90, 2.5, 7.6),
    new THREE.Vector3(-92, 0.04, 7.6)
  ]);
  geometries.add(lineGeometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: '#ccd9d9' });
  group.add(new THREE.Line(lineGeometry, lineMaterial));
  const reader = person('Reading on the sand', -40, -5, '#b38a9d', -0.7);
  reader.root.position.y -= 0.55;
  reader.legs.forEach((leg) => {
    leg.rotation.x = -Math.PI / 2;
  });
  reader.arms.forEach((arm) => {
    arm.rotation.x = -0.9;
  });
  box(reader.root, [0.6, 0.06, 0.38], [0, 0.9, 0.44], '#f6e8c8');
  const mat = box(group, [2.2, 0.04, 2.6], [-40, sandHeight(-40, -5) + 0.02, -5], '#92b7b0');
  mat.rotation.y = -0.7;
  const runners = [
    person('Beach runner A', -42, 40, '#648fad'),
    person('Beach runner B', -44, 43, '#cb9867')
  ];
  runners.forEach((visitor) =>
    visitor.arms.forEach((arm) => {
      arm.rotation.z = 0.15;
    })
  );
  let elapsed = 0;
  function update(dt, visible = true, peopleVisible = true) {
    // Pier is part of the scenery; the people follow the scene's people toggle.
    people.forEach((visitor) => {
      visitor.root.visible = visible && peopleVisible;
    });
    ball.visible = visible && peopleVisible;
    group.visible = visible;
    if (visible && peopleVisible && !reducedMotion) elapsed += Math.max(0, Math.min(dt, 0.05));
    const phase = elapsed * 1.4;
    const flight = (1 - Math.cos(phase)) / 2;
    ball.position.set(
      -49,
      2.1 + Math.abs(Math.sin(phase)) * 2,
      volleyballZ - flight * volleyballDistance
    );
    players.forEach((visitor, index) => {
      const reach = Math.pow(Math.max(0, Math.cos(phase + index * Math.PI)), 8);
      visitor.arms.forEach((arm, side) => {
        arm.rotation.x = -2.4 * reach;
        arm.rotation.z = (side ? 1 : -1) * 0.2;
      });
      visitor.root.position.y = visitor.baseY + reach * 0.28;
    });
    painter.arms[1].rotation.x = -1.1 + Math.sin(elapsed * 2) * 0.15;
    painter.arms[0].rotation.x = -0.7;
    fisher.arms[1].rotation.x = -1 + Math.sin(elapsed * 0.8) * 0.06;
    runners.forEach((visitor, index) => {
      const t = elapsed * 0.14 + index * 0.65;
      visitor.root.position.set(-43 + Math.cos(t) * 2, 0, 40 + Math.sin(t) * 10);
      visitor.root.position.y =
        sandHeight(visitor.root.position.x, visitor.root.position.z) +
        Math.abs(Math.sin(elapsed * 7)) * 0.08;
      visitor.root.rotation.y = Math.atan2(-2 * Math.sin(t), 10 * Math.cos(t));
      visitor.legs.forEach((leg, side) => {
        leg.rotation.x = Math.sin(elapsed * 7 + side * Math.PI) * 0.65;
      });
      visitor.arms.forEach((arm, side) => {
        arm.rotation.x = Math.sin(elapsed * 7 + side * Math.PI + Math.PI) * 0.65;
      });
    });
  }
  update(0);
  return {
    group,
    update,
    destroy() {
      coast.remove(group);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((value) => value.dispose());
      lineMaterial.dispose();
    }
  };
}
