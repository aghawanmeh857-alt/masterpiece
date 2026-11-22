export function createHeadquartersLighting(THREE, scene) {
  const night = { value: 0 };
  let outsideEntrance = true;
  const group = new THREE.Group();
  group.name = 'SAEIHeadquartersEntranceLighting';
  group.userData.dynamicScene = true;
  scene.add(group);

  const fixtureMaterial = new THREE.MeshBasicMaterial({ color: '#ffd398', toneMapped: false });
  const stripGeometry = new THREE.BoxGeometry(.037, 2.82, .028);
  for (const side of [-1, 1]) {
    const strip = new THREE.Mesh(stripGeometry, fixtureMaterial);
    strip.position.set(side * 1.6, 1.49, 2.215);
    group.add(strip);
  }
  const canopyGeometry = new THREE.BoxGeometry(3.95, .025, .075);
  const canopy = new THREE.Mesh(canopyGeometry, fixtureMaterial);
  canopy.position.set(0, 3.037, 4.38);
  group.add(canopy);

  const buffer = document.createElement('canvas');
  buffer.width = buffer.height = 64;
  const context = buffer.getContext('2d');
  const glow = context.createRadialGradient(32, 32, 2, 32, 32, 32);
  glow.addColorStop(0, 'rgba(255,207,137,.70)');
  glow.addColorStop(.35, 'rgba(252,183,93,.35)');
  glow.addColorStop(.7, 'rgba(225,142,60,.11)');
  glow.addColorStop(1, 'rgba(225,142,60,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  const spillMap = new THREE.CanvasTexture(buffer);
  spillMap.colorSpace = THREE.SRGBColorSpace;
  const spillMaterial = new THREE.MeshBasicMaterial({
    map: spillMap, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false
  });
  const spillGeometry = new THREE.PlaneGeometry(8.6, 7).rotateX(-Math.PI / 2);
  const spill = new THREE.Mesh(spillGeometry, spillMaterial);
  spill.position.set(0, .204, 5.7);
  group.add(spill);
  group.visible = false;

  function addFacade(tower) {
    const applied = new Set();
    tower.traverse(mesh => {
      if (!mesh.isMesh) return;
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const facade = material.name === 'Building_Facade' && material.map;
        const glazing = /^Glass_Generic/.test(material.name);
        if ((!glazing && !facade) || applied.has(material)) continue;
        applied.add(material);
        material.onBeforeCompile = shader => {
          shader.uniforms.headquartersNight = night;
          shader.fragmentShader = 'uniform float headquartersNight;\n' + shader.fragmentShader;
          if (glazing) {
            // Place the light in the glass behind the existing metal window
            // frames. The floor spacing comes from the source tower geometry.
            shader.vertexShader = 'varying vec3 headquartersPosition;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
              #include <begin_vertex>
              headquartersPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
            `);
            shader.fragmentShader = 'varying vec3 headquartersPosition;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
              #include <emissivemap_fragment>
              if (headquartersNight > 0.001) {
                float level = (headquartersPosition.y - 4.90) / 1.545;
                float floorNumber = floor(level);
                float office = floor((headquartersPosition.x + headquartersPosition.z * 0.73) * 0.68);
                float variation = fract(sin(office * 17.13 + floorNumber * 31.29 + 15.4) * 17931.17);
                float ceilingBounce = mix(0.64, 1.0, smoothstep(0.18, 0.91, fract(level)));
                float occupied = mix(0.08, 1.0, smoothstep(0.19, 0.38, variation));
                vec3 tungsten = mix(vec3(1.0, 0.31, 0.07), vec3(1.0, 0.67, 0.31), variation);
                totalEmissiveRadiance += tungsten * headquartersNight * occupied * ceilingBounce * 2.55;
              }
            `);
            return;
          }
          // A smaller amount spreads into the original facade's glazing mask
          // while leaving the mullions and trim dark.
          shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
            #include <emissivemap_fragment>
            #ifdef USE_MAP
              if (headquartersNight > 0.001) {
                vec2 tile = fract(vMapUv);
                float bay = fract(vMapUv.x * 4.0);
                float glazing = smoothstep(0.175, 0.190, tile.y)
                  * smoothstep(0.135, 0.170, bay)
                  * (1.0 - smoothstep(0.08, 0.69, diffuseColor.a));
                float column = floor(vMapUv.x * 4.0) * 2.0 + step(0.58, bay);
                float row = floor(max(0.0, tile.y - 0.18) * 3.65) + floor(vMapUv.y) * 3.0;
                float variation = fract(sin(column * 13.91 + row * 37.31 + 15.4) * 19417.37);
                float occupied = mix(0.16, 1.0, smoothstep(0.14, 0.34, variation));
                float windowLight = glazing * headquartersNight * occupied;
                vec3 tungsten = mix(vec3(1.0, 0.39, 0.12), vec3(1.0, 0.7, 0.36), variation);
                totalEmissiveRadiance += tungsten * windowLight * 1.3;
                diffuseColor.a = mix(diffuseColor.a, 0.70, windowLight * 0.50);
              }
            #endif
          `);
        };
        material.customProgramCacheKey = () => glazing ? 'saei-headquarters-glass-v2' : 'saei-headquarters-windows-v2';
        material.needsUpdate = true;
      }
    });
  }

  return {
    addFacade,
    updateCamera(camera) {
      outsideEntrance = camera.position.z > 1.4;
      group.visible = night.value > .02 && outsideEntrance;
    },
    setNight(amount) {
      night.value = THREE.MathUtils.smoothstep(amount, .14, .88);
      fixtureMaterial.color.setRGB(1, .69 + night.value * .10, .38 + night.value * .13);
      spillMaterial.opacity = night.value * .83;
      group.visible = night.value > .02 && outsideEntrance;
    },
    destroy() {
      group.removeFromParent();
      [stripGeometry, canopyGeometry, spillGeometry, fixtureMaterial, spillMaterial, spillMap]
        .forEach(asset => asset.dispose());
    }
  };
}
