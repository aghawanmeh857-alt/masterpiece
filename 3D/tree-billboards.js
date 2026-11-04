// Eight photographs of the original model; close trees keep their real geometry.
export function canopyDetailVisible(distanceSquared, wasBillboard) {
  const threshold = wasBillboard ? 24 : 30;
  return distanceSquared < threshold * threshold;
}

export function canopyTile(angle, treeRotation) {
  return ((Math.round((angle - treeRotation) / (Math.PI / 4)) % 8) + 8) % 8;
}

export async function createTreeBillboards(THREE, template, trees, parent) {
  const texture = await new THREE.TextureLoader().loadAsync(new URL('./maple-canopy-atlas.webp', import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  const bounds = new THREE.Box3().setFromObject(template);
  const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const width = Math.hypot(size.x, size.z) * 1.04, height = size.y * 1.04;
  const material = new THREE.MeshBasicMaterial({map: texture, alphaTest: .2, side: THREE.DoubleSide, toneMapped: false});
  const records = trees.map(tree => {
    const image = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    image.name = 'DistantMaplePhotograph';
    image.position.copy(tree.position); image.position.y += center.y;
    image.visible = false; parent.add(image);
    return { tree, image, angle: -1 };
  });
  let previousCount = -1;
  return {
    update(camera, nightAmount) {
      material.color.setScalar(1 - .95 * nightAmount);
      let count = 0;
      for (const record of records) {
        const {tree, image} = record;
        const dx = camera.position.x - tree.position.x, dz = camera.position.z - tree.position.z;
        tree.visible = canopyDetailVisible(dx * dx + dz * dz, image.visible);
        image.visible = !tree.visible;
        if (!image.visible) continue;
        count++;
        const angle = Math.atan2(dx, dz);
        image.rotation.y = angle;
        const tile = canopyTile(angle, tree.rotation.y);
        if (record.angle === tile) continue;
        const column = tile % 4, row = Math.floor(tile / 4);
        const left = (column * 512 + .5) / 2048, right = ((column + 1) * 512 - .5) / 2048;
        const top = 1 - (row * 512 + .5) / 1024, bottom = 1 - ((row + 1) * 512 - .5) / 1024;
        const uv = image.geometry.attributes.uv;
        uv.setXY(0, left, top); uv.setXY(1, right, top);
        uv.setXY(2, left, bottom); uv.setXY(3, right, bottom); uv.needsUpdate = true;
        record.angle = tile;
      }
      if (previousCount !== count) document.documentElement.dataset.treeBillboards = String(count);
      previousCount = count;
    },
    destroy() {
      records.forEach(({tree, image}) => { tree.visible = true; parent.remove(image); image.geometry.dispose(); });
      texture.dispose(); material.dispose();
    }
  };
}
