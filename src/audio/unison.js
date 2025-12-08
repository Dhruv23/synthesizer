export class UnisonOscillator {
  constructor(ctx, { voices = 4, detuneCents = 12, spread = 0.5, type = "sawtooth" } = {}) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.voices = [];
    this.panNodes = [];
    this.settings = { voices, detuneCents, spread, type };
    this.isNoise = false;
  }

  setType(type) {
    this.settings.type = type;
    this.isNoise = type === "noise";
    this.voices.forEach((o) => (o.type = type));
  }

  setVoices(count) {
    this.settings.voices = count;
    if (this.isPlaying) {
      this.stop();
      this.start(this.frequency);
    }
  }

  setDetune(cents) {
    this.settings.detuneCents = cents;
    this.voices.forEach((osc, idx) => {
      const det = this._detuneForIndex(idx);
      osc.detune.setValueAtTime(det, this.ctx.currentTime);
    });
  }

  setSpread(spread) {
    this.settings.spread = spread;
    this.panNodes.forEach((pan, idx) => pan.pan.setValueAtTime(this._panForIndex(idx), this.ctx.currentTime));
  }

  start(frequency) {
    this.stop();
    this.frequency = frequency;
    this.isPlaying = true;
    this.voices = [];
    this.panNodes = [];

    for (let i = 0; i < this.settings.voices; i++) {
      if (this.isNoise) {
        const noise = this._createNoiseSource();
        const pan = this.ctx.createStereoPanner();
        noise.connect(pan).connect(this.output);
        noise.start();
        this.voices.push(noise);
        this.panNodes.push(pan);
      } else {
        const osc = this.ctx.createOscillator();
        osc.type = this.settings.type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        osc.detune.setValueAtTime(this._detuneForIndex(i), this.ctx.currentTime);
        const pan = this.ctx.createStereoPanner();
        osc.connect(pan).connect(this.output);
        pan.pan.setValueAtTime(this._panForIndex(i), this.ctx.currentTime);
        osc.start();
        this.voices.push(osc);
        this.panNodes.push(pan);
      }
    }
  }

  stop() {
    this.isPlaying = false;
    this.voices.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
      try {
        source.disconnect();
      } catch (e) {}
    });
    this.voices = [];
    this.panNodes = [];
  }

  _detuneForIndex(idx) {
    if (this.settings.voices === 1) return 0;
    const spread = this.settings.detuneCents;
    const t = idx / (this.settings.voices - 1);
    return (t - 0.5) * 2 * spread;
  }

  _panForIndex(idx) {
    if (this.settings.voices === 1) return 0;
    const t = idx / (this.settings.voices - 1);
    return (t - 0.5) * 2 * this.settings.spread;
  }

  _createNoiseSource() {
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
  }
}
