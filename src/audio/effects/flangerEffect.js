import { EffectModule } from "./effectBase.js";

export class FlangerEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Flanger");
    this.delay = ctx.createDelay(0.01);
    this.feedback = ctx.createGain();
    this.lfo = ctx.createOscillator();
    this.lfoGain = ctx.createGain();
    this.mix = ctx.createGain();
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();

    this.delay.delayTime.value = 0.003;
    this.feedback.gain.value = 0.35;
    this.lfo.type = "sine";
    this.setRate(0.25);
    this.setDepth(0.002);
    this.setMix(0.3);

    this.input.connect(this.dry);
    this.input.connect(this.delay);
    this.delay.connect(this.feedback).connect(this.delay);
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

  setFeedback(amount) {
    this.feedbackAmount = amount;
    this.feedback.gain.setValueAtTime(amount, this.ctx.currentTime);
  }

  setMix(amount) {
    this.mixAmount = amount;
    this.dry.gain.setValueAtTime(1 - amount, this.ctx.currentTime);
    this.wet.gain.setValueAtTime(amount, this.ctx.currentTime);
  }

  getParams() {
    return {
      rate: this.rate,
      depth: this.depth,
      feedback: this.feedbackAmount,
      mix: this.mixAmount,
    };
  }
}
