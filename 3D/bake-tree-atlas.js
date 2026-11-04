// Development asset generation only; normal visitors load the exported PNG.
export function bakeTreeAtlas(THREE, renderer, template, environment) {
  const bounds = new THREE.Box3().setFromObject(template);
  const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const width = Math.hypot(size.x, size.z) * 1.04, height = size.y * 1.04;
  const scene = new THREE.Scene();
  scene.environment = environment;
  scene.environmentIntensity = .85;
  scene.add(template.clone(true));
  scene.add(new THREE.HemisphereLight('#d5e6ff', '#747568', 1.65));
  const sun = new THREE.DirectionalLight('#fff0d9', 3.5);
  sun.position.set(-30, 65, 30); scene.add(sun);
  const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 200);
  const target = new THREE.WebGLRenderTarget(512, 512);
  target.texture.colorSpace = THREE.SRGBColorSpace;
  const pixels = new Uint8Array(512 * 512 * 4);
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
  const context = canvas.getContext('2d');
  const tile = document.createElement('canvas'); tile.width = tile.height = 512;
  const tileContext = tile.getContext('2d');
  const previousTarget = renderer.getRenderTarget();
  const clear = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
  const exposure = renderer.toneMappingExposure;
  try {
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0, 0);
    renderer.setRenderTarget(target);
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4;
      camera.position.set(center.x + Math.sin(angle) * 60, center.y + 12, center.z + Math.cos(angle) * 60);
      camera.lookAt(center); camera.updateMatrixWorld();
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(target, 0, 0, 512, 512, pixels);
      tileContext.putImageData(new ImageData(new Uint8ClampedArray(pixels), 512, 512), 0, 0);
      context.save();
      context.translate(index % 4 * 512, (Math.floor(index / 4) + 1) * 512);
      context.scale(1, -1); context.drawImage(tile, 0, 0); context.restore();
    }
  } finally {
    renderer.setRenderTarget(previousTarget);
    renderer.setClearColor(clear, alpha);
    renderer.toneMappingExposure = exposure;
    target.dispose();
  }
  const output = document.createElement('img');
  output.id = 'baked-tree-atlas'; output.hidden = true;
  output.src = canvas.toDataURL('image/png');
  output.dataset.info = JSON.stringify({ width, height, centerY: center.y });
  document.body.append(output);
}
