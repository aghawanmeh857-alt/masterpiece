export const TOUR_STOPS = [0, 27, 36, 45, 54, 64];

export function tourTarget(raw, reducedMotion = false) {
  const progress = Math.max(0, Math.min(5, raw));
  const index = Math.min(4, Math.floor(progress));
  const fraction = progress - index;
  const transition = Math.max(0, Math.min(1, (fraction - .12) / .76));
  const eased = reducedMotion ? fraction : transition ** 3 * (transition * (transition * 6 - 15) + 10);
  return TOUR_STOPS[index] + (TOUR_STOPS[index + 1] - TOUR_STOPS[index]) * eased;
}

// Frame-rate independent easing. A scroll event only updates the destination;
// rendering advances toward it, including when the wheel is released.
export function advanceTour(time, target, dt, smoothness = .28) {
  const elapsed = Math.max(0, Math.min(dt, .05));
  const delta = target - time;
  if (Math.abs(delta) < .001) return target;
  const eased = delta * (1 - Math.exp(-elapsed / smoothness));
  const limit = 18 * elapsed;
  return time + Math.max(-limit, Math.min(limit, eased));
}

export function roomAtTourTime(time) {
  let room = 0;
  // Switch the text as the camera arrives at each room, rather than when the
  // scrollbar has already moved on to the next chapter.
  for (let index = 1; index < TOUR_STOPS.length; index++) {
    if (time >= TOUR_STOPS[index] - 2) room = index;
  }
  return room;
}
