import assert from 'node:assert/strict';
import { TOUR_STOPS, tourTarget, advanceTour, roomAtTourTime } from '../hero/tour-motion.js';

for (let index = 0; index < TOUR_STOPS.length; index++) assert.equal(tourTarget(index), TOUR_STOPS[index]);
let previous = 0;
for (let progress = 0; progress <= 5; progress += .002) {
  const target = tourTarget(progress);
  assert(target >= previous - 1e-9, 'Scrolling down must not reverse the camera');
  previous = target;
}
function run(fps, start, target, seconds) {
  let time = start;
  for (let frame = 0; frame < fps * seconds; frame++) {
    const next = advanceTour(time, target, 1 / fps);
    assert(Math.abs(next - time) <= 18 / fps + 1e-8, 'Each frame has a bounded movement');
    assert(next >= Math.min(start, target) && next <= Math.max(start, target), 'No overshoot');
    time = next;
  }
  return time;
}
for (const fps of [30, 60, 144]) {
  assert(Math.abs(run(fps, 0, 27, 4) - 27) < .01, 'The camera must catch up after scrolling stops');
  assert(Math.abs(run(fps, 36, 27, 3) - 27) < .01, 'Reverse scrolling must converge');
}
assert(Math.abs(run(30, 0, 27, 1) - run(144, 0, 27, 1)) < .1, 'Motion stays consistent across frame rates');
assert.equal(advanceTour(5, 20, 0), 5);
assert.equal(roomAtTourTime(0), 0);
assert.equal(roomAtTourTime(27), 1);
assert.equal(roomAtTourTime(36), 2);
assert.equal(roomAtTourTime(45), 3);
assert.equal(roomAtTourTime(64), 5);
assert.equal(tourTarget(-1), 0);
assert.equal(tourTarget(9), 64);
console.log('Passed: scroll mapping, bounded movement, no overshoot, settling, reverse scrolling, room synchronization and 30/60/144fps consistency.');
