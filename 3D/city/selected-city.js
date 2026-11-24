// Heights keep the four office models below the headquarters and align roof lights.
export const officeHeightsByLot = Object.freeze({
  2: 37,  // Singapore
  10: 32, // Atlanta
  30: 30, // Twin offices
  69: 19  // Modern office
});

export function addSelectedCity(THREE, group, loader, replaceLots, textures) {
  const officeMaterials = new Set();
  const panoramaOpacity = { value: 0 };
  let panorama = null;
  let night = 0;
  let aerial = 1;
  let disposed = false;

  function updatePanorama() {
    panoramaOpacity.value = night * aerial;
    if (panorama) panorama.visible = panoramaOpacity.value > 0.015;
  }

  function load(filename, setup) {
    return loader.loadAsync(new URL(filename, import.meta.url).href)
      .then(({ scene }) => {
        const geometries = new Set();
        const materials = new Set();
        const maps = new Set();
        scene.traverse(object => {
          if (!object.isMesh) return;
          geometries.add(object.geometry);
          materials.add(object.material);
          for (const map of [object.material.map, object.material.emissiveMap]) {
            if (map) maps.add(map);
          }
        });
        if (disposed) {
          for (const geometry of geometries) geometry.dispose();
          for (const material of materials) material.dispose();
          for (const map of maps) map.dispose();
          return;
        }
        textures.push(...maps);
        setup(scene, materials);
        group.add(scene);
      })
      .catch(error => console.warn('SAEI: unable to load city asset ' + filename, error));
  }

  const officesReady = load('./office-landmarks.glb', (scene, materials) => {
    scene.name = 'SelectedOfficeLandmarks';
    for (const material of materials) {
      material.emissiveIntensity = night * 0.9;
      officeMaterials.add(material);
    }
    replaceLots(scene.userData.lots);
  });

  const panoramaReady = load('./japan-night-panorama.glb', (scene, materials) => {
    scene.name = 'JapanNightPanorama';
    for (const material of materials) {
      material.fog = false;
      material.toneMapped = false;
      material.color.multiplyScalar(0.94);
      material.onBeforeCompile = shader => {
        shader.uniforms.panoramaOpacity = panoramaOpacity;
        shader.fragmentShader = 'uniform float panoramaOpacity;\n' + shader.fragmentShader.replace(
          '#include <alphatest_fragment>', `#include <alphatest_fragment>
          float threshold = fract(dot(floor(gl_FragCoord.xy), vec2(.7548777, .5698403)));
          if (threshold >= panoramaOpacity) discard;`);
      };
    }
    panorama = scene;
    updatePanorama();
  });

  return {
    ready: Promise.all([officesReady, panoramaReady]),
    updateCamera(camera) {
      aerial = THREE.MathUtils.smoothstep(camera.position.y, 35, 75);
      updatePanorama();
    },
    setNight(amount) {
      night = THREE.MathUtils.smoothstep(amount, 0.28, 0.92);
      for (const material of officeMaterials) material.emissiveIntensity = night * 0.9;
      updatePanorama();
    },
    destroy() { disposed = true; }
  };
}
