import assert from 'node:assert/strict';
import {SCENIC_TREES} from '../3D/scenic-plantings.js';
import {skylineBlocks} from '../hero/city-skyline.js';
assert.equal(SCENIC_TREES.length,12);
for(const [x,z,h]of SCENIC_TREES){assert(h>=8&&h<=10);assert(x>38||z< -90,'Decorative trees must stay away from the camera corridor');assert(Math.abs(x)<80&&z> -135);}
const buildings = skylineBlocks();
assert(buildings.length > 50 && buildings.some(building => building.setback));
for (const [i, building] of buildings.entries()) {
  const {x, z, width, depth} = building;
  assert(x - width / 2 > 38 || z + depth / 2 < -90, 'Skyline stays outside the tower and entrance route');
  for (const other of buildings.slice(i + 1)) {
    assert(Math.abs(x - other.x) >= (width + other.width) / 2 || Math.abs(z - other.z) >= (depth + other.depth) / 2,
      'Building footprints do not intersect');
  }
  for (const [treeX, treeZ] of SCENIC_TREES) {
    assert(Math.abs(x - treeX) > width / 2 || Math.abs(z - treeZ) > depth / 2,
      'A landscaping tree is not planted inside a skyline building');
  }
}
console.log('Passed: skyline footprints and trees stay out of the route and clear of each other.');
