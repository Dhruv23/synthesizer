import { evalWave } from "./utils/waves.js";

// Lightweight modulation matrix, evaluated at control rate (render loop).
// All modulation is feature-flagged and scales smoothly to avoid zipper noise.
export class ModMatrix {
  constructor(ctx) {
    this.ctx = ctx;
    this.last = {
      pitchCents: 0,
      cutoff: 0,
      resonance: 0,
      detune: 0,
      pan: 0,
      gain: 0,
    };
    this.smoothing = 0.04; // seconds to reach target
  }

  compute(params, time, note) {
    const slots = params.modMatrix || [];
    const enabled = params.featureFlags?.modMatrix;
    if (!enabled || !slots.length) {
      return this.last;
    }
    const accum = {
      pitchCents: 0,
      cutoff: 0,
      resonance: 0,
      detune: 0,
      pan: 0,
      gain: 0,
    };
    slots.forEach((slot) => {
      if (!slot.enabled || slot.source === "none" || slot.dest === "none") return;
      const srcVal = this._sourceValue(slot.source, params, note, time);
      const amt = slot.amount || 0;
      const val = srcVal * amt;
      switch (slot.dest) {
        case "pitch":
          accum.pitchCents += val * 120; // scale to cents
          break;
        case "cutoff":
          accum.cutoff += val * 1200; // Hz offset
          break;
        case "resonance":
          accum.resonance += val * 2;
          break;
        case "detune":
          accum.detune += val * 50;
          break;
        case "pan":
          accum.pan += val;
          break;
        case "volume":
          accum.gain += val * 0.5;
          break;
        default:
          break;
      }
    });
    // Smooth transitions
    this.last = this._smooth(accum, time);
    return this.last;
  }

  _smooth(target, time) {
    const k = Math.exp(-1 / (this.ctx.sampleRate * this.smoothing));
    const out = {};
    Object.keys(target).forEach((key) => {
      const prev = this.last[key] || 0;
      out[key] = prev * k + target[key] * (1 - k);
    });
    return out;
  }

  _sourceValue(source, params, note, time) {
    switch (source) {
      case "lfo1":
        return evalLfo(params.lfo, params, time);
      case "lfo2":
        return evalLfo(params.lfo2, params, time);
      case "env1":
        return params.ampEnv.s || 0;
      case "env2":
        return params.filter.adsr.s || 0;
      case "velocity":
        return (note?.velocity || 1) * 2 - 1;
      case "modwheel":
        return note?.modwheel || 0;
      case "keytrack": {
        const freq = note?.freq || 440;
        return Math.log2(freq / 440);
      }
      case "random":
        return Math.random() * 2 - 1;
      default:
        return 0;
    }
  }
}

function evalLfo(lfoParams, params, time) {
  if (!lfoParams) return 0;
  let freq = lfoParams.freq || 0;
  if (params.featureFlags?.modMatrix && lfoParams.sync && lfoParams.division) {
    const bpm = params.bpm || 120;
    freq = (bpm / 60) * lfoParams.division;
  }
  const phaseOffset = ((lfoParams.phase || 0) / 360) * (1 / freq || 0);
  const val = evalWave(lfoParams.wave, freq, time + phaseOffset);
  // Simple fade-in envelope for LFO
  const fade = Math.max(0, lfoParams.fade || 0);
  const fadeAmt = fade > 0 ? Math.min(1, time / fade) : 1;
  const out = val * (lfoParams.depth || 0) * fadeAmt;
  if (lfoParams.oneShot) {
    const period = 1 / Math.max(0.0001, freq);
    return time > period ? 0 : out;
  }
  return out;
}
