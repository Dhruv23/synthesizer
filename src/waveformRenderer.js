import { ADSRMath } from "./utils/adsrMath.js";
import { evalWave } from "./utils/waves.js";
import { biquadSim } from "./utils/biquadSim.js";

export class WaveformRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  render(params, freq) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.fillStyle = "#0a0a0a";
    this.ctx.fillRect(0, 0, width, height);

    const sr = 2048;
    const period = 1 / Math.max(1, freq);
    const totalTime = period * 2;
    const totalSamples = Math.max(32, Math.floor(sr * totalTime));

    const ampEnv = new ADSRMath(params.ampEnv);
    const filtEnv = new ADSRMath(params.filter.adsr);

    const cutoffBase = params.filter.cutoff;
    const cutoffPeak = cutoffBase + params.filter.envAmount;
    const q = params.filter.q;

    const lfoFreq = params.lfo.freq;
    const lfoDepth = params.lfo.depth;
    const lfoWave = params.lfo.wave;

    const samples = new Float32Array(totalSamples);
    let biquadState = { z1: 0, z2: 0 };
    for (let i = 0; i < totalSamples; i++) {
      const t = (i / sr);
      // LFO mod in cents -> Hz detune factor
      const lfoVal = evalWave(lfoWave, lfoFreq, t);
      const detuneRatio = Math.pow(2, (lfoVal * lfoDepth * 50) / 1200);

      let sum = 0;
      params.osc.forEach((osc) => {
        const hz = freq * Math.pow(2, (osc.range + osc.tune) / 12) * detuneRatio;
        sum += evalWave(osc.wave, hz, t) * osc.volume;
      });
      // Noise
      sum += (Math.random() * 2 - 1) * params.noise.level;

      // Filter cutoff with envelope
      const filtEnvVal = cutoffBase + filtEnv.valueAt(t) * params.filter.envAmount;
      const cutoff = Math.max(50, Math.min(18000, filtEnvVal));
      const { y, state } = biquadSim(sum, cutoff, q, sr, biquadState);
      biquadState = state;

      // Amp envelope
      const amp = ampEnv.valueAt(t);
      samples[i] = y * amp * params.master;
    }

    // Normalize for display
    const max = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0.0001);
    const scale = (height * 0.4) / max;

    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const x = (i / (samples.length - 1)) * width;
      const y = height / 2 - samples[i] * scale;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  }
}
