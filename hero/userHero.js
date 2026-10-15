// المشهد ثلاثي الأبعاد يحتاج Three.js. بقية الشاشات لا تستخدم مكتبات.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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
const rooms = [{
  id: 'lobby',
  name: 'الرئيسية',
  caption: 'أهلًا بك',
  title: 'مستقبلك يبدأ<br><em>من هنا.</em>',
  description: 'ادخل مساحة تجمع التعلّم والعمل والأشخاص الذين يشاركونك الطموح. كل غرفة تفتح بابًا جديدًا.',
  action: 'ابدأ رحلتك',
  tags: ['تعلّم', 'تواصل', 'انطلق'],
  cards: [
    ['مساحتك للعمل', 'تعرّف على غرف OFOQ الست واختر المسار المناسب لك.'],
    ['مجتمع الطموح', 'تواصل مع أشخاص يشاركونك رحلة التطور.'],
    ['خطوتك القادمة', 'استكشف التعلّم والفرص المهنية في مكان واحد.']
  ]
}, {
  id: 'freelance',
  name: 'العمل الحر',
  caption: 'اصنع طريقك',
  title: 'موهبتك.<br><em>قواعدك.</em>',
  description: 'مساحة للمستقلين وصنّاع الأفكار. اكتشف مشاريع جديدة وابدأ بناء عمل يحمل بصمتك.',
  action: 'استكشف المشاريع',
  tags: ['تصميم', 'تطوير', 'محتوى'],
  cards: [
    ['تصميم هوية بصرية', 'مشروع توضيحي · عن بُعد · مدة أسبوعين'],
    ['تطوير موقع إلكتروني', 'مشروع توضيحي · HTML وCSS وJavaScript'],
    ['كتابة محتوى إبداعي', 'مشروع توضيحي · حملة إطلاق منتج']
  ]
}, {
  id: 'academy',
  name: 'الأكاديمية',
  caption: 'واصل التعلّم',
  title: 'تعلّم اليوم.<br><em>اصنع الغد.</em>',
  description: 'ادخل قاعة الأفكار. مسارات تعليمية وورش عملية تساعدك على تحويل الفضول إلى مهارة.',
  action: 'تصفّح المسارات',
  tags: ['ورش عملية', 'مهارات', 'إرشاد'],
  cards: [
    ['أساسيات تصميم تجربة المستخدم', 'مسار توضيحي · 6 جلسات · مستوى مبتدئ'],
    ['تطوير واجهات الويب', 'مسار توضيحي · 8 جلسات · تطبيق عملي'],
    ['بناء ملف أعمالك', 'ورشة توضيحية · ساعتان · مراجعة المشاريع']
  ]
}, {
  id: 'internships',
  name: 'فرص التدريب',
  caption: 'خطوتك الأولى',
  title: 'أول تجربة.<br><em>أثر كبير.</em>',
  description: 'ابدأ رحلتك المهنية بجانب فريق يدعمك. اكتشف تدريبات تمنحك الخبرة والثقة للخطوة التالية.',
  action: 'اكتشف التدريبات',
  tags: ['خبرة', 'توجيه', 'بداية'],
  cards: [
    ['متدرّب تصميم', 'فرصة توضيحية · 3 أشهر · عمل هجين'],
    ['متدرّب تطوير واجهات', 'فرصة توضيحية · شهران · عن بُعد'],
    ['متدرّب تسويق رقمي', 'فرصة توضيحية · 3 أشهر · ضمن فريق']
  ]
}, {
  id: 'jobs',
  name: 'الوظائف',
  caption: 'ابحث عن مكانك',
  title: 'مكانك القادم.<br><em>ينتظرك.</em>',
  description: 'مهاراتك تستحق المساحة المناسبة. تعرّف على فرص عمل تناسب طموحك وتفتح فصلًا جديدًا.',
  action: 'تصفّح الوظائف',
  tags: ['فرص جديدة', 'فرق', 'نمو'],
  cards: [
    ['مصمّم تجربة مستخدم', 'وظيفة توضيحية · دوام كامل · عمل هجين'],
    ['مطوّر واجهات أمامية', 'وظيفة توضيحية · دوام كامل · عن بُعد'],
    ['مدير مجتمع', 'وظيفة توضيحية · دوام جزئي · عمل هجين']
  ]
}, {
  id: 'events',
  name: 'الفعاليات',
  caption: 'ننجز معًا',
  title: 'لقاء واحد.<br><em>ألف احتمال.</em>',
  description: 'تواصل، شارك، وألهم الآخرين. لقاءات وفعاليات تجمع الأفكار بالأشخاص القادرين على تحقيقها.',
  action: 'استكشف الفعاليات',
  tags: ['لقاءات', 'مجتمع', 'إلهام'],
  cards: [
    ['ليلة صنّاع الأفكار', 'فعالية توضيحية · جلسات مشاركة وتعارف'],
    ['ورشة بناء المنتجات', 'فعالية توضيحية · فرق صغيرة · تطبيق عملي'],
    ['لقاء المستقلين', 'فعالية توضيحية · حوار مفتوح وتبادل خبرات']
  ]
}];

const $ = id => document.getElementById(id);

const reducedMotion = matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

let currentRoom = -1;
let sceneApi = null;


const chapters = [...document.querySelectorAll('.chapter')];
const buttons = [...document.querySelectorAll('[data-room]')];

// تحديث واجهة القسم الحالي.
function setRoom(index) {
  if (currentRoom === index) return;

  currentRoom = index;

  const room = rooms[index];

  $('headline').innerHTML = room.title;
  $('description').textContent = room.description;

  $('roomLabel').textContent =
    `${String(index + 1).padStart(2, '0')} / ${room.name}`;

  $('roomAction').innerHTML =
    `${room.action} <span aria-hidden="true">←</span>`;

  $('tags').replaceChildren(
    ...room.tags.map(tag => {
      const element = document.createElement('span');
      element.textContent = tag;
      return element;
    })
  );

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


}

function jumpTo(index) {
  const y = index === 0 ? 0 : chapters[index].offsetTop;

  window.scrollTo({
    top: y,
    behavior: 'instant'
  });
  setRoom(index);
  sceneApi?.goToRoom?.(index);

  if (location.hash !== `#${rooms[index].id}`) {
    history.replaceState(null, '', `#${rooms[index].id}`);
  }
}

buttons.forEach(button => {
  button.addEventListener('click', () => {
    jumpTo(Number(button.dataset.room));
  });
});

document.querySelector('.brand').addEventListener(
  'click',
  event => {
    event.preventDefault();
    jumpTo(0);
  }
);

// كل غرفة تفتح الصفحة الخاصة بها؛ تبقى الجولة ثلاثية الأبعاد كما هي.
$('roomAction').addEventListener('click', () => {
  const pages = [null, '../Freelance/freelance.html', '../Academy/academy.html',
    '../Internships/internships.html', '../Jobs/jobs.html', '../Events/events.html'
  ];
  if (currentRoom === 0) scrollTo({top:chapters[1].offsetTop*.52,behavior:reducedMotion?'instant':'smooth'});
  else if (pages[currentRoom]) window.location.href = window.siteThemeUrl(pages[currentRoom]);
});

// بطاقات الفرص داخل نافذة Bootstrap.
$('exploreModal').addEventListener('show.bs.modal', () => {
  const room = rooms[Math.max(currentRoom, 0)];

  $('modalTitle').textContent =
    currentRoom === 0 ? 'مساحات OFOQ' : room.action;

  $('modalIntro').textContent = room.description;

  $('opportunities').replaceChildren(
    ...room.cards.map(([title, description], i) => {
      const column = document.createElement('div');
      column.className = 'col-md-4';

      const article = document.createElement('article');
      article.className = 'opportunity';

      const label = document.createElement('small');
      label.textContent = `0${i + 1} / ${room.name}`;

      const heading = document.createElement('h3');
      heading.textContent = title;

      const text = document.createElement('p');
      text.textContent = description;

      const button = document.createElement('button');
      button.className = 'btn btn-outline-light w-100';
      button.textContent = 'جرّب اختيار الفرصة';

      button.addEventListener('click', () => {
        bootstrap.Toast.getOrCreateInstance(
          $('demoToast')
        ).show();
      });

      article.append(label, heading, text, button);
      column.append(article);

      return column;
    })
  );
});


setRoom(0);

function progressAtScroll() {
  const stop = chapters[5].offsetTop,
    raw = Math.min(5, Math.max(0, scrollY / stop * 5));
  setRoom(Math.min(5, Math.floor(raw + .18)));
  $('progress').style.width = raw / 5 * 100 + '%';
  sceneApi?.move(raw);
}
addEventListener('scroll', progressAtScroll, {
  passive: true
});
addEventListener('resize', progressAtScroll);

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
    reducedMotion
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
  $('status').textContent = 'مرحبًا بك في OFOQ';
  restoreRoom();
}
initScene().catch(error => {
  console.error('OFOQ 3D:', error);
  document.body.classList.add('fallback');
  document.querySelector('.theme-toggle').disabled = false;
  document.querySelector('.day-night-controls').hidden = true;
  $('status').textContent = 'تعذّر عرض المشهد، يمكنك فتح الأقسام من القائمة.';
  document.documentElement.dataset.sceneReady = 'false';
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
  cylinder(3.5, 3.5, .28, [-24, .24, 15], stone);
  const rim = mesh(new THREE.TorusGeometry(3.15, .18, 10, 40), darkStone, [-24, .45, 15]);
  rim.rotation.x = Math.PI / 2;
  const water = new THREE.MeshPhysicalMaterial({
    color: '#6bafb9', roughness: .15, metalness: .15, clearcoat: 1
  });
  cylinder(2.98, 2.98, .035, [-24, .39, 15], water);
  cylinder(.28, .45, 1.25, [-24, .98, 15], stone);
  cylinder(1.15, 1.15, .12, [-24, 1.62, 15], darkStone);
  cylinder(1.02, 1.02, .03, [-24, 1.7, 15], water);

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

  // Promenade and a short boardwalk link the coast to the existing plaza.
  box([4, .16, 148], [-28, .20, -5], pathMaterial);
  box([18, .12, 3.2], [-31, .26, 26], woodMaterial);
  for (let x = -39; x <= -23; x += 1) box([.035, .02, 3.2], [x, .33, 26], pathMaterial);

  const waterGeometry = new THREE.PlaneGeometry(245, 320, 80, 65);
  waterGeometry.rotateX(-Math.PI / 2);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: '#147d9a', roughness: .24, metalness: .28, clearcoat: 1
  });
  const ocean = new THREE.Mesh(waterGeometry, waterMaterial);
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
  function update(dt, camera, oceanVisible = true) {
    if (destroyed) return;
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
  document.documentElement.dataset.coastalModels = 'palm-tree,beach-table';
  document.documentElement.dataset.beachPalms = '9';
  document.documentElement.dataset.beachTables = '5';
  return {
    setNight, update,
    destroy() {
      destroyed = true;
      themeObserver.disconnect();
      if (transitionFrame !== null) cancelAnimationFrame(transitionFrame);
    }
  };
}


// 5. مباني المدينة

// Real buildings from the selected Sketchfab pack, arranged beside the coast.
async function createCityNeighborhood(THREE, scene) {
  const city = new THREE.Group();
  city.name = 'OFOQCity';
  const loader = new GLTFLoader();
  const url = new URL('./assets/3d/environment/ccity-building-set-1.glb', import.meta.url);
  const model = await loader.loadAsync(url.href);
  model.scene.updateMatrixWorld(true);
  const materials = new Map();
  const glowingMaterials = [];

  function cityMaterial(original) {
    if (!materials.has(original)) {
      const material = original.clone();
      material.metalness = Math.min(material.metalness, .15);
      material.roughness = Math.max(material.roughness, .65);
      if (/glow/i.test(material.name)) {
        material.emissive.set('#ffe2b8');
        material.emissiveIntensity = 0;
        glowingMaterials.push(material);
      }
      materials.set(original, material);
    }
    return materials.get(original);
  }

  function placeBuilding(name, x, z, footprint, rotation = 0) {
    const source = model.scene.getObjectByName(name);
    if (!source) throw new Error('Missing city building: ' + name);
    const groups = new Map();
    source.traverse(node => {
      if (!node.isMesh) return;
      const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
      geometry.applyMatrix4(node.matrixWorld);
      // Merge tiny source pieces by material to keep rendering light.
      for (const key of Object.keys(geometry.attributes)) {
        if (!['position', 'normal', 'uv'].includes(key)) geometry.deleteAttribute(key);
      }
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      if (!geometry.attributes.uv) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
      if (!groups.has(node.material)) groups.set(node.material, []);
      groups.get(node.material).push(geometry);
    });
    const building = new THREE.Group();
    building.name = name;
    for (const [material, pieces] of groups) {
      const geometry = mergeGeometries(pieces);
      pieces.forEach(piece => piece.dispose());
      if (!geometry) throw new Error('Cannot merge city building: ' + name);
      const mesh = new THREE.Mesh(geometry, cityMaterial(material));
      mesh.receiveShadow = true;
      building.add(mesh);
    }
    const bounds = new THREE.Box3().setFromObject(building);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    building.children.forEach(mesh => mesh.geometry.translate(-center.x, -bounds.min.y, -center.z));
    building.scale.setScalar(footprint / Math.max(size.x, size.z));
    building.rotation.y = rotation;
    building.position.set(x, .03, z);
    city.add(building);
  }

  // Main tower stays taller; no buildings occupy the beach or entrance corridor.
  const layout = [
    ['Filler_Housing', 47, -28, 19],
    ['LM_Clinic2', 76, -18, 24],
    ['LM_Laundrette', 109, -22, 18],
    ['LM_Paramount1', 47, -64, 20],
    ['LM_PawnShop1', 79, -59, 19],
    ['Filler_Housing1', 110, -58, 19],
    ['المشاريع', 2, -120, 34],
    ['LM_Paramount9', 47, -120, 20],
    ['FFactory', 72, -120, 32],
    ['Filler_Housing2', 110, -121, 19],
    ['Projects2', 72, -158, 32, Math.PI / 2],
    ['LM_PawnShop3', 110, -157, 19]
  ];
  layout.forEach(item => placeBuilding(...item));

  const asphalt = new THREE.MeshStandardMaterial({color: '#424c59', roughness: .95});
  const pavement = new THREE.MeshStandardMaterial({color: '#aab6c1', roughness: .9});
  const marking = new THREE.MeshStandardMaterial({color: '#e8dfbc', roughness: .9});
  function box(size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.receiveShadow = true;
    city.add(mesh);
  }
  box([100, .08, 120], [80, -.09, -32], pavement);
  box([150, .08, 85], [57, -.09, -137], pavement);
  box([10, .04, 205], [30, -.035, -72], asphalt);
  box([147, .04, 10], [58, -.035, -95], asphalt);
  box([10, .04, 190], [94, -.035, -70], asphalt);
  for (let z = -165; z < 30; z += 9) {
    box([.22, .015, 3.5], [30, -.005, z], marking);
    box([.22, .015, 3.5], [94, -.005, z], marking);
  }
  for (let x = -10; x < 130; x += 9) box([3.5, .015, .22], [x, -.005, -95], marking);

  model.scene.traverse(object => object.geometry?.dispose());
  scene.add(city);
  const state = document.documentElement.dataset;
  state.cityStatus = 'ready';
  state.cityModel = 'ccity-building-set-1';
  state.cityBuildings = String(layout.length);
  state.cityMeshes = String(city.children.reduce((count, object) => count + (object.isMesh ? 1 : object.children.length), 0));
  return {
    destroy() {
      scene.remove(city);
      const textures = new Set();
      city.traverse(object => object.geometry?.dispose());
      for (const material of [...materials.values(), asphalt, pavement, marking]) {
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        material.dispose();
      }
      textures.forEach(texture => texture.dispose());
    },
    setNight(amount) {
      glowingMaterials.forEach(material => { material.emissiveIntensity = .65 * amount; });
      state.cityLightLevel = Number(amount).toFixed(4);
    }
  };
}


// 6. بناء المشهد وحركة الكاميرا والأداء.
async function createBuildingTour(container, {
  reducedMotion = false
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
    glass = new THREE.MeshPhysicalMaterial({
      color: '#6fa3be',
      metalness: .75,
      roughness: .085,
      clearcoat: 1,
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
  const logoTexture = new THREE.TextureLoader().load(new URL('../assets/branding/ofoq-logo.png?v=ofoq-11', import.meta.url).href,
    texture => {
      if (disposed) { texture.dispose(); return; }
      // Keep precisely the approved artwork; trim only its presentation whitespace.
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.repeat.set(740 / 1254, 770 / 1254);
      texture.offset.set(260 / 1254, (1254 - 245 - 770) / 1254);
      logoMaterials.forEach(material => { material.map = texture; material.needsUpdate = true; });
    }, undefined, error => console.warn('OFOQ: logo image unavailable.', error));
  function logo(width, x, y, z) {
    const c = document.createElement('canvas'); c.width = 740; c.height = 770;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fffdf9'; ctx.fillRect(0, 0, 740, 770);
    ctx.fillStyle = '#111e30'; ctx.textAlign = 'center'; ctx.font = 'bold 130px Arial';
    ctx.fillText('OFOQ', 370, 430);
    const fallback = new THREE.CanvasTexture(c); fallback.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({map: fallback});
    logoMaterials.push(material);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 770 / 740), material);
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
    deskGroups = [];

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
  logo(6, 0, 55.5, 2.25);
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
  logo(1.4, 0, 4.05, 2.25);
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
  person(5, -9.05, {
    color: '#344d7a'
  });
  logo(3, 5, 2.8, -12);
  plant(-7, -4);
  plant(8, -4);
  for (let z of [-5, -8]) {
    box(2.8, .52, 1, -6, .6, z, navy);
    box(2.8, .65, .18, -6, 1.1, z - .43, navy);
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
  box(15, .35, 3.5, 0, .2, -80, wood);
  box(8, 2.5, .15, 0, 2.9, -82.72, navy);
  sign('فعاليات أفق', 7.2, 1, 0, 3.1, -82.59, {
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

  let city = null;
  let cityLightLevel = 0;
  const localLights = [];
  function batchStaticMeshes() {
    scene.updateMatrixWorld(true);
    const excluded = new Set([doorLeft, doorRight]);
    const batches = new Map();
    scene.traverse(mesh => {
      if (!mesh.isMesh || mesh.isSkinnedMesh || excluded.has(mesh) || Array.isArray(mesh.material) || mesh.material.transparent) return;
      let ancestor = mesh;
      while (ancestor) {
        if (ancestor === coastal.group || ancestor.name === 'OFOQCoast' || ancestor.name === 'OFOQCity' || ancestor.userData.mixer) return;
        ancestor = ancestor.parent;
      }
      if (Object.keys(mesh.geometry.morphAttributes).length) return;
      const center = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);
      const attributes = Object.entries(mesh.geometry.attributes).map(([key,a]) => key + ':' + a.itemSize + ':' + a.array.constructor.name).sort().join(',');
      const key = mesh.material.uuid + ':' + Math.floor(center.x / 20) + ':' + Math.floor(center.z / 20) + ':' + mesh.castShadow + ':' + mesh.receiveShadow + ':' + attributes;
      if (!batches.has(key)) batches.set(key, []);
      batches.get(key).push(mesh);
    });
    const retiredGeometry = new Set();
    let saved = 0;
    for (const meshes of batches.values()) {
      if (meshes.length < 2) continue;
      const pieces = meshes.map(mesh => (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld));
      const geometry = mergeGeometries(pieces, false);
      pieces.forEach(piece => piece.dispose());
      if (!geometry) continue;
      geometry.computeBoundingSphere();
      const combined = new THREE.Mesh(geometry, meshes[0].material);
      combined.castShadow = meshes[0].castShadow; combined.receiveShadow = meshes[0].receiveShadow;
      combined.name = 'StaticBatch'; scene.add(combined);
      meshes.forEach(mesh => { retiredGeometry.add(mesh.geometry); mesh.removeFromParent(); }); saved += meshes.length - 1;
    }
    const liveGeometry = new Set();
    scene.traverse(object => { if (object.geometry) liveGeometry.add(object.geometry); });
    retiredGeometry.forEach(geometry => { if (!liveGeometry.has(geometry)) geometry.dispose(); });
    document.documentElement.dataset.batchedMeshes = String(saved);
  }
  let env = null;
  let requestedNight = false;
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
    [4, [26, 22, 48],
      [0, 27, -8]
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
    stops = [0, 27, 36, 45, 54, 64];
  let time = 0,
    disposed = false;
  // قيمة الهدف تأتي من السكرول، والزمن الحالي يقترب منها تدريجيًا.
  let targetTime = 0;
  let roomJump = null;
  const cameraSmoothness = 0.65; // قيمة أكبر تعني انتقالًا أهدأ.
  const cameraSpeed = 3; // الحد الأقصى لتغيّر مسار الكاميرا في الثانية.
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
    const open = smooth(Math.min(1, Math.max(0, (time - 8) / 3)));
    if (Math.abs(doorLeft.position.x - (-.77 - 1.55 * open)) > .001) renderer.shadowMap.needsUpdate = true;
    doorLeft.position.x = -.77 - 1.55 * open;
    doorRight.position.x = .77 + 1.55 * open;
    document.documentElement.dataset.tourTime = time.toFixed(2);
    document.documentElement.dataset.doorOpen = String(open > .95);
  }

  function move(raw) {
    const r = Math.max(0, Math.min(5, raw)),
      i = Math.min(4, Math.floor(r)),
      u = r - i;
    targetTime = stops[i] + (stops[i + 1] - stops[i]) * u;
    if (roomJump && Math.abs(targetTime - roomJump.target) > .01) roomJump = null;
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
    if (roomJump) {
      const progress = Math.max(0, Math.min(1, (now - roomJump.started) / 1800));
      seek(THREE.MathUtils.lerp(roomJump.start, roomJump.target, smooth(progress)));
      if (progress === 1) roomJump = null;
    } else if (Math.abs(targetTime - time) > .0001) {
      const difference = (targetTime - time) * (1 - Math.exp(-dt / cameraSmoothness));
      const step = THREE.MathUtils.clamp(difference, -cameraSpeed * dt, cameraSpeed * dt);
      seek(time + step);
    }
    camera.updateMatrixWorld();
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(viewProjection);
    let activePeople = 0;
    people.forEach(holder => {
      const mixer = holder.userData.mixer;
      if (!mixer) return;
      characterBounds.center.copy(holder.position); characterBounds.center.y += 1;
      const distance = camera.position.distanceToSquared(characterBounds.center);
      holder.visible = distance < 28 * 28 && frustum.intersectsSphere(characterBounds);
      if (reducedMotion || !holder.visible || distance > 18 * 18) return;
      mixer.update(dt); activePeople++;
    });
    // Stop invisible ocean geometry updates after entering the building.
    coastal.update(dt, camera, time < 7);
    // Four nearby local lights keep illumination without evaluating eighteen per pixel.
    if (localLights.length) {
      const nearest = localLights.map(light => ({light, distance: camera.position.distanceToSquared(light.position)})).sort((a,b) => a.distance-b.distance).slice(0,4);
      const selected = new Set(nearest.map(item => item.light));
      localLights.forEach(light => { light.visible = selected.has(light); });
      document.documentElement.dataset.activeLocalLights = String(nearest.length);
    }
    renderer.render(scene, camera);
    document.documentElement.dataset.activePeople = String(activePeople);
    // Lower resolution only after sustained slow frames, ignoring loading stalls.
    if (document.documentElement.dataset.modelLoad === 'ready' && elapsedMs > 0 && elapsedMs < 100) {
      sampleTime += elapsedMs; sampleFrames++;
      if (sampleTime >= 2000) {
        if (sampleTime / sampleFrames > 28 && renderScale > .75) {
          renderScale = Math.max(.75, renderScale - .15);
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
      const [buildings, office, boss, woman] = await Promise.all([
        loader.loadAsync(assetRoot + 'building/low-poly-skyscrapers.glb'),
        loader.loadAsync(assetRoot + 'furniture/modern-office.glb'),
    
        loader.loadAsync(assetRoot + 'people/formal-boss.glb'),
        loader.loadAsync(assetRoot + 'people/formal-businesswoman.glb')
      ]);
      if (disposed) return;
      // The source pack merges seven buildings by material. Separate them across the gaps in X.
      buildings.scene.updateMatrixWorld(true);
      const parts = [],
        xs = [];
      buildings.scene.traverse(node => {
        if (!node.isMesh) return;
        const geometry = (node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone()).applyMatrix4(node.matrixWorld);
        parts.push({
          geometry,
          name: node.name
        });
        const a = geometry.attributes.position;
        for (let i = 0; i < a.count; i++) xs.push(Math.round(a.getX(i) * 10000) / 10000);
      });
      const unique = [...new Set(xs)].sort((a, b) => a - b),
        gaps = unique.slice(1).map((v, i) => ({
          gap: v - unique[i],
          cut: (v + unique[i]) / 2
        })).sort((a, b) => b.gap - a.gap).slice(0, 6).map(g => g.cut).sort((a, b) => a - b);
      const ranges = [-Infinity, ...gaps, Infinity],
        bounds = Array.from({
          length: 7
        }, () => new THREE.Box3());
      for (const {
          geometry
        }
        of parts) {
        const a = geometry.attributes.position;
        for (let i = 0; i < a.count; i++) {
          const x = a.getX(i),
            slot = ranges.findIndex((r, n) => n < 7 && x >= r && x < ranges[n + 1]);
          if (slot >= 0) bounds[slot].expandByPoint(new THREE.Vector3(x, a.getY(i), a.getZ(i)));
        }
      }
      const slot = bounds.map((b, i) => ({
        i,
        height: b.max.y - b.min.y
      })).sort((a, b) => b.height - a.height)[0].i;
      const tower = new THREE.Group(),
        towerBounds = bounds[slot],
        towerSize = towerBounds.getSize(new THREE.Vector3()),
        towerCenter = towerBounds.getCenter(new THREE.Vector3());
      const silver = new THREE.MeshStandardMaterial({
        color: '#b8c7cf',
        metalness: .8,
        roughness: .23,
        envMapIntensity: 1.2
      });
      for (const {
          geometry,
          name
        }
        of parts) {
        const attributes = geometry.attributes,
          data = {};
        for (const key of Object.keys(attributes)) data[key] = [];
        const p = attributes.position;
        for (let i = 0; i < p.count; i += 3) {
          const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
          if (x < ranges[slot] || x >= ranges[slot + 1]) continue;
          for (const [key, a] of Object.entries(attributes))
            for (let v = i; v < i + 3; v++)
              for (let c = 0; c < a.itemSize; c++) data[key].push(a.array[v * a.itemSize + c]);
        }
        if (!data.position.length) continue;
        const cut = new THREE.BufferGeometry();
        for (const key of Object.keys(data)) cut.setAttribute(key, new THREE.Float32BufferAttribute(data[key], attributes[key].itemSize));
        const material = /windows/i.test(name) ? glass : /bottom|roof/i.test(name) ? navy : silver;
        const mesh = new THREE.Mesh(cut, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        tower.add(mesh);
        geometry.dispose();
      }
      tower.scale.set(20 / towerSize.x, 55 / towerSize.y, 20 / towerSize.z);
      tower.position.set(-towerCenter.x * tower.scale.x, 5 - towerBounds.min.y * tower.scale.y, -8 - towerCenter.z * tower.scale.z);
      scene.add(tower);
      const outdoor = createOutdoorFacilities(THREE, scene);
      const setOutdoorNight = outdoor.userData.setNight;
      outdoor.userData.setNight = amount => {
        cityLightLevel = amount;
        if (typeof setOutdoorNight === 'function') setOutdoorNight(amount);
        city?.setNight(amount);
      };
      coastal = await createCoastalEnvironment(THREE, scene, {
        renderer, sun, ambient, outdoor, reducedMotion
      });
      coastal.setNight(document.documentElement.dataset.theme === 'dark', true);
      document.documentElement.dataset.buildingModel = 'sketchfab';
      document.documentElement.dataset.buildingMaterial = 'reflective-glass';
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
        g.add(furniture.clone(true));
        g.add(chair.clone(true));
        box(.82, .52, .08, 0, 1.32, -.25, black, g);
        box(.72, .42, .012, 0, 1.32, -.202, new THREE.MeshStandardMaterial({
          color: '#75bdd8',
          emissive: '#2c6586',
          emissiveIntensity: .4
        }), g);
        box(.08, .22, .08, 0, .96, -.25, steel, g);
      }
      // Source props provide extra plants and desk lamps, placed around the reception.
      const plants = fit(collect(office, /Window_Plant_0/), 1.3);
      for (const x of [-7.5, 8]) {
        const wrapper = new THREE.Group();
        wrapper.position.set(x, .05, -8);
        wrapper.add(plants.clone(true));
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
        model.traverse(o => {
          if (o.isMesh) {
            o.castShadow = false;
            o.receiveShadow = true;
          }
        });
        holder.add(model);
        holder.userData.mixer = mixer;
      }
      document.documentElement.dataset.realisticPeople = String(people.length);
      document.documentElement.dataset.characterModels = '2';
      document.documentElement.dataset.furnitureModels = '1';
    
    
    
    
    
      batchStaticMeshes();
      scene.traverse(object => { if (object.isPointLight) localLights.push(object); });
      renderer.shadowMap.needsUpdate = true;
      document.documentElement.dataset.modelLoad = 'ready';
    } catch (error) {
      console.warn('OFOQ: using the base tour because model loading failed.', error);
      document.documentElement.dataset.modelLoad = 'fallback';
    }
  }
  // City assets are optional: loading them cannot interrupt the tour or sky.
  document.documentElement.dataset.cityStatus = 'loading';
  createCityNeighborhood(THREE, scene).then(neighborhood => {
    if (disposed) { neighborhood.destroy(); return; }
    city = neighborhood;
    city.setNight(cityLightLevel);
    renderer.shadowMap.needsUpdate = true;
    skylineFallback.forEach(mesh => { scene.remove(mesh); mesh.geometry.dispose(); });
  }).catch(error => {
    if (!disposed) document.documentElement.dataset.cityStatus = 'fallback';
    console.warn('OFOQ: city models unavailable; keeping the base skyline.', error);
  });
  document.documentElement.dataset.modelLoad = 'loading';
  loadModels();
  return {
    setNight: (night, immediate = false) => {
      requestedNight = night;
      coastal.setNight(night, immediate);
    },
    move,
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
      city?.destroy();
      logoTexture.dispose();
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
