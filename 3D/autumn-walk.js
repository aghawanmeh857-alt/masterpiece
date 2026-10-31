// Maple Trees by Jagobo (CC BY 4.0). Original download remains unchanged.
export async function createAutumnWalk(THREE, scene, { loader, reducedMotion = false }) {
  const asset = await loader.loadAsync(new URL('./maple-trees.glb', import.meta.url).href);
  asset.scene.updateMatrixWorld(true);
  const group = new THREE.Group();
  group.name = 'OFOQAutumnWalk';
  group.userData.dynamicScene = true;
  const geometries = new Set(), materials = new Set();
  const template = new THREE.Group();
  // The third variation has the broadest crown, suitable for a covered avenue.
  for (const name of ['structure002_6', 'foliage002_7']) {
    // GLTFLoader sanitizes dots in the original Blender node names.
    const source = asset.scene.getObjectByName(name) || asset.scene.getObjectByName(name.replace('002', '.002'));
    if (!source) throw new Error('Missing broad maple tree part: ' + name);
    source.traverse(node => {
      if (!node.isMesh) return;
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      geometries.add(geometry);
      const material = node.material.clone();
      materials.add(material);
      if (/foliage/i.test(material.name)) {
        material.transparent = false;
        material.alphaTest = .42;
        material.depthWrite = true;
        material.side = THREE.DoubleSide;
        material.color.set('#ffffff');
        material.onBeforeCompile = shader => {
          shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
            float autumnLight = dot(diffuseColor.rgb, vec3(.299, .587, .114));
            float autumnVariation = clamp(diffuseColor.g * 2.0 + diffuseColor.r * .35, 0.0, 1.0);
            vec3 autumnColor = mix(vec3(.32,.018,.003), vec3(.85,.13,.008), autumnVariation);
            autumnColor = mix(autumnColor, vec3(.95,.28,.018), smoothstep(.48,.82,autumnLight)*.22);
            diffuseColor.rgb = autumnColor * (.45 + autumnLight * .85);`);
        };
        material.customProgramCacheKey = () => 'ofoq-copper-maple-v1';
      }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.receiveShadow = true;
      template.add(mesh);
    });
  }
  const bounds = new THREE.Box3().setFromObject(template);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 20 / Math.max(size.x, size.z);
  template.children.forEach(mesh => {
    mesh.geometry.translate(-center.x, -bounds.min.y, -center.z);
    mesh.geometry.scale(scale, scale, scale);
  });
  const crownLift = 3.1;
  const bark = [...materials].find(material => /bark/i.test(material.name));
  const trunkGeometry = new THREE.CylinderGeometry(.23, .36, crownLift + .12, 10);
  geometries.add(trunkGeometry);
  for (const side of [-1, 1]) for (const z of [13, 28]) {
    const tree = template.clone(true);
    tree.name = 'CopperMapleCanopy';
    tree.position.set(side * 8.8, .35 + crownLift, z);
    tree.rotation.y = side < 0 ? .12 : Math.PI + .12;
    group.add(tree);
    const trunk = new THREE.Mesh(trunkGeometry, bark);
    trunk.position.set(side * 8.8, .35 + crownLift / 2, z);
    group.add(trunk);
  }

  const shape = new THREE.Shape();
  const outline = [[0,-.6],[-.12,-.2],[-.45,-.25],[-.3,0],[-.65,.15],[-.35,.25],[-.4,.55],[-.12,.4],[0,.8],[.12,.4],[.4,.55],[.35,.25],[.65,.15],[.3,0],[.45,-.25],[.12,-.2]];
  outline.forEach(([x,y], index) => index ? shape.lineTo(x,y) : shape.moveTo(x,y));
  shape.closePath();
  const leafGeometry = new THREE.ShapeGeometry(shape);
  geometries.add(leafGeometry);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .95, side: THREE.DoubleSide });
  materials.add(leafMaterial);
  const palette = ['#d95916', '#e78b22', '#a83513', '#b54b19', '#e3ad38', '#8e3418'];
  let seed = 473;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const dummy = new THREE.Object3D();
  const ground = new THREE.InstancedMesh(leafGeometry, leafMaterial, 1500);
  ground.name = 'AutumnLeavesOnWalkway';
  for (let i = 0; i < ground.count; i++) {
    const edge = random() < .72;
    const x = edge ? (random() < .5 ? -1 : 1) * (2.5 + random() * 2.7) : (random() - .5) * 7;
    dummy.position.set(x, .215 + random() * .012, 5 + random() * 31);
    dummy.rotation.set(-Math.PI / 2, 0, random() * Math.PI * 2);
    dummy.scale.setScalar(.12 + random() * .16);
    dummy.updateMatrix();
    ground.setMatrixAt(i, dummy.matrix);
    ground.setColorAt(i, new THREE.Color(palette[i % palette.length]));
  }
  group.add(ground);
  const falling = new THREE.InstancedMesh(leafGeometry, leafMaterial, 110);
  falling.name = 'FallingMapleLeaves';
  falling.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // All poses remain within this fixed volume; no per-frame bounds computation.
  falling.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, 20), 25);
  const particles = Array.from({ length: falling.count }, (_, i) => {
    falling.setColorAt(i, new THREE.Color(palette[i % palette.length]));
    return { x: (random() - .5) * 10, z: 7 + random() * 27, phase: random() * Math.PI * 2, start: random(), speed: .045 + random() * .04, scale: .13 + random() * .1 };
  });
  group.add(falling);
  scene.add(group);
  let elapsed = 0;
  function update(dt, outside = true) {
    group.visible = outside;
    falling.visible = !reducedMotion;
    if (!outside || reducedMotion) return;
    elapsed += Math.max(0, Math.min(dt, .05));
    particles.forEach((leaf, i) => {
      const progress = (leaf.start + elapsed * leaf.speed) % 1;
      dummy.position.set(leaf.x + Math.sin(elapsed * .8 + leaf.phase) * .8, .25 + (1 - progress) * 9, leaf.z + Math.sin(elapsed * .5 + leaf.phase) * .5);
      dummy.rotation.set(elapsed * 1.4 + leaf.phase, Math.sin(elapsed + leaf.phase) * .8, elapsed * .7 + leaf.phase);
      dummy.scale.setScalar(leaf.scale);
      dummy.updateMatrix();
      falling.setMatrixAt(i, dummy.matrix);
    });
    falling.instanceMatrix.needsUpdate = true;
  }
  update(0);
  document.documentElement.dataset.autumnTrees = '4';
  document.documentElement.dataset.fallingLeaves = String(falling.count);
  document.documentElement.dataset.autumnWalk = 'ready';
  return {
    update,
    destroy() {
      scene.remove(group);
      ground.dispose(); falling.dispose();
      geometries.forEach(geometry => geometry.dispose());
      const textures = new Set();
      materials.forEach(material => { for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); material.dispose(); });
      textures.forEach(texture => texture.dispose());
      asset.scene.traverse(node => { if (node.isMesh) node.geometry.dispose(); });
    }
  };
}
