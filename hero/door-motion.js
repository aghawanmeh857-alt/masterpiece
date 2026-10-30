// Open before reaching the glass, from either side of a doorway.
export function doorProximity(camera, doorway) {
  if (camera.y > doorway.height + 2) return 0;
  const distance = Math.hypot(camera.x - doorway.x, camera.z - doorway.z);
  const fraction = Math.max(0, Math.min(1, (7 - distance) / 3.5));
  return fraction * fraction * (3 - 2 * fraction);
}

export function advanceDoor(current, target, dt, reducedMotion = false) {
  if (reducedMotion || Math.abs(target - current) < .001) return target;
  return current + (target - current) * (1 - Math.exp(-Math.max(0, Math.min(dt, .05)) / .16));
}
