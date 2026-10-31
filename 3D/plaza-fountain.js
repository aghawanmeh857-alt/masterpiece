// Fountain by yorre.detavernier, CC BY 4.0. Keep the downloaded GLB unchanged.
export function registerFountainCompatibility(loader) {
  // Mark the extension as handled; its material data is restored after parsing.
  return loader.register(() => ({ name: 'KHR_materials_pbrSpecularGlossiness' }));
}

export async function restoreFountainMaterials(THREE, asset) {
  // This older GLB stores its textures in the retired specular/glossiness
  // extension. Restore its diffuse maps for the current Three.js loader.
  const definitions = new Map(asset.parser.json.materials.map(item => [item.name, item]));
  const materials = new Set();
  asset.scene.traverse(node => {
    if (node.isMesh) (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material));
  });
  await Promise.all([...materials].map(async material => {
    const definition = definitions.get(material.name);
    const legacy = definition?.extensions?.KHR_materials_pbrSpecularGlossiness;
    if (!legacy) return;
    if (legacy.diffuseTexture) {
      material.map = await asset.parser.getDependency('texture', legacy.diffuseTexture.index);
      material.map.colorSpace = THREE.SRGBColorSpace;
    }
    material.color.fromArray(legacy.diffuseFactor || [1, 1, 1]);
    material.metalness = 0;
    material.roughness = 1 - (legacy.glossinessFactor || 0);
    material.needsUpdate = true;
  }));
  return materials;
}

export async function createPlazaFountain(THREE, scene, { loader, reducedMotion = false }) {
  const asset = await registerFountainCompatibility(loader).loadAsync(new URL('./italian-fountain.glb', import.meta.url).href);
  const materials = await restoreFountainMaterials(THREE, asset);
  asset.scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(asset.scene);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 6.4 / Math.max(size.x, size.z);
  const group = new THREE.Group();
  group.name = 'OFOQItalianFountain';
  group.userData.dynamicScene = true;
  asset.scene.scale.multiplyScalar(scale);
  asset.scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  group.add(asset.scene);
  // Place it inside the seaward lawn, behind the benches and off the walkway.
  group.position.set(-14.5, .38, 18.5);
  const pavingMaterial = new THREE.MeshStandardMaterial({ color: '#93978e', roughness: .92 });
  const pavingGeometry = new THREE.CylinderGeometry(3.75, 3.75, .12, 40);
  const paving = new THREE.Mesh(pavingGeometry, pavingMaterial);
  paving.position.y = -.07;
  paving.receiveShadow = true;
  group.add(paving);
  const movingMaps = new Set();
  materials.forEach(material => {
    if (/Material_(2|3)$/.test(material.name)) material.color.set('#bba889');
    if (!/Material_(23|49|50)$/.test(material.name)) return;
    material.roughness = .24;
    material.envMapIntensity = 1.3;
    if (material.map) {
      material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
      movingMaps.add(material.map);
    }
  });
  asset.scene.traverse(node => {
    if (!node.isMesh) return;
    node.receiveShadow = true;
    node.castShadow = !node.material.transparent;
  });
  scene.add(group);
  document.documentElement.dataset.plazaFountain = 'ready';
  document.documentElement.dataset.fountainModel = 'sketchfab-yorre-detavernier';
  let elapsed = 0;
  return {
    update(dt, outside = true) {
      group.visible = outside;
      if (!outside || reducedMotion) return;
      elapsed += Math.max(0, Math.min(dt, .05));
      movingMaps.forEach(map => { map.offset.y = -(elapsed * .14) % 1; });
    },
    destroy() {
      scene.remove(group);
      pavingGeometry.dispose();
      pavingMaterial.dispose();
      const geometries = new Set(), textures = new Set();
      asset.scene.traverse(node => { if (node.isMesh) geometries.add(node.geometry); });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => {
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        material.dispose();
      });
      textures.forEach(texture => texture.dispose());
    }
  };
}
