import { ADSR } from "./adsr.js";
import { UnisonOscillator } from "./unison.js";
import { EffectChain } from "./effectChain.js";
import { FilterEffect } from "./effects/filterEffect.js";
import { DistortionEffect } from "./effects/distortionEffect.js";
import { ChorusEffect } from "./effects/chorusEffect.js";
import { FlangerEffect } from "./effects/flangerEffect.js";
import { PhaserEffect } from "./effects/phaserEffect.js";
import { DelayEffect } from "./effects/delayEffect.js";
import { ReverbEffect } from "./effects/reverbEffect.js";
import { BitcrusherEffect } from "./effects/bitcrusherEffect.js";
import { WaveshaperEffect } from "./effects/waveshaperEffect.js";
import { CompressorEffect } from "./effects/compressorEffect.js";
import { Visualizer } from "./visualizer.js";

export class SynthEngine {
  constructor(ctx, { oscilloscopeCanvas, spectrumCanvas } = {}) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.4;
    this.filterEnvAmount = 1200;
    this.visualizer = new Visualizer(ctx, { oscilloscopeCanvas, spectrumCanvas });
    this.master.connect(this.visualizer.analyser);
    this.visualizer.analyser.connect(ctx.destination);

    this.effectChain = new EffectChain(ctx);

    // default effects
    this.filterEffect = new FilterEffect(ctx);
    this.distortion = new DistortionEffect(ctx);
    this.chorus = new ChorusEffect(ctx);
    this.flanger = new FlangerEffect(ctx);
    this.phaser = new PhaserEffect(ctx);
    this.delay = new DelayEffect(ctx);
    this.reverb = new ReverbEffect(ctx);
    this.bitcrusher = new BitcrusherEffect(ctx);
    this.waveshaper = new WaveshaperEffect(ctx);
    this.compressor = new CompressorEffect(ctx);

    [
      this.filterEffect,
      this.distortion,
      this.chorus,
      this.flanger,
      this.phaser,
      this.delay,
      this.reverb,
      this.bitcrusher,
      this.waveshaper,
      this.compressor,
    ].forEach((fx) => this.effectChain.add(fx));

    this.osc = new UnisonOscillator(ctx);
    this.ampEnvelope = new ADSR(ctx);
    this.filterEnvelope = new ADSR(ctx);
    this.ampGain = ctx.createGain();
    this.ampGain.gain.value = 0;
    this.postFilter = ctx.createGain();

    this.osc.output.connect(this.ampGain);
    this.ampGain.connect(this.filterEffect.input);
    this.filterEffect.output.connect(this.postFilter);
    this.postFilter.connect(this.effectChain.input);
    this.effectChain.output.connect(this.master);
    this.visualizer.start();

    this.isGateOpen = false;
    this.watchCpu();
  }

  setMasterGain(value) {
    this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  setWaveform(type) {
    this.osc.setType(type);
  }

  setFrequency(freq) {
    this.frequency = freq;
    if (this.osc.voices.length) {
      this.osc.voices.forEach((o) => {
        if (o.frequency) o.frequency.setValueAtTime(freq, this.ctx.currentTime);
      });
    }
  }

  setUnisonVoices(count) {
    this.osc.setVoices(count);
  }

  setDetune(cents) {
    this.osc.setDetune(cents);
  }

  setSpread(amount) {
    this.osc.setSpread(amount);
  }

  triggerOn(freq) {
    this.frequency = freq ?? this.frequency ?? 220;
    this.osc.start(this.frequency);
    this.ampEnvelope.trigger(this.ampGain.gain, 1);
    this._applyFilterEnvelope(true);
    this.isGateOpen = true;
  }

  triggerOff() {
    this.ampEnvelope.release(this.ampGain.gain);
    this._applyFilterEnvelope(false);
    const release = this.ampEnvelope.settings.release;
    setTimeout(() => this.osc.stop(), release * 1000 + 20);
    this.isGateOpen = false;
  }

  setAmpEnvelope(params) {
    this.ampEnvelope.set(params);
  }

  setFilterEnvelope(params) {
    this.filterEnvelope.set(params);
  }

  setFilterEnvAmount(amount) {
    this.filterEnvAmount = amount;
  }

  setFilterParams({ type, frequency, q }) {
    if (type) this.filterEffect.setType(type);
    if (frequency !== undefined) this.filterEffect.setFrequency(frequency);
    if (q !== undefined) this.filterEffect.setQ(q);
  }

  _applyFilterEnvelope(triggerOn) {
    const now = this.ctx.currentTime;
    const base = this.filterEffect.filter.frequency.value;
    const { attack, decay, sustain, release } = this.filterEnvelope.settings;
    const peak = base + this.filterEnvAmount;
    const sustainLevel = base + this.filterEnvAmount * sustain;
    const param = this.filterEffect.filter.frequency;
    param.cancelScheduledValues(now);
    if (triggerOn) {
      param.setValueAtTime(base, now);
      param.linearRampToValueAtTime(peak, now + attack);
      param.linearRampToValueAtTime(sustainLevel, now + attack + decay);
    } else {
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(base, now + release);
    }
  }

  setEffectParam(effectName, updater) {
    if (typeof updater !== "function") return;
    const fx = this.effectChain.effects.find((e) => e.name === effectName);
    if (fx) updater(fx);
  }

  async startBitcrusher() {
    await this.bitcrusher.ready;
    this.effectChain.rebuild();
  }

  watchCpu() {
    const read = () => {
      const sampleRate = this.ctx.sampleRate;
      const base = 1 / sampleRate;
      const estimate = Math.min(100, Math.max(5, base * 2e5));
      const el = document.getElementById("cpu-estimate");
      const info = document.getElementById("context-info");
      if (el) el.textContent = `CPU est: ${estimate.toFixed(1)}%`;
      if (info) info.textContent = `Sample rate: ${this.ctx.sampleRate} Hz`;
      requestAnimationFrame(read);
    };
    requestAnimationFrame(read);
  }
}
