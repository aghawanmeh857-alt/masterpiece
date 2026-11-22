export const TOUR_STOPS = [0, 27, 36, 45, 54, 64];
export const RECEPTION_TIME = 19;
export const TOUR_END = 68;

const clampProgress = (value) => Math.max(0, Math.min(1, value));
const smoothProgress = (value) => value * value * (3 - 2 * value);

export function stationTourTime(index, opening, reading, travel, reducedMotion = false) {
  if (index === 0 && !reducedMotion && opening < 1) return RECEPTION_TIME * clampProgress(opening);
  const start = index === 0 ? RECEPTION_TIME : TOUR_STOPS[index];
  const end = TOUR_STOPS[index + 1] ?? TOUR_END;
  // Keep the subject in frame while the card is read, with just enough
  // movement to give feedback that scrolling is still advancing the tour.
  const drift = reducedMotion ? 0 : index === 0 ? 0.66 : index === 5 ? 1.65 : 1.05;
  const transition = clampProgress(travel);
  return (
    start +
    drift * smoothProgress(clampProgress(reading)) +
    (end - start - drift) * (reducedMotion ? transition : smoothProgress(transition))
  );
}

// Frame-rate independent easing. A scroll event only updates the destination;
// rendering advances toward it, including when the wheel is released.
export function advanceTour(time, target, dt, smoothness = 0.32) {
  // Use the time between frames on slower devices, but bound the first frame after a long stall.
  const elapsed = Math.max(0, Math.min(dt, 0.2));
  const delta = target - time;
  if (Math.abs(delta) < 0.001) return target;
  const eased = delta * (1 - Math.exp(-elapsed / smoothness));
  const limit = 12 * elapsed;
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

// Interpolate each coordinate using slopes in tour seconds. The shared slope
// on either side of a key keeps the speed continuous, even when key spacing
// changes. Bounding each coordinate also keeps the camera inside doorways.
export function createTourPath(keys) {
  const times = keys.map((key) => key[0]);
  const last = keys.length - 1;
  const durations = times.slice(1).map((time, index) => time - times[index]);
  const tracks = [1, 2].map((column) =>
    [0, 1, 2].map((axis) => {
      const values = keys.map((key) => key[column][axis]);
      const segments = durations.map((duration, i) => (values[i + 1] - values[i]) / duration);
      const slopes = values.map((_, i) => {
        if (i === 0) return segments[0];
        if (i === last) return segments[last - 1];
        const before = segments[i - 1],
          after = segments[i];
        if (before * after <= 0) return 0;
        const left = durations[i - 1],
          right = durations[i];
        const firstWeight = 2 * right + left,
          secondWeight = right + 2 * left;
        return (firstWeight + secondWeight) / (firstWeight / before + secondWeight / after);
      });
      return { values, slopes };
    })
  );
  return (time, position, aim) => {
    const next = times.findIndex((key) => key > time);
    const index = next === -1 ? last - 1 : Math.max(0, next - 1);
    const duration = durations[index];
    const t = Math.max(0, Math.min(1, (time - times[index]) / duration));
    const t2 = t * t,
      t3 = t2 * t;
    const start = 2 * t3 - 3 * t2 + 1,
      end = 3 * t2 - 2 * t3;
    const startSlope = (t3 - 2 * t2 + t) * duration,
      endSlope = (t3 - t2) * duration;
    function evaluate(track, dest) {
      for (let axis = 0; axis < 3; axis++) {
        const { values, slopes } = track[axis];
        dest[axis] =
          start * values[index] +
          end * values[index + 1] +
          startSlope * slopes[index] +
          endSlope * slopes[index + 1];
      }
    }
    evaluate(tracks[0], position);
    evaluate(tracks[1], aim);
  };
}

// Lower pixel work only after sustained slow frames, including severe stalls.
export function nextRenderScale(scale, averageFrameMs, viewportPixels) {
  if (!Number.isFinite(averageFrameMs) || averageFrameMs <= 28) return scale;
  const pixelBudget = averageFrameMs >= 95 ? 95000 : averageFrameMs >= 48 ? 155000 : 280000;
  const minimum = Math.min(0.65, Math.sqrt(pixelBudget / Math.max(1, viewportPixels)));
  return scale <= minimum ? scale : Math.max(minimum, scale * 0.8);
}
