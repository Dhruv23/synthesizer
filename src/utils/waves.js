export function evalWave(type, freq, t) {
  const phase = t * freq * 2 * Math.PI;
  switch (type) {
    case "sine":
      return Math.sin(phase);
    case "square":
      return Math.sign(Math.sin(phase)) || 1;
    case "sawtooth":
      return 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
    case "triangle":
      return 2 * Math.abs(2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5))) - 1;
    default:
      return Math.sin(phase);
  }
}
