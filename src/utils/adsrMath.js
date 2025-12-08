export class ADSRMath {
  constructor({ a, d, s, r }) {
    this.a = a;
    this.d = d;
    this.s = s;
    this.r = r;
  }

  valueAt(t) {
    if (t < this.a) return t / Math.max(0.0001, this.a);
    if (t < this.a + this.d) {
      const p = (t - this.a) / Math.max(0.0001, this.d);
      return 1 + (this.s - 1) * p;
    }
    // sustain hold (no release during visualization)
    return this.s;
  }
}
