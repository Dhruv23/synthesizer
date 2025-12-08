// Simple biquad low-pass simulation for offline visualization.
export function biquadSim(x, cutoff, q, sampleRate, state) {
  const omega = (2 * Math.PI * cutoff) / sampleRate;
  const alpha = Math.sin(omega) / (2 * q);
  const cosw = Math.cos(omega);
  const b0 = (1 - cosw) / 2;
  const b1 = 1 - cosw;
  const b2 = (1 - cosw) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosw;
  const a2 = 1 - alpha;

  const x0 = x;
  const x1 = state.x1 || 0;
  const x2 = state.x2 || 0;
  const y1 = state.z1 || 0;
  const y2 = state.z2 || 0;

  const y =
    (b0 / a0) * x0 +
    (b1 / a0) * x1 +
    (b2 / a0) * x2 -
    (a1 / a0) * y1 -
    (a2 / a0) * y2;

  return {
    y,
    state: { x1: x0, x2: x1, z1: y, z2: y1 },
  };
}
