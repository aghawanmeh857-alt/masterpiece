import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const INTERIOR_FLOOR = .04;

// These cushions share the same seat anchors as their occupants. The chair
// convention is local +Z towards the backrest and -Z towards the person's knees.
export function createTourInterior(THREE, scene, { box, cylinder, people, props }) {
  const material = (color, roughness = .72, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const oak = material('#ac8060', .47);
  const walnut = material('#674839', .53);
  const frame = material('#27303a', .38, .48);
  const paper = material('#f1ebdf');
  const glass = material('#436278', .28, .32);
  const screen = material('#344c61', .36);
  const rug = material('#78898d', .96);
  const runner = material('#5d3e44', .98);
  const fabrics = {
    lounge: material('#9b8e7b', .94),
    classroom: material('#4b7270', .88),
    interview: material('#365b75', .9),
    auditorium: material('#963c43', .87)
  };
  const accents = ['#ad7856', '#376575', '#458377', '#a46545', '#405c80', '#8c4349'].map(color => material(color));
  const partGeometries = new Map();
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const context = shadowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 5, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(22,27,34,.27)');
  gradient.addColorStop(.55, 'rgba(22,27,34,.16)');
  gradient.addColorStop(1, 'rgba(22,27,34,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const shadowMap = new THREE.CanvasTexture(shadowCanvas);
  shadowMap.colorSpace = THREE.SRGBColorSpace;
  const shadowSurface = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });
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

  function padded(group, width, height, depth, x, y, z, surface, radius = .035) {
    const key = [width, height, depth, radius].join(',');
    if (!partGeometries.has(key)) partGeometries.set(key, new RoundedBoxGeometry(width, height, depth, 2, radius));
    const mesh = new THREE.Mesh(partGeometries.get(key), surface);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }

  function contact(group, width, depth, z = 0) {
    const shadow = new THREE.Mesh(shadowGeometry, shadowSurface);
    shadow.position.set(0, .018, z);
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(width, depth, 1);
    group.add(shadow);
  }

  function sit(group, { x = 0, z = 0, height = .46, rotation = Math.PI, pose = 1 } = {}) {
    group.updateMatrixWorld(true);
    const at = group.localToWorld(new THREE.Vector3(x, height, z));
    return people(at.x, at.z, {
      rotation: group.rotation.y + rotation,
      seat: { height: at.y, pose }
    });
  }

  function chair(group, type, z = 0) {
    const auditorium = type === 'auditorium';
    const width = auditorium ? .66 : .53;
    const fabric = fabrics[type] || fabrics.interview;
    contact(group, width + .34, .92, z);
    padded(group, width, .12, .55, 0, .40, z, fabric);
    const back = padded(group, width, auditorium ? .64 : .49, .105, 0, auditorium ? .72 : .70, z + .25, fabric);
    back.rotation.x = .13;
    if (auditorium) {
      for (const x of [-.35, .35]) {
        box(.046, .61, .44, x, .305, z + .05, frame, group);
        padded(group, .095, .071, .5, x, .61, z, walnut);
      }
    } else {
      for (const x of [-.21, .21]) for (const dz of [-.19, .21]) {
        cylinder(.022, .35, x, .175, z + dz, frame, group);
      }
    }
  }

  function laptop(group, x, y, z) {
    padded(group, .34, .024, .24, x, y + .012, z, frame, .008);
    box(.29, .01, .15, x, y + .026, z - .01, glass, group);
    const lid = padded(group, .34, .225, .018, x, y + .12, z - .12, frame, .008);
    lid.rotation.x = -.17;
    const display = box(.30, .185, .008, x, y + .122, z - .107, screen, group);
    display.rotation.x = -.17;
  }

  function notebook(group, x, y, z, accent) {
    padded(group, .21, .028, .28, x, y + .014, z, accents[accent], .008);
    box(.195, .018, .265, x, y + .014, z + .005, paper, group);
  }

  function table(group, width, depth, height, surface = oak) {
    const leg = height - .075;
    contact(group, width + .36, depth + .35);
    padded(group, width, .075, depth, 0, height - .0375, 0, surface);
    for (const x of [-width / 2 + .13, width / 2 - .13]) for (const z of [-depth / 2 + .12, depth / 2 - .12]) {
      box(.048, leg, .048, x, leg / 2, z, frame, group);
    }
  }

  return {
    groupAt, sit, contact,
    reception(x, z) {
      const group = groupAt(x, z);
      padded(group, 3.72, .08, 1.18, 0, .99, 0, walnut);
      box(3.62, .89, .16, 0, .48, .47, oak, group);
      box(3.48, .075, .022, 0, .88, .556, accents[0], group);
      for (const x of [-1.74, 1.74]) box(.11, .89, 1.05, x, .48, 0, walnut, group);
      box(3.48, .08, .96, 0, .045, 0, frame, group);
      laptop(group, -.76, 1.03, -.07);
      notebook(group, .92, 1.03, .12, 0);
    },
    sofa(x, z, rotation, occupied) {
      const group = groupAt(x, z, rotation);
      padded(group, 2.13, .34, .88, 0, .22, 0, fabrics.lounge);
      for (const x of [-.47, .47]) padded(group, .89, .13, .7, x, .415, .02, fabrics.lounge);
      padded(group, 2.13, .64, .2, 0, .63, -.34, fabrics.lounge);
      for (const x of [-.97, .97]) padded(group, .17, .47, .85, x, .41, 0, fabrics.lounge);
      if (occupied) sit(group, { x: .39, z: -.055, height: .48, rotation: 0, pose: 3 });
      contact(group, 2.35, 1.22);
      return group;
    },
    coffeeTable(x, z, rotation = 0) {
      const group = groupAt(x, z, rotation);
      table(group, 1.36, .69, .43, walnut);
      notebook(group, .33, .43, .08, 0);
      cylinder(.051, .09, -.26, .475, -.14, paper, group);
    },
    classroom(x, z, variant) {
      const group = groupAt(x, z);
      table(group, 1.59, .69, .755);
      if (variant % 2 === 0) laptop(group, -.18, .755, -.05);
      notebook(group, .48, .755, .12, 2);
      chair(group, 'classroom', .93);
      sit(group, { z: 1, pose: variant % 2 + 1 });
    },
    mentorTable(x, z) {
      const group = groupAt(x, z);
      table(group, 2.13, .92, .755);
      notebook(group, -.59, .755, .14, 3);
      laptop(group, .43, .755, -.12);
      chair(group, 'interview', 1.03);
      sit(group, { z: 1.09, pose: 2 });
    },
    interview(x, z) {
      const group = groupAt(x, z);
      table(group, 2.7, 1.04, .755, walnut);
      for (const x of [-.63, .63]) {
        const seatGroup = groupAt(group.position.x + x, group.position.z + 1.18);
        chair(seatGroup, 'interview');
        sit(seatGroup, { z: .045, pose: x < 0 ? 2 : 3 });
        notebook(group, x, .755, .16, 4);
      }
      const host = groupAt(group.position.x, group.position.z - 1.18, Math.PI);
      chair(host, 'interview');
      sit(host, { z: .045, pose: 1 });
    },
    theatreSeat(x, z, occupied, pose) {
      const group = groupAt(x, z);
      chair(group, 'auditorium');
      if (occupied) sit(group, { z: .045, pose });
    },
    podium(x, z, elevation = INTERIOR_FLOOR) {
      const group = groupAt(x, z);
      group.position.y = elevation;
      box(.73, .09, .51, 0, .045, 0, frame, group);
      box(.62, .97, .34, 0, .55, 0, walnut, group);
      padded(group, .75, .09, .53, 0, 1.05, 0, oak);
      cylinder(.012, .24, -.23, 1.21, .13, frame, group).rotation.z = -.25;
      padded(group, .07, .039, .052, -.20, 1.33, .13, frame, .016);
    },
    cabinet(x, z, accent, rotation = 0) {
      const group = groupAt(x, z, rotation);
      padded(group, 1.74, .73, .4, 0, .43, 0, walnut);
      for (const x of [-.545, 0, .545]) {
        padded(group, .51, .61, .038, x, .42, .216, oak, .015);
        box(.12, .018, .026, x, .56, .248, frame, group);
      }
      for (const x of [-.72, .72]) for (const z of [-.12, .12]) cylinder(.021, .085, x, .043, z, frame, group);
      notebook(group, .4, .795, 0, accent);
      cylinder(.09, .19, -.57, .886, .015, accents[accent], group);
    },
    acousticPanels(x, z, accent, rotation = 0) {
      const group = groupAt(x, z, rotation);
      for (const x of [-1.41, -.47, .47, 1.41]) padded(group, .77, 1.36, .075, x, 2.08, 0, accents[accent], .025);
    },
    carpet(x, z, width, depth, theatre = false) {
      const group = groupAt(x, z);
      padded(group, width, .014, depth, 0, .007, 0, theatre ? runner : rug, .006).castShadow = false;
    },
    destroy() {
      shadowMap.dispose();
      shadowGeometry.dispose();
      shadowSurface.dispose();
      partGeometries.forEach(geometry => geometry.dispose());
      [oak, walnut, frame, paper, glass, screen, rug, runner, ...Object.values(fabrics), ...accents]
        .forEach(surface => surface.dispose());
    }
  };
}
