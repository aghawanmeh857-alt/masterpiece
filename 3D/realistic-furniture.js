// Downloaded Sketchfab furniture; source links and CC BY credits are in README.
export const FURNITURE_FILES = ['office-desk.glb', 'office-chair.glb', 'lobby-sofa.glb'];

// Split one workstation from the four-seat source desk without stretching its
// wood grain, changing its materials or altering the original GLB on disk.
function singleWorkstation(THREE, geometry) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const attributes = Object.fromEntries(Object.entries(source.attributes).filter(([key]) => ['position', 'normal', 'uv', 'uv1', 'color'].includes(key)));
  const output = Object.fromEntries(Object.keys(attributes).map(key => [key, []]));
  const vertex = index => Object.fromEntries(Object.entries(attributes).map(([key, attr]) => [key, Array.from({ length: attr.itemSize }, (_, c) => attr.array[index * attr.itemSize + c])]));
  const interpolate = (a, b, t) => Object.fromEntries(Object.keys(attributes).map(key => [key, a[key].map((value, c) => value + (b[key][c] - value) * t)]));
  function clip(polygon, axis, sign) {
    const result = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      const da = a.position[axis] * sign, db = b.position[axis] * sign;
      if (da >= 0) result.push(a);
      if ((da >= 0) !== (db >= 0)) result.push(interpolate(a, b, da / (da - db)));
    }
    return result;
  }
  for (let i = 0; i < attributes.position.count; i += 3) {
    let polygon = [vertex(i), vertex(i + 1), vertex(i + 2)];
    polygon = clip(polygon, 0, -1); // Left half of the shared desk.
    polygon = clip(polygon, 2, 1);  // Front-facing workstation.
    for (let n = 1; n < polygon.length - 1; n++) for (const point of [polygon[0], polygon[n], polygon[n + 1]]) {
      for (const key of Object.keys(attributes)) output[key].push(...point[key]);
    }
  }
  source.dispose();
  const result = new THREE.BufferGeometry();
  for (const [key, values] of Object.entries(output)) result.setAttribute(key, new THREE.Float32BufferAttribute(values, attributes[key].itemSize));
  result.normalizeNormals();
  return result;
}

export async function loadRealisticFurniture(THREE, loader) {
  const assets = await Promise.all(FURNITURE_FILES.map(file => loader.loadAsync(new URL('./' + file, import.meta.url).href)));
  const geometries = new Set(), materials = new Set(), textures = new Set();
  for (const asset of assets) asset.scene.traverse(node => {
    if (!node.isMesh) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      material.envMapIntensity = .85;
      for (const value of Object.values(material)) if (value?.isTexture) {
        value.anisotropy = 8;
        textures.add(value);
      }
    }
  });
  function template(asset, type) {
    const model = new THREE.Group();
    asset.scene.updateMatrixWorld(true);
    asset.scene.traverse(node => {
      if (!node.isMesh) return;
      let geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      if (type === 'desk') {
        const cropped = singleWorkstation(THREE, geometry);
        geometry.dispose(); geometry = cropped;
      }
      geometries.add(geometry);
      const mesh = new THREE.Mesh(geometry, node.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      model.add(mesh);
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    // The source desk's worktop is at Y=0, its feet at Y=-118.007.
    const scale = type === 'desk' ? .78 / -bounds.min.y : type === 'chair' ? 1.15 / size.y : Math.min(2.2 / size.x, 1.05 / size.y);
    model.children.forEach(mesh => {
      mesh.geometry.translate(-center.x, -bounds.min.y, -center.z);
      mesh.geometry.scale(scale, scale, scale);
    });
    model.name = 'Realistic-' + type;
    return model;
  }
  const desk = template(assets[0], 'desk');
  const chair = template(assets[1], 'chair');
  chair.rotation.y = Math.PI;
  chair.position.z = .88;
  const sofa = template(assets[2], 'sofa');
  return {
    desk, chair, sofa,
    destroy() {
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      textures.forEach(texture => texture.dispose());
    }
  };
}
