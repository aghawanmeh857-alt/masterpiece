// Animated Sketchfab characters already bundled with SAEI. Vehicles are not
// substituted here: the selected sedan will be supplied by the user separately.
export const STREET_ROUTES = [
  [
    [22, 19],
    [22, 2],
    [22, -18],
    [20.5, -30],
    [20.5, -48],
    [22, -60],
    [23.5, -48],
    [23.5, -24],
    [23.5, 2]
  ],
  [
    [18, 19],
    [18, 8],
    [18, -12],
    [18, -30],
    [19.5, -30],
    [19.5, -12],
    [19.5, 8],
    [19.5, 19]
  ],
  [
    [48, 39],
    [70, 39],
    [100, 39],
    [150, 39],
    [150, 40.5],
    [100, 40.5],
    [70, 40.5],
    [48, 40.5]
  ],
  [
    [16, 14],
    [10, 11],
    [4, 9],
    [2.1, 6.5],
    [-2.1, 6.5],
    [-6, 9],
    [-9, 13],
    [-9, 16],
    [4, 18],
    [16, 18]
  ]
];

export function wrappedProgress(distance, length) {
  return (((distance % length) + length) % length) / length;
}

export function createStreetLife(
  THREE,
  scene,
  { boss, woman, colleague, clone, reducedMotion = false }
) {
  const group = new THREE.Group();
  group.name = 'OFOQStreetLife';
  group.userData.dynamicScene = true;
  scene.add(group);
  const curves = STREET_ROUTES.map(
    (points) =>
      new THREE.CatmullRomCurve3(
        points.map(([x, z]) => new THREE.Vector3(x, 0.05, z)),
        true,
        'centripetal'
      )
  );
  const characters = [],
    ownedMaterials = new Set();
  const palette = ['#24445b', '#514d63', '#5b6b61', '#6b5149', '#344969', '#66717b'];
  const point = new THREE.Vector3(),
    tangent = new THREE.Vector3();
  const assetBounds = new Map();
  const distantCanvas = document.createElement('canvas');
  distantCanvas.width = 32;
  distantCanvas.height = 64;
  const ctx = distantCanvas.getContext('2d');
  ctx.fillStyle = '#263341';
  ctx.fillRect(11, 34, 5, 25);
  ctx.fillRect(17, 34, 5, 25);
  ctx.beginPath();
  ctx.roundRect(7, 17, 18, 24, 4);
  ctx.fill();
  ctx.fillStyle = '#bc9b84';
  ctx.beginPath();
  ctx.ellipse(16, 11, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const distantMap = new THREE.CanvasTexture(distantCanvas);
  distantMap.colorSpace = THREE.SRGBColorSpace;
  const distantMaterial = new THREE.SpriteMaterial({ map: distantMap, alphaTest: 0.25 });

  function character(asset, index, moving) {
    const holder = new THREE.Group();
    holder.userData.dynamicScene = true;
    const model = clone(asset.scene);
    const mixer = new THREE.AnimationMixer(model);
    const clip = moving
      ? asset.animations.find((clip) => /\|Walk$/.test(clip.name))
      : asset.animations.find((clip) => /Idle1$/.test(clip.name)) || asset.animations[0];
    if (clip) {
      mixer.clipAction(clip).play();
      mixer.setTime(0);
    }
    // Clones share their source mesh. Size each asset once in its starting pose.
    if (!assetBounds.has(asset)) {
      model.updateMatrixWorld(true);
      assetBounds.set(asset, new THREE.Box3().setFromObject(model, true));
    }
    const bounds = assetBounds.get(asset);
    if (clip) mixer.setTime(index * 0.31);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = (1.68 + (index % 5) * 0.045) / Math.max(0.01, size.y);
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    const colors = new Map();
    model.traverse((mesh) => {
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      const tint = (original) => {
        if (!colors.has(original)) {
          const material = original.clone();
          // Recolor neutral dark suit pixels while preserving skin and shirts.
          const color = new THREE.Color(palette[index % palette.length]);
          material.onBeforeCompile = (shader) => {
            shader.uniforms.ofoqSuitColor = { value: color };
            shader.fragmentShader = 'uniform vec3 ofoqSuitColor;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              `#include <map_fragment>
              float neutrality = 1.0 - smoothstep(0.025, 0.14, abs(diffuseColor.r-diffuseColor.b));
              float suitMask = neutrality * (1.0-smoothstep(0.07,0.38,max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b))));
              diffuseColor.rgb = mix(diffuseColor.rgb, ofoqSuitColor*max(0.35,diffuseColor.r*2.0), suitMask*0.85);`
            );
          };
          material.customProgramCacheKey = () => 'ofoq-suit-variation-v1';
          colors.set(original, material);
          ownedMaterials.add(material);
        }
        return colors.get(original);
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(tint) : tint(mesh.material);
    });
    holder.add(model);
    const image = new THREE.Sprite(distantMaterial);
    image.position.y = 0.9;
    image.scale.set(0.74, 1.9, 1);
    holder.add(image);
    group.add(holder);
    return { holder, model, image, mixer, index, moving, speed: 0.88 + (index % 5) * 0.09 };
  }
  const plazaWalkerCount = 1;
  const walkersPerSidewalk = 2;
  const sidewalkWalkerCount = (curves.length - 1) * walkersPerSidewalk;
  const walkerCount = plazaWalkerCount + sidewalkWalkerCount;
  for (let index = 0; index < walkerCount; index++) {
    const person = character(boss, index, true);
    const plaza = index < plazaWalkerCount;
    const sidewalkIndex = index - plazaWalkerCount;
    const routeIndex = plaza ? curves.length - 1 : Math.floor(sidewalkIndex / walkersPerSidewalk);
    person.route = curves[routeIndex];
    person.routeIndex = routeIndex;
    person.length = person.route.getLength();
    person.distance =
      person.length *
      (plaza ? 0.25 : ((sidewalkIndex % walkersPerSidewalk) + 0.5) / walkersPerSidewalk);
    characters.push(person);
  }
  // Female model has its original gesture animation; keep these people in
  // small conversation groups instead of making an idle pose slide down a path.
  const gatherings = [
    [17, -4],
    [18.3, -4.4]
  ];
  gatherings.forEach(([x, z], offset) => {
    const person = character(
      colleague && offset % 2 ? colleague : woman,
      walkerCount + offset,
      false
    );
    person.holder.position.set(x, 0.05, z);
    person.holder.rotation.y = offset % 2 ? -Math.PI / 2 : Math.PI / 2;
    characters.push(person);
  });
  let clock = 0;
  function update(dt, camera, visible = true, peopleVisible = true) {
    group.visible = visible && peopleVisible;
    if (!group.visible) return;
    const step = reducedMotion || !group.visible ? 0 : Math.max(0, Math.min(dt, 0.05));
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
      const detailDistance = person.image.visible ? 26 : 31;
      person.model.visible = distance < detailDistance * detailDistance;
      person.image.visible = !person.model.visible;
      if (person.model.visible && !reducedMotion) {
        person.mixer.update(step * (person.moving ? person.speed / 1.05 : 0.65));
        animated++;
      }
    }
    document.documentElement.dataset.streetPeople = String(characters.length);
    document.documentElement.dataset.streetWalkers = String(walkerCount);
    document.documentElement.dataset.streetVisitors = '0';
    document.documentElement.dataset.plazaWalkers = String(plazaWalkerCount);
    document.documentElement.dataset.streetCharacterModels = colleague ? '3' : '2';
    document.documentElement.dataset.streetAnimated = String(animated);
    document.documentElement.dataset.streetVisiblePeople = String(
      group.visible ? characters.filter((person) => person.holder.visible).length : 0
    );
    document.documentElement.dataset.streetLifeTime = clock.toFixed(2);
    const sample = characters[0].holder.position;
    document.documentElement.dataset.visitorPosition = `${sample.x.toFixed(2)},${sample.z.toFixed(2)}`;
  }
  update(0, { position: new THREE.Vector3() });
  return {
    group,
    update,
    entranceProximity() {
      if (!group.visible) return 0;
      let amount = 0;
      for (const person of characters.slice(0, plazaWalkerCount)) {
        const distance = Math.hypot(person.holder.position.x, person.holder.position.z - 2.05);
        const progress = Math.max(0, Math.min(1, (7 - distance) / 3.5));
        amount = Math.max(amount, progress * progress * (3 - 2 * progress));
      }
      return amount;
    },
    destroy() {
      characters.forEach((person) => person.mixer.stopAllAction());
      ownedMaterials.forEach((material) => material.dispose());
      distantMaterial.dispose();
      distantMap.dispose();
      scene.remove(group);
    }
  };
}

// Distant aircraft is original Three.js geometry, not a Sketchfab download.
