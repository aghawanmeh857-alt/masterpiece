// Placement only: keep original GLB geometry, textures and proportions intact.
export const HEADQUARTERS_MODEL = 'free-london-skyscraper.glb';

export function placeHeadquartersModel(THREE, model) {
  const holder = new THREE.Group();
  holder.name = 'OFOQLondonHeadquarters';
  holder.userData.dynamicScene = true;
  const orientation = new THREE.Group();
  // Present the broad face to the entrance while keeping the author's proportions.
  orientation.rotation.y = Math.PI / 2;
  orientation.add(model);
  holder.add(orientation);
  holder.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(holder);
  const center = bounds.getCenter(new THREE.Vector3());
  // The source's first office floor starts at Y=7. Its lobby and sidewalk are
  // replaced by our existing entrance, rather than sitting on top of its roof.
  const officeBase = 7;
  const scale = Math.min(55 / (bounds.max.y - officeBase), 18.5 / (bounds.max.x - bounds.min.x));
  const roofPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -4.9);
  model.traverse(node => {
    if (!node.isMesh) return;
    // Omit the detached source pavement and lower lobby altogether.
    const sourceBounds = new THREE.Box3().setFromObject(node);
    if (sourceBounds.max.y < officeBase) node.visible = false;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach(material => {
      // The exterior is a closed model: avoid drawing its transparent back faces twice.
      if (material.transparent) material.forceSinglePass = true;
      if (material.clearcoat > 0) material.clearcoat = 0;
      material.clippingPlanes = [roofPlane];
      material.clipShadows = true;
    });
    if (materials.every(material => material.opacity === 0)) node.visible = false;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  holder.scale.setScalar(scale);
  holder.position.set(-center.x * scale, 4.9 - officeBase * scale, 1.85 - bounds.max.z * scale);
  return holder;
}
