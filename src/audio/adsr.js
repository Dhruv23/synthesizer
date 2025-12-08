export class ADSR {
  constructor(ctx, { attack = 0.01, decay = 0.2, sustain = 0.7, release = 0.3 } = {}) {
    this.ctx = ctx;
    this.settings = { attack, decay, sustain, release };
  }

  set(params) {
    this.settings = { ...this.settings, ...params };
  }

  trigger(param, velocity = 1) {
    const now = this.ctx.currentTime;
    const { attack, decay, sustain } = this.settings;
    param.cancelScheduledValues(now);
    param.setValueAtTime(0, now);
    param.linearRampToValueAtTime(velocity, now + attack);
    param.linearRampToValueAtTime(velocity * sustain, now + attack + decay);
  }

  release(param) {
    const now = this.ctx.currentTime;
    const { release } = this.settings;
    const current = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(current, now);
    param.linearRampToValueAtTime(0, now + Math.max(0.01, release));
  }
}
