export class EffectChain {
  constructor(ctx) {
    this.ctx = ctx;
    this.effects = [];
    this.input = ctx.createGain();
    this.output = ctx.createGain();
  }

  add(effect) {
    this.effects.push(effect);
    this.rebuild();
  }

  moveUp(index) {
    if (index <= 0 || index >= this.effects.length) return;
    [this.effects[index - 1], this.effects[index]] = [this.effects[index], this.effects[index - 1]];
    this.rebuild();
  }

  moveDown(index) {
    if (index < 0 || index >= this.effects.length - 1) return;
    [this.effects[index + 1], this.effects[index]] = [this.effects[index], this.effects[index + 1]];
    this.rebuild();
  }

  rebuild() {
    // Disconnect everything
    try {
      this.input.disconnect();
      this.effects.forEach((fx) => {
        fx.input.disconnect();
        fx.output.disconnect();
      });
    } catch (e) {
      /* disconnect errors are safe to ignore */
    }

    let node = this.input;
    this.effects.forEach((fx) => {
      node.connect(fx.input);
      node = fx.output;
    });
    node.connect(this.output);
  }
}
