// Asynchronous GPU timing: never block the render loop waiting for a result.
export function createGpuTiming(gl, onSample, enabled = false) {
  const extension = enabled && gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!extension) return { begin() {}, end() {}, destroy() {} };
  let pending = null, active = false, nextSample = 0;
  return {
    begin(now) {
      if (pending) {
        if (!gl.getQueryParameter(pending, gl.QUERY_RESULT_AVAILABLE)) return;
        if (!gl.getParameter(extension.GPU_DISJOINT_EXT)) {
          onSample(gl.getQueryParameter(pending, gl.QUERY_RESULT) / 1e6);
        }
        gl.deleteQuery(pending);
        pending = null;
      }
      if (now < nextSample) return;
      pending = gl.createQuery();
      gl.beginQuery(extension.TIME_ELAPSED_EXT, pending);
      active = true;
      nextSample = now + 1500;
    },
    end() {
      if (!active) return;
      gl.endQuery(extension.TIME_ELAPSED_EXT);
      active = false;
    },
    destroy() {
      if (active) gl.endQuery(extension.TIME_ELAPSED_EXT);
      if (pending) gl.deleteQuery(pending);
      pending = null;
      active = false;
    }
  };
}
