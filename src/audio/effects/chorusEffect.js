import { EffectModule } from "./effectBase.js";

export class ChorusEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Chorus");
    this.delay = ctx.createDelay(0.05);
    this.lfo = ctx.createOscillator();
    this.lfoGain = ctx.createGain();
    this.mix = ctx.createGain();
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();

    this.lfo.type = "sine";
    this.setRate(1.2);
    this.setDepth(0.01);
    this.setMix(0.4);

    this.input.connect(this.dry);
    this.input.connect(this.delay);
    this.delay.connect(this.wet);
    this.dry.connect(this.mix);
    this.wet.connect(this.mix);
    this.mix.connect(this.output);

    this.lfo.connect(this.lfoGain).connect(this.delay.delayTime);
    this.lfo.start();
  }

  setRate(rate) {
    this.rate = rate;
    this.lfo.frequency.setValueAtTime(rate, this.ctx.currentTime);
  }

  setDepth(depth) {
    this.depth = depth;
    this.lfoGain.gain.setValueAtTime(depth, this.ctx.currentTime);
  }

  setMix(amount) {
    this.mixAmount = amount;
    this.dry.gain.setValueAtTime(1 - amount, this.ctx.currentTime);
    this.wet.gain.setValueAtTime(amount, this.ctx.currentTime);
  }

  getParams() {
    return { rate: this.rate, depth: this.depth, mix: this.mixAmount };
  }
}
