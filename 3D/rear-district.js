// Reuse the New York model's own tower, geometry and textures behind OFOQ.
export const REAR_DISTRICT_LAYOUT = [
  { x: -14, z: -109, height: 29, rotation: 0 },
  { x: 8, z: -113, height: 35, rotation: Math.PI / 2 },
  { x: -15, z: -145, height: 42, rotation: Math.PI / 2 },
  { x: 10, z: -149, height: 31, rotation: 0 },
  { x: -12, z: -181, height: 34, rotation: 0 },
  { x: 10, z: -185, height: 45, rotation: Math.PI / 2 }
];

export function addRearDistrict(THREE, city, sourceScene) {
  sourceScene.updateWorldMatrix(true, true);
  let tower = null, tallest = 0;
  // Select a complete vertical building, excluding terrain and highway meshes.
  sourceScene.traverse(node => {
    if (!node.isMesh) return;
    const bounds = new THREE.Box3().setFromObject(node);
    const size = bounds.getSize(new THREE.Vector3());
    if (size.y > tallest && size.y / Math.max(size.x, size.z) > 1.4) {
      tallest = size.y;
      tower = node;
    }
  });
  if (!tower) throw new Error('New York model has no standalone tower for the rear district.');
  const geometry = tower.geometry.clone().applyMatrix4(tower.matrixWorld);
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  const center = bounds.getCenter(new THREE.Vector3());
  const height = bounds.max.y - bounds.min.y;
  geometry.translate(-center.x, -bounds.min.y, -center.z);
  geometry.scale(1 / height, 1 / height, 1 / height);
  const district = new THREE.Group();
  district.name = 'OFOQRearDistrict';
  for (const [index, placement] of REAR_DISTRICT_LAYOUT.entries()) {
    const building = new THREE.Mesh(geometry, tower.material);
    building.name = `RearCityBuilding-${index + 1}`;
    building.scale.setScalar(placement.height);
    building.position.set(placement.x, .03, placement.z);
    building.rotation.y = placement.rotation;
    building.receiveShadow = true;
    district.add(building);
  }
  city.add(district);
  return { geometry, count: district.children.length };
}
