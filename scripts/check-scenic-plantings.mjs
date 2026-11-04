import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SCENIC_TREES} from '../3D/scenic-plantings.js';
assert.equal(SCENIC_TREES.length,12);
for(const [x,z,h]of SCENIC_TREES){assert(h>=8&&h<=10);assert(x>38||z< -90,'Decorative trees must stay away from the camera corridor');assert(Math.abs(x)<80&&z> -135);}
const svg=fs.readFileSync(new URL('../assets/illustrations/roadside-office.svg',import.meta.url),'utf8');
assert(svg.includes('<svg')&&!svg.includes('<script')&&!svg.includes('<image'),'Office drawing is a standalone vector without external models');
assert(fs.statSync(new URL('../assets/illustrations/roadside-office.svg',import.meta.url)).size<20000);
console.log('Passed: distant landscaping stays outside the route; office vector is self-contained and under 20 KB.');
