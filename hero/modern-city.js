// New York, Highway Interstate 95 by 99.Miles, downloaded by the user.
// Original GLB is kept unchanged in /3D. Placement/lighting happen at runtime.
import { addCityAppearance } from './city-appearance.js';
import { CITY_MODEL, placeCityModel } from '../3D/model-layout.js';
import { addRearDistrict } from '../3D/rear-district.js';
export async function createModernCity(THREE, scene, loader) {
  const asset = await loader.loadAsync(new URL('../3D/' + CITY_MODEL, import.meta.url).href);
  const city = new THREE.Group(); city.name = 'OFOQCity';
  city.userData.dynamicScene = true;
  city.add(placeCityModel(THREE, asset.scene));
  const sourceMaterials = new Map(), roadMaterials = [], geometry = new Set();
  asset.scene.traverse(node => {
    if (!node.isMesh) return;
    geometry.add(node.geometry); node.receiveShadow = true; node.castShadow = false;
    const material = source => {
      if (!sourceMaterials.has(source)) {
        const result = source.clone();
        result.roughness = Math.max(.48, result.roughness || 0);
        // Preserve the author's metallic/roughness maps instead of flattening
        // all seven materials to the same mostly-matte surface.
        result.metalness = source.metalness;
        result.envMapIntensity = 1.05;
        sourceMaterials.set(source, result);
      }
      return sourceMaterials.get(source);
    };
    node.material = Array.isArray(node.material) ? node.material.map(material) : material(node.material);
  });
  const rearDistrict = addRearDistrict(THREE, city, asset.scene);
  geometry.add(rearDistrict.geometry);
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
  const state = document.documentElement.dataset;
  state.cityStatus = 'ready'; state.cityModel = 'fixed-new-york-highway-interstate-95';
  state.cityBuildings = String(asset.scene.children.length); state.cityModelSource = 'Sketchfab / 99.Miles';
  state.rearCityBuildings = String(rearDistrict.count);
  return {
    setNight(amount) {
      sourceMaterials.forEach(material => { material.envMapIntensity = 1.05 - amount * .6; });
      appearance.setNight(amount);
      state.cityLightLevel = Number(amount).toFixed(4);
    },
    destroy() {
      scene.remove(city); geometry.forEach(item => item.dispose());
      appearance.destroy();
      const textures = new Set();
      [...sourceMaterials.values(), ...roadMaterials].forEach(material => {
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        material.dispose();
      });
      textures.forEach(texture => texture.dispose());
    }
  };
}
