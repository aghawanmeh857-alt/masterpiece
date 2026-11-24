// Offices and apartment blocks share one window atlas and draw in either theme.
export function createCityNeighborhood(THREE, existing, offices, random) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#171c2b';
  ctx.fillRect(0, 0, 512, 256);
  const glazing = ['#222637', '#313647', '#393847', '#685143', '#b7895e', '#ffcc8c', '#cbd0d6'];
  for (let row = 0; row < 8; row++) {
    const office = random();
    for (let bay = 0; bay < 16; bay++) {
      const x = bay * 32, y = row * 32;
      const occupied = random() < .28 + office * .22;
      const paletteIndex = occupied ? 3 + Math.floor(random() * 4) : Math.floor(random() * 3);
      ctx.fillStyle = glazing[paletteIndex];
      ctx.fillRect(x + 4, y + 5, 24, 17);
      ctx.fillStyle = '#242534';
      ctx.fillRect(x + 15, y + 4, 2, 19);
      ctx.fillStyle = '#363341';
      ctx.fillRect(x, y + 25, 32, 2);
    }
  }
  const windows = new THREE.CanvasTexture(canvas);
  windows.colorSpace = THREE.SRGBColorSpace;
  windows.wrapS = windows.wrapT = THREE.RepeatWrapping;
  const strength = { value: 0 };
  const material = new THREE.MeshStandardMaterial({ map: windows, roughness: 0.87 });
  material.onBeforeCompile = shader => {
    shader.uniforms.blockNight = strength;
    shader.vertexShader = 'varying float roofFace; varying float blockTone;\n' + shader.vertexShader.replace(
      '#include <uv_vertex>', `#include <uv_vertex>
      vec3 dims = vec3(instanceMatrix[0].x, instanceMatrix[1].y, instanceMatrix[2].z);
      vec3 offset = instanceMatrix[3].xyz;
      blockTone = fract(dot(offset.xz, vec2(.1031,.0973)));
      roofFace = max(normal.y,0.0);
      vMapUv = uv * vec2(mix(dims.x,dims.z,abs(normal.x))/22.0,dims.y/13.6)
        + vec2(floor(offset.x),floor(offset.z))/16.0;`);
    shader.fragmentShader = 'uniform float blockNight; varying float roofFace; varying float blockTone;\n'
      + shader.fragmentShader.replace('#include <map_fragment>', `
        vec3 facade = texture2D(map, vMapUv).rgb;
        float brightness = dot(facade, vec3(.2126,.7152,.0722));
        float masonry = smoothstep(.026,.065,brightness) * (1.0-smoothstep(.09,.19,brightness));
        vec3 stone = mix(vec3(.20,.195,.18), vec3(.32,.30,.26), blockTone);
        vec3 glass = mix(vec3(.10,.135,.16), vec3(.18,.225,.25), blockTone);
        vec3 day = mix(glass, stone, masonry);
        vec3 night = vec3(.054,.065,.086) * (.72+.45*blockTone);
        vec3 roof = mix(stone * .64, vec3(.022,.025,.037), blockNight);
        diffuseColor.rgb *= mix(mix(day, night, blockNight), roof, roofFace);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += facade * smoothstep(.14,.58,brightness)
          * blockNight * (1.0-roofFace) * (.65+.35*blockTone);`);
  };

  const pieces = [];
  function block(x, z, width, depth, floors) {
    if (existing.some(lot => Math.abs(x-lot.x) < (width+lot.width)/2+1 &&
      Math.abs(z-lot.z) < (depth+lot.depth)/2+1)) return;
    const height = floors * 1.7;
    pieces.push([x, height/2, z, width, height, depth]);
    const upper = floors > 4 ? 3.4 : 1.7;
    pieces.push([x-width*.09, height+upper/2, z+depth*.07, width*.64, upper, depth*.66]);
    pieces.push([x-width*.18, height+upper+.45, z, width*.24, .9, depth*.21]);
  }
  // Build within the existing grid. The seaward promenade and the gardens stay open.
  for (let z = -224; z <= 14; z += 34) {
    for (let x = 81; x < 360; x += 34) {
      block(x, z, 9+random()*3, 7+random()*3, 3+Math.floor(random()*6));
      block(x+14, z-1, 9+random()*2, 7+random()*2, 2+Math.floor(random()*4));
      if (x > 190) {
        block(x, z-17, 10, 12, 3+Math.floor(random()*8));
        block(x+14, z-17, 10, 11, 2+Math.floor(random()*5));
      }
    }
  }
  for (let z = -244; z <= -143; z += 34) {
    for (const x of [-48, -14, 18, 51]) block(x, z, 11, 8, 3+Math.floor(random()*5));
  }
  const firstOfficePiece = pieces.length;
  for (const { x, z, width, depth, height, finish, setback } of offices) {
    const podium = Math.min(4.5, height * 0.24);
    const crown = setback ? height * 0.22 : 1.3;
    const shaft = height - podium - crown;
    pieces.push(
      [x, podium / 2, z, width, podium, depth, finish],
      [x, podium + shaft / 2, z, width * 0.88, shaft, depth * 0.88, finish],
      [x - width * 0.06, height - crown / 2, z, width * 0.60, crown, depth * 0.66, finish]
    );
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(), material, pieces.length);
  mesh.name = 'ResidentialBlocks';
  const pose = new THREE.Object3D();
  const finishes = [
    new THREE.Color(0.86, 0.96, 1.05),
    new THREE.Color(1.08, 1.01, 0.92),
    new THREE.Color(0.94, 0.98, 1.01)
  ];
  pieces.forEach(([x, y, z, width, height, depth, finish], i) => {
    pose.position.set(x,y,z);
    pose.scale.set(width, height, depth);
    pose.updateMatrix();
    mesh.setMatrixAt(i,pose.matrix);
    if (i >= firstOfficePiece) mesh.setColorAt(i, finishes[finish]);
  });
  mesh.computeBoundingSphere();
  return { mesh, windows, setNight(amount) {
    strength.value = THREE.MathUtils.smoothstep(amount,.35,.96);
  }};
}
