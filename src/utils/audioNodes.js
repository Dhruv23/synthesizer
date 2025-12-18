export function createOscillatorNode(ctx, type, randomStartPhase = false) {
  const osc = ctx.createOscillator();
  osc.type = type;
  if (randomStartPhase && osc.type !== "custom") {
    const now = ctx.currentTime;
    const phaseOffset = Math.random() * (2 * Math.PI);
    const freq = 440;
    osc.frequency.setValueAtTime(freq, now);
    const real = new Float32Array([0, Math.cos(phaseOffset)]);
    const imag = new Float32Array([0, Math.sin(phaseOffset)]);
    const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
    osc.setPeriodicWave(wave);
  }
  return osc;
}

export function createNoiseNode(ctx) {
  const bufferSize = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  return noise;
}

export function createLfo(ctx, type, freq) {
  const lfo = ctx.createOscillator();
  lfo.type = type;
  lfo.frequency.value = freq;
  return lfo;
}
