// Lower pixel work only after sustained slow frames, including severe stalls.
export function nextRenderScale(scale, averageFrameMs, viewportPixels) {
  if (!Number.isFinite(averageFrameMs) || averageFrameMs <= 28) return scale;
  const minimum = Math.min(.65, Math.sqrt(280000 / Math.max(1, viewportPixels)));
  return scale <= minimum ? scale : Math.max(minimum, scale * .8);
}
