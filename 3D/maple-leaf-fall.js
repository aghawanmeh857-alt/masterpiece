// A folded blade with a darker midrib and a narrow stem, shared by all the leaves.
export function mapleLeafGeometry(THREE) {
  const edge = [[0,-.45],[-.27,-.52],[-.23,-.35],[-.5,-.3],[-.44,-.19],
    [-.68,.03],[-.49,.06],[-.54,.26],[-.31,.18],[-.36,.51],[-.17,.38],
    [-.13,.56],[0,.78],[.13,.52],[.18,.39],[.38,.5],[.31,.17],[.52,.26],
    [.48,.08],[.66,.02],[.43,-.18],[.49,-.29],[.21,-.34],[.25,-.48]];
  const vertices = [0,-.22,.1], colors = [.68,.58,.45], indices = [];
  for (const [x,y] of edge) {
    vertices.push(x, y, .065 * x + .06 * Math.abs(x) * Math.sin(12*y));
    const light = .86 + .12 * Math.sin(x*11 + y);
    colors.push(light, light, light*.95);
  }
  edge.forEach((_, i) => indices.push(0, 1 + (i+1)%edge.length, 1+i));
  const stem = vertices.length/3;
  vertices.push(-.022,-.425,0, .025,-.425,0, .08,-.76,-.015);
  colors.push(.49,.37,.23, .49,.37,.23, .38,.31,.24);
  indices.push(stem, stem+2, stem+1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Top surfaces of the entrance paving and raised beds.
export function walkwaySurface(x,z) {
  const side = Math.abs(x);
  if (side >= 8.25 && side <= 18.75 && z >= 7.25 && z <= 26.75) return .35;
  if (side >= 8 && side <= 19 && z >= 7 && z <= 27) return .26;
  if (Math.abs(z-32) <= 1.2) return .19;
  if (side < 2.5 && z >= 0 && z <= 20) return .17;
  if (side > 5.6 && side < 7.6 && z >= 2 && z <= 32) return .185;
  return z <= 35 ? .14 : .02;
}

export function createMapleLeafFall(THREE, trees, crown, geometry, material, palette, random) {
  const mesh = new THREE.InstancedMesh(geometry, material, 32);
  mesh.name = 'FallingMapleLeaves';
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 9, 21), 29);
  const transform = new THREE.Object3D(), sample = new THREE.Vector3();
  const foliage = crown.attributes.position;
  // Sample actual foliage on the branches overhanging the promenade.
  const sources = [];
  for (const tree of trees) {
    tree.updateMatrix();
    const branches = [];
    for (let i = 0; i < foliage.count; i += 17) {
      sample.fromBufferAttribute(foliage,i).applyMatrix4(tree.matrix);
      if (Math.abs(sample.x) < 7 && sample.y > 4 && sample.z > 6 && sample.z < 31)
        branches.push(sample.clone());
    }
    if (branches.length) sources.push(branches);
  }
  if (!sources.length) throw new Error('No overhanging maple foliage found.');
  const leaves = Array.from({length: mesh.count}, (_, i) => {
    mesh.setColorAt(i, new THREE.Color(palette[i % palette.length]));
    return {tree: i % sources.length};
  });
  const tau = Math.PI * 2;
  function release(leaf) {
    const branches = sources[leaf.tree];
    const origin = branches[Math.floor(random()*branches.length)];
    leaf.x = origin.x; leaf.y = origin.y; leaf.z = origin.z;
    leaf.phase = random()*tau;
    leaf.flutter = 2.2 + random()*2.7;
    leaf.drift = .15 + random()*.45;
    leaf.speed = .65 + random()*.65;
    leaf.scale = .085 + random()*.058;
    leaf.heading = random()*tau;
    leaf.age = 0;
    leaf.landed = 0;
    leaf.rest = 2 + random()*4;
  }
  for (const leaf of leaves) release(leaf);
  let clock = 0;
  function advance(leaf, dt) {
    leaf.age += dt;
    if (leaf.landed) {
      leaf.landed += dt;
      if (leaf.landed > leaf.rest) release(leaf);
      return;
    }
    const angle = leaf.age * leaf.flutter + leaf.phase;
    const gust = Math.sin(clock*.48 + leaf.z*.09);
    const catchAir = Math.min(1, leaf.age * 2);
    leaf.x += dt * (leaf.drift + gust*.42 + catchAir*.68*Math.cos(angle));
    leaf.z += dt * (.05 + .21*gust + catchAir*.38*Math.sin(angle*.73));
    leaf.y -= dt * leaf.speed * (.25 + .75*catchAir) * (1 + .35*Math.cos(2*angle));
    const floor = walkwaySurface(leaf.x,leaf.z) + leaf.scale*.105 + .006;
    if (leaf.y <= floor) {
      leaf.y = floor;
      leaf.landed = .001;
    }
  }
  // Stagger the initial ages so entering the scene catches a fall already in progress.
  leaves.forEach(leaf => {
    const steps = Math.floor(random() * leaf.y / leaf.speed * 10);
    for (let i = 0; i < steps; i++) advance(leaf,.1);
  });
  return {
    mesh,
    update(dt) {
      clock += dt;
      leaves.forEach((leaf, i) => {
        advance(leaf,dt);
        const flightTime = leaf.age - leaf.landed;
        const angle = flightTime * leaf.flutter + leaf.phase;
        const settle = Math.max(0, 1-leaf.landed*3.5);
        transform.position.set(leaf.x,leaf.y,leaf.z);
        transform.rotation.set(-Math.PI/2 + settle*.85*Math.sin(angle),
          leaf.heading + flightTime*.44, settle*.54*Math.sin(angle*.71), 'YXZ');
        const fade = leaf.landed ? Math.min(1,(leaf.rest-leaf.landed)*2.5) : 1;
        transform.scale.setScalar(leaf.scale*Math.max(0,fade));
        transform.updateMatrix();
        mesh.setMatrixAt(i,transform.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  };
}
