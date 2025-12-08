export function createOscillatorNode(ctx, type) {
  const osc = ctx.createOscillator();
  osc.type = type;
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
