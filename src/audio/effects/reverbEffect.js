import { EffectModule } from "./effectBase.js";

function buildImpulse(ctx, seconds = 2.5, decay = 2.8) {
  const rate = ctx.sampleRate;
  const length = rate * seconds;
  const impulse = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const n = Math.random() * 2 - 1;
      data[i] = n * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

export class ReverbEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Reverb");
    this.convolver = ctx.createConvolver();
    this.wet = ctx.createGain();
    this.dry = ctx.createGain();
    this.mix = ctx.createGain();

    this.convolver.buffer = buildImpulse(ctx);
    this.setMix(0.3);

    this.input.connect(this.dry);
    this.input.connect(this.convolver);
    this.convolver.connect(this.wet);
    this.dry.connect(this.mix);
    this.wet.connect(this.mix);
    this.mix.connect(this.output);
  }

  setDecay(decay) {
    this.convolver.buffer = buildImpulse(this.ctx, 2.5, decay);
  }

  setMix(amount) {
    this.mixAmount = amount;
    this.dry.gain.setValueAtTime(1 - amount, this.ctx.currentTime);
    this.wet.gain.setValueAtTime(amount, this.ctx.currentTime);
  }

  getParams() {
    return { mix: this.mixAmount };
  }
}
