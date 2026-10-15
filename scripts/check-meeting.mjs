import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { initializeMeeting, meetingRoom, loadJitsi } from '../Meeting/meeting-session.js';

const html = readFileSync(new URL('../Meeting/meeting.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../Meeting/meeting-session.js', import.meta.url), 'utf8');
for (const [, id] of source.matchAll(/(?<!\.)\bget\('([^']+)'\)/g)) assert(html.includes(`id="${id}"`), `Missing element ${id}`);
const crypto = { randomUUID };
const emptyUrl = new URL('https://ofoq.example/Meeting/meeting.html?recipient=lina&theme=dark');
const room = meetingRoom(emptyUrl, crypto);
assert.notEqual(room, meetingRoom(emptyUrl, crypto));
emptyUrl.searchParams.set('room', room);
assert.equal(meetingRoom(emptyUrl, crypto), room);
emptyUrl.searchParams.set('room', '<script>');
assert.match(meetingRoom(emptyUrl, crypto), /^OfoqInterview-[a-f0-9]{32}$/);
assert.match(meetingRoom(emptyUrl, { getRandomValues: bytes => bytes.fill(7) }), /^OfoqInterview-[a-f0-9]{32}$/);

function fixture(load) {
  const elements = new Map();
  const events = {};
  const instances = [];
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '', hidden: false, disabled: false, textContent: '', listeners: {},
      addEventListener(event, fn) { this.listeners[event] = fn; },
      replaceChildren() {}, setCustomValidity(text) { this.validation = text; },
      reportValidity() { return !this.validation; }, focus() { this.focused = true; }, select() { this.selected = true; }
    });
    return elements.get(id);
  };
  class FakeJitsi {
    constructor(domain, options) { this.domain = domain; this.options = options; this.events = {}; instances.push(this); }
    addListener(event, fn) { this.events[event] = fn; }
    dispose() { this.disposed = true; }
  }
  const win = {
    location: { href: 'https://ofoq.example/Meeting/meeting.html?recipient=lina&theme=dark' },
    crypto, isSecureContext: true,
    history: { replaceState(_state, _unused, url) { win.location.href = url.href; } },
    navigator: { clipboard: { async writeText(text) { win.copied = text; } } },
    OfoqPublishers: {
      get: id => id === 'lina' ? { id, name: 'لينا حداد' } : undefined,
      url: () => 'https://ofoq.example/Account/Messages/messages.html?recipient=lina'
    },
    addEventListener(event, fn) { events[event] = fn; }
  };
  initializeMeeting(win, { getElementById: element }, load ? () => load(FakeJitsi) : async () => FakeJitsi);
  element('displayName').value = '  اسم المشارك  ';
  return { win, events, element, instances, join: () => element('joinMeeting').listeners.click() };
}

const ui = fixture();
assert.equal(ui.instances.length, 0, 'Loading the page must not start the camera or a meeting');
assert(ui.element('backToProject').href.includes('recipient=lina'));
await ui.join();
const first = ui.instances[0];
assert.equal(first.domain, 'meet.jit.si');
assert.equal(first.options.userInfo.displayName, 'اسم المشارك');
assert.equal(first.options.roomName, new URL(ui.win.location.href).searchParams.get('room'));
assert.equal(ui.element('inviteLink').value, `https://meet.jit.si/${first.options.roomName}`);
assert.equal(first.options.width, '100%');
assert.equal(first.options.configOverwrite.startWithVideoMuted, true);
assert.equal(ui.element('welcome').hidden, true);
await ui.join();
assert.equal(ui.instances.length, 1, 'Do not open duplicate meeting frames');
first.events.videoConferenceJoined();
assert(ui.element('meetingStatus').textContent.includes('أنت الآن'));
first.events.cameraError();
assert(ui.element('meetingStatus').textContent.includes('الكاميرا'));
first.events.micError();
assert(ui.element('meetingStatus').textContent.includes('الميكروفون'));
first.events.errorOccurred();
assert(ui.element('meetingStatus').textContent.includes('الاتصال'));
await ui.element('copyInvite').listeners.click();
assert.equal(ui.win.copied, ui.element('inviteLink').value);
ui.element('leaveMeeting').listeners.click();
assert.equal(first.disposed, true);
assert.equal(ui.element('welcome').hidden, false);
assert.equal(ui.element('joinMeeting').disabled, false);
await ui.join();
assert.equal(ui.instances[1].options.roomName, first.options.roomName, 'Rejoin must preserve the room');
ui.instances[1].events.readyToClose();
assert.equal(ui.instances[1].disposed, true);
await ui.join();
ui.events.pagehide();
assert.equal(ui.instances[2].disposed, true);

let attempts = 0;
const retry = fixture(async API => { if (++attempts === 1) throw new Error('offline'); return API; });
await retry.join();
assert.equal(retry.element('joinMeeting').disabled, false);
assert(retry.element('meetingStatus').textContent.includes('تعذّر'));
await retry.join();
assert.equal(retry.instances.length, 1);
retry.win.navigator.clipboard.writeText = async () => { throw new Error('blocked'); };
await retry.element('copyInvite').listeners.click();
assert.equal(retry.element('inviteLink').selected, true);
const invalid = fixture();
invalid.element('displayName').value = '   ';
await invalid.join();
assert.equal(invalid.instances.length, 0);
invalid.element('displayName').value = 'اسم';
invalid.win.isSecureContext = false;
await invalid.join();
assert.equal(invalid.instances.length, 0);

// Exercise the external script loader without contacting Jitsi or using devices.
let script;
const loaderWindow = { setTimeout: () => 1, clearTimeout() {} };
const loaderDoc = { createElement: () => ({ remove() { this.removed = true; } }), head: { append(node) { script = node; } } };
const failedLoad = loadJitsi(loaderWindow, loaderDoc);
script.onerror();
await assert.rejects(failedLoad);
assert.equal(script.removed, true);
const successfulLoad = loadJitsi(loaderWindow, loaderDoc);
loaderWindow.JitsiMeetExternalAPI = class {};
script.onload();
assert.equal(await successfulLoad, loaderWindow.JitsiMeetExternalAPI);
console.log('Passed: unique/reusable rooms, participant context, join/leave/rejoin, duplicate prevention, cleanup, failed-load retry, copy fallback, name validation and secure-context handling. No live call was made.');
