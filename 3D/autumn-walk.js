import { mapleLeafGeometry, createMapleLeafFall, walkwaySurface } from './maple-leaf-fall.js';
import { createTreeBillboards } from './tree-billboards.js';
// Maple Trees by Jagobo (CC BY 4.0). Original download remains unchanged.
export async function createAutumnWalk(THREE, scene, { loader, reducedMotion = false }) {
  const asset = await loader.loadAsync(new URL('./maple-trees.glb', import.meta.url).href);
  asset.scene.updateMatrixWorld(true);
  const group = new THREE.Group();
  group.name = 'OFOQAutumnWalk';
  group.userData.dynamicScene = true;
  const geometries = new Set(),
    materials = new Set();
  const template = new THREE.Group();
  // The third variation has the broadest crown, suitable for a covered avenue.
  for (const name of ['structure002_6', 'foliage002_7']) {
    // GLTFLoader sanitizes dots in the original Blender node names.
    const source =
      asset.scene.getObjectByName(name) || asset.scene.getObjectByName(name.replace('002', '.002'));
    if (!source) throw new Error('Missing broad maple tree part: ' + name);
    source.traverse((node) => {
      if (!node.isMesh) return;
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      geometries.add(geometry);
      const material = node.material.clone();
      materials.add(material);
      if (/foliage/i.test(material.name)) {
        material.transparent = false;
        material.alphaTest = 0.42;
        material.depthWrite = true;
        material.side = THREE.DoubleSide;
        material.color.set('#ffffff');
        material.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `#include <map_fragment>
            float autumnLight = dot(diffuseColor.rgb, vec3(.299, .587, .114));
            float autumnVariation = clamp(diffuseColor.g * 2.0 + diffuseColor.r * .35, 0.0, 1.0);
            vec3 autumnColor = mix(vec3(.32,.018,.003), vec3(.85,.13,.008), autumnVariation);
            autumnColor = mix(autumnColor, vec3(.95,.28,.018), smoothstep(.48,.82,autumnLight)*.22);
            diffuseColor.rgb = autumnColor * (.45 + autumnLight * .85);`
          );
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
  template.children.forEach((mesh) => {
    mesh.geometry.translate(-center.x, -bounds.min.y, -center.z);
    mesh.geometry.scale(scale, scale, scale);
  });
  const canopyTrees = [];
  const crownLift = 3.1;
  // Extend the original, off-centre trunk to the soil beneath its own canopy.
  const trunk = template.children.find(mesh => !/foliage/i.test(mesh.material.name)).geometry;
  const trunkVertices = trunk.attributes.position;
  for (let i = 0; i < trunkVertices.count; i++) {
    const y = trunkVertices.getY(i);
    trunkVertices.setY(i, y - crownLift * (1 - THREE.MathUtils.smoothstep(y, 0, 3.5)));
  }
  trunk.computeVertexNormals();
  trunk.computeBoundingBox();
  trunk.computeBoundingSphere();
  for (const side of [-1, 1])
    for (const z of [13, 28]) {
      const tree = template.clone(true);
      tree.name = 'CopperMapleCanopy';
      tree.position.set(side * 8.8, 0.35 + crownLift, z);
      tree.rotation.y = side < 0 ? 0.12 : Math.PI + 0.12;
      group.add(tree);
      canopyTrees.push(tree);
    }

  const leafGeometry = mapleLeafGeometry(THREE);
  geometries.add(leafGeometry);
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.95,
    side: THREE.DoubleSide
  });
  materials.add(leafMaterial);
  const palette = ['#a94a23', '#bc662a', '#80341f', '#a65b2b', '#cd983e', '#753a26'];
  let seed = 473;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const dummy = new THREE.Object3D();
  const ground = new THREE.InstancedMesh(leafGeometry, leafMaterial, 630);
  ground.name = 'AutumnLeavesOnWalkway';
  const drifts = Array.from({ length: 16 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * (2.7 + random()*3.6),
    z: 7 + random()*24
  }));
  for (let i = 0; i < ground.count; i++) {
    const drift = drifts[i % drifts.length];
    const clustered = random() < .72;
    const x = clustered ? drift.x + (random()+random()-1)*1.5 : (random()-.5)*14;
    const z = clustered ? drift.z + (random()+random()-1)*3.4 : 5+random()*29;
    const scale = .08 + random()*.066;
    dummy.position.set(x, walkwaySurface(x,z) + scale*.1 + random()*.008, z);
    dummy.rotation.set(-Math.PI/2, random()*Math.PI*2, 0, 'YXZ');
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    ground.setMatrixAt(i, dummy.matrix);
    ground.setColorAt(i, new THREE.Color(palette[i % palette.length]));
  }
  const crown = template.children.find(mesh => /foliage/i.test(mesh.material.name));
  const fall = createMapleLeafFall(THREE, canopyTrees, crown.geometry, leafGeometry, leafMaterial, palette, random);
  group.add(ground, fall.mesh);
  let billboards = null;
  try {
    billboards = await createTreeBillboards(THREE, template, canopyTrees, group);
  } catch (error) {
    console.warn(
      'SAEI: keeping full tree geometry because the photographs are unavailable.',
      error
    );
  }
  scene.add(group);
  const walkCenter = new THREE.Vector3(0, 7, 21);
  function update(dt, outside = true, camera, detail = 1) {
    if (outside && camera)
      billboards?.update(
        camera,
        Number(document.documentElement.dataset.dayNightProgress || 0),
        detail
      );
    group.visible = outside;
    fall.mesh.visible = outside && !reducedMotion && !!camera &&
      camera.position.distanceToSquared(walkCenter) < 68 * 68;
    if (fall.mesh.visible) fall.update(Math.max(0, Math.min(dt, .1)));
  }
  update(0);
  document.documentElement.dataset.autumnTrees = '4';
  document.documentElement.dataset.fallingLeaves = String(fall.mesh.count);
  document.documentElement.dataset.autumnWalk = 'ready';
  return {
    update,
    destroy() {
      billboards?.destroy();
      scene.remove(group);
      ground.dispose();
      fall.mesh.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      const textures = new Set();
      materials.forEach((material) => {
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      asset.scene.traverse((node) => {
        if (node.isMesh) node.geometry.dispose();
      });
    }
  };
}
