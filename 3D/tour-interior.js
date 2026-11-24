import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const INTERIOR_FLOOR = 0.04;

// These cushions share the same seat anchors as their occupants. The chair
// convention is local +Z towards the backrest and -Z towards the person's knees.
export function createTourInterior(THREE, scene, { box, cylinder, people, props }) {
  const material = (color, roughness = 0.72, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const oak = material('#ac8060', 0.47);
  const walnut = material('#674839', 0.53);
  const frame = material('#27303a', 0.38, 0.48);
  const paper = material('#f1ebdf');
  const glass = material('#436278', 0.28, 0.32);
  const screen = material('#344c61', 0.36);
  const rug = material('#78898d', 0.96);
  const runner = material('#5d3e44', 0.98);
  const fabrics = {
    lounge: material('#9b8e7b', 0.94),
    classroom: material('#4b7270', 0.88),
    interview: material('#365b75', 0.9),
    auditorium: material('#963c43', 0.87)
  };
  const accents = ['#ad7856', '#376575', '#458377', '#a46545', '#405c80', '#8c4349'].map((color) =>
    material(color)
  );
  const partGeometries = new Map();
  let seed = 8217;
  const grain = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function surfaceMap(size, base, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    draw(ctx, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  const floorMap = surfaceMap(128, '#d9d6cf', (ctx, size) => {
    for (let i = 0; i < 720; i++) {
      ctx.fillStyle = grain() < 0.45 ? 'rgba(72,66,61,.09)' : 'rgba(255,255,255,.18)';
      ctx.fillRect(grain() * size, grain() * size, 1 + grain() * 1.8, 1);
    }
    ctx.strokeStyle = 'rgba(69,65,59,.22)';
    ctx.strokeRect(0.75, 0.75, size - 1.5, size - 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,.19)';
    ctx.strokeRect(2.2, 2.2, size - 4.4, size - 4.4);
  });
  const timberMap = surfaceMap(128, '#e9dcd0', (ctx, size) => {
    for (let y = 0; y < size; y += 1.3) {
      ctx.strokeStyle = grain() < 0.44 ? 'rgba(71,46,25,.24)' : 'rgba(255,248,223,.26)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.2, y - 4 * grain(), size * 0.64, y + 5 * grain(), size, y);
      ctx.stroke();
    }
  });
  const fabricMap = surfaceMap(64, '#dfdfdf', (ctx, size) => {
    for (let y = 0; y < size; y += 3)
      for (let x = 0; x < size; x += 3) {
        ctx.fillStyle = (x + y) % 2 ? 'rgba(36,36,36,.16)' : 'rgba(255,255,255,.28)';
        ctx.fillRect(x, y, 2, 1);
      }
  });
  for (const wood of [oak, walnut]) wood.map = timberMap;
  for (const cloth of [rug, runner, ...Object.values(fabrics), ...accents]) cloth.map = fabricMap;
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const context = shadowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 5, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(22,27,34,.27)');
  gradient.addColorStop(0.55, 'rgba(22,27,34,.16)');
  gradient.addColorStop(1, 'rgba(22,27,34,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const shadowMap = new THREE.CanvasTexture(shadowCanvas);
  shadowMap.colorSpace = THREE.SRGBColorSpace;
  const shadowSurface = new THREE.MeshBasicMaterial({
    map: shadowMap,
    transparent: true,
    depthWrite: false
  });
  const shadowGeometry = new THREE.PlaneGeometry(1, 1);

  function groupAt(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, INTERIOR_FLOOR, z);
    group.rotation.y = rotation;
    group.userData.dynamicScene = true;
    props.push(group);
    scene.add(group);
    return group;
  }

  function padded(group, width, height, depth, x, y, z, surface, radius = 0.035) {
    const key = [width, height, depth, radius].join(',');
    if (!partGeometries.has(key))
      partGeometries.set(key, new RoundedBoxGeometry(width, height, depth, 1, radius));
    const mesh = new THREE.Mesh(partGeometries.get(key), surface);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }

  function contact(group, width, depth, z = 0) {
    const shadow = new THREE.Mesh(shadowGeometry, shadowSurface);
    shadow.position.set(0, 0.018, z);
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(width, depth, 1);
    group.add(shadow);
  }

  function sit(group, { x = 0, z = 0, height = 0.46, rotation = Math.PI, pose = 1, role = 'listener' } = {}) {
    group.updateMatrixWorld(true);
    const at = group.localToWorld(new THREE.Vector3(x, height, z));
    return people(at.x, at.z, {
      rotation: group.rotation.y + rotation,
      role,
      seat: { height: at.y, pose }
    });
  }

  function chair(group, type, z = 0) {
    const auditorium = type === 'auditorium';
    const width = auditorium ? 0.66 : 0.53;
    const fabric = fabrics[type] || fabrics.interview;
    contact(group, width + 0.34, 0.92, z);
    padded(group, width, 0.12, 0.55, 0, 0.4, z, fabric);
    const back = padded(
      group,
      width,
      auditorium ? 0.64 : 0.49,
      0.105,
      0,
      auditorium ? 0.72 : 0.7,
      z + 0.25,
      fabric
    );
    back.rotation.x = 0.13;
    if (auditorium) {
      for (const x of [-0.35, 0.35]) {
        box(0.046, 0.61, 0.44, x, 0.305, z + 0.05, frame, group);
        padded(group, 0.095, 0.071, 0.5, x, 0.61, z, walnut);
      }
    } else {
      for (const x of [-0.21, 0.21])
        for (const dz of [-0.19, 0.21]) {
          cylinder(0.022, 0.35, x, 0.175, z + dz, frame, group);
        }
    }
  }

  function laptop(group, x, y, z) {
    padded(group, 0.34, 0.024, 0.24, x, y + 0.012, z, frame, 0.008);
    box(0.29, 0.01, 0.15, x, y + 0.026, z - 0.01, glass, group);
    const lid = padded(group, 0.34, 0.225, 0.018, x, y + 0.12, z - 0.12, frame, 0.008);
    lid.rotation.x = -0.17;
    const display = box(0.3, 0.185, 0.008, x, y + 0.122, z - 0.107, screen, group);
    display.rotation.x = -0.17;
  }

  function notebook(group, x, y, z, accent) {
    padded(group, 0.21, 0.028, 0.28, x, y + 0.014, z, accents[accent], 0.008);
    box(0.195, 0.018, 0.265, x, y + 0.014, z + 0.005, paper, group);
  }

  function table(group, width, depth, height, surface = oak) {
    const leg = height - 0.075;
    contact(group, width + 0.36, depth + 0.35);
    padded(group, width, 0.075, depth, 0, height - 0.0375, 0, surface);
    for (const x of [-width / 2 + 0.13, width / 2 - 0.13])
      for (const z of [-depth / 2 + 0.12, depth / 2 - 0.12]) {
        box(0.048, leg, 0.048, x, leg / 2, z, frame, group);
      }
  }

  return {
    groupAt,
    sit,
    contact,
    floorMap,
    timberMap,
    reception(x, z) {
      const group = groupAt(x, z);
      padded(group, 3.72, 0.08, 1.18, 0, 0.99, 0, walnut);
      box(3.62, 0.89, 0.16, 0, 0.48, 0.47, oak, group);
      box(3.48, 0.075, 0.022, 0, 0.88, 0.556, accents[0], group);
      for (const x of [-1.74, 1.74]) box(0.11, 0.89, 1.05, x, 0.48, 0, walnut, group);
      box(3.48, 0.08, 0.96, 0, 0.045, 0, frame, group);
      laptop(group, -0.76, 1.03, -0.07);
      notebook(group, 0.92, 1.03, 0.12, 0);
      return group;
    },
    sofa(x, z, rotation, occupied) {
      const group = groupAt(x, z, rotation);
      padded(group, 2.13, 0.34, 0.88, 0, 0.22, 0, fabrics.lounge);
      for (const x of [-0.47, 0.47]) padded(group, 0.89, 0.13, 0.7, x, 0.415, 0.02, fabrics.lounge);
      padded(group, 2.13, 0.64, 0.2, 0, 0.63, -0.34, fabrics.lounge);
      for (const x of [-0.97, 0.97]) padded(group, 0.17, 0.47, 0.85, x, 0.41, 0, fabrics.lounge);
      if (occupied) sit(group, { x: 0.39, z: -0.055, height: 0.48, rotation: 0, pose: 3 });
      contact(group, 2.35, 1.22);
      return group;
    },
    coffeeTable(x, z, rotation = 0) {
      const group = groupAt(x, z, rotation);
      table(group, 1.36, 0.69, 0.43, walnut);
      notebook(group, 0.33, 0.43, 0.08, 0);
      cylinder(0.051, 0.09, -0.26, 0.475, -0.14, paper, group);
    },
    classroom(x, z, variant) {
      const group = groupAt(x, z);
      table(group, 1.59, 0.69, 0.755);
      if (variant % 2 === 0) laptop(group, 0, 0.755, 0.19);
      notebook(group, 0.48, 0.755, 0.12, 2);
      chair(group, 'classroom', 0.72);
      sit(group, { z: 0.79, pose: (variant % 2) + 1, role: variant % 2 === 0 ? 'typist' : 'listener' });
    },
    mentorTable(x, z) {
      const group = groupAt(x, z);
      table(group, 2.13, 0.92, 0.755);
      notebook(group, -0.59, 0.755, 0.14, 3);
      laptop(group, 0, 0.755, 0.25);
      chair(group, 'interview', 0.78);
      sit(group, { z: 0.84, pose: 2, role: 'typist' });
    },
    interview(x, z) {
      const group = groupAt(x, z);
      table(group, 2.7, 1.04, 0.755, walnut);
      for (const x of [-0.63, 0.63]) {
        const seatGroup = groupAt(group.position.x + x, group.position.z + 1.18);
        chair(seatGroup, 'interview');
        sit(seatGroup, { z: 0.045, pose: x < 0 ? 2 : 3 });
        notebook(group, x, 0.755, 0.16, 4);
      }
      const host = groupAt(group.position.x, group.position.z - 1.18, Math.PI);
      chair(host, 'interview');
      sit(host, { z: 0.045, pose: 1, role: 'interviewer' });
    },
    theatreSeat(x, z, occupied, pose) {
      const group = groupAt(x, z);
      chair(group, 'auditorium');
      if (occupied) sit(group, { z: 0.045, pose });
    },
    podium(x, z, elevation = INTERIOR_FLOOR) {
      const group = groupAt(x, z);
      group.position.y = elevation;
      box(0.73, 0.09, 0.51, 0, 0.045, 0, frame, group);
      box(0.62, 0.97, 0.34, 0, 0.55, 0, walnut, group);
      padded(group, 0.75, 0.09, 0.53, 0, 1.05, 0, oak);
      cylinder(0.012, 0.24, -0.23, 1.21, 0.13, frame, group).rotation.z = -0.25;
      padded(group, 0.07, 0.039, 0.052, -0.2, 1.33, 0.13, frame, 0.016);
    },
    cabinet(x, z, accent, rotation = 0) {
      const group = groupAt(x, z, rotation);
      padded(group, 1.74, 0.73, 0.4, 0, 0.43, 0, walnut);
      for (const x of [-0.545, 0, 0.545]) {
        padded(group, 0.51, 0.61, 0.038, x, 0.42, 0.216, oak, 0.015);
        box(0.12, 0.018, 0.026, x, 0.56, 0.248, frame, group);
      }
      for (const x of [-0.72, 0.72])
        for (const z of [-0.12, 0.12]) cylinder(0.021, 0.085, x, 0.043, z, frame, group);
      notebook(group, 0.4, 0.795, 0, accent);
      cylinder(0.09, 0.19, -0.57, 0.886, 0.015, accents[accent], group);
    },
    carpet(x, z, width, depth, theatre = false) {
      const group = groupAt(x, z);
      padded(group, width, 0.014, depth, 0, 0.007, 0, theatre ? runner : rug, 0.006).castShadow =
        false;
    },
    destroy() {
      shadowMap.dispose();
      shadowGeometry.dispose();
      shadowSurface.dispose();
      [floorMap, timberMap, fabricMap].forEach((texture) => texture.dispose());
      partGeometries.forEach((geometry) => geometry.dispose());
      [
        oak,
        walnut,
        frame,
        paper,
        glass,
        screen,
        rug,
        runner,
        ...Object.values(fabrics),
        ...accents
      ].forEach((surface) => surface.dispose());
    }
  };
}
