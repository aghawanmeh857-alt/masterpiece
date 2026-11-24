const seatedModels = [
  { file: 'ellis-seated.glb', cushion: 0.455, anchor: 0.035 },
  { file: 'taylor-seated.glb', cushion: 0.455, anchor: 0.025 }
];
const presenter = { file: 'mara-presenter.glb', anchor: 0 };

export function isPresenter(role) {
  return role === 'teacher' || role === 'speaker';
}

export function createWelcome(updatePose) {
  let elapsed = 0;
  let greeting = false;
  const duration = 2.6;
  return (dt, visible, distanceSquared) => {
    if (distanceSquared > 12 * 12) {
      if (greeting) updatePose(0, 0);
      greeting = false;
      elapsed = 0;
      return false;
    }
    if (!visible || elapsed >= duration) return false;
    if (!greeting && distanceSquared > 8 * 8) return false;
    greeting = true;
    elapsed = Math.min(duration, elapsed + dt);
    const fade = Math.min(1, elapsed / 0.45, (duration - elapsed) / 0.55);
    updatePose(elapsed / duration, fade * fade * (3 - 2 * fade));
    return true;
  };
}

// Figures share their original meshes and textures. The shader bends the posed
// forearms around the elbows, while the seat, feet and furniture stay anchored.
function attachGesture(THREE, figure, holder, index, materials) {
  const role = holder.userData.role;
  const seated = Boolean(holder.userData.seat);
  const motion = { value: new THREE.Vector4() };
  const pose = { value: new THREE.Vector3(seated ? 0.72 : 1.17, seated ? 1.04 : 1.38, role === 'typist' ? 0.16 : 0) };
  const copies = new Map();
  function forFigure(original) {
    if (copies.has(original)) return copies.get(original);
    const material = original.clone();
    material.onBeforeCompile = (shader) => {
      shader.uniforms.gesture = motion;
      shader.uniforms.restPose = pose;
      shader.vertexShader = 'uniform vec4 gesture; uniform vec3 restPose;\n' +
        shader.vertexShader.replace('#include <begin_vertex>', `
          #include <begin_vertex>
          float elbow = restPose.x;
          float arm = smoothstep(0.06, 0.27, position.z)
            * smoothstep(elbow - 0.21, elbow - 0.12, position.y)
            * (1.0 - smoothstep(elbow + 0.17, elbow + 0.27, position.y));
          float angle = mix(gesture.x, gesture.y, smoothstep(-0.045, 0.045, position.x));
          vec2 forearm = position.yz - vec2(elbow, 0.08);
          float c = cos(angle), s = sin(angle);
          transformed.yz += arm * (vec2(c*forearm.x + s*forearm.y, c*forearm.y - s*forearm.x) - forearm);
          transformed.z += restPose.z * arm;
          float head = smoothstep(restPose.y - 0.05, restPose.y + 0.11, position.y)
            * (1.0 - smoothstep(0.14, 0.24, abs(position.x)));
          transformed.z += head * (position.y - restPose.y) * gesture.z;
          float turn = gesture.w * head;
          transformed.xz = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * transformed.xz;
        `);
    };
    material.customProgramCacheKey = () => 'saei-indoor-gesture';
    copies.set(original, material);
    materials.add(material);
    return material;
  }
  figure.traverse((mesh) => {
    if (mesh.isMesh) mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(forFigure) : forFigure(mesh.material);
  });
  if (role === 'typist') {
    // Hold both hands at keyboard height in the existing seated pose.
    motion.value.set(0.28, 0.28, 0.14, 0);
    return;
  }
  if (role === 'reception') {
    holder.userData.welcome = createWelcome((progress, weight) => {
      const wave = 1.08 + 0.24 * Math.sin(progress * Math.PI * 6);
      motion.value.set(wave * weight, 0, 0.09 * weight, 0.12 * weight);
    });
    return;
  }
  const reach = role === 'teacher' ? 0.65 : 0.48;
  let time = index * 0.73;
  holder.userData.updateGesture = (dt) => {
    time += dt;
    const beat = Math.sin(time * 1.6);
    const glance = Math.sin(time * 0.75);
    motion.value.set(reach * (0.5 + 0.5 * beat), reach * (0.44 - 0.4 * glance),
      0.08 * beat, 0.22 * glance);
  };
  holder.userData.updateGesture(0);
}

export async function loadInteriorPeople(THREE, loader) {
  const gestureMaterials = new Set();
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
      const asset = seat ? seated[holder.userData.role === 'typist' ? 0 : index % seated.length] : standing;
      if (!asset) return null;
      const figure = asset.scene.clone(true);
      const height = asset.bounds.max.y - asset.bounds.min.y;
      const scale = seat ? (seat.height - holder.position.y) / asset.cushion : 1.73 / height;
      figure.scale.setScalar(scale);
      figure.position.set(0, -asset.bounds.min.y * scale, -asset.anchor * scale);
      if (['typist', 'reception'].includes(holder.userData.role) || isPresenter(holder.userData.role)) {
        attachGesture(THREE, figure, holder, index, gestureMaterials);
      }
      return figure;
    },
    destroy() {
      gestureMaterials.forEach((material) => material.dispose());
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
