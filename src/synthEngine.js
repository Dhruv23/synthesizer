import { ADSR } from "./utils/adsr.js";
import { createOscillatorNode, createNoiseNode, createLfo } from "./utils/audioNodes.js";

export class SynthEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.lfo = null;
    this.oscillators = [];
    this.noise = null;
    this.ampEnv = new ADSR();
    this.filterEnv = new ADSR();
    this.currentFreq = 220;
  }

  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 1;

    this.master.connect(this.ctx.destination);
  }

  updateParams(params) {
    if (!this.ctx) return;
    this.currentParams = params;
    this.master.gain.setTargetAtTime(params.master, this.ctx.currentTime, 0.01);
    this.filter.frequency.setTargetAtTime(params.filter.cutoff, this.ctx.currentTime, 0.01);
    this.filter.Q.setTargetAtTime(params.filter.q, this.ctx.currentTime, 0.01);
    this.ampEnv.set(params.ampEnv);
    this.filterEnv.set(params.filter.adsr);
    if (this.oscillators.length && !this._suppressRetrigger) {
      // rebuild current note with new settings
      this.triggerOn(this.currentFreq, params);
    }
  }

  triggerOn(freq, params) {
    if (!this.ctx) return;
    this.currentFreq = freq;
    const now = this.ctx.currentTime;

    this.stop();
    this._suppressRetrigger = true;
    this.updateParams(params);
    this._suppressRetrigger = false;

    // LFO
    this.lfo = createLfo(this.ctx, params.lfo.wave, params.lfo.freq);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = params.lfo.depth * 50; // vibrato depth in cents
    this.lfo.connect(lfoGain);

    // Oscillators
    this.oscillators = params.osc
      .filter((oscCfg) => oscCfg.enabled)
      .map((oscCfg) => {
        const osc = createOscillatorNode(this.ctx, oscCfg.wave);
        const gain = this.ctx.createGain();
        gain.gain.value = oscCfg.volume;
        const offsetSemis = oscCfg.range + oscCfg.tune;
        const freqHz = freq * Math.pow(2, offsetSemis / 12);
        osc.frequency.setValueAtTime(freqHz, now);
        lfoGain.connect(osc.detune);
        osc.connect(gain);
        gain.connect(this.filter);
        osc.start(now);
        return { osc, gain };
      });

    // Noise
    this.noise = createNoiseNode(this.ctx);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = params.noise.level;
    this.noise.connect(noiseGain).connect(this.filter);
    this.noise.start(now);

    // Filter envelope
    const baseCutoff = params.filter.cutoff;
    const envAmt = params.filter.envAmount;
    this.filterEnv.apply(this.filter.frequency, now, baseCutoff + envAmt, baseCutoff);

    // Amp envelope
    this.ampEnv.apply(this.master.gain, now, 1.0, 0.0);

    this.filter.connect(this.master);
    this.lfo.start(now);
  }

  triggerOff() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.ampEnv.release(this.master.gain, now);
    this.filterEnv.release(this.filter.frequency, now);
    this._scheduleStop(now + this.ampEnv.releaseTime + 0.1);
  }

  _scheduleStop(at) {
    this.oscillators.forEach(({ osc }) => osc.stop(at));
    if (this.noise) this.noise.stop(at);
    if (this.lfo) this.lfo.stop(at);
  }

  stop() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.oscillators.forEach(({ osc }) => { try { osc.stop(now); } catch (_) {} });
    this.oscillators = [];
    if (this.noise) { try { this.noise.stop(now); } catch (_) {} this.noise = null; }
    if (this.lfo) { try { this.lfo.stop(now); } catch (_) {} this.lfo = null; }
  }
}
