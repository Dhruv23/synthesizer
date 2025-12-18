export class FXChain {
  constructor(ctx) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.modules = {
      dist: this._createDistortion(),
      chorus: this._createChorus(),
      delay: this._createDelay(),
      reverb: this._createReverb(),
      comp: this._createCompressor(),
    };
  }

  configure(fxParams = {}) {
    // Disconnect existing
    try {
      this.input.disconnect();
      Object.values(this.modules).forEach((m) => m.output.disconnect());
    } catch (_) {}

    const active = [];
    if (fxParams.dist) active.push(this.modules.dist);
    if (fxParams.chorus) active.push(this.modules.chorus);
    if (fxParams.delay) active.push(this.modules.delay);
    if (fxParams.reverb) active.push(this.modules.reverb);
    if (fxParams.comp) active.push(this.modules.comp);

    if (!active.length) {
      this.input.connect(this.output);
      return false;
    }

    let node = this.input;
    active.forEach((m) => {
      node.connect(m.input);
      node = m.output;
    });
    node.connect(this.output);
    return true;
  }

  _createDistortion() {
    const ws = this.ctx.createWaveShaper();
    ws.curve = this._makeCurve(0.5);
    const input = this.ctx.createGain();
    const mix = this.ctx.createGain();
    const dry = this.ctx.createGain();
    const wet = this.ctx.createGain();
    dry.gain.value = 0.6;
    wet.gain.value = 0.4;
    input.connect(dry);
    input.connect(ws);
    ws.connect(wet);
    dry.connect(mix);
    wet.connect(mix);
    return { input, output: mix };
  }

  _makeCurve(amount) {
    const k = amount * 800;
    const samples = 2048;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * 2 - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  _createChorus() {
    const input = this.ctx.createGain();
    const delay = this.ctx.createDelay(0.05);
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const mix = this.ctx.createGain();
    const dry = this.ctx.createGain();
    const wet = this.ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 1.2;
    lfoGain.gain.value = 0.01;
    lfo.connect(lfoGain).connect(delay.delayTime);
    lfo.start();
    dry.gain.value = 0.7;
    wet.gain.value = 0.3;
    input.connect(dry);
    input.connect(delay);
    delay.connect(wet);
    dry.connect(mix);
    wet.connect(mix);
    return { input, output: mix };
  }

  _createDelay() {
    const input = this.ctx.createGain();
    const delay = this.ctx.createDelay(1.5);
    const fb = this.ctx.createGain();
    const mix = this.ctx.createGain();
    const dry = this.ctx.createGain();
    const wet = this.ctx.createGain();
    dry.gain.value = 0.7;
    wet.gain.value = 0.3;
    delay.delayTime.value = 0.25;
    fb.gain.value = 0.35;
    input.connect(dry);
    input.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet);
    dry.connect(mix);
    wet.connect(mix);
    return { input, output: mix };
  }

  _createReverb() {
    const input = this.ctx.createGain();
    const convolver = this.ctx.createConvolver();
    convolver.buffer = this._buildImpulse(2.2, 2.5);
    const mix = this.ctx.createGain();
    const dry = this.ctx.createGain();
    const wet = this.ctx.createGain();
    dry.gain.value = 0.7;
    wet.gain.value = 0.3;
    input.connect(dry);
    input.connect(convolver);
    convolver.connect(wet);
    dry.connect(mix);
    wet.connect(mix);
    return { input, output: mix };
  }

  _buildImpulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const length = rate * seconds;
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  _createCompressor() {
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    const input = this.ctx.createGain();
    input.connect(comp);
    return { input, output: comp };
  }
}
