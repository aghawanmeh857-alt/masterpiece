import assert from 'node:assert/strict';
import { TOUR_STOPS, TOUR_END, RECEPTION_TIME, stationTourTime, advanceTour, roomAtTourTime, createTourPath, nextRenderScale } from '../hero/tour-motion.js';

assert.equal(stationTourTime(0, 0, 0, 0), 0);
assert.equal(stationTourTime(0, .5, 0, 0), RECEPTION_TIME / 2);
for (let index = 0; index < TOUR_STOPS.length; index++) {
  const arrival = index === 0 ? RECEPTION_TIME : TOUR_STOPS[index];
  const departure = TOUR_STOPS[index + 1] ?? TOUR_END;
  assert.equal(stationTourTime(index, 1, 0, 0), arrival);
  assert.equal(stationTourTime(index, 1, 1, 1), departure);
  assert.equal(stationTourTime(index, 1, .5, 0, true), arrival, 'Reduced motion holds the room while reading');
  let previous = arrival;
  for (let step = 1; step <= 200; step++) {
    const progress = step / 100;
    const target = stationTourTime(index, 1, progress, progress - 1);
    assert(target > previous, 'Scrolling even within a station must advance the path');
    previous = target;
  }
}
function run(fps, start, target, seconds) {
  let time = start;
  for (let frame = 0; frame < fps * seconds; frame++) {
    const next = advanceTour(time, target, 1 / fps);
    assert(Math.abs(next - time) <= 12 / fps + 1e-8, 'Each frame has a bounded movement');
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
assert(Math.abs(run(10, 0, 27, 1) - run(60, 0, 27, 1)) < .1, 'Slow render frames must not leave the scroll camera behind');
assert.equal(advanceTour(5, 20, 0), 5);
assert.equal(roomAtTourTime(0), 0);
assert.equal(roomAtTourTime(27), 1);
assert.equal(roomAtTourTime(36), 2);
assert.equal(roomAtTourTime(45), 3);
assert.equal(roomAtTourTime(64), 5);
console.log('Passed: scroll mapping, bounded movement, no overshoot, settling, reverse scrolling, room synchronization and 30/60/144fps consistency.');

const unevenKeys = [
  [0, [0, 10, 21], [0, 8, 0]],
  [3, [0, 3, 8], [0, 2, -2]],
  [4, [0, 2, 2], [0, 2, -8]],
  [7, [1, 2, -6], [4, 2, -10]]
];
const samplePath = createTourPath(unevenKeys);
function pathAt(time) {
  const position = [], aim = [];
  samplePath(time, position, aim);
  return [...position, ...aim];
}
for (const [time, position, aim] of unevenKeys) assert.deepEqual(pathAt(time), [...position, ...aim]);
const step = 1e-5;
for (const [time] of unevenKeys.slice(1, -1)) {
  const before = pathAt(time - step), current = pathAt(time), after = pathAt(time + step);
  current.forEach((value, index) => {
    const incoming = (value - before[index]) / step, outgoing = (after[index] - value) / step;
    assert(Math.abs(incoming - outgoing) < .001, 'Camera and aim velocity must match across uneven key intervals');
  });
}
for (let time = 0; time <= 4; time += .01) assert.equal(pathAt(time)[0], 0, 'The approach does not drift sideways across the entrance');

assert.equal(nextRenderScale(1,16,1920*1080),1);
assert(nextRenderScale(1,200,1920*1080)<1,'Severe slow frames must lower pixel work');
let scale=1;
for(let i=0;i<30;i++) scale=nextRenderScale(scale,200,1920*1080);
assert(Math.abs(scale-Math.sqrt(95000/(1920*1080)))<1e-9);
assert.equal(nextRenderScale(scale,200,1920*1080),scale,'Never shrink below the pixel budget');
assert(nextRenderScale(.65,58,930*570)<nextRenderScale(.65,32,930*570),'Sustained long frames use the lighter pixel budget');
assert.equal(nextRenderScale(.2,200,1920*1080),.2,'Never increase an already lower scale');
assert.equal(nextRenderScale(1,NaN,1920*1080),1);
console.log('Passed: fast frames unchanged, severe stalls handled, bounded render scale without oscillation.');
