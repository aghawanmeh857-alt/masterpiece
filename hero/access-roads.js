import { mergeStaticMeshes } from './static-meshes.js';
import { addCityAppearance } from './city-appearance.js';
import { addCitySkyline } from './city-skyline.js';
export async function createAccessRoads(THREE, scene, { mergeGeometries, loader }) {
  const city = new THREE.Group();
  city.name = 'OFOQCity';
  city.userData.dynamicScene = true;
  const roadMaterials = [],
    geometry = new Set();
  const asphalt = new THREE.MeshStandardMaterial({ color: '#353c45', roughness: 0.95 });
  const pavement = new THREE.MeshStandardMaterial({ color: '#a8afb5', roughness: 0.92 });
  const marking = new THREE.MeshStandardMaterial({ color: '#e6e4d8', roughness: 0.8 });
  roadMaterials.push(asphalt, pavement, marking);
  function box(size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    if (material === asphalt || material === pavement) {
      const uv = mesh.geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, (uv.getX(i) * size[0]) / 2, (uv.getY(i) * size[2]) / 2);
    }
    geometry.add(mesh.geometry);
    mesh.position.set(...position);
    mesh.receiveShadow = true;
    city.add(mesh);
  }
  // Dedicated access roads remain clear of the imported building footprints.
  box([10, 0.07, 230], [30, -0.025, -65], asphalt);
  box([260, 0.07, 10], [120, -0.025, 48], asphalt);
  box([5, 0.08, 210], [22, 0.01, -55], pavement);
  box([195, 0.08, 3.5], [145, 0.01, 40], pavement);
  box([30, 0.08, 28], [5, 0.01, 17], pavement);
  // Infill behind the headquarters, beyond its rear wall at Z=-83.
  box([48, 0.08, 112], [-5, -0.025, -149], pavement);
  box([5, 0.1, 112], [-2, 0.03, -149], asphalt);
  for (const z of [-128, -166]) box([48, 0.1, 4], [-5, 0.03, z], asphalt);
  for (let z = -170; z < 45; z += 9) box([0.16, 0.018, 3.5], [30, 0.02, z], marking);
  for (let x = 5; x < 245; x += 9) box([3.5, 0.018, 0.16], [x, 0.02, 48], marking);
  for (let z = 12; z < 17; z += 0.95) box([9.5, 0.02, 0.42], [30, 0.025, z], marking);
  for (const x of [24.6, 35.4]) box([0.16, 0.18, 210], [x, 0.02, -55], pavement);
  const appearance = addCityAppearance(THREE, city);
  asphalt.map = appearance.asphaltMap;
  asphalt.color.set('#ffffff');
  pavement.map = appearance.pavementMap;
  pavement.color.set('#ffffff');
  scene.add(city);
  mergeStaticMeshes(THREE, city, mergeGeometries).geometries.forEach((item) => geometry.add(item));
  const state = document.documentElement.dataset;
  const skyline = addCitySkyline(THREE, city, loader);
  await skyline.ready;
  state.cityStatus = 'ready';
  state.cityModel = 'lit-skyline';
  state.cityBuildings = String(skyline.count);
  state.rearCityBuildings = String(skyline.rearCount);
  return {
    group: city,
    updateCamera: skyline.updateCamera,
    setNight(amount) {
      appearance.setNight(amount);
      skyline.setNight(amount);
      state.cityLightLevel = Number(amount).toFixed(4);
    },
    destroy() {
      scene.remove(city);
      geometry.forEach((item) => item.dispose());
      appearance.destroy();
      skyline.destroy();
      const textures = new Set();
      roadMaterials.forEach((material) => {
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
    }
  };
}
