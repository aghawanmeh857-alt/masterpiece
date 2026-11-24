import { createScenicPlantings } from '../3D/scenic-plantings.js';
import { mergeStaticMeshes } from './static-meshes.js';
import { createRoomArt } from './room-art.js';
import { createWelcome, isPresenter, loadInteriorPeople } from './interior-people.js';
import { addTowerBillboard } from './exterior-lod.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  TOUR_STOPS,
  TOUR_END,
  RECEPTION_TIME as receptionTime,
  advanceTour,
  roomAtTourTime,
  createTourPath,
  nextRenderScale
} from './tour-motion.js';
import { doorProximity, advanceDoor } from './door-motion.js';
import { createStreetLife } from './street-life.js';
import { createCityAircraft } from './aircraft.js';
import { createCityTraffic } from './city-traffic.js';
import { createAccessRoads } from './access-roads.js';
import { createDescentClouds } from './descent-clouds.js';
import { HEADQUARTERS_MODEL, placeHeadquartersModel } from '../3D/model-layout.js';
import { createHeadquartersLighting } from '../3D/headquarters-lighting.js';
import { createAutumnWalk } from '../3D/autumn-walk.js';
import { createPlazaFountain } from '../3D/plaza-fountain.js';
import { loadRealisticFurniture } from '../3D/realistic-furniture.js';
import { createTourInterior, INTERIOR_FLOOR } from '../3D/tour-interior.js';
import { createCoastalEnvironment } from './coastal-environment.js';
import { createOutdoorFacilities } from './outdoor-facilities.js';
import { TOUR_CAMERA_PATH } from './tour-camera-path.js';

export async function createBuildingTour(
  container,
  {
    reducedMotion = false,
    adminPreview = false,
    onRoomChange = () => {},
    onTourProgress = () => {}
  } = {}
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c9dce9');
  scene.fog = new THREE.Fog('#c9dce9', 100, 340);
  const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.08, 820);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });
  renderer.localClippingEnabled = true;
  // Keep a bounded framebuffer so the glass, clouds and foliage don't compete
  // for fill rate during the descent on integrated graphics.
  const maxPixelRatio = () =>
    Math.min(devicePixelRatio, 1.2, Math.sqrt(850000 / (innerWidth * innerHeight)));
  let renderScale = maxPixelRatio();
  renderer.setPixelRatio(renderScale);
  let viewportWidth = innerWidth,
    viewportHeight = innerHeight;
  renderer.setSize(viewportWidth, viewportHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  // Architecture and landscaping are static; reuse their shadow map.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);
  const descentClouds = createDescentClouds(THREE, scene);
  descentClouds.setNight(document.documentElement.dataset.theme === 'dark' ? 1 : 0);
  const headquartersLighting = createHeadquartersLighting(THREE, scene);
  const ambient = new THREE.HemisphereLight('#d5e6ff', '#747568', 1.65);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff0d9', 3.5);
  sun.position.set(-30, 65, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -35,
    right: 35,
    top: 20,
    bottom: -90,
    near: 1,
    far: 160
  });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const mat = (color, metalness = 0, roughness = 0.65) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness
    });
  const navy = mat('#111e30'),
    orange = mat('#ff783d'),
    steel = mat('#50667a', 0.7, 0.32),
    wall = mat('#d1cec7'),
    floor = mat('#d0cbc1', 0.02, 0.56),
    wood = mat('#b88d61'),
    black = mat('#162233'),
    glass = new THREE.MeshStandardMaterial({
      color: '#6fa3be',
      metalness: 0.75,
      roughness: 0.085,
      envMapIntensity: 1.4
    }),
    green = mat('#42765a');
  const lightMat = new THREE.MeshStandardMaterial({
    color: '#fff0d9',
    emissive: '#fff0d9',
    emissiveIntensity: 1.1
  });

  function box(w, h, d, x, y, z, m, parent = scene) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }

  function cylinder(r, h, x, y, z, m, parent = scene) {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    parent.add(o);
    return o;
  }

  function sign(
    text,
    width,
    height,
    x,
    y,
    z,
    { size = 80, bg = '#111e30', color = '#ffffff', rotation = 0 } = {}
  ) {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = Math.round((c.width * height) / width);
    const ctx = c.getContext('2d');
    ctx.direction = 'rtl';
    const panel = ctx.createLinearGradient(0, 0, 0, c.height);
    panel.addColorStop(0, bg);
    panel.addColorStop(1, '#1e3042');
    ctx.fillStyle = panel;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(218,195,166,.48)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, c.width - 8, c.height - 8);
    ctx.fillStyle = '#e29a63';
    ctx.fillRect(c.width - 19, c.height * 0.2, 4, c.height * 0.6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.min(c.height * 0.55, size * 0.75);
    ctx.font = `700 ${fontSize}px Tajawal, Segoe UI, Arial`;
    ctx.fillStyle = color;
    ctx.fillText(text, c.width / 2, c.height * 0.54, c.width - 72);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const o = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: tex,
        toneMapped: false
      })
    );
    o.position.set(x, y, z);
    o.rotation.y = rotation;
    scene.add(o);
    return o;
  }

  const logoMaterials = [];
  let indoorLogoTexture;
  const logoTexture = new THREE.TextureLoader().load(
    new URL('../assets/branding/saei-logo.png', import.meta.url).href,
    (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      const indoorFace = document.createElement('canvas');
      indoorFace.width = texture.image.width;
      indoorFace.height = texture.image.height;
      const indoorContext = indoorFace.getContext('2d');
      indoorContext.fillStyle = '#ffffff';
      indoorContext.fillRect(0, 0, indoorFace.width, indoorFace.height);
      indoorContext.drawImage(
        texture.image,
        indoorFace.width * 0.04,
        indoorFace.height * 0.04,
        indoorFace.width * 0.92,
        indoorFace.height * 0.92
      );
      indoorLogoTexture = new THREE.CanvasTexture(indoorFace);
      indoorLogoTexture.colorSpace = THREE.SRGBColorSpace;
      indoorLogoTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      // White lettering and orange steps on a transparent face blend into the facade.
      const face = document.createElement('canvas');
      face.width = texture.image.width;
      face.height = texture.image.height;
      const context = face.getContext('2d');
      context.drawImage(
        texture.image,
        face.width * 0.025,
        face.height * 0.025,
        face.width * 0.95,
        face.height * 0.95
      );
      const pixels = context.getImageData(0, 0, face.width, face.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        if (!pixels.data[i + 3]) continue;
        // Preserve the orange brand mark, recolor the dark wordmark for glass facades.
        if (pixels.data[i] < 100 && pixels.data[i + 1] < 120 && pixels.data[i + 2] < 145) {
          pixels.data[i] = 245;
          pixels.data[i + 1] = 248;
          pixels.data[i + 2] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      texture.image = face;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.needsUpdate = true;
      logoMaterials.forEach((material) => {
        const map = material.userData.television ? indoorLogoTexture : texture;
        material.userData.dayMap = map;
        const off = requestedNight && material.userData.television;
        material.map = off ? null : map;
        material.color.set(off ? '#05070b' : '#ffffff');
        material.needsUpdate = true;
      });
    },
    undefined,
    (error) => console.warn('SAEI: logo image unavailable.', error)
  );
  function logo(width, x, y, z, television = false) {
    const c = document.createElement('canvas');
    c.width = 740;
    c.height = 296;
    const ctx = c.getContext('2d');
    if (television) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.fillStyle = television ? '#111e30' : '#f5f8ff';
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 165px Tajawal, Segoe UI, Arial';
    ctx.fillText('سعي', c.width / 2, c.height / 2);
    const fallback = new THREE.CanvasTexture(c);
    fallback.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({
      map: fallback,
      transparent: true,
      alphaTest: 0.05
    });
    material.toneMapped = false;
    material.userData.dayMap = fallback;
    material.userData.television = television;
    logoMaterials.push(material);
    const screenHeight = width * 0.3999;
    if (television) {
      box(width + 0.16, screenHeight + 0.18, 0.14, x, y, z - 0.08, mat('#111821'));
      box(width + 0.04, 0.025, 0.025, x, y - screenHeight / 2 - 0.055, z + 0.005, mat('#303a48'));
      const indicatorMaterial = new THREE.MeshBasicMaterial({
        color: '#63d8b1',
        toneMapped: false
      });
      const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), indicatorMaterial);
      indicator.position.set(x + width / 2 - 0.05, y - screenHeight / 2 - 0.055, z + 0.022);
      scene.add(indicator);
      material.userData.indicator = indicatorMaterial;
    }
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.3999), material);
    plaque.position.set(x, y, z);
    scene.add(plaque);
    return plaque;
  }

  function plant(x, z) {
    cylinder(0.32, 0.65, x, 0.33, z, navy);
    cylinder(0.045, 1, x, 1.0, z, wood);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), green);
      leaf.scale.set(1, 0.7, 0.7);
      leaf.position.set(x + Math.sin(i) * 0.25, 1.45 + (i % 3) * 0.18, z + Math.cos(i) * 0.25);
      scene.add(leaf);
    }
  }
  const people = [],
    deskGroups = [],
    interiorProps = [];

  function person(x, z, { seat = null, rotation = 0, elevation = INTERIOR_FLOOR, role = 'listener' } = {}) {
    const group = new THREE.Group();
    group.position.set(x, elevation, z);
    group.rotation.y = rotation;
    group.userData.seat = seat;
    group.userData.role = role;
    scene.add(group);
    people.push(group);
    return group;
  }

  const interior = createTourInterior(THREE, scene, {
    box,
    cylinder,
    people: person,
    props: interiorProps
  });
  const roomArt = createRoomArt(THREE, scene);
  floor.map = interior.floorMap;
  wood.map = interior.timberMap;

  function desk(x, z, pose = 1) {
    const g = interior.groupAt(x, z);
    box(2.02, 0.075, 0.92, 0, 0.7425, 0, wood, g);
    for (const a of [-0.85, 0.85]) box(0.06, 0.705, 0.72, a, 0.3525, 0, steel, g);
    box(0.82, 0.48, 0.06, 0, 1.1, -0.16, black, g);
    box(0.72, 0.38, 0.012, 0, 1.1, -0.122, glass, g);
    box(0.07, 0.14, 0.07, 0, 0.85, -0.16, steel, g);
    box(0.48, 0.026, 0.16, 0, 0.793, 0.39, navy, g);
    box(0.56, 0.11, 0.59, 0, 0.425, 0.98, black, g);
    box(0.56, 0.61, 0.11, 0, 0.78, 1.23, navy, g);
    cylinder(0.045, 0.36, 0, 0.2, 0.98, steel, g);
    cylinder(0.28, 0.06, 0, 0.04, 0.98, steel, g);
    interior.sit(g, { z: 1.05, height: 0.48, pose, role: 'typist' });
    interior.contact(g, 2.35, 1.9, 0.25);
    deskGroups.push(g);
  }
  // Concept geometry only: final meshes will come from the approved Sketchfab downloads.
  box(160, 0.3, 220, 0, -0.32, -25, mat('#68798a'));
  const slab = box(22, 0.18, 90, 0, -0.05, -39, floor);
  const floorUV = slab.geometry.attributes.uv,
    floorNormal = slab.geometry.attributes.normal;
  for (let index = 0; index < floorUV.count; index++) {
    if (floorNormal.getY(index) > 0.99)
      floorUV.setXY(index, floorUV.getX(index) * 18, floorUV.getY(index) * 72);
  }
  box(20, 0.2, 20, 0, 0.02, 10, mat('#b4b8bd'));
  box(5, 0.04, 20, 0, 0.15, 10, mat('#d8d6cd'));
  // Enclosed podium and a slender, closed skyscraper facade above its entrance.
  const towerWordmark = logo(13.2, 0, 43, 2.65);
  towerWordmark.name = 'SaeiTowerWordmark';
  towerWordmark.userData.dynamicScene = true;
  box(0.3, 4.8, 86, -10, 2.4, -40, wall);
  box(0.3, 4.8, 86, 10, 2.4, -40, wall);
  box(20, 4.8, 0.3, 0, 2.4, -83, wall);
  box(20, 0.2, 86, 0, 4.85, -40, navy);
  box(8.35, 4.8, 0.3, -5.8, 2.4, 2, glass);
  box(8.35, 4.8, 0.3, 5.8, 2.4, 2, glass);
  box(3.3, 1.35, 0.45, 0, 4.15, 2, navy);
  logo(2.7, 0, 4.05, 2.3);
  box(4.7, 0.18, 3.1, 0, 3.15, 3.3, steel);
  box(3.2, 0.08, 0.16, 0, 3.03, 4.85, lightMat);
  const doorMat = new THREE.MeshStandardMaterial({
    color: '#84adc3',
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 0.55
  });
  const doorLeft = box(1.5, 3, 0.14, -0.77, 1.5, 2.05, doorMat),
    doorRight = box(1.5, 3, 0.14, 0.77, 1.5, 2.05, doorMat);
  doorLeft.castShadow = doorRight.castShadow = false;
  const entrance = { x: 0, z: 2.05, height: 3, approach: 9.5, fullyOpen: 5.5 };
  const roomDoors = [];
  let mainDoorAmount = 0;
  function slidingRoomDoor(name, x, z, rotation, width = 5.1, height = 3.35) {
    const group = new THREE.Group();
    group.name = 'GlassDoor-' + name;
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    // All moving leaves and their trim must stay out of static geometry batches.
    group.userData.dynamicDoor = true;
    scene.add(group);
    const half = width / 2;
    const leaves = [-1, 1].map((side) => {
      const leaf = new THREE.Group();
      leaf.position.x = (side * width) / 4;
      group.add(leaf);
      box(half - 0.04, height - 0.06, 0.14, 0, height / 2, 0, doorMat, leaf);
      for (const edge of [-1, 1])
        box(0.045, height, 0.17, edge * (half / 2 - 0.025), height / 2, 0, steel, leaf);
      for (const y of [0.035, height - 0.035]) box(half, 0.07, 0.17, 0, y, 0, steel, leaf);
      // A narrow safety stripe makes the closed glass visible from both sides.
      box(half - 0.1, 0.055, 0.15, 0, 1.25, 0, steel, leaf);
      mergeStaticMeshes(THREE, leaf, mergeGeometries);
      return leaf;
    });
    for (const side of [-1, 1])
      box(0.1, height + 0.1, 0.24, side * half, height / 2, 0, steel, group);
    box(width + 0.15, 0.12, 0.3, 0, height + 0.025, 0, navy, group);
    group.traverse((node) => {
      if (node.isMesh) node.castShadow = false;
    });
    mergeStaticMeshes(THREE, group, mergeGeometries, new Set(leaves));
    roomDoors.push({ name, x, z, height, width, leaves, group, amount: 0 });
    document.documentElement.dataset.roomDoorCount = String(roomDoors.length);
  }
  box(0.1, 3, 0.1, -1.55, 1.5, 2.1, steel);
  box(0.1, 3, 0.1, 1.55, 1.5, 2.1, steel);
  plant(-4, 6);
  plant(4, 6);
  for (let z = -5; z > -82; z -= 10) {
    box(1.8, 0.04, 2.5, 0, 4.7, z, lightMat);
    const l = new THREE.PointLight('#fff0dc', 9.5, 16, 2);
    l.position.set(0, 3.8, z);
    scene.add(l);
    box(0.07, 0.015, 8, -1.75, 0.14, z, orange);
    box(0.07, 0.015, 8, 1.75, 0.14, z, orange);
  }
  // Lobby: reception, waiting lounge and a clear passage into the corridor.
  const receptionDesk = interior.reception(5, -8.7);
  const receptionSurfaces = new Map();
  receptionDesk.traverse((mesh) => {
    if (!mesh.isMesh || !mesh.material.isMeshStandardMaterial) return;
    if (!receptionSurfaces.has(mesh.material)) {
      const surface = mesh.material.clone();
      receptionSurfaces.set(mesh.material, { surface, dayColor: surface.color.clone() });
    }
    mesh.material = receptionSurfaces.get(mesh.material).surface;
  });
  const receptionPanel = wood.clone();
  receptionSurfaces.set(wood, { surface: receptionPanel, dayColor: receptionPanel.color.clone() });
  person(5, -9.85, { role: 'reception' });
  box(5.15, 4.67, 0.18, 5, 2.35, -12.03, receptionPanel);
  box(4.2, 1.58, 0.075, 5, 2.8, -11.87, navy);
  const receptionWordmark = logo(3.6, 5, 2.8, -11.81);
  plant(-7, -4);
  plant(8, -4);
  const loungeSofas = [
    interior.sofa(-7.8, -6.4, Math.PI / 2, false),
    interior.sofa(7.3, -4.8, -Math.PI / 2, true)
  ];
  interior.coffeeTable(-6.3, -6.4, Math.PI / 2);
  interior.coffeeTable(5.8, -4.8, Math.PI / 2);
  interior.carpet(-7.2, -6.4, 2.85, 3.2);
  interior.carpet(6.7, -4.8, 2.85, 3.2);
  interior.cabinet(-7, -9, 0);
  const rooms = [
    {
      id: 'freelance',
      name: 'العمل الحر',
      x: -6,
      z: -22
    },
    {
      id: 'academy',
      name: 'الأكاديمية',
      x: 6,
      z: -36
    },
    {
      id: 'internships',
      name: 'فرص التدريب',
      x: -6,
      z: -50
    },
    {
      id: 'jobs',
      name: 'الوظائف',
      x: 6,
      z: -64
    }
  ];
  for (const r of rooms) {
    const side = Math.sign(r.x),
      partition = side * 2.25;
    box(7.6, 4.7, 0.22, r.x, 2.35, r.z - 6.8, wall);
    box(7.6, 4.7, 0.22, r.x, 2.35, r.z + 6.8, wall);
    box(0.18, 4.7, 4.3, partition, 2.35, r.z - 4.7, wall);
    box(0.18, 4.7, 4.3, partition, 2.35, r.z + 4.7, wall);
    box(0.18, 1.3, 5.1, partition, 4.05, r.z, wall);
    slidingRoomDoor(r.name, partition, r.z, Math.PI / 2);
    const roomSign = sign(r.name, 5.6, 0.64, r.x, 3.83, r.z - 6.66, {
      color: '#fff1dd',
      size: 85
    });
    roomArt.hang(r.id, r.x, 2.46, r.z - 6.65, 0);
    const hallwaySign = roomSign.clone();
    hallwaySign.position.set(partition - side * 0.11, 3.72, r.z);
    hallwaySign.rotation.y = (-side * Math.PI) / 2;
    hallwaySign.scale.set(0.73, 0.69, 1);
    scene.add(hallwaySign);
    // The open bay across from each classroom forms a waiting area, clear of its doorway.
    const facing = side * Math.PI / 2;
    const wallX = -side * 9.78;
    box(0.12, 2.85, 5.4, wallX, 1.85, r.z, wood);
    const directory = sign(r.name + '   •   المدخل المقابل', 4.4, 0.65,
      wallX + side * 0.08, 2.55, r.z, { rotation: facing });
    directory.name = 'CorridorDirectory-' + r.id;
    loungeSofas.push(interior.sofa(-side * 8.55, r.z, facing, false));
    interior.coffeeTable(-side * 7.15, r.z + 0.35, facing);
    interior.carpet(-side * 7.9, r.z, 3.2, 4.2);
    plant(-side * 8.8, r.z - 2.15);
    plant(side * 8.7, r.z - 5);
    box(5, 0.04, 2.4, r.x, 4.69, r.z, lightMat);
    const l = new THREE.PointLight('#fff0dc', 17, 14, 2);
    l.position.set(r.x, 3.65, r.z);
    scene.add(l);
  }
  desk(-7.2, -24.5, 1);
  desk(-4.1, -24.5, 2);
  desk(-7.4, -19.65, 3);
  interior.cabinet(-6.7, -28.35, 1);
  roomArt.hang('lobby', -9.79, 2.48, -8.2, Math.PI / 2);
  // Academy desks, a tutor and seated learners.
  interior.classroom(4.25, -38.4, 0);
  interior.classroom(7.5, -38.4, 1);
  interior.classroom(4.25, -33.3, 1);
  interior.classroom(7.5, -33.3, 2);
  interior.podium(7.05, -40.4);
  person(7.05, -41.02, { role: 'teacher' });
  interior.cabinet(7.8, -29.6, 2, Math.PI);
  desk(-7.5, -53.7, 1);
  interior.mentorTable(-4.25, -53.45);
  interior.mentorTable(-7.35, -47.35);
  interior.cabinet(-7.75, -56.36, 3);
  interior.interview(6.4, -67.15);
  interior.sofa(8.8, -62.1, -Math.PI / 2, false);
  interior.cabinet(7.6, -57.56, 4, Math.PI);
  // Events: enclosed auditorium at the end of the same corridor.
  // A glass entrance spans the hall, leaving a central sliding doorway.
  for (const side of [-1, 1]) box(7.7, 3.35, 0.14, side * 6.15, 1.675, -70.8, doorMat);
  box(20, 1.3, 0.18, 0, 4.05, -70.8, wall);
  slidingRoomDoor('الفعاليات', 0, -70.8, 0, 4.5);
  box(15, 0.35, 3.5, 0, 0.2, -80, wood);
  box(8, 2.5, 0.15, 0, 2.9, -82.72, navy);
  sign('فعاليات سعي', 7.2, 1, 0, 3.1, -82.59, {
    color: '#ff783d',
    size: 85
  });
  const stageTop = 0.375;
  interior.carpet(-4.48, -75.03, 4.15, 6, true);
  interior.carpet(4.48, -75.03, 4.15, 6, true);
  interior.podium(2.25, -79.3, stageTop);
  roomArt.hang('events', 6.75, 2.65, -82.81, 0);
  person(2.25, -79.94, { elevation: stageTop, role: 'speaker' });
  for (let row = 0; row < 3; row++) {
    for (const [seat, x] of [-5.7, -3.25, 3.25, 5.7].entries()) {
      interior.theatreSeat(x, -73.05 - 1.9 * row, (seat + row) % 4 !== 0, ((seat + row) % 3) + 1);
    }
  }
  plant(-8, -80);
  plant(8, -80);

  let city = null,
    headquartersExterior = null;
  let streetLife = null,
    traffic = null,
    autumnWalk = null,
    plazaFountain = null,
    realisticFurniture = null,
    interiorPeople = null,
    scenicPlantings = null;
  let preparing = !adminPreview;
  const aircraft = createCityAircraft(THREE, scene, reducedMotion);
  let cityLightLevel = Number(document.documentElement.dataset.theme === 'dark');
  const localLights = [];
  function batchStaticMeshes() {
    const excluded = new Set([doorLeft, doorRight]);
    const result = mergeStaticMeshes(THREE, scene, mergeGeometries, excluded, {
      cellSize: 20,
      disposeUnused: true
    });
    document.documentElement.dataset.batchedMeshes = String(result.savedMeshes);
  }
  function registerLocalLights(root) {
    root.traverse((object) => {
      if (!object.isPointLight) return;
      object.visible = false;
      localLights.push(object);
    });
  }
  let env = null;
  let requestedNight = document.documentElement.dataset.theme === 'dark';
  let screenBrightness = requestedNight ? 0 : 1;
  const employeeExits = new Map();
  function restoreEmployees() {
    employeeExits.clear();
    people.forEach((holder) => {
      const home = holder.userData.home;
      if (!home) return;
      holder.position.copy(home.position);
      holder.rotation.y = home.rotation;
      holder.scale.setScalar(1);
      holder.userData.fadeMaterials?.forEach(({ material, opacity, transparent, depthWrite }) => {
        material.opacity = opacity;
        material.transparent = transparent;
        material.depthWrite = depthWrite;
        material.needsUpdate = true;
      });
      holder.userData.mixer?.stopAllAction();
      holder.userData.restAction?.reset().setEffectiveWeight(1).play();
      const model = holder.children[0];
      if (model) {
        model.position.copy(home.modelPosition);
        model.scale.copy(home.modelScale);
      }
    });
  }
  function beginEmployeeExits() {
    restoreEmployees();
    people.forEach((holder, index) => {
      if (!holder.userData.mixer) return;
      const direction = Math.abs(holder.position.x) > 1 ? -Math.sign(holder.position.x) : 0;
      const target = holder.position
        .clone()
        .add(new THREE.Vector3(direction * 2.4, 0, direction ? 0 : 2.4));
      employeeExits.set(holder, {
        delay: (index % 5) * 0.45,
        points: [target],
        started: false,
        elapsed: 0
      });
    });
  }
  function employeeDoorProximity(door) {
    let proximity = 0;
    employeeExits.forEach((_, holder) => {
      proximity = Math.max(proximity, doorProximity(holder.position, door));
    });
    return proximity;
  }
  let coastal = {
    update() {},
    setNight(night) {
      cityLightLevel = Number(night);
      descentClouds.setNight(cityLightLevel);
      city?.setNight(cityLightLevel);
      headquartersLighting.setNight(cityLightLevel);
      sun.intensity = night ? 0.35 : 3.5;
      ambient.intensity = night ? 0.45 : 1.65;
      scene.background.set(night ? '#080f20' : '#87ceeb');
      scene.fog.color.copy(scene.background);
    }
  };

  const smooth = (x) => x * x * (3 - 2 * x),
    stops = TOUR_STOPS;
  let time = 0,
    disposed = false;
  // السكرول يحدّد الوجهة فقط؛ حلقة الرسم تحرّك الكاميرا تدريجيًا.
  let targetTime = 0;
  let cameraSmoothness = 0.27;
  let preview = adminPreview ? { active: false } : null;
  let previewCity = true,
    previewPeople = true;
  const cameraPath = createTourPath(TOUR_CAMERA_PATH);
  const pathPosition = new Float64Array(3);
  const pathAim = new Float64Array(3);
  const lookTarget = new THREE.Vector3();
  const floorDayColor = floor.color.clone();
  let interiorNight = -1;
  function renderTour() {
    const daylight = 1 - cityLightLevel;
    const indoors = 1 - THREE.MathUtils.smoothstep(camera.position.z, -2, 1.85);
    const nightEntrance = (1 - THREE.MathUtils.smoothstep(camera.position.z, 2.05, 5.2)) * cityLightLevel;
    const exteriorFill = ambient.intensity;
    const exteriorEnvironment = scene.environmentIntensity;
    // Compensate for the daylight blocked by the roof and facade.
    ambient.intensity = exteriorFill * (1 - 0.72 * nightEntrance) + 1.35 * indoors * daylight;
    scene.environmentIntensity *= 1 - 0.85 * nightEntrance;
    // The lobby materials are dark even when viewed from outside the entrance.
    if (interiorNight !== cityLightLevel) {
      interiorNight = cityLightLevel;
      floor.color.copy(floorDayColor).multiplyScalar(1 - 0.985 * interiorNight);
      for (const { surface, dayColor } of receptionSurfaces.values()) {
        surface.color.copy(dayColor).multiplyScalar(1 - 0.96 * interiorNight);
      }
      receptionWordmark.material.opacity = 1 - interiorNight;
    }
    renderer.render(scene, camera);
    ambient.intensity = exteriorFill;
    scene.environmentIntensity = exteriorEnvironment;
  }

  function seek(t, notify = true) {
    time = Math.max(0, Math.min(TOUR_END, t));
    cameraPath(time, pathPosition, pathAim);
    camera.position.fromArray(pathPosition);
    lookTarget.fromArray(pathAim);
    const distanceView = THREE.MathUtils.smoothstep(camera.position.y, 25, 155);
    if (camera.aspect < 0.8) lookTarget.x += 9 * distanceView;
    camera.lookAt(lookTarget);
    const bank = !reducedMotion && time < 9 ? 0.022 * Math.sin((Math.PI * time) / 9) : 0;
    if (bank) camera.rotateZ(bank);
    scene.fog.near = THREE.MathUtils.lerp(100, 190, distanceView);
    scene.fog.far = THREE.MathUtils.lerp(340, 550, distanceView);
    headquartersLighting.updateCamera(camera);
    const openingFov = (camera.aspect < 0.8 ? 70 : 55) + 3 * distanceView;
    const fov = THREE.MathUtils.lerp(
      openingFov,
      64,
      smooth(Math.max(0, Math.min(1, (time - 9.5) / 7)))
    );
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    if (!notify) return;
    document.documentElement.dataset.tourTime = time.toFixed(2);
    if (!adminPreview) {
      onRoomChange(roomAtTourTime(time));
      onTourProgress(time);
    }
  }

  function moveToTime(value) {
    const next = Math.max(0, Math.min(TOUR_END, value));
    if (next !== targetTime || !document.documentElement.dataset.tourTarget) {
      document.documentElement.dataset.tourTarget = next.toFixed(2);
    }
    targetTime = next;
    if (reducedMotion && time !== next) seek(next);
  }

  let resizeFrame = null;
  function resize() {
    if (resizeFrame !== null) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      if (viewportWidth === innerWidth && viewportHeight === innerHeight) return;
      viewportWidth = innerWidth;
      viewportHeight = innerHeight;
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
      const nextScale = Math.min(renderScale, maxPixelRatio());
      if (nextScale !== renderScale) {
        renderScale = nextScale;
        renderer.setPixelRatio(renderScale);
      }
      renderer.setSize(viewportWidth, viewportHeight, false);
      seek(time);
    });
  }
  addEventListener('resize', resize);
  seek(time);
  let previousFrame = performance.now(),
    lastRender = previousFrame,
    renderFrame = null;
  let sampleTime = 0,
    sampleFrames = 0,
    slowFrames = 0,
    stableFastTime = 0;
  let nextLightSelection = 0;
  const frustum = new THREE.Frustum();
  const viewProjection = new THREE.Matrix4();
  const characterBounds = new THREE.Sphere(new THREE.Vector3(), 1.5);
  function updateLocalLights(now) {
    if (!localLights.length || now < nextLightSelection) return;
    nextLightSelection = now + 100;
    let first = null,
      second = null,
      firstDistance = Infinity,
      secondDistance = Infinity;
    for (const light of localLights) {
      const distance = camera.position.distanceToSquared(light.position);
      if (distance < firstDistance) {
        second = first;
        secondDistance = firstDistance;
        first = light;
        firstDistance = distance;
      } else if (distance < secondDistance) {
        second = light;
        secondDistance = distance;
      }
    }
    for (const light of localLights) light.visible = light === first || light === second;
    document.documentElement.dataset.activeLocalLights = String(Math.min(2, localLights.length));
  }

  function animate(now) {
    if (disposed) return;
    renderFrame = requestAnimationFrame(animate);
    const frameMs = now - previousFrame;
    previousFrame = now;
    if (document.hidden) {
      sampleTime = sampleFrames = slowFrames = stableFastTime = 0;
      lastRender = now;
      return;
    }
    if (preparing) return;
    if (preview && !preview.active) return;
    const moving = Math.abs(targetTime - time) > 0.001 || preview?.playing;
    // Ambient effects do not need to run at the display's full refresh rate
    // while reading. Camera motion is rendered on each available frame.
    const elapsedMs = now - lastRender;
    if (!moving && elapsedMs < (reducedMotion ? 58 : 27)) return;
    lastRender = now;
    const dt = Math.min(elapsedMs / 1000, 0.05);
    if (preview?.playing) {
      preview.elapsed = Math.min(preview.duration, preview.elapsed + dt);
      // Follow the entrance portion of the existing tour, including the sliding doors.
      targetTime = (receptionTime * preview.elapsed) / preview.duration;
      if (preview.elapsed === preview.duration) preview.playing = false;
    }
    if (Math.abs(targetTime - time) > 0.0001) {
      seek(
        reducedMotion
          ? targetTime
          : advanceTour(time, targetTime, elapsedMs / 1000, cameraSmoothness)
      );
    }
    drawTourFrame(now, dt, elapsedMs);
    adaptRenderScale(frameMs);
  }

  function drawTourFrame(now, dt, elapsedMs) {
    screenBrightness = THREE.MathUtils.damp(screenBrightness, requestedNight ? 0 : 1, 3.5, dt);
    logoMaterials.forEach((material) => {
      if (!material.userData.television) return;
      const off = screenBrightness < 0.008;
      const map = off ? null : material.userData.dayMap;
      if (material.map !== map) {
        material.map = map;
        material.needsUpdate = true;
      }
      material.color.setScalar(off ? 0.002 : screenBrightness);
      material.userData.indicator?.color.set(off ? '#d15a43' : '#63d8b1');
    });
    employeeExits.forEach((exit, holder) => {
      exit.delay -= dt;
      if (exit.delay > 0) return;
      if (!exit.started) {
        exit.started = true;
        holder.userData.mixer?.stopAllAction();
        (holder.userData.walkAction || holder.userData.idleAction)?.reset().fadeIn(0.4).play();
        const model = holder.children[0];
        if (model && holder.userData.standingPosition) {
          model.position.copy(holder.userData.standingPosition);
          model.scale.setScalar(holder.userData.standingScale);
        }
      }
      exit.elapsed += dt;
      const target = exit.points[0];
      const dx = target.x - holder.position.x,
        dz = target.z - holder.position.z;
      const distance = Math.hypot(dx, dz),
        step = dt * 1.25;
      holder.rotation.y = Math.atan2(dx, dz);
      if (distance <= step) {
        holder.position.copy(target);
      } else {
        holder.position.x += (dx / distance) * step;
        holder.position.z += (dz / distance) * step;
      }
      const fade = THREE.MathUtils.clamp((exit.elapsed - 0.9) / 1.1, 0, 1);
      holder.userData.fadeMaterials?.forEach(({ material, opacity }) => {
        if (fade > 0 && !material.transparent) {
          material.transparent = true;
          material.depthWrite = false;
          material.needsUpdate = true;
        }
        material.opacity = opacity * (1 - fade);
      });
      if (fade === 1) {
        holder.visible = false;
        employeeExits.delete(holder);
      }
    });
    const exteriorVisible = previewCity && camera.position.z > -2;
    headquartersExterior?.update(camera, camera.position.z > 6.2, cityLightLevel);
    if (city) {
      city.group.visible = exteriorVisible;
      if (exteriorVisible) city.updateCamera(camera);
    }
    streetLife?.update(dt, camera, exteriorVisible, previewPeople && !requestedNight);
    traffic?.update(dt, camera, exteriorVisible);
    aircraft.update(elapsedMs / 1000, camera.position.z > 4, previewCity);
    const entranceTarget = Math.max(
      doorProximity(camera.position, entrance),
      employeeDoorProximity(entrance)
    );
    const mainDoorNext = advanceDoor(
      mainDoorAmount,
      entranceTarget,
      elapsedMs / 1000,
      reducedMotion
    );
    mainDoorAmount = mainDoorNext;
    doorLeft.position.x = -0.77 - 1.55 * mainDoorAmount;
    doorRight.position.x = 0.77 + 1.55 * mainDoorAmount;
    document.documentElement.dataset.doorOpen = String(mainDoorAmount > 0.95);
    document.documentElement.dataset.entranceDoorAmount = mainDoorAmount.toFixed(2);
    for (const door of roomDoors) {
      const dx = camera.position.x - door.x,
        dz = camera.position.z - door.z;
      door.group.visible = time > 10 && dx * dx + dz * dz < 35 * 35;
      const target = Math.max(doorProximity(camera.position, door), employeeDoorProximity(door));
      const amount = advanceDoor(door.amount, target, elapsedMs / 1000, reducedMotion);
      door.amount = amount;
      door.leaves.forEach((leaf, index) => {
        const side = index === 0 ? -1 : 1;
        leaf.position.x = side * (door.width / 4 + (door.width / 2 + 0.06) * amount);
      });
    }
    document.documentElement.dataset.roomDoors = JSON.stringify(
      roomDoors.map((door) => ({ name: door.name, open: Number(door.amount.toFixed(2)) }))
    );
    camera.updateMatrixWorld();
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(viewProjection);
    let activePeople = 0;
    people.forEach((holder) => {
      const mixer = holder.userData.mixer;
      if (!previewPeople || (requestedNight && !employeeExits.has(holder))) {
        holder.visible = false;
        return;
      }
      characterBounds.center.copy(holder.position);
      characterBounds.center.y += 1;
      const distance = camera.position.distanceToSquared(characterBounds.center);
      holder.visible = distance < 28 * 28 && frustum.intersectsSphere(characterBounds);
      if (holder.userData.welcome) {
        if (!reducedMotion && holder.userData.welcome(dt, holder.visible, distance)) activePeople++;
        return;
      }
      if (reducedMotion || !holder.visible || distance > 18 * 18) return;
      if (holder.userData.updateGesture) holder.userData.updateGesture(dt);
      else if (mixer) mixer.update(dt);
      else return;
      activePeople++;
    });
    // Keep the high-detail furniture out of the draw list until the entrance opens.
    const interiorVisible = camera.position.z < entrance.z + entrance.fullyOpen;
    for (const group of interiorProps)
      group.visible = interiorVisible && camera.position.distanceToSquared(group.position) < 30 * 30;
    // Stop invisible ocean geometry updates after entering the building.
    descentClouds.update(camera, reducedMotion ? 0 : dt);
    coastal.update(dt, camera, camera.position.z > -2, previewPeople && !requestedNight);
    const outsideEntrance = camera.position.z > 1.85;
    // Keep the full maple meshes for the trees nearest the walkway camera.
    const landscapeDetail = THREE.MathUtils.lerp(
      0.42, 0.6, THREE.MathUtils.smoothstep(renderScale, 0.5, 0.85)
    );
    autumnWalk?.update(dt, outsideEntrance, camera, landscapeDetail);
    scenicPlantings?.update(
      camera,
      previewCity && outsideEntrance,
      Number(document.documentElement.dataset.dayNightProgress ?? (requestedNight ? 1 : 0))
    );
    plazaFountain?.update(dt, outsideEntrance, camera, cityLightLevel);
    updateLocalLights(now);
    renderTour();
    document.documentElement.dataset.activePeople = String(activePeople);
  }

  function adaptRenderScale(frameMs) {
    // Adapt to several slow frames, rather than treating a single loading
    // stall as a reason to change quality during the tour.
    if (frameMs > 0) {
      sampleTime += Math.min(frameMs, 250);
      sampleFrames++;
      if (frameMs >= 95) slowFrames++;
      if ((sampleTime >= 850 && sampleFrames >= 5) || slowFrames >= 3) {
        const averageFrameMs = sampleTime / sampleFrames;
        let nextScale = nextRenderScale(
          renderScale,
          averageFrameMs,
          viewportWidth * viewportHeight
        );
        const canRecover =
          averageFrameMs < 18.5 &&
          Math.abs(targetTime - time) < 0.001 &&
          document.documentElement.dataset.modelLoad === 'ready';
        stableFastTime = canRecover ? stableFastTime + sampleTime : 0;
        if (stableFastTime >= 3000 && renderScale < maxPixelRatio()) {
          nextScale = Math.min(maxPixelRatio(), renderScale * 1.12);
          stableFastTime = 0;
        }
        if (nextScale !== renderScale) {
          renderScale = nextScale;
          renderer.setPixelRatio(renderScale);
        }
        document.documentElement.dataset.renderScale = renderScale.toFixed(2);
        sampleTime = sampleFrames = slowFrames = 0;
      }
    }
  }
  batchStaticMeshes();
  registerLocalLights(scene);
  updateLocalLights(performance.now());
  renderFrame = requestAnimationFrame(animate);
  // Render the base tour immediately; model enhancements load independently.
  descentClouds.update(camera, 0);
  renderer.render(scene, camera);
  const yieldToTour = () =>
    new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  async function loadModels() {
    try {
      // Local GLB assets are bundled with the project; visitors never need to upload models.
      await yieldToTour();
      if (disposed) return;
      const generator = new THREE.PMREMGenerator(renderer);
      const studio = new RoomEnvironment();
      env = generator.fromScene(studio, 0.04);
      generator.dispose();
      studio.dispose();
      scene.environment = env.texture;
      const loader = new GLTFLoader(),
        assetRoot = './assets/3d/';
      const indoorModels = loadInteriorPeople(THREE, loader).then((result) => {
        if (disposed) result.destroy();
        else interiorPeople = result;
        return result;
      });
      const [headquarters, office, boss, woman, colleague, furnitureAssets] = await Promise.all([
        loader.loadAsync(new URL('../3D/' + HEADQUARTERS_MODEL, import.meta.url).href),
        loader.loadAsync(assetRoot + 'furniture/modern-office.glb'),

        loader.loadAsync(assetRoot + 'people/formal-boss.glb'),
        loader.loadAsync(assetRoot + 'people/formal-businesswoman.glb'),
        loader
          .loadAsync(new URL('../3D/business-male-4.glb', import.meta.url).href)
          .catch(() => null),
        loadRealisticFurniture(THREE, new GLTFLoader()).catch((error) => {
          console.warn(
            'SAEI: keeping existing furniture because the new models failed to load.',
            error
          );
          return null;
        })
      ]);
      if (disposed) {
        furnitureAssets?.destroy();
        return;
      }
      realisticFurniture = furnitureAssets;
      const tower = placeHeadquartersModel(THREE, headquarters.scene);
      scene.add(tower);
      mergeStaticMeshes(THREE, tower, mergeGeometries);
      headquartersLighting.addFacade(tower);
      headquartersLighting.setNight(cityLightLevel);
      headquartersExterior = addTowerBillboard(
        THREE,
        renderer,
        tower,
        scene,
        towerWordmark,
        headquartersLighting.setNight,
        cityLightLevel,
        reducedMotion
      );
      await yieldToTour();
      if (disposed) return;
      const outdoor = createOutdoorFacilities(THREE, scene);
      mergeStaticMeshes(THREE, outdoor, mergeGeometries, new Set(), {
        cellSize: 20,
        disposeUnused: true
      });
      registerLocalLights(outdoor);
      const setOutdoorNight = outdoor.userData.setNight;
      outdoor.userData.setNight = (amount) => {
        descentClouds.setNight(amount);
        cityLightLevel = amount;
        headquartersLighting.setNight(amount);
        if (typeof setOutdoorNight === 'function') setOutdoorNight(amount);
        city?.setNight(amount);
        traffic?.setNight(amount);
      };
      coastal = await createCoastalEnvironment(THREE, scene, {
        renderer,
        sun,
        ambient,
        outdoor,
        reducedMotion
      });
      coastal.setNight(document.documentElement.dataset.theme === 'dark', true);
      document.documentElement.dataset.buildingModel = 'free-london-skyscraper';
      document.documentElement.dataset.buildingMaterial = 'original-london-materials';
      // Extract only furniture, keeping the source room's posters and walls out of the tour.
      function collect(asset, pattern) {
        const group = new THREE.Group();
        asset.scene.updateMatrixWorld(true);
        asset.scene.traverse((n) => {
          if (n.isMesh && pattern.test(n.name)) {
            const mesh = new THREE.Mesh(n.geometry.clone().applyMatrix4(n.matrixWorld), n.material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
          }
        });
        return group;
      }

      function fit(group, width) {
        const b = new THREE.Box3().setFromObject(group),
          s = b.getSize(new THREE.Vector3()),
          c = b.getCenter(new THREE.Vector3());
        const factor = width / Math.max(s.x, s.z);
        group.scale.setScalar(factor);
        group.position.set(-c.x * factor, -b.min.y * factor, -c.z * factor);
        return group;
      }
      for (const g of deskGroups) {
        if (!furnitureAssets) continue;
        g.children.forEach((mesh) => {
          if (mesh.castShadow) mesh.geometry.dispose();
        });
        g.clear();
        g.add(furnitureAssets.desk.clone(true), furnitureAssets.chair.clone(true));
        box(0.82, 0.43, 0.043, 0, 1.1, -0.19, black, g);
        box(0.747, 0.364, 0.009, 0, 1.1, -0.166, glass, g);
        box(0.07, 0.114, 0.07, 0, 0.84, -0.19, steel, g);
        box(0.25, 0.022, 0.16, 0, 0.804, -0.19, black, g);
        box(0.48, 0.025, 0.16, 0, 0.805, 0.39, navy, g);
        interior.contact(g, 2.35, 1.9, 0.25);
      }
      if (furnitureAssets)
        for (const sofa of loungeSofas) {
          sofa.clear();
          const model = furnitureAssets.sofa.clone(true);
          // Align the imported cushion height with the lounge seat anchor.
          model.scale.y = 0.98;
          sofa.add(model);
          interior.contact(sofa, 2.35, 1.22);
        }
      // Source props provide extra plants and desk lamps, placed around the reception.
      const plants = fit(collect(office, /Window_Plant_0/), 1.3);
      for (const x of [-7.5, 8]) {
        const wrapper = new THREE.Group();
        wrapper.position.set(x, 0.05, -8);
        wrapper.add(plants.clone(true));
        wrapper.userData.dynamicScene = true;
        interiorProps.push(wrapper);
        scene.add(wrapper);
      }

      const poseBounds = new Map();
      const standingAssets = [woman, colleague || boss, boss];
      await indoorModels;
      if (disposed) return;
      let standingIndex = 0;
      function boundsForPose(clip, model) {
        if (!poseBounds.has(clip)) {
          model.updateMatrixWorld(true);
          poseBounds.set(clip, new THREE.Box3().setFromObject(model, true));
        }
        return poseBounds.get(clip);
      }
      let sliceStart = performance.now();
      for (let n = 0; n < people.length; n++) {
        if (performance.now() - sliceStart > 8) {
          await yieldToTour();
          if (disposed) return;
          sliceStart = performance.now();
        }
        const holder = people[n],
          seat = holder.userData.seat,
          standingAsset = seat ? null : standingAssets[standingIndex++ % standingAssets.length],
          asset = seat || holder.userData.role === 'reception' ? boss : standingAsset;
        holder.clear();
        const posedFigure = interiorPeople?.createFigure(holder, n);
        if (posedFigure) {
          holder.add(posedFigure);
          continue;
        }
        const model = clone(asset.scene);
        const mixer = new THREE.AnimationMixer(model);
        const idle = asset.animations.find((a) => a.name.endsWith('Idle1')) || asset.animations[0];
        const idleAction = mixer.clipAction(idle).play();
        mixer.setTime(0);
        const standing = boundsForPose(idle, model),
          scale = 1.82 / standing.getSize(new THREE.Vector3()).y;
        const seatedClip =
          seat && asset.animations.find((a) => a.name.endsWith('SitIdle' + seat.pose));
        const restClip = seatedClip || idle;
        if (seatedClip) {
          idleAction.stop();
          mixer.clipAction(restClip).play();
          mixer.setTime(0);
        }
        const b = boundsForPose(restClip, model),
          center = b.getCenter(new THREE.Vector3());
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -b.min.y * scale, -center.z * scale);
        if (seatedClip) {
          const pelvis = model.getObjectByName('Root_01');
          if (pelvis) {
            // The model's pelvis sits above the cushion surface. Anchor it in
            // X/Z and fit the pose vertically from the floor to that surface.
            // Read the pose in unscaled model coordinates.
            model.position.set(0, 0, 0);
            model.scale.setScalar(1);
            const hip = pelvis.getWorldPosition(new THREE.Vector3());
            const cushionHeight = seat.height - holder.position.y;
            const hipClearance = 0.13;
            const verticalScale = cushionHeight / (hip.y - b.min.y - hipClearance);
            model.scale.set(scale, verticalScale, scale);
            model.position.set(-hip.x * scale, -b.min.y * verticalScale, -hip.z * scale);
          }
        }
        const fadeMaterials = [];
        model.traverse((o) => {
          if (o.isMesh) {
            const copyMaterial = (source) => {
              const material = source.clone();
              material.metalness = 0;
              material.roughness = 0.86;
              material.envMapIntensity = 0.38;
              fadeMaterials.push({
                material,
                opacity: material.opacity,
                transparent: material.transparent,
                depthWrite: material.depthWrite
              });
              return material;
            };
            o.material = Array.isArray(o.material)
              ? o.material.map(copyMaterial)
              : copyMaterial(o.material);
            o.castShadow = false;
            o.receiveShadow = true;
          }
        });
        holder.userData.fadeMaterials = fadeMaterials;
        holder.add(model);
        if (holder.userData.role === 'reception') {
          const clip = asset.animations.find((action) => action.name.endsWith('Wave'));
          if (clip) {
            const wave = mixer.clipAction(clip).setEffectiveWeight(0).play();
            holder.userData.welcome = createWelcome((progress, weight) => {
              idleAction.setEffectiveWeight(1 - weight);
              wave.setEffectiveWeight(weight);
              wave.time = clip.duration * progress;
              mixer.update(0);
            });
          }
        }
        // The mixer above sampled the fallback pose. Only presenters advance it.
        if (!isPresenter(holder.userData.role)) continue;
        holder.userData.mixer = mixer;
        holder.userData.idleAction = idleAction;
        holder.userData.restAction = mixer.clipAction(restClip);
        if (seatedClip && !reducedMotion) {
          holder.userData.restAction.time = (n % 5) * restClip.duration * 0.06;
          mixer.update(0);
        }
        holder.userData.home = {
          position: holder.position.clone(),
          rotation: holder.rotation.y,
          modelPosition: model.position.clone(),
          modelScale: model.scale.clone()
        };
        const standingCenter = standing.getCenter(new THREE.Vector3());
        holder.userData.standingPosition = new THREE.Vector3(
          -standingCenter.x * scale,
          -standing.min.y * scale,
          -standingCenter.z * scale
        );
        holder.userData.standingScale = scale;
        const walkClip = asset.animations.find((a) => /walk/i.test(a.name));
        if (walkClip) holder.userData.walkAction = mixer.clipAction(walkClip);
      }
      document.documentElement.dataset.realisticPeople = String(people.length);
      document.documentElement.dataset.characterModels = colleague ? '3' : '2';
      document.documentElement.dataset.interiorFigureModels = String(interiorPeople?.count ?? 0);
      document.documentElement.dataset.furnitureModels = furnitureAssets ? '4' : '1';
      document.documentElement.dataset.realisticFurniture = furnitureAssets ? 'ready' : 'fallback';
      streetLife = createStreetLife(THREE, scene, { woman, colleague, clone, reducedMotion });

      renderer.shadowMap.needsUpdate = true;
      document.documentElement.dataset.modelLoad = 'ready';
    } catch (error) {
      console.warn('SAEI: using the base tour because model loading failed.', error);
      document.documentElement.dataset.modelLoad = 'fallback';
    }
  }
  // The street grid and city silhouettes are available before the GLBs load.
  document.documentElement.dataset.cityStatus = 'loading';
  const streetsReady = createAccessRoads(THREE, scene, { mergeGeometries, loader: new GLTFLoader() })
    .then((neighborhood) => {
      if (disposed) {
        neighborhood.destroy();
        return;
      }
      city = neighborhood;
      scene.getObjectByName('OFOQCity').visible = previewCity;
      city.setNight(cityLightLevel);
      city.updateCamera(camera);
      renderer.shadowMap.needsUpdate = true;
    })
    .catch((error) => {
      if (!disposed) document.documentElement.dataset.cityStatus = 'roads-unavailable';
      console.warn('SAEI: city models unavailable; keeping the base skyline.', error);
    });
  document.documentElement.dataset.modelLoad = 'loading';
  const modelsReady = loadModels();
  const parkReady = createScenicPlantings(THREE, scene)
    .then((plantings) => {
      if (disposed) {
        plantings.destroy();
        return;
      }
      scenicPlantings = plantings;
    })
    .catch((error) => console.warn('SAEI: optional park photographs unavailable.', error));
  const fountainReady = createPlazaFountain(THREE, scene, {
    loader: new GLTFLoader(),
    renderer,
    reducedMotion
  })
    .then((fountain) => {
      if (disposed) {
        fountain.destroy();
        return;
      }
      plazaFountain = fountain;
      const fallback = scene.getObjectByName('OFOQFountainFallback');
      if (fallback) fallback.visible = false;
      renderer.shadowMap.needsUpdate = true;
    })
    .catch((error) => {
      document.documentElement.dataset.plazaFountain = 'unavailable';
      console.warn('SAEI: imported plaza fountain could not be loaded.', error);
    });
  const landscapeReady = createAutumnWalk(THREE, scene, { loader: new GLTFLoader(), reducedMotion })
    .then((walk) => {
      if (disposed) {
        walk.destroy();
        return;
      }
      autumnWalk = walk;
      scene.traverse((node) => {
        if (node.userData.autumnReplacement) node.visible = false;
      });
      renderer.shadowMap.needsUpdate = true;
    })
    .catch((error) => {
      document.documentElement.dataset.autumnWalk = 'unavailable';
      console.warn('SAEI: autumn maples could not be loaded.', error);
    });
  const aircraftReady = aircraft.loadModel(new GLTFLoader()).catch((error) => {
    document.documentElement.dataset.aircraftSource = 'procedural-fallback';
    console.warn('SAEI: aircraft model unavailable; using the lightweight fallback.', error);
  });
  document.documentElement.dataset.trafficStatus = 'loading';
  const trafficReady = createCityTraffic(THREE, scene, {
    loader: new GLTFLoader(),
    mergeGeometries,
    reducedMotion
  })
    .then((result) => {
      if (disposed) {
        result.destroy();
        return;
      }
      traffic = result;
      traffic.setNight(requestedNight ? 1 : cityLightLevel);
    })
    .catch((error) => {
      if (!disposed) document.documentElement.dataset.trafficStatus = 'unavailable';
      console.warn('SAEI: the sedan asset could not be loaded.', error);
    });
  const ready = Promise.allSettled([
    streetsReady,
    modelsReady,
    parkReady,
    fountainReady,
    landscapeReady,
    aircraftReady,
    trafficReady
  ])
    .then(async () => {
      if (disposed) return;
      if (!adminPreview) {
        // Warm the material programs and the entrance textures while the logo is still on screen.
        await renderer.compileAsync(scene, camera);
        if (disposed) return;
        const savedTime = time;
        try {
          // Use the live render path so each preview warms the same LOD and light variants.
          const warmStops = [5.6, 7.7, 9.9, 10.6, 11.5, 12.5, 13.5, 14.2, 16.6, 17.6, 19, 62.5];
          for (const stop of [...warmStops, ...stops, TOUR_END]) {
            seek(stop, false);
            nextLightSelection = 0;
            drawTourFrame(performance.now(), 0, 0);
            await yieldToTour();
            if (disposed) return;
          }
        } finally {
          if (!disposed) {
            seek(savedTime, false);
            nextLightSelection = 0;
            drawTourFrame(performance.now(), 0, 0);
          }
        }
      }
    })
    .catch((error) => {
      if (!disposed) console.warn('SAEI: preview warm-up could not finish.', error);
    })
    .then(async () => {
      if (disposed) return;
      lastRender = performance.now();
      preparing = false;
      // Give the viewer one complete frame at the restored tour position before revealing it.
      await yieldToTour();
    });
  return {
    ready,
    configurePreview(config) {
      if (!adminPreview) return;
      if (config.theme) this.setNight(config.theme === 'dark', true);
      if (config.active === false) {
        if (preview) preview.active = false;
        return;
      }
      if (config.resume && preview) {
        preview.active = true;
        return;
      }
      const duration = Number(config.duration),
        smoothness = Number(config.smoothness);
      preview = {
        duration: Number.isFinite(duration) ? Math.max(8, Math.min(40, duration)) : 16,
        elapsed: 0,
        active: true,
        playing: Boolean(config.autoplay) && !reducedMotion
      };
      cameraSmoothness = Number.isFinite(smoothness)
        ? Math.max(0.2, Math.min(2, smoothness))
        : 0.65;
      previewCity = config.city !== false;
      previewPeople = config.people !== false;
      const cityGroup = scene.getObjectByName('OFOQCity');
      if (cityGroup) cityGroup.visible = previewCity;
      people.forEach((holder) => {
        holder.visible = previewPeople && !requestedNight;
      });
      moveToTime(0);
      seek(0);
      renderer.shadowMap.needsUpdate = true;
    },
    setNight: (night, immediate = false) => {
      const changed = requestedNight !== night;
      requestedNight = night;
      if (immediate || reducedMotion) screenBrightness = night ? 0 : 1;
      if (!night) restoreEmployees();
      else if (changed && !immediate && !reducedMotion && previewPeople) beginEmployeeExits();
      else if (immediate || reducedMotion) employeeExits.clear();
      logoMaterials.forEach((material) => {
        const off = screenBrightness < 0.008 && material.userData.television;
        material.map = off ? null : material.userData.dayMap;
        material.color.set(off ? '#05070b' : '#ffffff');
        material.userData.indicator?.color.set(off ? '#d15a43' : '#63d8b1');
        material.needsUpdate = true;
      });
      people.forEach((holder) => {
        holder.visible = previewPeople && (!night || employeeExits.has(holder));
      });
      if (immediate || document.documentElement.dataset.modelLoad !== 'ready')
        traffic?.setNight(night ? 1 : 0);
      coastal.setNight(night, immediate);
    },
    moveToTime,
    seek(value) {
      moveToTime(value);
      if (time !== targetTime) seek(targetTime);
    },
    goToRoom(index) {
      if (!Number.isInteger(index) || index < 0 || index >= stops.length || disposed) return;
      moveToTime(index === 0 && reducedMotion ? receptionTime : stops[index]);
    },
    destroy() {
      disposed = true;
      if (renderFrame !== null) cancelAnimationFrame(renderFrame);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      removeEventListener('resize', resize);
      coastal.destroy?.();
      descentClouds.destroy();
      headquartersLighting.destroy();
      headquartersExterior?.destroy();
      interior.destroy();
      for (const { surface } of receptionSurfaces.values()) surface.dispose();
      interiorPeople?.destroy();
      roomArt.destroy();
      autumnWalk?.destroy();
      scenicPlantings?.destroy();
      plazaFountain?.destroy();
      realisticFurniture?.destroy();
      city?.destroy();
      streetLife?.destroy();
      traffic?.destroy();
      aircraft.destroy();
      logoTexture.dispose();
      indoorLogoTexture?.dispose();
      logoMaterials.forEach((material) => {
        material.map?.dispose();
        material.dispose();
      });
      renderer.dispose();
      env?.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose();
      });
    }
  };
}
