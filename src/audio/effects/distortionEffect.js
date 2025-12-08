import { EffectModule } from "./effectBase.js";

function makeCurve(amount = 0) {
  const k = amount * 800;
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export class DistortionEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Distortion");
    this.shaper = ctx.createWaveShaper();
    this.setDrive(0.2);
    this.input.connect(this.shaper);
    this.shaper.connect(this.output);
  }

  setDrive(amount) {
    this.drive = amount;
    this.shaper.curve = makeCurve(amount);
  }

  getParams() {
    return { drive: this.drive };
  }
}
