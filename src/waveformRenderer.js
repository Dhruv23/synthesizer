import { evalWave } from "./utils/waves.js";
import { biquadSim } from "./utils/biquadSim.js";

export class WaveformRenderer {
  constructor(canvases) {
    this.canvases = canvases;
    Object.values(this.canvases).forEach((c) => this._resize(c));
    window.addEventListener("resize", () => {
      Object.values(this.canvases).forEach((c) => this._resize(c));
    });
  }

  renderAll(params, freq) {
    Object.values(this.canvases).forEach((c) => {
      if (c && (c.width === 0 || c.height === 0)) this._resize(c);
    });
    this._renderOsc("osc1", params, freq, 0);
    this._renderOsc("osc2", params, freq, 1);
    this._renderOsc("osc3", params, freq, 2);
    this._renderCombined(params, freq);
  }

  _renderOsc(key, params, freq, idx) {
    const canvas = this.canvases[key];
    if (!canvas) return;
    const oscCfg = params.osc[idx];
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    // Disabled: draw baseline only
    if (!oscCfg.enabled) {
      ctx.strokeStyle = "#555";
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }
    const sr = 2048;
    const period = 1 / Math.max(1, freq * Math.pow(2, (oscCfg.range + oscCfg.tune) / 12));
    const totalTime = period * 2;
    const totalSamples = Math.max(32, Math.floor(sr * totalTime));
    const samples = new Float32Array(totalSamples);
    const amp = params.ampEnv.s; // steady sustain level
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sr;
      samples[i] = evalWave(oscCfg.wave, 1 / period, t) * oscCfg.volume * params.master * amp;
    }
    this._drawSamples(ctx, samples);
  }

  _renderCombined(params, freq) {
    const canvas = this.canvases.combined;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    const sr = 4096;
    const period = 1 / Math.max(1, freq);
    const totalTime = period * 2;
    const totalSamples = Math.max(64, Math.floor(sr * totalTime));

    const ampSustain = params.ampEnv.s;
    const filtSustain = params.filter.adsr.s;
    const cutoffBase = params.filter.cutoff;
    const q = params.filter.q;

    const lfoFreq = params.lfo.freq;
    const lfoDepth = params.lfo.depth;
    const lfoWave = params.lfo.wave;

    const samples = new Float32Array(totalSamples);
    let biquadState = { z1: 0, z2: 0 };
    const rand = makeRand(performance.now() | 0);
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sr;
      const lfoVal = evalWave(lfoWave, lfoFreq, t);
      const detuneRatio = Math.pow(2, (lfoVal * lfoDepth * 50) / 1200);

      let sum = 0;
      params.osc.forEach((osc) => {
        if (!osc.enabled) return;
        const voices = params.featureFlags?.unison ? Math.max(1, osc.unison || 1) : 1;
        if (voices <= 1) {
          const hz = freq * Math.pow(2, (osc.range + osc.tune) / 12) * detuneRatio;
          sum += evalWave(osc.wave, hz, t) * osc.volume;
        } else {
          const detune = osc.detune || 0;
          const perVoiceGain = (osc.volume || 0) / voices;
          for (let i = 0; i < voices; i++) {
            const detCents = ((i / Math.max(1, voices - 1)) - 0.5) * 2 * detune;
            const hz = freq * Math.pow(2, (osc.range + osc.tune) / 12) * detuneRatio * Math.pow(2, detCents / 1200);
            sum += evalWave(osc.wave, hz, t) * perVoiceGain;
          }
        }
      });
      sum += (rand() * 2 - 1) * params.noise.level;

      const filtEnvVal = cutoffBase + filtSustain * params.filter.envAmount;
      const cutoff = Math.max(50, Math.min(18000, filtEnvVal));
      const { y, state } = biquadSim(sum, cutoff, q, sr, biquadState);
      biquadState = state;

      samples[i] = y * ampSustain * params.master;
    }
    // Align combined view to nearest mid zero-crossing to keep wave centered.
    const shifted = this._alignToZeroCross(samples);

    // if silent (all disabled and noise 0), just draw center line
    if (shifted.every((v) => Math.abs(v) < 1e-6)) {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#444";
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }
    this._drawSamples(ctx, shifted, 1.8); // slight zoom-in for combined view
  }

  _drawSamples(ctx, samples, scaleBoost = 1.0) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const max = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0.0001);
    const scale = (h * 0.4 * scaleBoost) / max;

    // center line
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const x = (i / (samples.length - 1)) * w;
      const y = h / 2 - samples[i] * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  _resize(canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  _alignToZeroCross(samples) {
    const len = samples.length;
    const mid = Math.floor(len / 2);
    let best = mid;
    let bestDist = Infinity;
    for (let i = 1; i < len; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      if ((prev <= 0 && curr >= 0) || (prev >= 0 && curr <= 0)) {
        const dist = Math.abs(i - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
    }
    const aligned = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      aligned[i] = samples[(best + i) % len];
    }
    return aligned;
  }
}

function makeRand(seed = 1) {
  let s = seed >>> 0;
  return function rand() {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}
