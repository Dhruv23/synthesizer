import { ADSR } from "./utils/adsr.js";
import { createOscillatorNode, createNoiseNode, createLfo } from "./utils/audioNodes.js";
import { ModMatrix } from "./modMatrix.js";
import { FXChain } from "./fx/fxChain.js";

export class SynthEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.fxChain = null;
    this.lfo = null;
    this.oscillators = [];
    this.noise = null;
    this.ampEnv = new ADSR();
    this.filterEnv = new ADSR();
    this.currentFreq = 220;
    this.currentVelocity = 1;
    this.baseCutoff = 2000;
    this.baseQ = 1;
    this.baseMaster = 0.8;
    this.modMatrix = null;
  }

  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 1;

    this.fxChain = new FXChain(this.ctx);
    this.postFilter = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.modMatrix = new ModMatrix(this.ctx);
  }

  updateParams(params) {
    if (!this.ctx) return;
    this.currentParams = params;
    this.baseMaster = params.master;
    this.baseCutoff = params.filter.cutoff;
    this.baseQ = params.filter.q;
    this.master.gain.setTargetAtTime(this.baseMaster, this.ctx.currentTime, 0.01);
    this.filter.frequency.setTargetAtTime(this.baseCutoff, this.ctx.currentTime, 0.01);
    this.filter.Q.setTargetAtTime(this.baseQ, this.ctx.currentTime, 0.01);
    this.ampEnv.set(params.ampEnv);
    this.filterEnv.set(params.filter.adsr);
    if (this.oscillators.length && !this._suppressRetrigger) {
      // rebuild current note with new settings
      this.triggerOn(this.currentFreq, params);
    }
    this._refreshRouting(params);
  }

  triggerOn(freq, params) {
    if (!this.ctx) return;
    this.currentFreq = freq;
    this.currentVelocity = 1;
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

    // Oscillators (with optional unison)
    const unisonEnabled = params.featureFlags?.unison;
    this.oscillators = params.osc
      .filter((oscCfg) => oscCfg.enabled)
      .flatMap((oscCfg) => {
        if (!unisonEnabled || (oscCfg.unison || 1) <= 1) {
          const osc = createOscillatorNode(this.ctx, oscCfg.wave, oscCfg.randPhase);
          const gain = this.ctx.createGain();
          gain.gain.value = oscCfg.volume;
          const offsetSemis = oscCfg.range + oscCfg.tune;
          const freqHz = freq * Math.pow(2, offsetSemis / 12);
          osc.frequency.setValueAtTime(freqHz, now);
          osc.baseDetune = 0;
          lfoGain.connect(osc.detune);
          osc.connect(gain);
          gain.connect(this.postFilter);
          osc.start(now);
          return [{ osc, gain }];
        }
        const voices = oscCfg.unison || 1;
        const detune = oscCfg.detune || 0;
        const spread = oscCfg.spread || 0;
        const perVoiceGain = oscCfg.volume / voices;
        const voiceNodes = [];
        for (let i = 0; i < voices; i++) {
          const osc = createOscillatorNode(this.ctx, oscCfg.wave, oscCfg.randPhase);
          const gain = this.ctx.createGain();
          gain.gain.value = perVoiceGain;
          const offsetSemis = oscCfg.range + oscCfg.tune;
          const detCents = ((i / Math.max(1, voices - 1)) - 0.5) * 2 * detune;
          const freqHz = freq * Math.pow(2, offsetSemis / 12);
          osc.frequency.setValueAtTime(freqHz, now);
          osc.detune.setValueAtTime(detCents, now);
          osc.baseDetune = detCents;
          lfoGain.connect(osc.detune);
          const pan = this.ctx.createStereoPanner();
          const panPos = ((i / Math.max(1, voices - 1)) - 0.5) * spread;
          pan.pan.setValueAtTime(panPos, now);
          pan.basePan = panPos;
          osc.connect(pan).connect(gain).connect(this.postFilter);
          osc.start(now);
          voiceNodes.push({ osc, gain, pan });
        }
        return voiceNodes;
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

    this.filter.connect(this.postFilter);
    this._refreshRouting(params);
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

  _refreshRouting(params) {
    // Clear connections from postFilter
    try { this.postFilter.disconnect(); } catch (_) {}
    try { this.fxChain.output.disconnect(); } catch (_) {}
    if (params.featureFlags?.fx) {
      const hasFx = this.fxChain.configure(params.fx);
      if (hasFx) {
        this.postFilter.connect(this.fxChain.input);
        this.fxChain.output.connect(this.master);
        return;
      }
    }
    this.postFilter.connect(this.master);
  }

  applyModulations(params) {
    if (!params.featureFlags?.modMatrix || !this.modMatrix || !this.oscillators.length) return;
    const now = this.ctx.currentTime;
    const mods = this.modMatrix.compute(params, now, { freq: this.currentFreq, velocity: this.currentVelocity, modwheel: 0 });

    // Pitch (cents) applied to detune
    this.oscillators.forEach((voice) => {
      if (voice.osc?.detune) {
        const base = voice.osc.baseDetune || 0;
        voice.osc.detune.setTargetAtTime(base + mods.pitchCents, now, 0.01);
      }
      if (voice.pan) {
        const basePan = voice.pan.basePan || 0;
        const panVal = Math.max(-1, Math.min(1, basePan + mods.pan));
        voice.pan.pan.setTargetAtTime(panVal, now, 0.01);
      }
    });

    // Filter
    const cutoff = Math.max(50, this.baseCutoff + mods.cutoff);
    this.filter.frequency.setTargetAtTime(cutoff, now, 0.01);
    const q = Math.max(0.1, this.baseQ + mods.resonance);
    this.filter.Q.setTargetAtTime(q, now, 0.01);

    // Volume
    const gain = Math.max(0, this.baseMaster * (1 + mods.gain));
    this.master.gain.setTargetAtTime(gain, now, 0.01);
  }
}
