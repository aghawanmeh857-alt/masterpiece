import { mergeStaticMeshes } from './static-meshes.js';
// Lightweight access roads and street lighting; no imported city model.
import { addCityAppearance } from './city-appearance.js';
export async function createAccessRoads(THREE, scene, { mergeGeometries }) {
  const city = new THREE.Group(); city.name = 'OFOQCity';
  city.userData.dynamicScene = true;
  const roadMaterials = [], geometry = new Set();
  const asphalt = new THREE.MeshStandardMaterial({ color: '#353c45', roughness: .95 });
  const pavement = new THREE.MeshStandardMaterial({ color: '#a8afb5', roughness: .92 });
  const marking = new THREE.MeshStandardMaterial({ color: '#e6e4d8', roughness: .8 });
  roadMaterials.push(asphalt, pavement, marking);
  function box(size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    if (material === asphalt || material === pavement) {
      const uv = mesh.geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * size[0] / 2, uv.getY(i) * size[2] / 2);
    }
    geometry.add(mesh.geometry); mesh.position.set(...position); mesh.receiveShadow = true; city.add(mesh);
  }
  // Dedicated access roads remain clear of the imported building footprints.
  box([10, .07, 230], [30, -.025, -65], asphalt);
  box([260, .07, 10], [120, -.025, 48], asphalt);
  box([5, .08, 210], [22, .01, -55], pavement);
  box([195, .08, 3.5], [145, .01, 40], pavement);
  box([30, .08, 28], [5, .01, 17], pavement);
  // Infill behind the headquarters, beyond its rear wall at Z=-83.
  box([48, .08, 112], [-5, -.025, -149], pavement);
  box([5, .10, 112], [-2, .03, -149], asphalt);
  for (const z of [-128, -166]) box([48, .10, 4], [-5, .03, z], asphalt);
  for (let z = -170; z < 45; z += 9) box([.16, .018, 3.5], [30, .02, z], marking);
  for (let x = 5; x < 245; x += 9) box([3.5, .018, .16], [x, .02, 48], marking);
  for (let z = 12; z < 17; z += .95) box([9.5, .02, .42], [30, .025, z], marking);
  for (const x of [24.6, 35.4]) box([.16, .18, 210], [x, .02, -55], pavement);
  const appearance = addCityAppearance(THREE, city);
  asphalt.map = appearance.asphaltMap; asphalt.color.set('#ffffff');
  pavement.map = appearance.pavementMap; pavement.color.set('#ffffff');
  scene.add(city);
  mergeStaticMeshes(THREE, city, mergeGeometries).geometries.forEach(item => geometry.add(item));
  const state = document.documentElement.dataset;
  state.cityStatus = 'removed'; state.cityModel = 'none';
  state.cityBuildings = '0'; state.rearCityBuildings = '0';
  return {
    group: city,
    setNight(amount) {
      appearance.setNight(amount);
      state.cityLightLevel = Number(amount).toFixed(4);
    },
    destroy() {
      scene.remove(city); geometry.forEach(item => item.dispose());
      appearance.destroy();
      const textures = new Set();
      roadMaterials.forEach(material => {
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        material.dispose();
      });
      textures.forEach(texture => texture.dispose());
    }
  };
}
