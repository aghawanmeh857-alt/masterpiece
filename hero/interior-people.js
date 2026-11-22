const seatedModels = [
  { file: 'ellis-seated.glb', cushion: 0.455, anchor: 0.035 },
  { file: 'taylor-seated.glb', cushion: 0.455, anchor: 0.025 }
];
const presenter = { file: 'mara-presenter.glb', anchor: 0 };

export async function loadInteriorPeople(THREE, loader) {
  async function load({ file, cushion, anchor }) {
    const url = new URL(`./assets/3d/people/${file}`, import.meta.url);
    try {
      const { scene } = await loader.loadAsync(url.href);
      const bounds = new THREE.Box3().setFromObject(scene, true);
      scene.traverse((mesh) => {
        if (!mesh.isMesh) return;
        mesh.receiveShadow = true;
      });
      return { scene, bounds, cushion, anchor };
    } catch (error) {
      console.warn('SAEI: using an animated fallback for an unavailable indoor figure.', error);
      return null;
    }
  }
  const models = await Promise.all([...seatedModels, presenter].map(load));
  const seated = models.slice(0, -1).filter(Boolean);
  const standing = models.at(-1);

  return {
    count: models.filter(Boolean).length,
    createFigure(holder, index) {
      const seat = holder.userData.seat;
      const asset = seat ? seated[index % seated.length] : standing;
      if (!asset) return null;
      const figure = asset.scene.clone(true);
      const height = asset.bounds.max.y - asset.bounds.min.y;
      const scale = seat ? (seat.height - holder.position.y) / asset.cushion : 1.73 / height;
      figure.scale.setScalar(scale);
      figure.position.set(0, -asset.bounds.min.y * scale, -asset.anchor * scale);
      return figure;
    },
    destroy() {
      const textures = new Set();
      const materials = new Set();
      for (const asset of models.filter(Boolean)) {
        asset.scene.traverse((mesh) => {
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            materials.add(material);
            for (const value of Object.values(material)) {
              if (value?.isTexture) textures.add(value);
            }
          }
        });
      }
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    }
  };
}
