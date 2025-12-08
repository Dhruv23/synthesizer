import { EffectModule } from "./effectBase.js";

function buildWaveshaper(drive = 1.5) {
  const samples = 2048;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i / samples) * 2 - 1;
    curve[i] = Math.tanh(x * drive);
  }
  return curve;
}

export class WaveshaperEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Waveshaper");
    this.shaper = ctx.createWaveShaper();
    this.input.connect(this.shaper);
    this.shaper.connect(this.output);
    this.setDrive(1.4);
  }

  setDrive(drive) {
    this.drive = drive;
    this.shaper.curve = buildWaveshaper(drive);
  }

  getParams() {
    return { drive: this.drive };
  }
}
