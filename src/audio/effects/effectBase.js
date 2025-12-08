export class EffectModule {
  constructor(ctx, name) {
    this.ctx = ctx;
    this.name = name;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.active = true;
  }

  connect(node) {
    return this.output.connect(node);
  }

  setActive(active) {
    this.active = active;
    this.input.gain.setValueAtTime(active ? 1 : 0, this.ctx.currentTime);
  }

  getParams() {
    return {};
  }

  updateParams() {}
}
