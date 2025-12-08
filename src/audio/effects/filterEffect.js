import { EffectModule } from "./effectBase.js";

export class FilterEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Filter");
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 1600;
    this.filter.Q.value = 1;
    this.input.connect(this.filter);
    this.filter.connect(this.output);
  }

  setType(type) {
    this.filter.type = type;
  }

  setFrequency(freq) {
    this.filter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.01);
  }

  setQ(q) {
    this.filter.Q.setTargetAtTime(q, this.ctx.currentTime, 0.01);
  }

  getParams() {
    return {
      type: this.filter.type,
      frequency: this.filter.frequency.value,
      q: this.filter.Q.value,
    };
  }
}
