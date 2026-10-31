// Animated Sketchfab characters already bundled with OFOQ. Vehicles are not
// substituted here: the selected sedan will be supplied by the user separately.
export const STREET_ROUTES = [
  [[22, 19], [22, 2], [22, -18], [20.5, -30], [20.5, -48], [22, -60], [23.5, -48], [23.5, -24], [23.5, 2]],
  [[18, 19], [18, 8], [18, -12], [18, -30], [19.5, -30], [19.5, -12], [19.5, 8], [19.5, 19]],
  [[48, 39], [70, 39], [100, 39], [150, 39], [150, 40.5], [100, 40.5], [70, 40.5], [48, 40.5]],
  [[16, 14], [10, 11], [4, 9], [2.1, 6.5], [-2.1, 6.5], [-6, 9], [-9, 13], [-9, 16], [4, 18], [16, 18]]
];

export function wrappedProgress(distance, length) {
  return ((distance % length) + length) % length / length;
}

export function createStreetLife(THREE, scene, { boss, woman, colleague, clone, reducedMotion = false }) {
  const group = new THREE.Group();
  group.name = 'OFOQStreetLife';
  group.userData.dynamicScene = true;
  scene.add(group);
  const curves = STREET_ROUTES.map(points => new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, .05, z)), true, 'centripetal'));
  const characters = [], ownedMaterials = new Set();
  const palette = ['#24445b', '#514d63', '#5b6b61', '#6b5149', '#344969', '#66717b'];
  const point = new THREE.Vector3(), tangent = new THREE.Vector3();
  const bounds = new THREE.Box3();

  function character(asset, index, moving) {
    const holder = new THREE.Group();
    holder.userData.dynamicScene = true;
    const model = clone(asset.scene);
    const mixer = new THREE.AnimationMixer(model);
    const clip = moving ? asset.animations.find(clip => /\|Walk$/.test(clip.name)) : asset.animations.find(clip => /Idle1$/.test(clip.name)) || asset.animations[0];
    if (clip) { mixer.clipAction(clip).play(); mixer.setTime(index * .31); }
    model.updateMatrixWorld(true);
    bounds.setFromObject(model, true);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = (1.68 + (index % 5) * .045) / Math.max(.01, size.y);
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    const colors = new Map();
    model.traverse(mesh => {
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      const tint = original => {
        if (!colors.has(original)) {
          const material = original.clone();
          // Recolor neutral dark suit pixels while preserving skin and shirts.
          const color = new THREE.Color(palette[index % palette.length]);
          material.onBeforeCompile = shader => {
            shader.uniforms.ofoqSuitColor = { value: color };
            shader.fragmentShader = 'uniform vec3 ofoqSuitColor;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
              float neutrality = 1.0 - smoothstep(0.025, 0.14, abs(diffuseColor.r-diffuseColor.b));
              float suitMask = neutrality * (1.0-smoothstep(0.07,0.38,max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b))));
              diffuseColor.rgb = mix(diffuseColor.rgb, ofoqSuitColor*max(0.35,diffuseColor.r*2.0), suitMask*0.85);`);
          };
          material.customProgramCacheKey = () => 'ofoq-suit-variation-v1';
          colors.set(original, material); ownedMaterials.add(material);
        }
        return colors.get(original);
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(tint) : tint(mesh.material);
    });
    holder.add(model); group.add(holder);
    return { holder, mixer, index, moving, speed: .88 + (index % 5) * .09 };
  }
  // Eighteen walkers: six in the exterior plaza and twelve on sidewalks.
  for (let index = 0; index < 18; index++) {
    const person = character(boss, index, true);
    const routeIndex = index < 6 ? 3 : Math.floor((index - 6) / 4);
    person.route = curves[routeIndex];
    person.routeIndex = routeIndex;
    person.length = person.route.getLength();
    person.distance = person.length * (index < 6 ? index / 6 : (index % 4) / 4);
    characters.push(person);
  }
  // Female model has its original gesture animation; keep these people in
  // small conversation groups instead of making an idle pose slide down a path.
  const gatherings = [[-5, 8], [-6, 7], [9, 8], [10, 7], [17, -4], [18.3, -4.4]];
  gatherings.forEach(([x, z], offset) => {
    const person = character(colleague && offset % 2 ? colleague : woman, 18 + offset, false);
    person.holder.position.set(x, .05, z);
    person.holder.rotation.y = offset % 2 ? -Math.PI / 2 : Math.PI / 2;
    characters.push(person);
  });
  let clock = 0;
  function update(dt, camera, visible = true, peopleVisible = true) {
    group.visible = visible && peopleVisible;
    const step = reducedMotion || !group.visible ? 0 : Math.max(0, Math.min(dt, .05));
    clock += step;
    let animated = 0;
    for (const person of characters) {
      if (person.moving) {
        person.distance += person.speed * step;
        const progress = wrappedProgress(person.distance, person.length);
        person.route.getPointAt(progress, point);
        person.route.getTangentAt(progress, tangent);
        person.holder.position.copy(point);
        person.holder.rotation.y = Math.atan2(tangent.x, tangent.z);
      }
      const distance = person.holder.position.distanceToSquared(camera.position);
      person.holder.visible = distance < 150 * 150;
      if (group.visible && person.holder.visible && distance < 65 * 65 && !reducedMotion) {
        person.mixer.update(step * (person.moving ? person.speed / 1.05 : .65));
        animated++;
      }
    }
    document.documentElement.dataset.streetPeople = String(characters.length);
    document.documentElement.dataset.streetWalkers = '18';
    document.documentElement.dataset.streetVisitors = '0';
    document.documentElement.dataset.plazaWalkers = '6';
    document.documentElement.dataset.streetCharacterModels = colleague ? '3' : '2';
    document.documentElement.dataset.streetAnimated = String(animated);
    document.documentElement.dataset.streetVisiblePeople = String(group.visible ? characters.filter(person => person.holder.visible).length : 0);
    document.documentElement.dataset.streetLifeTime = clock.toFixed(2);
    const sample = characters[0].holder.position;
    document.documentElement.dataset.visitorPosition = `${sample.x.toFixed(2)},${sample.z.toFixed(2)}`;
  }
  update(0, { position: new THREE.Vector3() });
  return {
    group, update,
    entranceProximity() {
      if (!group.visible) return 0;
      let amount = 0;
      for (const person of characters.slice(0, 6)) {
        const distance = Math.hypot(person.holder.position.x, person.holder.position.z - 2.05);
        const progress = Math.max(0, Math.min(1, (7 - distance) / 3.5));
        amount = Math.max(amount, progress * progress * (3 - 2 * progress));
      }
      return amount;
    },
    destroy() {
      characters.forEach(person => person.mixer.stopAllAction());
      ownedMaterials.forEach(material => material.dispose());
      scene.remove(group);
    }
  };
}

// Distant aircraft is original Three.js geometry, not a Sketchfab download.
export function createCityAircraft(THREE, scene, reducedMotion = false) {
  const aircraft = new THREE.Group();
  aircraft.name = 'OFOQCityAircraft';
  aircraft.userData.dynamicScene = true;
  const white = new THREE.MeshStandardMaterial({ color: '#e9eef3', roughness: .35, metalness: .35 });
  const blue = new THREE.MeshStandardMaterial({ color: '#234467', roughness: .4, metalness: .3 });
  const windowMaterial = new THREE.MeshStandardMaterial({ color: '#1c3346', roughness: .18, metalness: .4 });
  function sphere(size, position, material) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), material);
    mesh.scale.set(...size); mesh.position.set(...position); aircraft.add(mesh);
  }
  function wing(points, y, material) {
    const shape = new THREE.Shape();
    points.forEach(([x, z], index) => index ? shape.lineTo(x, z) : shape.moveTo(x, z));
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .12, bevelEnabled: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2; mesh.position.y = y;
    aircraft.add(mesh);
  }
  sphere([.8, .85, 6.4], [0, 0, 0], white);
  sphere([.62, .3, 1.1], [0, .42, 4.9], windowMaterial);
  wing([[-.4, 1.2], [-7.5, -2.8], [-7.5, -3.6], [-.4, -1.5]], -.15, white);
  wing([[.4, 1.2], [7.5, -2.8], [7.5, -3.6], [.4, -1.5]], -.15, white);
  wing([[-.3, -3.8], [-3.1, -5.2], [-3.1, -5.8], [-.3, -5]], .35, blue);
  wing([[.3, -3.8], [3.1, -5.2], [3.1, -5.8], [.3, -5]], .35, blue);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(.14, 2.6, 2), blue);
  tail.position.set(0, 1.4, -4.7); aircraft.add(tail);
  for (const side of [-1, 1]) {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(.42, .48, 1.9, 16), white);
    engine.rotation.x = Math.PI / 2; engine.position.set(side * 2.4, -.65, -.5); aircraft.add(engine);
    for (let z = -3.2; z < 4; z += .65) sphere([.055, .13, .18], [side * .76, .25, z], windowMaterial);
  }
  scene.add(aircraft);
  let phase = .1;
  return {
    async loadModel(loader) {
      const asset = await loader.loadAsync(new URL('../3D/airplane.glb', import.meta.url).href);
      const model = asset.scene;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      const scale = 17 / Math.max(size.x, size.z);
      model.scale.setScalar(scale); model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      aircraft.traverse(node => node.geometry?.dispose());
      aircraft.clear(); aircraft.add(model);
      document.documentElement.dataset.aircraftSource = 'sketchfab-gompirulo';
    },
    update(dt, outside = true, enabled = true) {
      if (!reducedMotion) phase = (phase + Math.min(dt, .05) / 75) % 1;
      const angle = phase * Math.PI * 2;
      aircraft.visible = outside && enabled;
      aircraft.position.set(45 + Math.cos(angle) * 160, 73 + Math.sin(angle * 2) * 3, -65 + Math.sin(angle) * 155);
      aircraft.rotation.set(0, Math.atan2(-Math.sin(angle), Math.cos(angle)), -.08);
      document.documentElement.dataset.aircraftFlying = String(aircraft.visible && !reducedMotion);
      document.documentElement.dataset.aircraftPhase = phase.toFixed(5);
    },
    destroy() {
      aircraft.traverse(node => node.geometry?.dispose());
      [white, blue, windowMaterial].forEach(material => material.dispose());
      scene.remove(aircraft);
    }
  };
}
