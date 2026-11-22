// Distant park trees use photographs of the original maple, not more GLB models.
export const SCENIC_TREES = [
  [46, 8, 9],
  [59, 8, 8],
  [48, -12, 9],
  [63, -23, 10],
  [47, -36, 9],
  [45, -52, 8],
  [49, -68, 10],
  [44, -87, 9],
  [-17, -96, 9],
  [8, -98, 8],
  [-18, -116, 10],
  [10, -120, 9]
];

export async function createScenicPlantings(THREE, scene) {
  const loader = new THREE.TextureLoader();
  const texture = await loader.loadAsync(
    new URL('./maple-canopy-atlas.webp', import.meta.url).href
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  const group = new THREE.Group();
  group.name = 'SAEIScenicPlantings';
  group.userData.dynamicScene = true;
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.setAttribute(
    'atlasFrame',
    new THREE.InstancedBufferAttribute(new Float32Array(SCENIC_TREES.map((_, i) => i % 8)), 1)
  );
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    alphaTest: 0.2,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = 'attribute float atlasFrame;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
      vMapUv = uv * vec2(.2495, .499) + vec2(mod(atlasFrame, 4.0) * .25 + .00025, (1.0 - floor(atlasFrame / 4.0)) * .5 + .0005);`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      vec3 sourceColor = diffuseColor.rgb / max(diffuse, vec3(.001));
      float leafMask = smoothstep(.04, .12, sourceColor.r - sourceColor.b);
      float luminance = dot(sourceColor, vec3(.299, .587, .114));
      vec3 foliage = mix(vec3(.018, .055, .025), vec3(.12, .28, .10), smoothstep(0.0, .7, luminance));
      diffuseColor.rgb = mix(sourceColor, foliage, leafMask * .94) * diffuse;`
    );
  };
  material.customProgramCacheKey = () => 'saei-scenic-tree-photos-v1';
  const trees = new THREE.InstancedMesh(geometry, material, SCENIC_TREES.length);
  group.add(trees);
  const grassGeometry = new THREE.PlaneGeometry(1, 1);
  grassGeometry.rotateX(-Math.PI / 2);
  const grassMaterial = new THREE.MeshStandardMaterial({ color: '#88aa91', roughness: 1 });
  const patches = new THREE.InstancedMesh(grassGeometry, grassMaterial, 3);
  const dummy = new THREE.Object3D();
  [
    [54, -37, 24, 65],
    [-6, -105, 36, 38],
    [61, -90, 24, 31]
  ].forEach(([x, z, width, length], index) => {
    dummy.position.set(x, 0.028, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(width, 1, length);
    dummy.updateMatrix();
    patches.setMatrixAt(index, dummy.matrix);
  });
  group.add(patches);
  scene.add(group);
  let lastX = Infinity,
    lastZ = Infinity;
  document.documentElement.dataset.scenicTrees = String(SCENIC_TREES.length);
  return {
    update(camera, visible, nightAmount) {
      group.visible = visible;
      if (!visible) return;
      material.color.setScalar(1 - 0.94 * nightAmount);
      if (Math.abs(camera.position.x - lastX) + Math.abs(camera.position.z - lastZ) < 0.05) return;
      SCENIC_TREES.forEach(([x, z, height], index) => {
        dummy.position.set(x, height / 2 + 0.05, z);
        dummy.rotation.set(0, Math.atan2(camera.position.x - x, camera.position.z - z), 0);
        dummy.scale.set(height * 1.52, height, 1);
        dummy.updateMatrix();
        trees.setMatrixAt(index, dummy.matrix);
      });
      trees.instanceMatrix.needsUpdate = true;
      trees.computeBoundingSphere();
      lastX = camera.position.x;
      lastZ = camera.position.z;
    },
    destroy() {
      scene.remove(group);
      geometry.dispose();
      grassGeometry.dispose();
      material.dispose();
      grassMaterial.dispose();
      texture.dispose();
      trees.dispose();
      patches.dispose();
    }
  };
}
