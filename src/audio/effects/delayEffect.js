import { EffectModule } from "./effectBase.js";

export class DelayEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Delay");
    this.delay = ctx.createDelay(2.0);
    this.feedback = ctx.createGain();
    this.wet = ctx.createGain();
    this.dry = ctx.createGain();
    this.mix = ctx.createGain();

    this.delay.delayTime.value = 0.25;
    this.feedback.gain.value = 0.35;
    this.setMix(0.35);

    this.input.connect(this.dry);
    this.input.connect(this.delay);
    this.delay.connect(this.feedback).connect(this.delay);
    this.delay.connect(this.wet);
    this.dry.connect(this.mix);
    this.wet.connect(this.mix);
    this.mix.connect(this.output);
  }

  setTime(time) {
    this.time = time;
    this.delay.delayTime.setTargetAtTime(time, this.ctx.currentTime, 0.01);
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
    return { time: this.delay.delayTime.value, feedback: this.feedbackAmount, mix: this.mixAmount };
  }
}
