// World-space banks give the near wisps and the distant deck different parallax.
// The two small textures contain baked density and sunlight, including alpha at the edges.
const banks = [
  // x, altitude, z, width, height, texture, opacity
  [-55, 121, 149, 107, 28, 1, .88],
  [100, 116, 134, 100, 30, 0, .81],
  [-3, 98, 78, 66, 29, 0, .98],
  [46, 90, 82, 57, 25, 1, .96],
  [9, 83, 58, 40, 14, 1, .71],
  [-18, 77, 41, 58, 21, 0, .91],
  [42, 74, 50, 60, 25, 0, .95],
  [-7, 55, 56, 49, 18, 1, .93],
  [30, 50, 49, 51, 15, 0, .84],
  [-47, 54, 1, 78, 18, 0, .76],
  [61, 48, -10, 72, 21, 1, .74],
  [-66, 69, -62, 100, 23, 1, .70],
  [21, 68, -77, 94, 19, 0, .58]
];

export function createDescentClouds(THREE, scene) {
  const group = new THREE.Group();
  group.name = 'DescentClouds';
  const loader = new THREE.TextureLoader();
  const textures = ['cloud-bank.webp', 'cloud-tower.webp'].map(name => {
    const texture = loader.load(new URL('./assets/sky/' + name, import.meta.url).href, () => {
      for (const sprite of group.children) {
        if (sprite.material.map === texture) sprite.material.visible = true;
      }
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });
  for (const [x, y, z, width, height, variant, opacity] of banks) {
    const material = new THREE.SpriteMaterial({
      map: textures[variant], opacity, transparent: true, depthWrite: false, toneMapped: false
    });
    material.visible = false;
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(width, height, 1);
    sprite.userData.opacity = opacity;
    group.add(sprite);
  }
  scene.add(group);
  const direction = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const daylight = new THREE.Color('#ffffff');
  const moonlight = new THREE.Color('#445576');
  return {
    setNight(amount) {
      for (const bank of group.children) bank.material.color.copy(daylight).lerp(moonlight, amount);
    },
    update(camera) {
      group.visible = camera.position.z > 5;
      if (!group.visible) return;
      camera.getWorldDirection(direction);
      for (const bank of group.children) {
        const depth = offset.subVectors(bank.position, camera.position).dot(direction);
        // Dissolve a passing edge before its billboard crosses the near plane.
        const fade = THREE.MathUtils.smoothstep(depth, 4, 20);
        bank.material.opacity = bank.userData.opacity * fade;
        bank.visible = fade > 0;
      }
    },
    destroy() {
      group.removeFromParent();
      for (const bank of group.children) bank.material.dispose();
      group.clear();
      textures.forEach(texture => texture.dispose());
    }
  };
}
