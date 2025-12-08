import { EffectModule } from "./effectBase.js";

export class CompressorEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Compressor");
    this.compressor = ctx.createDynamicsCompressor();
    this.setParams({
      threshold: -14,
      ratio: 3,
      attack: 0.003,
      release: 0.25,
      knee: 12,
    });
    this.input.connect(this.compressor).connect(this.output);
  }

  setParams({ threshold, ratio, attack, release, knee }) {
    if (threshold !== undefined) this.compressor.threshold.setValueAtTime(threshold, this.ctx.currentTime);
    if (ratio !== undefined) this.compressor.ratio.setValueAtTime(ratio, this.ctx.currentTime);
    if (attack !== undefined) this.compressor.attack.setValueAtTime(attack, this.ctx.currentTime);
    if (release !== undefined) this.compressor.release.setValueAtTime(release, this.ctx.currentTime);
    if (knee !== undefined) this.compressor.knee.setValueAtTime(knee, this.ctx.currentTime);
    this.params = { threshold, ratio, attack, release, knee };
  }

  getParams() {
    return this.params;
  }
}
