import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TRAFFIC_LANES, lanePosition } from '../hero/city-traffic.js';
import { STREET_ROUTES, wrappedProgress } from '../hero/street-life.js';
for (const lane of TRAFFIC_LANES) {
  for (const distance of [-1000, 0, 45, 200, 10000]) {
    const point = lanePosition(lane, distance), coordinate = point[lane.axis];
    assert(coordinate >= lane.from && coordinate <= lane.to);
    assert.equal(point[lane.axis === 'x' ? 'z' : 'x'], lane[lane.axis === 'x' ? 'z' : 'x']);
  }
  const length = lane.to - lane.from;
  assert.deepEqual(lanePosition(lane, 0), lanePosition(lane, length));
}
assert.equal(wrappedProgress(120, 100), .2);
assert.equal(wrappedProgress(-10, 100), .9);
assert(STREET_ROUTES[3].every(([, z]) => z >= 6.5), 'Plaza walkers stay outside the entrance');
for (const route of STREET_ROUTES) assert(route.every(([x, z]) => x > 16 || z >= 6.5), 'No walking route enters the building');
for (const file of ['generic-sedan-car', 'fixed-new-york-highway-interstate-95', 'free-london-skyscraper', 'business-male-4', 'airplane', 'maple-trees', 'italian-fountain', 'office-desk', 'office-chair', 'lobby-sofa']) {
  const bytes = fs.readFileSync(new URL(`../3D/${file}.glb`, import.meta.url));
  assert.equal(bytes.subarray(0, 4).toString(), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  assert(json.meshes.length > 0);
  assert((json.buffers || []).every(buffer => !buffer.uri), 'GLB buffers are self-contained');
}
console.log('Passed: traffic routes, looping, exterior-only pedestrian paths and ten valid self-contained GLB assets.');
