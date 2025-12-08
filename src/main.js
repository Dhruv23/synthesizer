import { AudioContextManager } from "./audio/context.js";
import { SynthEngine } from "./audio/synthEngine.js";
import { bindSelect, bindSlider } from "./ui/bindings.js";

let ctxManager = new AudioContextManager();
let engine = null;
let started = false;

async function setup() {
  const startBtn = document.getElementById("start-audio");
  const stopBtn = document.getElementById("stop-audio");

  startBtn.addEventListener("click", async () => {
    if (started) return;
    const sampleRate = parseInt(document.getElementById("sample-rate").value, 10);
    const latencyHint = document.getElementById("latency").value;
    const ctx = await ctxManager.init({ sampleRate, latencyHint });
    engine = new SynthEngine(ctx, {
      oscilloscopeCanvas: document.getElementById("oscilloscope"),
      spectrumCanvas: document.getElementById("spectrum"),
    });
    attachControls(engine);
    engine.startBitcrusher();
    started = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    if (document.getElementById("hold-note").checked) {
      engine.triggerOn(parseFloat(document.getElementById("frequency").value));
    }
  });

  stopBtn.addEventListener("click", async () => {
    if (!started) return;
    engine.triggerOff();
    await ctxManager.dispose();
    started = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}

function attachControls(engine) {
  bindSelect("waveform", (wave) => engine.setWaveform(wave));
  bindSlider("frequency", (v) => engine.setFrequency(v));
  bindSlider("unison-voices", (v) => engine.setUnisonVoices(v));
  bindSlider("detune", (v) => engine.setDetune(v));
  bindSlider("spread", (v) => engine.setSpread(v));
  bindSlider("gain", (v) => engine.setMasterGain(v));

  bindSlider("amp-attack", (v) => engine.setAmpEnvelope({ attack: v }));
  bindSlider("amp-decay", (v) => engine.setAmpEnvelope({ decay: v }));
  bindSlider("amp-sustain", (v) => engine.setAmpEnvelope({ sustain: v }));
  bindSlider("amp-release", (v) => engine.setAmpEnvelope({ release: v }));

  bindSlider("filter-attack", (v) => engine.setFilterEnvelope({ attack: v }));
  bindSlider("filter-decay", (v) => engine.setFilterEnvelope({ decay: v }));
  bindSlider("filter-sustain", (v) => engine.setFilterEnvelope({ sustain: v }));
  bindSlider("filter-release", (v) => engine.setFilterEnvelope({ release: v }));
  bindSelect("filter-type", (v) => engine.setFilterParams({ type: v }));
  bindSlider("filter-frequency", (v) => engine.setFilterParams({ frequency: v }));
  bindSlider("filter-q", (v) => engine.setFilterParams({ q: v }));
  bindSlider("filter-env-amount", (v) => engine.setFilterEnvAmount(v));

  document.getElementById("trigger-on").addEventListener("click", () => {
    engine.triggerOn(parseFloat(document.getElementById("frequency").value));
  });
  document.getElementById("trigger-off").addEventListener("click", () => engine.triggerOff());
  document.getElementById("hold-note").addEventListener("change", (e) => {
    if (e.target.checked && started) engine.triggerOn(parseFloat(document.getElementById("frequency").value));
  });

  renderEffects(engine);
}

function renderEffects(engine) {
  const container = document.getElementById("effects-container");
  container.innerHTML = "";

  const effectConfigs = {
    Distortion: [
      { key: "drive", label: "Drive", min: 0, max: 1, step: 0.01, setter: (fx, v) => fx.setDrive(v) },
    ],
    Chorus: [
      { key: "rate", label: "Rate", min: 0.05, max: 4, step: 0.01, setter: (fx, v) => fx.setRate(v) },
      { key: "depth", label: "Depth", min: 0, max: 0.02, step: 0.0001, setter: (fx, v) => fx.setDepth(v) },
      { key: "mix", label: "Mix", min: 0, max: 1, step: 0.01, setter: (fx, v) => fx.setMix(v) },
    ],
    Flanger: [
      { key: "rate", label: "Rate", min: 0.05, max: 1, step: 0.01, setter: (fx, v) => fx.setRate(v) },
      { key: "depth", label: "Depth", min: 0.0001, max: 0.01, step: 0.0001, setter: (fx, v) => fx.setDepth(v) },
      { key: "feedback", label: "Feedback", min: 0, max: 0.95, step: 0.01, setter: (fx, v) => fx.setFeedback(v) },
      { key: "mix", label: "Mix", min: 0, max: 1, step: 0.01, setter: (fx, v) => fx.setMix(v) },
    ],
    Phaser: [
      { key: "rate", label: "Rate", min: 0.05, max: 1, step: 0.01, setter: (fx, v) => fx.setRate(v) },
      { key: "depth", label: "Depth", min: 20, max: 1200, step: 10, setter: (fx, v) => fx.setDepth(v) },
      { key: "mix", label: "Mix", min: 0, max: 1, step: 0.01, setter: (fx, v) => fx.setMix(v) },
    ],
    Delay: [
      { key: "time", label: "Time", min: 0, max: 1, step: 0.01, setter: (fx, v) => fx.setTime(v) },
      { key: "feedback", label: "Feedback", min: 0, max: 0.95, step: 0.01, setter: (fx, v) => fx.setFeedback(v) },
      { key: "mix", label: "Mix", min: 0, max: 1, step: 0.01, setter: (fx, v) => fx.setMix(v) },
    ],
    Reverb: [
      { key: "mix", label: "Mix", min: 0, max: 1, step: 0.01, setter: (fx, v) => fx.setMix(v) },
      { key: "decay", label: "Decay", min: 0.5, max: 5, step: 0.1, setter: (fx, v) => fx.setDecay(v) },
    ],
    Bitcrusher: [
      { key: "bitDepth", label: "Bit Depth", min: 2, max: 16, step: 1, setter: (fx, v) => fx.setParams({ bitDepth: v }) },
      {
        key: "reduction",
        label: "Reduction",
        min: 0.05,
        max: 1,
        step: 0.01,
        setter: (fx, v) => fx.setParams({ reduction: v }),
      },
    ],
    Waveshaper: [
      { key: "drive", label: "Drive", min: 0.5, max: 3, step: 0.01, setter: (fx, v) => fx.setDrive(v) },
    ],
    Compressor: [
      { key: "threshold", label: "Threshold", min: -60, max: 0, step: 1, setter: (fx, v) => fx.setParams({ threshold: v }) },
      { key: "ratio", label: "Ratio", min: 1, max: 20, step: 0.1, setter: (fx, v) => fx.setParams({ ratio: v }) },
      { key: "attack", label: "Attack", min: 0.001, max: 0.2, step: 0.001, setter: (fx, v) => fx.setParams({ attack: v }) },
      { key: "release", label: "Release", min: 0.01, max: 1, step: 0.01, setter: (fx, v) => fx.setParams({ release: v }) },
    ],
  };

  engine.effectChain.effects.forEach((fx, index) => {
    const card = document.createElement("div");
    card.className = "effect-card";
    const header = document.createElement("div");
    header.className = "effect-header";
    const title = document.createElement("h3");
    title.textContent = `${index + 1}. ${fx.name}`;
    header.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "effect-actions";
    const toggle = document.createElement("button");
    toggle.textContent = fx.active ? "On" : "Off";
    toggle.className = fx.active ? "toggle-on" : "toggle-off";
    toggle.addEventListener("click", () => {
      fx.setActive(!fx.active);
      toggle.textContent = fx.active ? "On" : "Off";
      toggle.className = fx.active ? "toggle-on" : "toggle-off";
    });
    const up = document.createElement("button");
    up.textContent = "↑";
    up.addEventListener("click", () => {
      engine.effectChain.moveUp(index);
      renderEffects(engine);
    });
    const down = document.createElement("button");
    down.textContent = "↓";
    down.addEventListener("click", () => {
      engine.effectChain.moveDown(index);
      renderEffects(engine);
    });
    actions.append(toggle, up, down);
    header.appendChild(actions);
    card.appendChild(header);

    const params = effectConfigs[fx.name] || [];
    const grid = document.createElement("div");
    grid.className = "effect-grid";
    params.forEach((cfg) => {
      const row = document.createElement("div");
      row.className = "control-row";
      const label = document.createElement("label");
      label.textContent = cfg.label;
      const input = document.createElement("input");
      input.type = "range";
      input.min = cfg.min;
      input.max = cfg.max;
      input.step = cfg.step;
      const currentParams = fx.getParams ? fx.getParams() : {};
      input.value = currentParams?.[cfg.key] ?? cfg.default ?? cfg.min;
      const value = document.createElement("span");
      value.className = "value";
      value.textContent = input.value;
      input.addEventListener("input", () => {
        value.textContent = input.value;
        cfg.setter(fx, parseFloat(input.value));
      });
      row.append(label, input, value);
      grid.appendChild(row);
    });
    card.appendChild(grid);
    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", setup);
