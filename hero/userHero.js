import { ROOM_SECTIONS, renderRoomSections } from './room-sections.js?v=single-action-2';
import { TOUR_STOPS, RECEPTION_TIME as receptionTime, stationTourTime } from './tour-motion.js';

const adminPreview =
  new URLSearchParams(location.search).get('preview') === 'admin' && parent !== window;
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
  document.querySelector('.theme-toggle').textContent = dark
    ? '☀ الوضع النهاري'
    : '☾ الوضع الليلي';
  document
    .querySelector('.theme-toggle')
    .setAttribute('aria-label', dark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي');
  const url = new URL(location.href);
  url.searchParams.set('theme', dark ? 'dark' : 'light');
  history.replaceState(null, '', url);
  document.querySelectorAll('a[href]').forEach(function (link) {
    const target = new URL(link.href);
    if (target.origin === location.origin && target.pathname.endsWith('.html'))
      link.href = window.siteThemeUrl(link.href);
  });
};
window.setSiteTheme(new URLSearchParams(location.search).get('theme'));
document.querySelector('.theme-toggle').addEventListener('click', function () {
  setTimeOfDay(document.documentElement.dataset.theme !== 'dark');
});

// 2. أزرار الصفحة والتنقل بالسكرول.

// بيانات الغرف والفرص التجريبية.
const rooms = [
  { id: 'lobby', name: 'الرئيسية', caption: 'أهلًا بك', action: 'ابدأ رحلتك' },
  { id: 'freelance', name: 'العمل الحر', caption: 'اصنع طريقك', action: 'استكشف المشاريع' },
  { id: 'academy', name: 'الأكاديمية', caption: 'واصل التعلّم', action: 'تصفّح المسارات' },
  { id: 'internships', name: 'فرص التدريب', caption: 'خطوتك الأولى', action: 'اكتشف التدريبات' },
  { id: 'jobs', name: 'الوظائف', caption: 'ابحث عن مكانك', action: 'تصفّح الوظائف' },
  { id: 'events', name: 'الفعاليات', caption: 'ننجز معًا', action: 'استكشف الفعاليات' }
];

const $ = (id) => document.getElementById(id);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let currentRoom = -1;
let sceneApi = null;
let renderedTourTime = 0;
let skipOpening = reducedMotion;

function setTimeOfDay(night, immediate = false) {
  window.setSiteTheme(night ? 'dark' : 'light');
  sceneApi?.setNight(night, immediate);
  $('dayMode').setAttribute('aria-pressed', String(!night));
  $('nightMode').setAttribute('aria-pressed', String(night));
}

const chapters = [...document.querySelectorAll('.chapter')];
const tourEnd = document.getElementById('journeyEnd');
let tourEndTop = 0;
const buttons = [...document.querySelectorAll('[data-room]')];
const readingStops = chapters.map((chapter, index) => {
  const data = ROOM_SECTIONS[index];
  const article = document.createElement('article');
  article.className = 'station-content';
  const label = document.createElement('p');
  label.className = 'station-label';
  label.textContent = String(index + 1).padStart(2, '0') + ' / ' + rooms[index].name;
  const title = document.createElement(index === 0 ? 'h1' : 'h2');
  title.className = 'station-title';
  title.innerHTML = data.title;
  const description = document.createElement('p');
  description.className = 'station-description';
  description.textContent = data.description;
  const services = document.createElement('div');
  renderRoomSections(services, index);
  const action = document.createElement('a');
  action.className = 'btn btn-orange station-action';
  const destinations = [
    '../Auth/Register/register.html',
    '../Freelance/freelance.html',
    '../Academy/academy.html',
    '../Internships/internships.html',
    '../Jobs/jobs.html',
    '../Events/events.html'
  ];
  action.href = window.siteThemeUrl(destinations[index]);
  action.textContent = index === 0 ? 'إنشاء حساب ←' : rooms[index].action + ' ←';
  const hint = document.createElement('p');
  hint.className = 'station-scroll-hint';
  hint.textContent =
    index === 5
      ? 'تابع التمرير للوصول إلى ختام الجولة ↓'
      : 'تابع التمرير للانتقال إلى القسم التالي ↓';
  article.append(label, title, description, services, action, hint);
  chapter.append(article);
  return { chapter, article, reading: 0, travel: 0 };
});
function refreshReadingPanels() {
  readingStops.forEach((stop, index) => {
    const local = scrollY - stop.top;
    const readingLocal = local - (stop.opening || 0);
    const active =
      index === currentRoom &&
      readingLocal >= -20 &&
      readingLocal < stop.reading &&
      (index !== 0 || skipOpening || renderedTourTime >= receptionTime - 0.5);
    const fadeDistance = Math.max(1, Math.min(180, stop.reading * 0.3));
    const remaining = Math.max(0, Math.min(1, (stop.reading - readingLocal) / fadeDistance));
    const opacity = remaining * remaining * (3 - 2 * remaining);
    const inert = !active || opacity < 0.15;
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
    const movement = Math.max(
      0,
      Math.min(1, (readingLocal - stop.hold) / (stop.reading - stop.hold))
    );
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
  const heights = readingStops.map((stop) => stop.article.offsetHeight);
  readingStops.forEach((stop, index) => {
    stop.opening = index === 0 && !skipOpening ? innerHeight * (innerWidth < 768 ? 2 : 2.6) : 0;
    // Hold the panel in place first, then leave a longer reading window before travel.
    stop.hold = innerHeight * 0.25;
    stop.reading = stop.hold + Math.max(innerHeight * 1.2, heights[index] - innerHeight + 380);
    stop.travel = index === 5 ? innerHeight * 0.35 : innerHeight * 1.15;
    stop.chapter.style.setProperty(
      '--station-height',
      stop.opening + stop.reading + stop.travel + 'px'
    );
  });
  // Measure once after layout changes, never while animating the camera.
  readingStops.forEach((stop, index) => {
    stop.top = stop.chapter.offsetTop;
    stop.exitDistance = heights[index] + (innerWidth < 768 ? 130 : 150);
  });
  tourEndTop = tourEnd.offsetTop;
}
measureReadingStops();
let readingLayoutFrame = null;
function scheduleReadingLayout() {
  if (readingLayoutFrame !== null) return;
  readingLayoutFrame = requestAnimationFrame(() => {
    readingLayoutFrame = null;
    measureReadingStops();
    progressAtScroll();
  });
}
const readingResizeObserver = new ResizeObserver(scheduleReadingLayout);
readingStops.forEach((stop) => readingResizeObserver.observe(stop.article));
document.fonts.ready.then(scheduleReadingLayout);

// تحديث واجهة القسم الحالي.
function setRoom(index) {
  if (currentRoom === index) return;

  currentRoom = index;
  refreshReadingPanels();

  const room = rooms[index];
  $('counter').textContent = `${String(index + 1).padStart(2, '0')} / 06`;

  $('sceneCaption').textContent = `${room.name} / ${room.caption}`;

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

buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    jumpTo(Number(button.dataset.room));
    const navigation = button.closest('.hero-navigation');
    if (navigation && matchMedia('(max-width: 991px)').matches) {
      navigation.open = false;
      navigation.querySelector('summary').focus({ preventScroll: true });
    }
  });
});

document.querySelector('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  jumpTo(0);
});

const mobileTour = matchMedia('(max-width: 767px)');
const tourFooter = document.querySelector('.tour-footer');
const tourCaption = document.querySelector('.scene-caption');
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
document.querySelector('.journey-end-brand').addEventListener('click', (event) => {
  event.preventDefault();
  jumpTo(0);
});

function progressAtScroll() {
  const endVisible = !adminPreview && scrollY + innerHeight > tourEndTop + 60;
  if (tourEndVisible !== endVisible) {
    tourEndVisible = endVisible;
    document.documentElement.classList.toggle('tour-at-end', endVisible);
    tourEnd.inert = !endVisible;
    tourEnd.setAttribute('aria-hidden', String(!endVisible));
    syncMobileTourOverlay();
  }
  refreshReadingPanels();
  if (adminPreview) return;
  let index = 0;
  for (let i = 1; i < readingStops.length; i++) if (scrollY >= readingStops[i].top) index = i;
  const stop = readingStops[index];
  const local = scrollY - stop.top;
  const reading = (local - stop.opening) / stop.reading;
  const approach = stop.opening ? local / stop.opening : 1;
  const travel = (local - stop.opening - stop.reading) / stop.travel;
  const journeyTime = stationTourTime(index, approach, reading, travel, reducedMotion);
  if (!sceneApi) setRoom(index);
  sceneApi?.moveToTime(journeyTime);
  $('progress').style.width = Math.min(100, (journeyTime / TOUR_STOPS[5]) * 100) + '%';
}
let pendingScrollFrame = null;
addEventListener(
  'scroll',
  () => {
    if (pendingScrollFrame !== null) return;
    pendingScrollFrame = requestAnimationFrame(() => {
      pendingScrollFrame = null;
      progressAtScroll();
    });
  },
  { passive: true }
);
addEventListener('resize', scheduleReadingLayout);

function restoreRoom() {
  const index = rooms.findIndex((r) => location.hash === '#' + r.id);
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
  const { createBuildingTour } = await import('./building-tour.js?v=realistic-coastal-tour');
  sceneApi = await createBuildingTour($('scene'), {
    reducedMotion,
    adminPreview,
    onRoomChange: setRoom,
    onTourProgress: (value) => {
      renderedTourTime = value;
      refreshReadingPanels();
    }
  });
  document.documentElement.dataset.sceneReady = 'true';
  setTimeOfDay(document.documentElement.dataset.theme === 'dark', true);
  document.querySelector('.theme-toggle').disabled = false;
  $('dayMode').disabled = false;
  $('nightMode').disabled = false;
  $('dayMode').addEventListener('click', () => setTimeOfDay(false));
  $('nightMode').addEventListener('click', () => setTimeOfDay(true));
  restoreRoom();
  sceneApi.ready.then(() => {
    $('status').textContent = 'مرحبًا بك في SAEI';
    $('sceneLoader').hidden = true;
  });
  if (adminPreview) {
    addEventListener('message', (event) => {
      if (
        event.source !== parent ||
        event.origin !== location.origin ||
        event.data?.type !== 'ofoq-preview-config'
      )
        return;
      sceneApi.configurePreview(event.data);
    });
    parent.postMessage({ type: 'ofoq-preview-ready' }, location.origin);
  }
}
initScene().catch((error) => {
  console.error('SAEI 3D:', error);
  document.body.classList.add('fallback');
  $('sceneLoader').hidden = true;
  document.querySelector('.theme-toggle').disabled = false;
  document.querySelector('.day-night-controls').hidden = true;
  $('status').textContent = 'تعذّر عرض المشهد، يمكنك فتح الأقسام من القائمة.';
  document.documentElement.dataset.sceneReady = 'false';
  skipOpening = true;
  measureReadingStops();
  progressAtScroll();
  if (adminPreview) parent.postMessage({ type: 'ofoq-preview-error' }, location.origin);
});

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
