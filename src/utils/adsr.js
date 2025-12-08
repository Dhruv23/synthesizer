export class ADSR {
  constructor() {
    this.a = 0.02;
    this.d = 0.3;
    this.s = 0.7;
    this.r = 0.5;
  }

  set({ a, d, s, r }) {
    if (a !== undefined) this.a = a;
    if (d !== undefined) this.d = d;
    if (s !== undefined) this.s = s;
    if (r !== undefined) this.r = r;
  }

  apply(param, now, peak, base) {
    param.cancelScheduledValues(now);
    param.setValueAtTime(base, now);
    param.linearRampToValueAtTime(peak, now + this.a);
    param.linearRampToValueAtTime(base + (peak - base) * this.s, now + this.a + this.d);
  }

  release(param, now) {
    param.cancelScheduledValues(now);
    const current = param.value;
    param.setValueAtTime(current, now);
    param.linearRampToValueAtTime(0, now + this.r);
  }

  get releaseTime() {
    return this.r;
  }
}
