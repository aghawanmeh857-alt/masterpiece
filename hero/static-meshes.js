// Merge only opaque, non-animated pieces. Materials and world placement stay intact.
export function mergeStaticMeshes(THREE, root, mergeGeometries, excluded = new Set(), {cellSize = 0, disposeUnused = false} = {}) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const groups = new Map();
  root.traverse(mesh => {
    if (!mesh.visible || !mesh.isMesh || mesh.isSkinnedMesh || mesh.isInstancedMesh || Array.isArray(mesh.material)
      || mesh.material.transparent || Object.keys(mesh.geometry.morphAttributes).length) return;
    for (let parent = mesh; parent && parent !== root; parent = parent.parent) {
      if (!parent.visible || excluded.has(parent) || parent.userData.mixer || parent.userData.dynamicDoor
        || parent.userData.dynamicScene || parent.userData.autumnReplacement) return;
    }
    const attributes = Object.entries(mesh.geometry.attributes)
      .map(([name, value]) => `${name}:${value.itemSize}:${value.array.constructor.name}`).sort().join(',');
    const center = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);
    const cell = cellSize ? `${Math.floor(center.x / cellSize)}:${Math.floor(center.z / cellSize)}` : '';
    const key = `${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}:${attributes}:${cell}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(mesh);
  });
  const owned = [];
  const retired = new Set();
  let savedMeshes = 0;
  for (const meshes of groups.values()) {
    if (meshes.length < 2) continue;
    const pieces = meshes.map(mesh => {
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      return geometry.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
    });
    const geometry = mergeGeometries(pieces, false);
    pieces.forEach(piece => piece.dispose());
    if (!geometry) continue;
    geometry.computeBoundingSphere();
    const combined = new THREE.Mesh(geometry, meshes[0].material);
    combined.castShadow = meshes[0].castShadow;
    combined.receiveShadow = meshes[0].receiveShadow;
    combined.name = 'MergedStaticPieces';
    meshes.forEach(mesh => { retired.add(mesh.geometry); mesh.removeFromParent(); });
    root.add(combined);
    owned.push(geometry);
    savedMeshes += meshes.length - 1;
  }
  if (disposeUnused) {
    const live = new Set();
    root.traverse(node => { if (node.geometry) live.add(node.geometry); });
    retired.forEach(geometry => { if (!live.has(geometry)) geometry.dispose(); });
  }
  return {geometries: owned, savedMeshes};
}
