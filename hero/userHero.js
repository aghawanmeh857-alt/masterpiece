import { createScenicPlantings } from '../3D/scenic-plantings.js';
import { mergeStaticMeshes } from './static-meshes.js';
import { ROOM_SECTIONS, renderRoomSections } from './room-sections.js?v=single-action-2';
// المشهد ثلاثي الأبعاد يحتاج Three.js. بقية الشاشات لا تستخدم مكتبات.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TOUR_STOPS, tourTarget, advanceTour, roomAtTourTime, nextRenderScale } from './tour-motion.js';
import { doorProximity, advanceDoor } from './door-motion.js';
import { createStreetLife, createCityAircraft } from './street-life.js';
import { createCityTraffic } from './city-traffic.js';
import { createAccessRoads } from './access-roads.js';
import { createBeachLife } from './beach-life.js';
import { HEADQUARTERS_MODEL, placeHeadquartersModel } from '../3D/model-layout.js';
import { createAutumnWalk } from '../3D/autumn-walk.js';
import { createPlazaFountain } from '../3D/plaza-fountain.js';
import { loadRealisticFurniture } from '../3D/realistic-furniture.js';
const adminPreview = new URLSearchParams(location.search).get('preview') === 'admin' && parent !== window;
if (adminPreview) document.documentElement.classList.add('admin-scene-preview');
// 1. الوضع النهاري والليلي وروابط الصفحات، دون تخزين.
window.siteThemeUrl = function (href) {
  const url = new URL(href, location.href);
  url.searchParams.set('theme', document.documentElement.dataset.theme || 'light');
  return url.href;
};
window.setSiteTheme = function (value) {
  const dark = value === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.classList.add('theme-transition');
  document.querySelector('.theme-toggle').textContent = dark ? '☀ الوضع النهاري' : '☾ الوضع الليلي';
  document.querySelector('.theme-toggle').setAttribute('aria-label', dark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي');
  const url = new URL(location.href);
  url.searchParams.set('theme', dark ? 'dark' : 'light');
  history.replaceState(null, '', url);
  document.querySelectorAll('a[href]').forEach(function (link) {
    const target = new URL(link.href);
    if (target.origin === location.origin && target.pathname.endsWith('.html')) link.href = window.siteThemeUrl(link.href);
  });
};
window.setSiteTheme(new URLSearchParams(location.search).get('theme'));
document.querySelector('.theme-toggle').addEventListener('click', function () {
  const dark = document.documentElement.dataset.theme === 'dark';
  if (sceneApi) document.getElementById(dark ? 'dayMode' : 'nightMode').click();
  else window.setSiteTheme(dark ? 'light' : 'dark');
});

// 2. أزرار الصفحة والتنقل بالسكرول.


// بيانات الغرف والفرص التجريبية.
const rooms = [
  {id:'lobby',name:'الرئيسية',caption:'أهلًا بك',action:'ابدأ رحلتك'},
  {id:'freelance',name:'العمل الحر',caption:'اصنع طريقك',action:'استكشف المشاريع'},
  {id:'academy',name:'الأكاديمية',caption:'واصل التعلّم',action:'تصفّح المسارات'},
  {id:'internships',name:'فرص التدريب',caption:'خطوتك الأولى',action:'اكتشف التدريبات'},
  {id:'jobs',name:'الوظائف',caption:'ابحث عن مكانك',action:'تصفّح الوظائف'},
  {id:'events',name:'الفعاليات',caption:'ننجز معًا',action:'استكشف الفعاليات'}
];

const $ = id => document.getElementById(id);

const reducedMotion = matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

let currentRoom = -1;
let sceneApi = null;
let renderedTourTime = 0;
const receptionTime = 19;


const chapters = [...document.querySelectorAll('.chapter')];
const buttons = [...document.querySelectorAll('[data-room]')];
const readingStops = chapters.map((chapter, index) => {
  const data = ROOM_SECTIONS[index];
  const article = document.createElement('article'); article.className = 'station-content';
  const label = document.createElement('p'); label.className = 'station-label'; label.textContent = String(index + 1).padStart(2, '0') + ' / ' + rooms[index].name;
  const title = document.createElement(index === 0 ? 'h1' : 'h2'); title.className = 'station-title'; title.innerHTML = data.title;
  const description = document.createElement('p'); description.className = 'station-description'; description.textContent = data.description;
  const services = document.createElement('div'); renderRoomSections(services, index);
  const action = document.createElement('a'); action.className = 'btn btn-orange station-action';
  const destinations = ['../Auth/Register/register.html','../Freelance/freelance.html','../Academy/academy.html','../Internships/internships.html','../Jobs/jobs.html','../Events/events.html'];
  action.href = window.siteThemeUrl(destinations[index]); action.textContent = index === 0 ? 'إنشاء حساب ←' : rooms[index].action + ' ←';
  const hint = document.createElement('p'); hint.className = 'station-scroll-hint'; hint.textContent = index === 5 ? 'تابع التمرير للوصول إلى ختام الجولة ↓' : 'تابع التمرير للانتقال إلى القسم التالي ↓';
  article.append(label, title, description, services, action, hint); chapter.append(article);
  return { chapter, article, reading: 0, travel: 0 };
});
function refreshReadingPanels() {
  readingStops.forEach((stop, index) => {
    const local = scrollY - stop.top;
    const readingLocal = local - (stop.opening || 0);
    const active = index === currentRoom && readingLocal >= -20 && readingLocal < stop.reading && (index !== 0 || renderedTourTime >= receptionTime - .5);
    const fadeDistance = Math.max(1, Math.min(180, stop.reading * .3));
    const remaining = Math.max(0, Math.min(1, (stop.reading - readingLocal) / fadeDistance));
    const opacity = remaining * remaining * (3 - 2 * remaining);
    const inert = !active || opacity < .15;
    if (stop.active !== active) {
      stop.article.classList.toggle('station-active', active);
      stop.active = active;
    }
    if (stop.inert !== inert) {
      stop.article.inert = inert;
      stop.article.setAttribute('aria-hidden', String(inert));
      stop.inert = inert;
    }
    if (!active) return;
    const nextOpacity = opacity.toFixed(3);
    const movement = Math.max(0, Math.min(1, (readingLocal - stop.hold) / (stop.reading - stop.hold)));
    const nextOffset = (movement * stop.exitDistance).toFixed(1) + 'px';
    if (stop.opacity !== nextOpacity) {
      stop.article.style.setProperty('--station-opacity', nextOpacity);
      stop.opacity = nextOpacity;
    }
    if (stop.offset !== nextOffset) {
      stop.article.style.setProperty('--reading-offset', nextOffset);
      stop.offset = nextOffset;
    }
  });
}
function measureReadingStops() {
  readingStops.forEach((stop, index) => {
    stop.opening = index === 0 ? innerHeight * 1.8 : 0;
    // Hold the panel in place first, then leave a longer reading window before travel.
    stop.hold = innerHeight * .25;
    stop.reading = stop.hold + Math.max(innerHeight * 1.75, stop.article.offsetHeight - innerHeight + 380);
    stop.travel = index === 5 ? innerHeight * .35 : innerHeight * 1.15;
    stop.chapter.style.setProperty('--station-height', (stop.opening + stop.reading + stop.travel) + 'px');
  });
  // Measure once after layout changes, never while animating the camera.
  readingStops.forEach(stop => {
    stop.top = stop.chapter.offsetTop;
    stop.exitDistance = stop.article.offsetHeight + (innerWidth < 768 ? 130 : 150);
  });
}
measureReadingStops();
const readingResizeObserver = new ResizeObserver(() => { measureReadingStops(); progressAtScroll(); });
readingStops.forEach(stop => readingResizeObserver.observe(stop.article));
document.fonts.ready.then(() => { measureReadingStops(); progressAtScroll(); });


// تحديث واجهة القسم الحالي.
function setRoom(index) {
  if (currentRoom === index) return;

  currentRoom = index;
  refreshReadingPanels();

  const room = rooms[index];
  $('counter').textContent =
    `${String(index + 1).padStart(2, '0')} / 06`;

  $('sceneCaption').textContent =
    `${room.name} / ${room.caption}`;

  buttons.forEach((button, i) => {
    button.classList.toggle('active', i === index);

    if (i === index) {
      button.setAttribute('aria-current', 'location');
    } else {
      button.removeAttribute('aria-current');
    }
  });
  showMobileRoomOverlay();
}

function jumpTo(index) {
  const y = index === 0 ? 0 : chapters[index].offsetTop;

  window.scrollTo({
    top: y,
    behavior: 'instant'
  });
  if (!sceneApi) setRoom(index);
  else if (currentRoom === index) showMobileRoomOverlay();
  sceneApi?.goToRoom?.(index);

  if (location.hash !== `#${rooms[index].id}`) {
    history.replaceState(null, '', `#${rooms[index].id}`);
  }
}

buttons.forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    jumpTo(Number(button.dataset.room));
    const navigation = button.closest('.hero-navigation');
    if (navigation && matchMedia('(max-width: 991px)').matches) {
      navigation.open = false;
      navigation.querySelector('summary').focus({ preventScroll: true });
    }
  });
});

document.querySelector('.brand').addEventListener(
  'click',
  event => {
    event.preventDefault();
    jumpTo(0);
  }
);

const mobileTour = matchMedia('(max-width: 767px)');
const tourFooter = document.querySelector('.tour-footer');
const tourCaption = document.querySelector('.scene-caption');
const tourEnd = document.getElementById('journeyEnd');
let tourEndVisible = false;
const mobileRoomLabelDuration = 3500;
let mobileOverlayExpired = false;
let mobileOverlayTimer = null;
function syncMobileTourOverlay() {
  const hide = tourEndVisible || (mobileTour.matches && mobileOverlayExpired);
  document.documentElement.classList.toggle('mobile-tour-started', hide);
  for (const element of [tourFooter, tourCaption]) {
    if (!element) continue;
    element.inert = hide;
    element.setAttribute('aria-hidden', String(hide));
  }
}
function showMobileRoomOverlay() {
  clearTimeout(mobileOverlayTimer);
  mobileOverlayExpired = false;
  syncMobileTourOverlay();
  if (mobileTour.matches && !adminPreview) {
    mobileOverlayTimer = setTimeout(() => {
      mobileOverlayExpired = true;
      syncMobileTourOverlay();
    }, mobileRoomLabelDuration);
  }
}
mobileTour.addEventListener('change', showMobileRoomOverlay);
setRoom(0);
document.getElementById('tourFooterYear').textContent = new Date().getFullYear();
document.getElementById('restartTour').addEventListener('click', () => jumpTo(0));
document.querySelector('.journey-end-brand').addEventListener('click', event => {
  event.preventDefault();
  jumpTo(0);
});

function progressAtScroll() {
  tourEndVisible = !adminPreview && scrollY + innerHeight > tourEnd.offsetTop + 60;
  document.documentElement.classList.toggle('tour-at-end', tourEndVisible);
  tourEnd.inert = !tourEndVisible;
  tourEnd.setAttribute('aria-hidden', String(!tourEndVisible));
  syncMobileTourOverlay();
  refreshReadingPanels();
  if (adminPreview) return;
  let index = 0;
  for (let i = 1; i < readingStops.length; i++) if (scrollY >= readingStops[i].top) index = i;
  const stop = readingStops[index];
  const local = scrollY - stop.chapter.offsetTop;
  const travel = Math.max(0, Math.min(1, (local - stop.opening - stop.reading) / stop.travel));
  const raw = index === 5 ? 5 : index + (travel === 0 ? 0 : .12 + .76 * travel);
  if (!sceneApi) setRoom(Math.min(5, Math.floor(raw + .12)));
  $('progress').style.width = raw / 5 * 100 + '%';
  if (index === 0) {
    const approach = Math.max(0, Math.min(1, local / stop.opening));
    const eased = approach * approach * (3 - 2 * approach);
    const journeyTime = local < stop.opening ? receptionTime * eased : receptionTime + (TOUR_STOPS[1] - receptionTime) * travel * travel * (3 - 2 * travel);
    sceneApi?.moveToTime(journeyTime);
  } else sceneApi?.move(raw);
}
let pendingScrollFrame = null;
addEventListener('scroll', () => {
  if (pendingScrollFrame !== null) return;
  pendingScrollFrame = requestAnimationFrame(() => {
    pendingScrollFrame = null;
    progressAtScroll();
  });
}, { passive: true });
addEventListener('resize', () => { measureReadingStops(); progressAtScroll(); });

function restoreRoom() {
  const index = rooms.findIndex(r => location.hash === '#' + r.id);
  if (index >= 0) {
    scrollTo({
      top: index === 0 ? 0 : chapters[index].offsetTop,
      behavior: 'instant'
    });
  }
  progressAtScroll();
}
addEventListener('hashchange', restoreRoom);
restoreRoom();
async function initScene() {

  sceneApi = await createBuildingTour($('scene'), {
    reducedMotion,
    onRoomChange: setRoom,
    onTourProgress: value => { renderedTourTime = value; refreshReadingPanels(); }
  });
  document.documentElement.dataset.sceneReady = 'true';
  function setTimeOfDay(night, immediate = false) {
    window.setSiteTheme(night ? 'dark' : 'light');
    sceneApi.setNight(night, immediate);
    $('dayMode').setAttribute('aria-pressed', String(!night));
    $('nightMode').setAttribute('aria-pressed', String(night));
  }
  setTimeOfDay(document.documentElement.dataset.theme === 'dark', true);
  document.querySelector('.theme-toggle').disabled = false;
  $('dayMode').disabled = false;
  $('nightMode').disabled = false;
  $('dayMode').addEventListener('click', () => setTimeOfDay(false));
  $('nightMode').addEventListener('click', () => setTimeOfDay(true));
  $('status').textContent = 'مرحبًا بك في SAEI';
  restoreRoom();
  if (adminPreview) {
    addEventListener('message', event => {
      if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'ofoq-preview-config') return;
      sceneApi.configurePreview(event.data);
    });
    parent.postMessage({type: 'ofoq-preview-ready'}, location.origin);
  }
}
initScene().catch(error => {
  console.error('SAEI 3D:', error);
  document.body.classList.add('fallback');
  document.querySelector('.theme-toggle').disabled = false;
  document.querySelector('.day-night-controls').hidden = true;
  $('status').textContent = 'تعذّر عرض المشهد، يمكنك فتح الأقسام من القائمة.';
  document.documentElement.dataset.sceneReady = 'false';
  if (adminPreview) parent.postMessage({type: 'ofoq-preview-error'}, location.origin);
});



// 3. الحديقة وعناصر الساحة
// محيط المبنى: ممرات مفتوحة، أشجار، جلسات، وإنارة.
// جميع الأشكال والخامات محلية؛ لا توجد تنزيلات إضافية عند فتح الصفحة.
function createOutdoorFacilities(THREE, scene) {
  const park = new THREE.Group();
  park.name = 'OFOQOutdoorFacilities';
  scene.add(park);

  const material = (color, roughness = .8, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const stone = material('#c9ccca');
  const darkStone = material('#77868c');
  const grass = material('#568068');
  const bark = material('#796049');
  const foliage = [material('#365f4b'), material('#47745a'), material('#608268')];
  const wood = material('#ad8660');
  const metal = material('#354b58', .35, .65);
  const streetLights = [];
  const lampHalos = [];
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 64;
  const haloContext = haloCanvas.getContext('2d');
  const haloGradient = haloContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  haloGradient.addColorStop(0, '#fff4cc');
  haloGradient.addColorStop(.2, '#ffcc7bcc');
  haloGradient.addColorStop(1, '#ffae4200');
  haloContext.fillStyle = haloGradient;
  haloContext.fillRect(0, 0, 64, 64);
  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  const haloMaterial = new THREE.SpriteMaterial({
    map: haloTexture, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false
  });
  const glow = new THREE.MeshStandardMaterial({
    color: '#fff1d5', emissive: '#fff1d5', emissiveIntensity: 0
  });

  function mesh(geometry, surface, position, parent = park) {
    const item = new THREE.Mesh(geometry, surface);
    item.position.set(...position);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  const box = (size, position, surface, parent) =>
    mesh(new THREE.BoxGeometry(...size), surface, position, parent);
  const cylinder = (top, bottom, height, position, surface, parent) =>
    mesh(new THREE.CylinderGeometry(top, bottom, height, 16), surface, position, parent);

  // Raised paving and planted beds leave the central entrance path clear.
  box([46, .08, 34], [0, .1, 18], stone);
  box([46, .06, 2.4], [0, .16, 32], darkStone);
  for (const side of [-1, 1]) {
    box([11, .2, 20], [side * 13.5, .16, 17], darkStone);
    box([10.5, .14, 19.5], [side * 13.5, .28, 17], grass);
    box([2, .05, 30], [side * 6.6, .16, 17], stone);
    box([8, .16, 44], [side * 17, .08, -21], grass);
  }
  // Paving joints give the plaza scale without adding a texture download.
  for (let z = 5; z <= 31; z += 3) {
    box([10, .015, .045], [0, .19, z], darkStone);
  }
  for (const x of [-3.4, 3.4]) box([.045, .015, 28], [x, .19, 18], darkStone);

  // Shared leaf geometry keeps the trees light enough for mobile devices.
  const leafGeometry = new THREE.SphereGeometry(1, 14, 10);
  function tree(x, z, scale, index) {
    const group = new THREE.Group();
    group.userData.autumnReplacement = z > 0 && Math.abs(x) < 20;
    group.visible = !(group.userData.autumnReplacement && document.documentElement.dataset.autumnWalk === 'ready');
    group.position.set(x, .35, z);
    group.scale.setScalar(scale);
    park.add(group);
    cylinder(.13, .25, 3.3, [0, 1.65, 0], bark, group);
    for (const [dx, y, dz, radius] of [
      [0, 4.4, 0, 1.5], [-.85, 3.65, .1, 1.15],
      [.8, 3.8, -.15, 1.2], [0, 3.8, .75, 1.1], [0, 5.1, 0, .95]
    ]) {
      const leaf = mesh(leafGeometry, foliage[(index + Math.round(y)) % 3], [dx, y, dz], group);
      leaf.scale.set(radius, radius * .85, radius);
    }
    const ring = mesh(new THREE.TorusGeometry(.75, .08, 8, 24), stone, [0, .02, 0], group);
    ring.rotation.x = Math.PI / 2;
  }
  let count = 0;
  for (const side of [-1, 1]) {
    for (const [x, z, size] of [[13, 9, 1], [16, 18, 1.15], [12, 26, .95], [22, 30, 1.1]]) {
      tree(side * x, z, size, count++);
    }
    for (const z of [-8, -23, -38]) tree(side * 17, z, 1.1, count++);
  }

  function bench(x, z, rotation) {
    const group = new THREE.Group();
    group.position.set(x, .18, z);
    group.rotation.y = rotation;
    park.add(group);
    for (const dz of [-.2, 0, .2]) box([2.7, .09, .16], [0, .55, dz], wood, group);
    for (const y of [.9, 1.15]) box([2.7, .17, .08], [0, y, -.36], wood, group);
    for (const dx of [-1.05, 1.05]) {
      box([.1, .55, .65], [dx, .27, 0], metal, group);
      box([.1, .8, .09], [dx, .8, -.36], metal, group);
    }
  }
  for (const side of [-1, 1]) {
    bench(side * 9.8, 14, side * Math.PI / 2);
    bench(side * 10, 23, side * Math.PI / 2);
    for (const z of [8, 20, 30]) {
      cylinder(.08, .12, 3.8, [side * 5.5, 2.05, z], metal);
      box([.7, .12, .7], [side * 5.5, 4, z], metal);
      box([.55, .08, .55], [side * 5.5, 3.92, z], glow);
      const lamp = new THREE.PointLight('#ffc27b', 0, 14, 2);
      lamp.position.set(side * 5.5, 3.75, z);
      park.add(lamp);
      streetLights.push(lamp);
      const halo = new THREE.Sprite(haloMaterial);
      halo.position.set(side * 5.5, 4.08, z);
      halo.scale.set(1.2, 1.2, 1);
      park.add(halo);
      lampHalos.push(halo);
    }
    cylinder(.34, .3, .9, [side * 7, .62, 25], metal);
    cylinder(.37, .37, .08, [side * 7, 1.11, 25], darkStone);
  }

  // A small fountain sits to the side, away from the door and camera route.
  const fountainFallback = new THREE.Group();
  fountainFallback.name = 'OFOQFountainFallback';
  fountainFallback.userData.dynamicScene = true;
  fountainFallback.visible = document.documentElement.dataset.plazaFountain !== 'ready';
  park.add(fountainFallback);
  cylinder(3.5, 3.5, .28, [-24, .24, 15], stone, fountainFallback);
  const rim = mesh(new THREE.TorusGeometry(3.15, .18, 10, 40), darkStone, [-24, .45, 15], fountainFallback);
  rim.rotation.x = Math.PI / 2;
  const water = new THREE.MeshPhysicalMaterial({
    color: '#6bafb9', roughness: .15, metalness: .15, clearcoat: 1
  });
  cylinder(2.98, 2.98, .035, [-24, .39, 15], water, fountainFallback);
  cylinder(.28, .45, 1.25, [-24, .98, 15], stone, fountainFallback);
  cylinder(1.15, 1.15, .12, [-24, 1.62, 15], darkStone, fountainFallback);
  cylinder(1.02, 1.02, .03, [-24, 1.7, 15], water, fountainFallback);

  // Visitor bicycle parking on the opposite side of the plaza.
  box([5, .1, 2.4], [24, .1, 14], stone);
  for (const x of [22.5, 24, 25.5]) {
    cylinder(.055, .055, .8, [x - .35, .55, 14], metal);
    cylinder(.055, .055, .8, [x + .35, .55, 14], metal);
    box([.8, .11, .11], [x, .95, 14], metal);
  }
  document.documentElement.dataset.outdoorTrees = String(count);
  document.documentElement.dataset.outdoorFacilities = 'benches,lights,fountain,bicycle-parking,gardens';
  park.userData.setNight = amount => {
    const level = Math.max(0, Math.min(1, Number(amount)));
    glow.emissiveIntensity = 2.8 * level;
    streetLights.forEach(light => { light.intensity = 45 * level; });
    haloMaterial.opacity = level;
    lampHalos.forEach(halo => { halo.visible = level > .001; });
    document.documentElement.dataset.streetLightsOn = String(level > .001);
    document.documentElement.dataset.streetLightLevel = level.toFixed(4);
    document.documentElement.dataset.streetLightCount = String(streetLights.length);
  };
  return park;
}


// 4. البحر والسماء وحركة الشمس والقمر

// Coast, sky and day/night lighting. Downloaded props remain in 3D animation.
async function createCoastalEnvironment(THREE, scene, { renderer, sun, ambient, outdoor, reducedMotion }) {
  const coast = new THREE.Group();
  coast.name = 'OFOQCoast';
  scene.add(coast);
  const sandMaterial = new THREE.MeshStandardMaterial({ color: '#e5cf9e', roughness: .96 });
  const pathMaterial = new THREE.MeshStandardMaterial({ color: '#d8d5ca', roughness: .85 });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: '#a97c50', roughness: .8 });

  function box(size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.receiveShadow = true;
    coast.add(mesh);
    return mesh;
  }

  // Curved sand strip to the left of the entrance plaza.
  const sand = new THREE.PlaneGeometry(36, 150, 18, 55);
  sand.rotateX(-Math.PI / 2);
  const sandPositions = sand.attributes.position;
  for (let i = 0; i < sandPositions.count; i++) {
    const z = sandPositions.getZ(i);
    const ratio = (sandPositions.getX(i) + 18) / 36;
    const shore = -63 + Math.sin(z * .045) * 2.6;
    sandPositions.setXYZ(i, shore + ratio * (-28 - shore), -.10 + ratio * .34, z - 5);
  }
  sand.computeVertexNormals();
  const beach = new THREE.Mesh(sand, sandMaterial);
  beach.receiveShadow = true;
  coast.add(beach);
  const beachLife = createBeachLife(THREE, coast, { reducedMotion, mergeGeometries });

  // Promenade and a short boardwalk link the coast to the existing plaza.
  box([4, .16, 148], [-28, .20, -5], pathMaterial);
  box([18, .12, 3.2], [-31, .26, 26], woodMaterial);
  for (let x = -39; x <= -23; x += 1) box([.035, .02, 3.2], [x, .33, 26], pathMaterial);

  const waterGeometry = new THREE.PlaneGeometry(245, 320, 80, 65);
  waterGeometry.rotateX(-Math.PI / 2);
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: '#147d9a', roughness: .24, metalness: .28
  });
  const ocean = new THREE.Mesh(waterGeometry, waterMaterial);
  ocean.name = 'OFOQOcean';
  ocean.position.set(-180, -.05, -5);
  ocean.receiveShadow = true;
  coast.add(ocean);

  // A narrow, irregular foam edge follows the shoreline.
  const foamPositions = [];
  for (let z = -79; z < 70; z += 1.2) {
    const edge = -63 + Math.sin((z + 5) * .045) * 2.6;
    foamPositions.push(edge + .7, -.01, z, edge + 1.2, -.01, z);
  }
  const foamGeometry = new THREE.BufferGeometry();
  foamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(foamPositions, 3));
  const foamMaterial = new THREE.LineBasicMaterial({ color: '#d8f5ed', transparent: true, opacity: .55 });
  const foam = new THREE.LineSegments(foamGeometry, foamMaterial);
  coast.add(foam);

  // Smooth sand color variation comes from vertex colors, without texture files.
  const sandColors = [];
  for (let i = 0; i < sandPositions.count; i++) {
    const variation = .96 + Math.sin(i * 1.73) * .035;
    sandColors.push(variation, variation, variation);
  }
  sand.setAttribute('color', new THREE.Float32BufferAttribute(sandColors, 3));
  sandMaterial.vertexColors = true;

  const loader = new GLTFLoader();
  const root = new URL('./assets/3d/environment/', import.meta.url).href;
  const [palmAsset, tableAsset] = await Promise.all([
    loader.loadAsync(root + 'palm-tree.glb'),
    loader.loadAsync(root + 'beach-table.glb')
  ]);

  function placeModel(source, height, x, z, rotation = 0) {
    const holder = new THREE.Group();
    const model = source.clone(true);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = height / size.y;
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    model.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach(material => {
          material.metalness = Math.min(material.metalness || 0, .1);
          material.roughness = Math.max(material.roughness || .8, .65);
        });
      }
    });
    holder.add(model);
    holder.position.set(x, .23, z);
    holder.rotation.y = rotation;
    coast.add(holder);
    return holder;
  }

  for (let i = 0; i < 9; i++) {
    placeModel(palmAsset.scene, 7 + i % 3, -34 - i % 2 * 3, -55 + i * 14, i * .8);
  }
  for (let i = 0; i < 5; i++) {
    placeModel(tableAsset.scene, 3.5, -45 - i % 2 * 4, -39 + i * 20, i * .65);
  }

  // A single scene background controls the entire sky in both modes.
  // No dome material can retain a different color above this background.

  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, depthWrite: false, fog: false }));
  sunDisc.position.set(-90, 75, -100);
  scene.add(sunDisc);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4.5, 24, 16), new THREE.MeshStandardMaterial({
    color: '#d8e0f1', emissive: '#b9c8e9', emissiveIntensity: .6, roughness: 1, transparent: true, depthWrite: false, fog: false
  }));
  moon.position.copy(sunDisc.position);
  scene.add(moon);
  const craterMaterial = new THREE.MeshBasicMaterial({ color: '#9baac6', transparent: true, depthWrite: false, fog: false });
  for (const [x, y, z, radius] of [[-1, 1, 4.2, .6], [1.4, -.8, 3.9, .85], [-1.5, -1.6, 3.7, .45]]) {
    const crater = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), craterMaterial);
    crater.scale.z = .14;
    crater.position.set(x, y, z);
    moon.add(crater);
  }

  const clouds = new THREE.Group();
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .65, fog: false });
  for (const [x, y, z] of [[-120, 65, -80], [-40, 85, -125], [70, 80, -120]]) {
    const cloud = new THREE.Group();
    cloud.position.set(x, y, z);
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 8), cloudMaterial);
      puff.position.set(i * 7 - 10, i % 2 * 2, 0);
      puff.scale.set(1.4, .6, .9);
      cloud.add(puff);
    }
    clouds.add(cloud);
  }
  scene.add(clouds);

  const starsGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 180; i++) {
    const angle = i * 2.39996;
    const elevation = .12 + (i % 67) / 67 * .85;
    const radius = Math.sqrt(1 - elevation * elevation) * 195;
    starPositions.push(Math.cos(angle) * radius, elevation * 195, Math.sin(angle) * radius);
  }
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: '#d5e3ff', size: .65, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  scene.add(stars);

  const moonLight = new THREE.DirectionalLight('#9db8ee', .8);
  moonLight.position.copy(moon.position);
  scene.add(moonLight);

  // One value controls the whole scene: 0 is day, 1 is night.
  const transitionDuration = 6;
  let nightAmount = 0;
  let transitionStart = 0;
  let transitionTarget = 0;
  let transitionTime = transitionDuration;
  let transitionStartedAt = 0;
  let transitionFrame = null;
  let destroyed = false;
  const dayAmbient = new THREE.Color('#d5e6ff');
  const nightAmbient = new THREE.Color('#9db7e2');
  const dayFog = new THREE.Color('#87ceeb');
  const nightFog = new THREE.Color('#080f20');
  const daySky = new THREE.Color('#87ceeb');
  const nightSky = new THREE.Color('#080f20');
  const dayWater = new THREE.Color('#147d9a');
  const nightWater = new THREE.Color('#164466');

  function applyTimeOfDay(amount) {
    nightAmount = amount;
    const daylight = 1 - amount;


    // The sun sets while the moon rises; both follow a small arc.
    const arc = Math.sin(amount * Math.PI) * 15;
    sunDisc.position.set(-90 - arc, 75 - 110 * amount, -100);
    moon.position.set(-90 + arc, -35 + 110 * amount, -100);
    // Keep each body visible during its journey; fade only near the horizon.
    const sunOpacity = THREE.MathUtils.smoothstep(sunDisc.position.y, -5, 10);
    const moonOpacity = THREE.MathUtils.smoothstep(moon.position.y, -5, 10);
    sunDisc.material.opacity = sunOpacity;
    moon.material.opacity = moonOpacity;
    craterMaterial.opacity = moonOpacity;
    sunDisc.visible = sunOpacity > 0;
    moon.visible = moonOpacity > 0;
    sun.intensity = 3.5 * daylight;
    const daylightShadows = amount < .98;
    if (sun.castShadow !== daylightShadows) {
      sun.castShadow = daylightShadows;
      renderer.shadowMap.needsUpdate = true;
    }
    moonLight.intensity = .8 * amount;
    moonLight.position.copy(moon.position);
    cloudMaterial.opacity = .65 * daylight;
    stars.material.opacity = amount;
    ambient.intensity = THREE.MathUtils.lerp(1.65, .45, amount);
    ambient.color.copy(dayAmbient).lerp(nightAmbient, amount);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.15, 1.05, amount);
    scene.environmentIntensity = THREE.MathUtils.lerp(.85, .16, amount);
    scene.fog.color.copy(dayFog).lerp(nightFog, amount);
    // Match every uncovered part of the sky to the same day/night transition.
    scene.background.copy(daySky).lerp(nightSky, amount);
    waterMaterial.color.copy(dayWater).lerp(nightWater, amount);
    foamMaterial.opacity = THREE.MathUtils.lerp(.55, .22, amount);
    // Optional street-light integration must never stop the sky transition.
    if (typeof outdoor?.userData?.setNight === 'function') {
      outdoor.userData.setNight(amount);
    }

    const state = document.documentElement.dataset;
    state.dayNightProgress = amount.toFixed(4);
    state.dayNightTransitioning = String(transitionTime < transitionDuration);
    state.sunVisible = String(sunDisc.visible);
    state.moonVisible = String(moon.visible);
    state.sunHeight = sunDisc.position.y.toFixed(2);
    state.moonHeight = moon.position.y.toFixed(2);
  }

  function advanceTransition() {
    transitionFrame = null;
    if (destroyed) return;
    transitionTime = Math.min((performance.now() - transitionStartedAt) / 1000, transitionDuration);
    const progress = transitionTime / transitionDuration;
    const eased = progress * progress * (3 - 2 * progress);
    applyTimeOfDay(THREE.MathUtils.lerp(transitionStart, transitionTarget, eased));
    if (transitionTime < transitionDuration) {
      transitionFrame = requestAnimationFrame(advanceTransition);
    }
  }

  function setNight(night, immediate = false) {
    if (destroyed) return;
    const target = night ? 1 : 0;
    // The button and theme observer can request the same state in one turn.
    if (!immediate && target === transitionTarget && transitionTime < transitionDuration) return;
    if (transitionFrame !== null) cancelAnimationFrame(transitionFrame);
    transitionFrame = null;
    transitionStart = nightAmount;
    transitionStartedAt = performance.now();
    transitionTarget = target;
    transitionTime = immediate || reducedMotion || transitionStart === target ? transitionDuration : 0;
    document.documentElement.dataset.timeOfDay = night ? 'night' : 'day';
    applyTimeOfDay(transitionTime === transitionDuration ? target : nightAmount);
    if (transitionTime < transitionDuration) {
      transitionFrame = requestAnimationFrame(advanceTransition);
    }
  }

  const positions = waterGeometry.attributes.position;
  let elapsed = 0;
  function update(dt, camera, oceanVisible = true, peopleVisible = true) {
    if (destroyed) return;
    beachLife.update(dt, oceanVisible, peopleVisible);
    // Reconcile both directions with the visible page, including late model loading.
    const nightRequested = document.documentElement.dataset.theme === 'dark';
    if (Number(nightRequested) !== transitionTarget) setNight(nightRequested);

    if (reducedMotion || !oceanVisible) return;
    elapsed += dt;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i);
      positions.setY(i, Math.sin(x * .18 + elapsed * .8) * .065 + Math.sin(z * .16 - elapsed * .65) * .045);
    }
    positions.needsUpdate = true;
    // The normal field is almost flat; no expensive per-frame recomputation.
    foam.position.x = Math.sin(elapsed * .7) * .35;
  }

  // Follow the visible page mode even when models finish loading later.
  setNight(document.documentElement.dataset.theme === 'dark', true);
  const themeObserver = new MutationObserver(() => {
    setNight(document.documentElement.dataset.theme === 'dark');
  });
  themeObserver.observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme']
  });
  const coastalBatches = mergeStaticMeshes(THREE, coast, mergeGeometries, new Set([ocean, beachLife.group])).geometries;
  document.documentElement.dataset.coastalModels = 'palm-tree,beach-table';
  document.documentElement.dataset.beachPalms = '9';
  document.documentElement.dataset.beachTables = '5';
  return {
    setNight, update,
    destroy() {
      destroyed = true;
      beachLife.destroy();
      coastalBatches.forEach(geometry => geometry.dispose());
      themeObserver.disconnect();
      if (transitionFrame !== null) cancelAnimationFrame(transitionFrame);
    }
  };
}


// 6. بناء المشهد وحركة الكاميرا والأداء.
async function createBuildingTour(container, {
  reducedMotion = false,
  onRoomChange = () => {},
  onTourProgress = () => {}
} = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c9dce9');
  scene.fog = new THREE.Fog('#c9dce9', 100, 260);
  const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, .08, 250);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });
  renderer.localClippingEnabled = true;
  renderer.setSize(innerWidth, innerHeight);
  const maxPixelRatio = () => Math.min(devicePixelRatio, 1.25, Math.sqrt(1200000 / (innerWidth * innerHeight)));
  let renderScale = maxPixelRatio();
  renderer.setPixelRatio(renderScale);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  // Architecture and landscaping are static; reuse their shadow map.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);
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
  sun.shadow.bias = -.0005;
  scene.add(sun);
  const mat = (color, metalness = 0, roughness = .65) => new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness
  });
  const navy = mat('#111e30'),
    orange = mat('#ff783d'),
    steel = mat('#50667a', .7, .32),
    wall = mat('#d7dbe0'),
    floor = mat('#a8b5c1'),
    wood = mat('#b88d61'),
    black = mat('#162233'),
    glass = new THREE.MeshStandardMaterial({
      color: '#6fa3be',
      metalness: .75,
      roughness: .085,
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

  function sign(text, width, height, x, y, z, {
    size = 80,
    bg = '#111e30',
    color = '#ffffff',
    rotation = 0
  } = {}) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.round(1024 * height / width);
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `750 ${size}px Segoe UI,Arial`;
    ctx.fillStyle = color;
    ctx.fillText(text, c.width / 2, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const o = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide
    }));
    o.position.set(x, y, z);
    o.rotation.y = rotation;
    scene.add(o);
    return o;
  }

  const logoMaterials = [];
  let indoorLogoTexture;
  const logoTexture = new THREE.TextureLoader().load(new URL('../assets/branding/saei-logo.png', import.meta.url).href,
    texture => {
      if (disposed) { texture.dispose(); return; }
      const indoorFace = document.createElement('canvas');
      indoorFace.width = texture.image.width; indoorFace.height = texture.image.height;
      const indoorContext = indoorFace.getContext('2d');
      indoorContext.fillStyle = '#ffffff';
      indoorContext.fillRect(0, 0, indoorFace.width, indoorFace.height);
      indoorContext.drawImage(texture.image, indoorFace.width * .04, indoorFace.height * .04, indoorFace.width * .92, indoorFace.height * .92);
      indoorLogoTexture = new THREE.CanvasTexture(indoorFace);
      indoorLogoTexture.colorSpace = THREE.SRGBColorSpace;
      indoorLogoTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      // White lettering and orange steps on a transparent face blend into the facade.
      const face = document.createElement('canvas');
      face.width = texture.image.width; face.height = texture.image.height;
      const context = face.getContext('2d');
      context.drawImage(texture.image, face.width * .025, face.height * .025, face.width * .95, face.height * .95);
      const pixels = context.getImageData(0, 0, face.width, face.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        if (!pixels.data[i + 3]) continue;
        // Preserve the orange brand mark, recolor the dark wordmark for glass facades.
        if (pixels.data[i] < 100 && pixels.data[i + 1] < 120 && pixels.data[i + 2] < 145) {
          pixels.data[i] = 245; pixels.data[i + 1] = 248; pixels.data[i + 2] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      texture.image = face;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.needsUpdate = true;
      logoMaterials.forEach(material => { const map = material.userData.television ? indoorLogoTexture : texture; material.userData.dayMap = map; const off = requestedNight && material.userData.television; material.map = off ? null : map; material.color.set(off ? '#05070b' : '#ffffff'); material.needsUpdate = true; });
    }, undefined, error => console.warn('SAEI: logo image unavailable.', error));
  function logo(width, x, y, z, television = false) {
    const c = document.createElement('canvas'); c.width = 740; c.height = 296;
    const ctx = c.getContext('2d');
    if (television) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.fillStyle = television ? '#111e30' : '#f5f8ff'; ctx.textAlign = 'center'; ctx.font = 'bold 80px Arial';
    ctx.fillText('SAEI', 370, 175);
    const fallback = new THREE.CanvasTexture(c); fallback.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({map: fallback, transparent: true, alphaTest: .05});
    material.toneMapped = false;
    material.userData.dayMap = fallback;
    material.userData.television = television;
    logoMaterials.push(material);
    const screenHeight = width * .39990;
    if (television) {
    box(width + .16, screenHeight + .18, .14, x, y, z - .08, mat('#111821'));
    box(width + .04, .025, .025, x, y - screenHeight / 2 - .055, z + .005, mat('#303a48'));
    const indicatorMaterial = new THREE.MeshBasicMaterial({color:'#63d8b1',toneMapped:false});
    const indicator = new THREE.Mesh(new THREE.SphereGeometry(.015,8,6), indicatorMaterial);
    indicator.position.set(x + width / 2 - .05, y - screenHeight / 2 - .055, z + .022);scene.add(indicator);
    material.userData.indicator = indicatorMaterial;
    }
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.39990), material);
    plaque.position.set(x, y, z); scene.add(plaque);
  }

  function plant(x, z) {
    cylinder(.32, .65, x, .33, z, navy);
    cylinder(.045, 1, x, 1.0, z, wood);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.45, 8, 6), green);
      leaf.scale.set(1, .7, .7);
      leaf.position.set(x + Math.sin(i) * .25, 1.45 + (i % 3) * .18, z + Math.cos(i) * .25);
      scene.add(leaf);
    }
  }
  const people = [],
    deskGroups = [], interiorProps = [];

 function person(x, z, { seated = false, rotation = 0 } = {}) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    group.userData.seated = seated;
    scene.add(group);
    people.push(group);
    return group;
  }

  function desk(x, z, {
    rotation = 0,
    personColor = '#4b7eaf'
  } = {}) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotation;
    scene.add(g);
    box(2.15, .14, 1.05, 0, 1.12, 0, wood, g);
    for (const a of [-.85, .85]) box(.09, 1.08, .72, a, .54, 0, steel, g);
    box(.82, .52, .08, 0, 1.32, -.25, black, g);
    box(.72, .42, .012, 0, 1.32, -.202, new THREE.MeshStandardMaterial({
      color: '#75bdd8',
      emissive: '#2c6586',
      emissiveIntensity: .6
    }), g);
    box(.08, .22, .08, 0, .96, -.25, steel, g);
    box(.65, .025, .21, 0, 1.21, .17, navy, g);
    box(.55, .12, .58, 0, .72, .87, black, g);
    box(.55, .63, .12, 0, 1.1, 1.15, navy, g);
    cylinder(.045, .65, 0, .35, .9, steel, g);
    cylinder(.28, .06, 0, .05, .9, steel, g);
    deskGroups.push(g);
    const px = x - Math.sin(rotation) * .85,
      pz = z + Math.cos(rotation) * .85;
    person(px, pz, {
      seated: true,
      color: personColor,
      rotation
    });
  }
  // Concept geometry only: final meshes will come from the approved Sketchfab downloads.
  box(160, .3, 220, 0, -.32, -25, mat('#68798a'));
  box(22, .18, 90, 0, -.05, -39, floor);
  box(20, .2, 20, 0, .02, 10, mat('#b4b8bd'));
  box(5, .04, 20, 0, .15, 10, mat('#d8d6cd'));
  // Enclosed podium and a slender, closed skyscraper facade above its entrance.
  logo(13.2, 0, 43, 2.3);
  const skylineFallback = [];
  for (const [x, z, h] of [
      [60, -75, 27],
      [40, -45, 36],
      [50, -110, 45],
      [34, 9, 22]
    ]) {
    skylineFallback.push(box(16, h, 16, x, h / 2, z, mat('#263c53')));
    for (let y = 2; y < h; y += 3) skylineFallback.push(box(16.1, .15, 16.1, x, y, z, steel));
  }
  box(.3, 4.8, 86, -10, 2.4, -40, wall);
  box(.3, 4.8, 86, 10, 2.4, -40, wall);
  box(20, 4.8, .3, 0, 2.4, -83, wall);
  box(20, .2, 86, 0, 4.85, -40, navy);
  box(8.35, 4.8, .3, -5.8, 2.4, 2, glass);
  box(8.35, 4.8, .3, 5.8, 2.4, 2, glass);
  box(3.3, 1.35, .45, 0, 4.15, 2, navy);
  logo(2.7, 0, 4.05, 2.3);
  box(4.7, .18, 3.1, 0, 3.15, 3.3, steel);
  box(3.2, .08, .16, 0, 3.03, 4.85, lightMat);
  const doorMat = new THREE.MeshStandardMaterial({
    color: '#84adc3',
    metalness: .3,
    roughness: .2,
    transparent: true,
    opacity: .55
  });
  const doorLeft = box(1.5, 3, .14, -.77, 1.5, 2.05, doorMat),
    doorRight = box(1.5, 3, .14, .77, 1.5, 2.05, doorMat);
  doorLeft.castShadow = doorRight.castShadow = false;
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
    const leaves = [-1, 1].map(side => {
      const leaf = new THREE.Group();
      leaf.position.x = side * width / 4;
      group.add(leaf);
      box(half - .04, height - .06, .14, 0, height / 2, 0, doorMat, leaf);
      for (const edge of [-1, 1]) box(.045, height, .17, edge * (half / 2 - .025), height / 2, 0, steel, leaf);
      for (const y of [.035, height - .035]) box(half, .07, .17, 0, y, 0, steel, leaf);
      // A narrow safety stripe makes the closed glass visible from both sides.
      box(half - .1, .055, .15, 0, 1.25, 0, steel, leaf);
      mergeStaticMeshes(THREE, leaf, mergeGeometries);
      return leaf;
    });
    for (const side of [-1, 1]) box(.1, height + .1, .24, side * half, height / 2, 0, steel, group);
    box(width + .15, .12, .3, 0, height + .025, 0, navy, group);
    group.traverse(node => { if (node.isMesh) node.castShadow = false; });
    mergeStaticMeshes(THREE, group, mergeGeometries, new Set(leaves));
    roomDoors.push({ name, x, z, height, width, leaves, group, amount: 0 });
    document.documentElement.dataset.roomDoorCount = String(roomDoors.length);
  }
  box(.1, 3, .1, -1.55, 1.5, 2.1, steel);
  box(.1, 3, .1, 1.55, 1.5, 2.1, steel);
  plant(-4, 6);
  plant(4, 6);
  for (let z = -5; z > -82; z -= 10) {
    box(1.8, .04, 2.5, 0, 4.7, z, lightMat);
    const l = new THREE.PointLight('#e2efff', 10, 16, 2);
    l.position.set(0, 3.8, z);
    scene.add(l);
    box(.07, .015, 8, -1.75, .14, z, orange);
    box(.07, .015, 8, 1.75, .14, z, orange);
  }
  // Lobby: reception, waiting lounge and a clear passage into the corridor.
  box(3.6, 1.1, 1.2, 5, .55, -8, wood);
  box(3.5, .2, .05, 5, .86, -7.37, orange);
  const receptionist = person(5, -9.05, {
    color: '#344d7a'
  });
  logo(3.4, 5, 2.8, -12, true);
  plant(-7, -4);
  plant(8, -4);
  for (let z of [-5, -8]) {
    const sofa = new THREE.Group();
    sofa.position.set(-6, .05, z);
    sofa.userData.lobbySofa = true;
    interiorProps.push(sofa);
    sofa.userData.dynamicScene = true;
    scene.add(sofa);
    box(2.8, .52, 1, 0, .6, 0, navy, sofa);
    box(2.8, .65, .18, 0, 1.1, -.43, navy, sofa);
  }
  box(1.3, .08, 1.3, -4, .5, -6.5, wood);
  cylinder(.15, .5, -4, .25, -6.5, steel);
  const rooms = [{
    name: 'العمل الحر',
    x: -6,
    z: -22
  }, {
    name: 'الأكاديمية',
    x: 6,
    z: -36
  }, {
    name: 'فرص التدريب',
    x: -6,
    z: -50
  }, {
    name: 'الوظائف',
    x: 6,
    z: -64
  }];
  for (const r of rooms) {
    const side = Math.sign(r.x),
      partition = side * 2.25;
    box(7.6, 4.7, .22, r.x, 2.35, r.z - 6.8, wall);
    box(7.6, 4.7, .22, r.x, 2.35, r.z + 6.8, wall);
    box(.18, 4.7, 4.3, partition, 2.35, r.z - 4.7, wall);
    box(.18, 4.7, 4.3, partition, 2.35, r.z + 4.7, wall);
    box(.18, 1.3, 5.1, partition, 4.05, r.z, wall);
    slidingRoomDoor(r.name, partition, r.z, Math.PI / 2);
    sign(r.name, 5.6, .72, r.x, 3.7, r.z - 6.66, {
      color: '#ff783d',
      size: 85
    });
    plant(side * 8.7, r.z - 5);
    box(5, .04, 2.4, r.x, 4.69, r.z, lightMat);
    const l = new THREE.PointLight('#fff0dc', 17, 14, 2);
    l.position.set(r.x, 3.65, r.z);
    scene.add(l);
  }
  for (const [x, z] of [
      [-7.2, -24.7],
      [-4.1, -24.7],
      [-7.2, -20.5]
    ]) desk(x, z);
  sign('صمّم / برمج / ابتكر', 4.8, .48, -6, 2.4, -28.65, {
    size: 54,
    color: '#c5d5e8'
  });
  // Academy: tutorial screen, desks, a tutor and seated learners.
  box(4.3, 1.8, .13, 6, 2.35, -42.56, navy);
  sign('ابنِ خطوتك القادمة', 3.9, .66, 6, 2.4, -42.45, {
    color: '#ff783d',
    size: 70
  });
  for (const [x, z] of [
      [4.25, -37.2],
      [7.7, -37.2],
      [4.25, -33.7],
      [7.7, -33.7]
    ]) desk(x, z, {
    personColor: '#50897c'
  });
  person(8.3, -40.4, {
    color: '#ff783d',
    rotation: Math.PI
  });
  desk(-7, -53.5, {
    personColor: '#8c5fa1'
  });
  desk(-4.2, -49, {
    personColor: '#477ba7'
  });
  box(2.6, 1.5, .1, -5.5, 2.5, -56.65, navy);
  sign('تعلّم ← طبّق ← تطوّر', 2.3, .55, -5.5, 2.5, -56.56, {
    size: 68,
    color: '#ff9a6d'
  });
  box(4.7, .15, 1.7, 6, 1.1, -66, wood);
  for (const x of [4.3, 6, 7.7]) {
    box(.55, .12, .55, x, .65, -64.7, navy);
    box(.55, .6, .12, x, .98, -64.4, navy);
    person(x, -64.6, {
      seated: true,
      color: '#46627e'
    });
  }
  person(6, -67.3, {
    color: '#ff783d',
    rotation: Math.PI
  });
  sign('فرصتك القادمة', 4.8, .5, 6, 2.2, -70.65, {
    size: 57,
    color: '#a9c3d8'
  });
  // Events: enclosed auditorium at the end of the same corridor.
  // A glass entrance spans the hall, leaving a central sliding doorway.
  for (const side of [-1, 1]) box(7.7, 3.35, .14, side * 6.15, 1.675, -70.8, doorMat);
  box(20, 1.3, .18, 0, 4.05, -70.8, wall);
  slidingRoomDoor('الفعاليات', 0, -70.8, 0, 4.5);
  box(15, .35, 3.5, 0, .2, -80, wood);
  box(8, 2.5, .15, 0, 2.9, -82.72, navy);
  sign('فعاليات سعي', 7.2, 1, 0, 3.1, -82.59, {
    color: '#ff783d',
    size: 85
  });
  person(2, -79.6, {
    color: '#ff783d',
    rotation: Math.PI
  });
  for (let z = -73; z >= -77; z -= 2) {
    for (const x of [-6, -4, 4, 6]) {
      box(.65, .12, .65, x, .65, z, navy);
      box(.65, .75, .13, x, 1.1, z + .35, navy);
      person(x, z, {
        seated: true,
        color: x < 0 ? '#476a92' : '#497d6e'
      });
    }
  }
  plant(-8, -80);
  plant(8, -80);

  let city = null, headquartersExterior = null;
  let streetLife = null, traffic = null, autumnWalk = null, plazaFountain = null, realisticFurniture = null, scenicPlantings = null;
  const aircraft = createCityAircraft(THREE, scene, reducedMotion);
  let cityLightLevel = 0;
  const localLights = [];
  function batchStaticMeshes() {
    const excluded = new Set([doorLeft, doorRight, scene.getObjectByName('OFOQCoast'), scene.getObjectByName('OFOQCity')]);
    const result = mergeStaticMeshes(THREE, scene, mergeGeometries, excluded, {cellSize: 20, disposeUnused: true});
    document.documentElement.dataset.batchedMeshes = String(result.savedMeshes);
  }
  let env = null;
  let requestedNight = document.documentElement.dataset.theme === 'dark';
  let screenBrightness = requestedNight ? 0 : 1;
  const employeeExits = new Map();
  function restoreEmployees() {
    employeeExits.clear();
    people.forEach(holder => {
      const home = holder.userData.home;
      if (!home) return;
      holder.position.copy(home.position); holder.rotation.y = home.rotation;
      holder.scale.setScalar(1);
      holder.userData.fadeMaterials?.forEach(({ material, opacity, transparent, depthWrite }) => {
        material.opacity = opacity; material.transparent = transparent; material.depthWrite = depthWrite; material.needsUpdate = true;
      });
      holder.userData.mixer?.stopAllAction();
      holder.userData.restAction?.reset().setEffectiveWeight(1).play();
      if (holder.children[0] && home.modelPosition) holder.children[0].position.copy(home.modelPosition);
    });
  }
  function beginEmployeeExits() {
    restoreEmployees();
    people.forEach((holder, index) => {
      const direction = Math.abs(holder.position.x) > 1 ? -Math.sign(holder.position.x) : 0;
      const target = holder.position.clone().add(new THREE.Vector3(direction * 2.4, 0, direction ? 0 : 2.4));
      employeeExits.set(holder, { delay: (index % 5) * .45, points: [target], started: false, elapsed: 0 });
    });
  }
  function employeeDoorProximity(door) {
    let proximity = 0;
    employeeExits.forEach((_, holder) => { proximity = Math.max(proximity, doorProximity(holder.position, door)); });
    return proximity;
  }
  let coastal = {
    update() {},
    setNight(night) {
      sun.intensity = night ? .35 : 3.5;
      ambient.intensity = night ? .45 : 1.65;
      scene.background.set(night ? '#080f20' : '#87ceeb');
      scene.fog.color.copy(scene.background);
    }
  };

  const keys = [
    [0, [50, 36, 78],
      [0, 29, -8]
    ],
    [4, [0, 3.1, 35],
      [0, 3.2, 14]
    ],
    [7, [0, 3.0, 17],
      [0, 2.7, 0]
    ],
    [11, [0, 1.9, 6],
      [0, 1.9, -6]
    ],
    [15, [0, 1.95, -2],
      [5, 1.7, -8]
    ],
    [19, [1, 2.1, -6],
      [5, 1.4, -9]
    ],
    [21, [0, 2, -14],
      [0, 2, -22]
    ],
    [23, [0, 2, -22],
      [-6, 1.8, -24]
    ],
    [26, [-4.3, 2.0, -22],
      [-7, 1.4, -26]
    ],
    [29, [-4.6, 2.1, -22],
      [-6, 1.5, -27]
    ],
    [31, [0, 2, -22],
      [0, 2, -36]
    ],
    [32, [0, 2, -36],
      [6, 1.8, -38]
    ],
    [35, [4.3, 2.0, -36],
      [6.5, 1.6, -40]
    ],
    [38, [4.6, 2.1, -36],
      [6, 1.8, -42]
    ],
    [40, [0, 2, -36],
      [0, 2, -50]
    ],
    [41, [0, 2, -50],
      [-6, 1.7, -53]
    ],
    [44, [-4.5, 2, -50],
      [-6.5, 1.6, -54]
    ],
    [47, [-4.8, 2.1, -50],
      [-5.7, 1.8, -55]
    ],
    [49, [0, 2, -50],
      [0, 2, -64]
    ],
    [50, [0, 2, -64],
      [6, 1.7, -66]
    ],
    [53, [4.1, 2, -64],
      [6, 1.5, -67]
    ],
    [56, [4.4, 2.1, -64],
      [6.3, 1.7, -68]
    ],
    [58, [0, 2, -64],
      [0, 2, -77]
    ],
    [59, [0, 2, -69],
      [0, 2.5, -81]
    ],
    [63, [0, 2.2, -74],
      [0, 2.6, -81]
    ],
    [68, [0, 2.3, -76],
      [0, 2.7, -81]
    ]
  ];

  const smooth = x => x * x * (3 - 2 * x),
    stops = TOUR_STOPS;
  let time = 0,
    disposed = false;
  // السكرول يحدّد الوجهة فقط؛ حلقة الرسم تحرّك الكاميرا تدريجيًا.
  let targetTime = 0;
  let roomJump = null;
  let cameraSmoothness = .4;
  let preview = adminPreview ? {active: false} : null;
  let previewCity = true, previewPeople = true;
  const cameraPath = new THREE.CatmullRomCurve3(keys.map(key => new THREE.Vector3(...key[1])), false, 'centripetal');
  const lookPath = new THREE.CatmullRomCurve3(keys.map(key => new THREE.Vector3(...key[2])), false, 'centripetal');
  const lookTarget = new THREE.Vector3();

  function seek(t) {
    time = Math.max(0, Math.min(68, t));
    let i = keys.findIndex(k => k[0] > time) - 1;
    if (i < 0) i = keys.length - 2;
    const a = keys[i], b = keys[i + 1];
    const segment = Math.max(0, Math.min(1, (time - a[0]) / (b[0] - a[0])));
    const point = (i + segment) / (keys.length - 1);
    cameraPath.getPoint(point, camera.position);
    lookPath.getPoint(point, lookTarget);
    camera.lookAt(lookTarget);
    const fov = THREE.MathUtils.lerp(innerWidth < 768 ? 76 : 54, 64, smooth(Math.max(0, Math.min(1, (time - 5) / 4))));
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    document.documentElement.dataset.tourTime = time.toFixed(2);
    if (!adminPreview) { onRoomChange(roomAtTourTime(time)); onTourProgress(time); }
  }

  function move(raw) {
    targetTime = tourTarget(raw, reducedMotion);
    document.documentElement.dataset.tourTarget = targetTime.toFixed(2);
    roomJump = null;
    if (reducedMotion) seek(targetTime);
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    if (innerWidth < 768) {
      camera.fov = time < 7 ? 76 : 64;
    } else camera.fov = time < 7 ? 54 : 64;
    camera.updateProjectionMatrix();
    renderScale = Math.min(renderScale, maxPixelRatio());
    renderer.setPixelRatio(renderScale);
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.needsUpdate = true;
    seek(time);
  }
  addEventListener('resize', resize);
  resize();
  let last = performance.now(), renderFrame = null;
  let sampleTime = 0, sampleFrames = 0;
  let nextLightSelection = 0;
  const frustum = new THREE.Frustum();
  const viewProjection = new THREE.Matrix4();
  const characterBounds = new THREE.Sphere(new THREE.Vector3(), 1.5);
  function animate(now) {
    if (disposed) return;
    renderFrame = requestAnimationFrame(animate);
    const elapsedMs = now - last;
    const dt = Math.min(elapsedMs / 1000, .05);
    last = now;
    if (document.hidden) { sampleTime = 0; sampleFrames = 0; return; }
    if (preview && !preview.active) return;
    if (preview?.playing) {
      preview.elapsed = Math.min(preview.duration, preview.elapsed + dt);
      // Follow the entrance portion of the existing tour, including the sliding doors.
      targetTime = 15 * preview.elapsed / preview.duration;
      if (preview.elapsed === preview.duration) preview.playing = false;
    }
    if (roomJump) {
      const progress = Math.max(0, Math.min(1, (now - roomJump.started) / 2800));
      seek(THREE.MathUtils.lerp(roomJump.start, roomJump.target, smooth(progress)));
      if (progress === 1) roomJump = null;
    } else if (Math.abs(targetTime - time) > .0001) {
      seek(reducedMotion ? targetTime : advanceTour(time, targetTime, dt, cameraSmoothness));
    }
    screenBrightness = THREE.MathUtils.damp(screenBrightness, requestedNight ? 0 : 1, 3.5, dt);
    logoMaterials.forEach(material => {
      if (!material.userData.television) return;
      const off = screenBrightness < .008;
      const map = off ? null : material.userData.dayMap;
      if (material.map !== map) { material.map = map; material.needsUpdate = true; }
      material.color.setScalar(off ? .002 : screenBrightness);
      material.userData.indicator?.color.set(off ? '#d15a43' : '#63d8b1');
    });
    employeeExits.forEach((exit, holder) => {
      exit.delay -= dt;
      if (exit.delay > 0) return;
      if (!exit.started) {
        exit.started = true;
        holder.userData.mixer?.stopAllAction();
        (holder.userData.walkAction || holder.userData.idleAction)?.reset().fadeIn(.4).play();
        if (holder.children[0] && holder.userData.standingPosition) holder.children[0].position.copy(holder.userData.standingPosition);
      }
      exit.elapsed += dt;
      const target = exit.points[0];
      const dx = target.x - holder.position.x, dz = target.z - holder.position.z;
      const distance = Math.hypot(dx, dz), step = dt * 1.25;
      holder.rotation.y = Math.atan2(dx, dz);
      if (distance <= step) { holder.position.copy(target); }
      else { holder.position.x += dx / distance * step; holder.position.z += dz / distance * step; }
      const fade = THREE.MathUtils.clamp((exit.elapsed - .9) / 1.1, 0, 1);
      holder.userData.fadeMaterials?.forEach(({ material, opacity }) => {
        if (fade > 0 && !material.transparent) { material.transparent = true; material.depthWrite = false; material.needsUpdate = true; }
        material.opacity = opacity * (1 - fade);
      });
      if (fade === 1) { holder.visible = false; employeeExits.delete(holder); }
    });
    const exteriorVisible = previewCity && time < 19;
    if (headquartersExterior) headquartersExterior.visible = time < 19;
    if (city?.group) city.group.visible = exteriorVisible;
    streetLife?.update(dt, camera, exteriorVisible, previewPeople && !requestedNight);
    traffic?.update(dt, camera, exteriorVisible);
    aircraft.update(dt, time < 17, previewCity);
    const entranceTarget = Math.max(doorProximity(camera.position, { x: 0, z: 2.05, height: 3 }), streetLife?.entranceProximity() || 0, employeeDoorProximity({ x: 0, z: 2.05, height: 3 }));
    const mainDoorNext = advanceDoor(mainDoorAmount, entranceTarget, dt, reducedMotion);
    mainDoorAmount = mainDoorNext;
    doorLeft.position.x = -.77 - 1.55 * mainDoorAmount;
    doorRight.position.x = .77 + 1.55 * mainDoorAmount;
    document.documentElement.dataset.doorOpen = String(mainDoorAmount > .95);
    document.documentElement.dataset.entranceDoorAmount = mainDoorAmount.toFixed(2);
    for (const door of roomDoors) {
      const dx = camera.position.x - door.x, dz = camera.position.z - door.z;
      door.group.visible = time > 10 && dx * dx + dz * dz < 35 * 35;
      const target = Math.max(doorProximity(camera.position, door), employeeDoorProximity(door));
      const amount = advanceDoor(door.amount, target, dt, reducedMotion);
      door.amount = amount;
      door.leaves.forEach((leaf, index) => {
        const side = index === 0 ? -1 : 1;
        leaf.position.x = side * (door.width / 4 + (door.width / 2 + .06) * amount);
      });
    }
    document.documentElement.dataset.roomDoors = JSON.stringify(roomDoors.map(door => ({ name: door.name, open: Number(door.amount.toFixed(2)) })));
    camera.updateMatrixWorld();
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(viewProjection);
    let activePeople = 0;
    people.forEach(holder => {
      const mixer = holder.userData.mixer;
      if (!previewPeople || (requestedNight && !(employeeExits.has(holder)))) { holder.visible = false; return; }
      if (!mixer) { holder.visible = true; return; }
      characterBounds.center.copy(holder.position); characterBounds.center.y += 1;
      const distance = camera.position.distanceToSquared(characterBounds.center);
      holder.visible = distance < 28 * 28 && frustum.intersectsSphere(characterBounds);
      if (reducedMotion || !holder.visible || distance > 18 * 18) return;
      mixer.update(dt); activePeople++;
    });
    // Interior furniture is occluded outside and in distant rooms.
    for (const group of deskGroups) group.visible = time > 9 && camera.position.distanceToSquared(group.position) < 30 * 30;
    for (const group of interiorProps) group.visible = time > 9 && camera.position.distanceToSquared(group.position) < 30 * 30;
    // Stop invisible ocean geometry updates after entering the building.
    coastal.update(dt, camera, time < 7, previewPeople && !requestedNight);
    autumnWalk?.update(dt, time < 15, camera);
    scenicPlantings?.update(camera, previewCity && time < 15, Number(document.documentElement.dataset.dayNightProgress ?? (requestedNight ? 1 : 0)));
    plazaFountain?.update(dt, time < 15);
    // Two nearby local lights keep the night lighting affordable on integrated GPUs.
    if (localLights.length && now >= nextLightSelection) {
      nextLightSelection = now + 100;
      const nearest = localLights.map(light => ({light, distance: camera.position.distanceToSquared(light.position)})).sort((a,b) => a.distance-b.distance).slice(0,2);
      const selected = new Set(nearest.map(item => item.light));
      localLights.forEach(light => { light.visible = selected.has(light); });
      document.documentElement.dataset.activeLocalLights = String(nearest.length);
    }
    renderer.render(scene, camera);
    document.documentElement.dataset.activePeople = String(activePeople);
    // Lower resolution only after sustained slow frames, ignoring loading stalls.
    if (document.documentElement.dataset.modelLoad === 'ready' && elapsedMs > 0 && elapsedMs < 1000) {
      sampleTime += elapsedMs; sampleFrames++;
      if (sampleTime >= 1500) {
        const averageFrameMs = sampleTime / sampleFrames;
        const nextScale = nextRenderScale(renderScale, averageFrameMs, innerWidth * innerHeight);
        if (nextScale !== renderScale) {
          renderScale = nextScale;
          renderer.setPixelRatio(renderScale);
          renderer.setSize(innerWidth, innerHeight);
        }
        document.documentElement.dataset.renderScale = renderScale.toFixed(2);
        sampleTime = 0; sampleFrames = 0;
      }
    }
  }
  renderFrame = requestAnimationFrame(animate);
  // Render the base tour immediately; model enhancements load independently.
  renderer.render(scene, camera);
  async function loadModels() {
    try {
      // Local GLB assets are bundled with the project; visitors never need to upload models.
      env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04);
      scene.environment = env.texture;
      const loader = new GLTFLoader(),
        assetRoot = './assets/3d/';
      const [headquarters, office, boss, woman, colleague, furnitureAssets] = await Promise.all([
        loader.loadAsync(new URL('../3D/' + HEADQUARTERS_MODEL, import.meta.url).href),
        loader.loadAsync(assetRoot + 'furniture/modern-office.glb'),
    
        loader.loadAsync(assetRoot + 'people/formal-boss.glb'),
        loader.loadAsync(assetRoot + 'people/formal-businesswoman.glb'),
        loader.loadAsync(new URL('../3D/business-male-4.glb', import.meta.url).href).catch(() => null),
        loadRealisticFurniture(THREE, new GLTFLoader()).catch(error => {
          console.warn('SAEI: keeping existing furniture because the new models failed to load.', error);
          return null;
        })
      ]);
      if (disposed) { furnitureAssets?.destroy(); return; }
      realisticFurniture = furnitureAssets;
      const tower = placeHeadquartersModel(THREE, headquarters.scene);
      scene.add(tower);
      headquartersExterior = tower;
      mergeStaticMeshes(THREE, tower, mergeGeometries);
      const outdoor = createOutdoorFacilities(THREE, scene);
      const setOutdoorNight = outdoor.userData.setNight;
      outdoor.userData.setNight = amount => {
        cityLightLevel = amount;
        if (typeof setOutdoorNight === 'function') setOutdoorNight(amount);
        city?.setNight(amount);
        traffic?.setNight(amount);
      };
      coastal = await createCoastalEnvironment(THREE, scene, {
        renderer, sun, ambient, outdoor, reducedMotion
      });
      coastal.setNight(document.documentElement.dataset.theme === 'dark', true);
      document.documentElement.dataset.buildingModel = 'free-london-skyscraper';
      document.documentElement.dataset.buildingMaterial = 'original-london-materials';
      // Extract only furniture, keeping the source room's posters and walls out of the tour.
      function collect(asset, pattern) {
        const group = new THREE.Group();
        asset.scene.updateMatrixWorld(true);
        asset.scene.traverse(n => {
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
      const table = collect(office, /Window_Table_0/),
        tableSize = new THREE.Box3().setFromObject(table).getSize(new THREE.Vector3());
      fit(table, 2.15);
      const heightScale = .85 / (tableSize.y * table.scale.y);
      table.scale.y *= heightScale;
      table.position.y *= heightScale;
      const furniture = new THREE.Group();
      furniture.add(table);
      if (tableSize.z > tableSize.x) furniture.rotation.y = Math.PI / 2;
      const chair = fit(collect(office, /Window_Chair_0/), .65);
      chair.position.z += .9;
      for (const g of deskGroups) {
        g.clear();
        g.userData.dynamicScene = true;
        g.add((furnitureAssets?.desk || furniture).clone(true));
        g.add((furnitureAssets?.chair || chair).clone(true));
        const screenHeight = furnitureAssets ? 1.16 : 1.32;
        box(.82, .48, .06, 0, screenHeight, -.15, black, g);
        box(.72, .38, .012, 0, screenHeight, -.112, new THREE.MeshStandardMaterial({
          color: '#9cb5c8',
          emissive: '#203243',
          emissiveIntensity: .12
        }), g);
        box(.07, .18, .07, 0, furnitureAssets ? .87 : .96, -.15, steel, g);
        box(.3, .025, .2, 0, furnitureAssets ? .8 : .86, -.15, black, g);
        box(.48, .025, .16, 0, furnitureAssets ? .795 : .87, .2, navy, g);
      }
      if (furnitureAssets) scene.traverse(node => {
        if (!node.userData.lobbySofa) return;
        node.clear();
        node.add(furnitureAssets.sofa.clone(true));
      });
      // Source props provide extra plants and desk lamps, placed around the reception.
      const plants = fit(collect(office, /Window_Plant_0/), 1.3);
      for (const x of [-7.5, 8]) {
        const wrapper = new THREE.Group();
        wrapper.position.set(x, .05, -8);
        wrapper.add(plants.clone(true));
        wrapper.userData.dynamicScene = true;
        interiorProps.push(wrapper);
        scene.add(wrapper);
      }
    
      for (let n = 0; n < people.length; n++) {
        const holder = people[n],
          seated = holder.userData.seated,
          asset = seated || n % 2 === 0 ? boss : woman;
        holder.clear();
        const model = clone(asset.scene);
        const mixer = new THREE.AnimationMixer(model);
        const idle = asset.animations.find(a => a.name.endsWith('Idle1')) || asset.animations[0];
        const idleAction = mixer.clipAction(idle).play();
        mixer.setTime(0);
        model.updateMatrixWorld(true);
        const standing = new THREE.Box3().setFromObject(model, true),
          scale = 1.82 / standing.getSize(new THREE.Vector3()).y;
        if (seated) {
          idleAction.stop();
          mixer.clipAction(asset.animations.find(a => a.name.endsWith('SitIdle1'))).play();
          mixer.setTime(0);
          holder.rotation.y += Math.PI;
        }
        model.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(model, true),
          center = b.getCenter(new THREE.Vector3());
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -b.min.y * scale, -center.z * scale);
        const fadeMaterials = [];
        model.traverse(o => {
          if (o.isMesh) {
            const copyMaterial = source => {
              const material = source.clone();
              fadeMaterials.push({ material, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
              return material;
            };
            o.material = Array.isArray(o.material) ? o.material.map(copyMaterial) : copyMaterial(o.material);
            o.castShadow = false;
            o.receiveShadow = true;
          }
        });
        holder.userData.fadeMaterials = fadeMaterials;
        holder.add(model);
        holder.userData.mixer = mixer;
        holder.userData.idleAction = idleAction;
        holder.userData.restAction = seated ? mixer.clipAction(asset.animations.find(a => a.name.endsWith('SitIdle1'))) : idleAction;
        holder.userData.home = { position: holder.position.clone(), rotation: holder.rotation.y, modelPosition: model.position.clone() };
        const standingCenter = standing.getCenter(new THREE.Vector3());
        holder.userData.standingPosition = new THREE.Vector3(-standingCenter.x * scale, -standing.min.y * scale, -standingCenter.z * scale);
        const walkClip = asset.animations.find(a => /walk/i.test(a.name));
        if (walkClip) holder.userData.walkAction = mixer.clipAction(walkClip);
      }
      document.documentElement.dataset.realisticPeople = String(people.length);
      document.documentElement.dataset.characterModels = '2';
      document.documentElement.dataset.furnitureModels = furnitureAssets ? '4' : '1';
      document.documentElement.dataset.realisticFurniture = furnitureAssets ? 'ready' : 'fallback';
      streetLife = createStreetLife(THREE, scene, { boss, woman, colleague, clone, reducedMotion });
    
    
    
    
    
      batchStaticMeshes();
      scene.traverse(object => { if (object.isPointLight) localLights.push(object); });
      renderer.shadowMap.needsUpdate = true;
      document.documentElement.dataset.modelLoad = 'ready';
    } catch (error) {
      console.warn('SAEI: using the base tour because model loading failed.', error);
      document.documentElement.dataset.modelLoad = 'fallback';
    }
  }
  // Keep access roads and lighting without loading the removed city.
  document.documentElement.dataset.cityStatus = 'loading';
  createAccessRoads(THREE, scene, { mergeGeometries }).then(neighborhood => {
    if (disposed) { neighborhood.destroy(); return; }
    city = neighborhood;
    scene.getObjectByName('OFOQCity').visible = previewCity;
    city.setNight(cityLightLevel);
    renderer.shadowMap.needsUpdate = true;
    skylineFallback.forEach(mesh => { scene.remove(mesh); mesh.geometry.dispose(); });
  }).catch(error => {
    if (!disposed) document.documentElement.dataset.cityStatus = 'roads-unavailable';
    console.warn('SAEI: city models unavailable; keeping the base skyline.', error);
  });
  document.documentElement.dataset.modelLoad = 'loading';
  loadModels();
  createScenicPlantings(THREE, scene).then(plantings => {
    if (disposed) { plantings.destroy(); return; }
    scenicPlantings = plantings;
  }).catch(error => console.warn('SAEI: optional park photographs unavailable.', error));
  createPlazaFountain(THREE, scene, { loader: new GLTFLoader(), reducedMotion }).then(fountain => {
    if (disposed) { fountain.destroy(); return; }
    plazaFountain = fountain;
    const fallback = scene.getObjectByName('OFOQFountainFallback');
    if (fallback) fallback.visible = false;
    renderer.shadowMap.needsUpdate = true;
  }).catch(error => {
    document.documentElement.dataset.plazaFountain = 'unavailable';
    console.warn('SAEI: imported plaza fountain could not be loaded.', error);
  });
  createAutumnWalk(THREE, scene, { loader: new GLTFLoader(), reducedMotion }).then(walk => {
    if (disposed) { walk.destroy(); return; }
    autumnWalk = walk;
    scene.traverse(node => { if (node.userData.autumnReplacement) node.visible = false; });
    renderer.shadowMap.needsUpdate = true;
  }).catch(error => {
    document.documentElement.dataset.autumnWalk = 'unavailable';
    console.warn('SAEI: autumn maples could not be loaded.', error);
  });
  aircraft.loadModel(new GLTFLoader()).catch(error => {
    document.documentElement.dataset.aircraftSource = 'procedural-fallback';
    console.warn('SAEI: aircraft model unavailable; using the lightweight fallback.', error);
  });
  document.documentElement.dataset.trafficStatus = 'loading';
  createCityTraffic(THREE, scene, { loader: new GLTFLoader(), mergeGeometries, reducedMotion }).then(result => {
    if (disposed) { result.destroy(); return; }
    traffic = result;
    traffic.setNight(requestedNight ? 1 : cityLightLevel);
  }).catch(error => {
    if (!disposed) document.documentElement.dataset.trafficStatus = 'unavailable';
    console.warn('SAEI: the sedan asset could not be loaded.', error);
  });
  return {
    configurePreview(config) {
      if (!adminPreview) return;
      if (config.theme) this.setNight(config.theme === 'dark', true);
      if (config.active === false) { if (preview) preview.active = false; return; }
      if (config.resume && preview) { preview.active = true; return; }
      const duration = Number(config.duration), smoothness = Number(config.smoothness);
      preview = {
        duration: Number.isFinite(duration) ? Math.max(8, Math.min(40, duration)) : 16,
        elapsed: 0, active: true, playing: Boolean(config.autoplay) && !reducedMotion
      };
      cameraSmoothness = Number.isFinite(smoothness) ? Math.max(.2, Math.min(2, smoothness)) : .65;
      previewCity = config.city !== false; previewPeople = config.people !== false;
      skylineFallback.forEach(mesh => { mesh.visible = previewCity; });
      const cityGroup = scene.getObjectByName('OFOQCity');
      if (cityGroup) cityGroup.visible = previewCity;
      people.forEach(holder => { holder.visible = previewPeople && !requestedNight; });
      roomJump = null; targetTime = 0; seek(0);
      renderer.shadowMap.needsUpdate = true;
    },
    setNight: (night, immediate = false) => {
      const changed = requestedNight !== night;
      requestedNight = night;
      if (immediate || reducedMotion) screenBrightness = night ? 0 : 1;
      if (!night) restoreEmployees();
      else if (changed && !immediate && !reducedMotion && previewPeople) beginEmployeeExits();
      else if (immediate || reducedMotion) employeeExits.clear();
      logoMaterials.forEach(material => { const off = screenBrightness < .008 && material.userData.television; material.map = off ? null : material.userData.dayMap; material.color.set(off ? '#05070b' : '#ffffff'); material.userData.indicator?.color.set(off ? '#d15a43' : '#63d8b1'); material.needsUpdate = true; });
      people.forEach(holder => { holder.visible = previewPeople && (!night || (employeeExits.has(holder))); });
      if (immediate || document.documentElement.dataset.modelLoad !== 'ready') traffic?.setNight(night ? 1 : 0);
      coastal.setNight(night, immediate);
    },
    move,
    moveToTime(value) { roomJump = null; targetTime = Math.max(0, Math.min(68, value)); if (reducedMotion) seek(targetTime); },
    seek(value) { roomJump = null; targetTime = value; seek(value); },
    goToRoom(index) {
      if (!Number.isInteger(index) || index < 0 || index >= stops.length || disposed) return;
      targetTime = stops[index];
      roomJump = { start: time, target: targetTime, started: performance.now() };
      if (reducedMotion) { seek(targetTime); roomJump = null; }
    },
    destroy() {
      disposed = true;
      if (renderFrame !== null) cancelAnimationFrame(renderFrame);
      removeEventListener('resize', resize);
      coastal.destroy?.();
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
      logoMaterials.forEach(material => { material.map?.dispose(); material.dispose(); });
      renderer.dispose();
      env?.dispose();
      scene.traverse(o => {
        o.geometry?.dispose();
      });
    }
  };
}






// إغلاق قائمة الحساب عند الضغط خارجها أو على زر Escape.
const accountMenu = document.querySelector('.account-menu');
document.addEventListener('click', function (event) {
  if (accountMenu && !accountMenu.contains(event.target)) accountMenu.open = false;
});
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && accountMenu && accountMenu.open) {
    accountMenu.open = false;
    accountMenu.querySelector('summary').focus();
  }
});
