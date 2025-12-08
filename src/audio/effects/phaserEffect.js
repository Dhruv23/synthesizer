import { EffectModule } from "./effectBase.js";

export class PhaserEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Phaser");
    this.stages = Array.from({ length: 4 }, () => ctx.createBiquadFilter());
    this.stages.forEach((ap) => {
      ap.type = "allpass";
      ap.frequency.value = 800;
    });
    this.lfo = ctx.createOscillator();
    this.modulators = [];
    this.mix = ctx.createGain();
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();

    this.setRate(0.2);
    this.setDepth(600);
    this.setMix(0.35);

    this.input.connect(this.dry);
    let node = this.input;
    this.stages.forEach((ap) => {
      node.connect(ap);
      node = ap;
    });
    node.connect(this.wet);
    this.dry.connect(this.mix);
    this.wet.connect(this.mix);
    this.mix.connect(this.output);

    this.stages.forEach((ap, idx) => {
      const offset = idx * 0.5;
      const lfoGain = ctx.createGain();
      this.lfo.connect(lfoGain);
      lfoGain.gain.value = this.depth;
      lfoGain.connect(ap.frequency);
      this.modulators.push(lfoGain);
      ap.frequency.value = 700 + offset * 100;
    });

    this.lfo.start();
  }

  setRate(rate) {
    this.rate = rate;
    this.lfo.frequency.setValueAtTime(rate, this.ctx.currentTime);
  }

  setDepth(depth) {
    this.depth = depth;
    this.modulators.forEach((g) => g.gain.setValueAtTime(depth, this.ctx.currentTime));
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
