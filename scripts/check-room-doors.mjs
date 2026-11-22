import assert from 'node:assert/strict';
import { doorProximity, advanceDoor } from '../hero/door-motion.js';

const doorway = { x: -2.25, z: -22, height: 3.35 };
assert.equal(doorProximity({ x: -2.25, y: 2, z: -22 }, doorway), 1);
assert.equal(doorProximity({ x: -4.5, y: 2, z: -22 }, doorway), 1);
assert.equal(doorProximity({ x: 0, y: 2, z: -22 }, doorway), 1);
assert.equal(doorProximity({ x: 0, y: 2, z: 10 }, doorway), 0);
assert.equal(doorProximity({ x: -2.25, y: 36, z: -22 }, doorway), 0);
assert.equal(
  doorProximity({ x: -2.25, y: 2, z: -16 }, doorway),
  doorProximity({ x: -2.25, y: 2, z: -28 }, doorway)
);
const entrance = { x: 0, z: 2.05, height: 3, approach: 9.5, fullyOpen: 5.5 };
assert.equal(
  doorProximity({ x: 0, y: 1.85, z: 7.55 }, entrance),
  1,
  'The main door must open ahead of the approaching camera'
);
assert.equal(doorProximity({ x: 0, y: 1.85, z: 11.6 }, entrance), 0);
for (const fps of [10, 30, 60, 144]) {
  let amount = 0;
  for (let i = 0; i < fps; i++) amount = advanceDoor(amount, 1, 1 / fps);
  assert(amount > 0.99 && amount <= 1);
  for (let i = 0; i < fps; i++) amount = advanceDoor(amount, 0, 1 / fps);
  assert(amount < 0.01 && amount >= 0);
}
assert.equal(advanceDoor(0, 1, 1 / 60, true), 1);
assert.equal(advanceDoor(0, 1, 0), 0);
console.log(
  'Passed: proximity, early entry opening, smooth opening/closing at 10/30/60/144fps, and reduced motion.'
);
