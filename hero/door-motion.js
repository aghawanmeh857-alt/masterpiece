// Open before reaching the glass, from either side of a doorway.
export function doorProximity(camera, doorway) {
  if (camera.y > doorway.height + 2) return 0;
  const distance = Math.hypot(camera.x - doorway.x, camera.z - doorway.z);
  const approach = doorway.approach ?? 7;
  const fullyOpen = doorway.fullyOpen ?? 3.5;
  const fraction = Math.max(0, Math.min(1, (approach - distance) / (approach - fullyOpen)));
  return fraction * fraction * (3 - 2 * fraction);
}

export function advanceDoor(current, target, dt, reducedMotion = false) {
  if (reducedMotion || Math.abs(target - current) < .001) return target;
  return current + (target - current) * (1 - Math.exp(-Math.max(0, Math.min(dt, .2)) / .16));
}
