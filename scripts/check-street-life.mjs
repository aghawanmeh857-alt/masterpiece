import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TRAFFIC_LANES, lanePosition } from '../hero/city-traffic.js';
import { SIDEWALK_GATHERING } from '../hero/street-life.js';
import { sampleAircraftFlight } from '../hero/aircraft.js';
import { TOUR_CAMERA_PATH } from '../hero/tour-camera-path.js';
for (const lane of TRAFFIC_LANES) {
  for (const distance of [-1000, 0, 45, 200, 10000]) {
    const point = lanePosition(lane, distance),
      coordinate = point[lane.axis];
    assert(coordinate >= lane.from && coordinate <= lane.to);
    assert.equal(point[lane.axis === 'x' ? 'z' : 'x'], lane[lane.axis === 'x' ? 'z' : 'x']);
  }
  const length = lane.to - lane.from;
  assert.deepEqual(lanePosition(lane, 0), lanePosition(lane, length));
}
assert.deepEqual(sampleAircraftFlight(0), sampleAircraftFlight(1));
const openingAltitude = TOUR_CAMERA_PATH[0][1][1];
for (let sample = 0; sample <= 100; sample++) {
  assert(sampleAircraftFlight(sample / 100).y > openingAltitude, 'Flyby stays above the aerial opening');
}
assert(sampleAircraftFlight(0.5).z > 40, 'The visible leg crosses in front of the city');
for (const phase of [0.1, 0.25, 0.5, 0.75, 0.9]) {
  const before = sampleAircraftFlight(phase - 0.00001);
  const current = sampleAircraftFlight(phase);
  const after = sampleAircraftFlight(phase + 0.00001);
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  const dz = after.z - before.z;
  assert(Math.abs(current.yaw - Math.atan2(dx, dz)) < 0.0001);
  assert(Math.abs(current.pitch + Math.atan2(dy, Math.hypot(dx, dz))) < 0.0001);
}
assert(SIDEWALK_GATHERING.every(([x]) => x > 16), 'Stationary visitors stay on the side pavement');
for (const file of [
  'generic-sedan-car',
  'free-london-skyscraper',
  'business-male-4',
  'airplane',
  'maple-trees',
  'italian-fountain',
  'office-desk',
  'office-chair',
  'lobby-sofa'
]) {
  const bytes = fs.readFileSync(new URL(`../3D/${file}.glb`, import.meta.url));
  assert.equal(bytes.subarray(0, 4).toString(), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  assert(json.meshes.length > 0);
  assert(
    (json.buffers || []).every((buffer) => !buffer.uri),
    'GLB buffers are self-contained'
  );
}
console.log(
  'Passed: traffic routes, looping, stationary sidewalk visitors and nine valid self-contained GLB assets.'
);
