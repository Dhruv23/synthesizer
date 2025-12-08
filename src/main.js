import { SynthEngine } from "./synthEngine.js";
import { WaveformRenderer } from "./waveformRenderer.js";
import { buildKeyboard } from "./ui/keyboard.js";
import { bindControl } from "./ui/bindings.js";

let engine = null;
let renderer = null;

function gatherParams() {
  return {
    osc: [
      {
        wave: document.getElementById("osc1-wave").value,
        range: parseFloat(document.getElementById("osc1-range").value),
        tune: parseFloat(document.getElementById("osc1-tune").value),
        volume: parseFloat(document.getElementById("osc1-vol").value),
      },
      {
        wave: document.getElementById("osc2-wave").value,
        range: parseFloat(document.getElementById("osc2-range").value),
        tune: parseFloat(document.getElementById("osc2-tune").value),
        volume: parseFloat(document.getElementById("osc2-vol").value),
      },
      {
        wave: document.getElementById("osc3-wave").value,
        range: parseFloat(document.getElementById("osc3-range").value),
        tune: parseFloat(document.getElementById("osc3-tune").value),
        volume: parseFloat(document.getElementById("osc3-vol").value),
      },
    ],
    lfo: {
      wave: document.getElementById("lfo-wave").value,
      freq: parseFloat(document.getElementById("lfo-freq").value),
      depth: parseFloat(document.getElementById("lfo-depth").value),
    },
    filter: {
      cutoff: parseFloat(document.getElementById("filter-cutoff").value),
      q: parseFloat(document.getElementById("filter-q").value),
      envAmount: parseFloat(document.getElementById("filter-env").value),
      adsr: {
        a: parseFloat(document.getElementById("f-attack").value),
        d: parseFloat(document.getElementById("f-decay").value),
        s: parseFloat(document.getElementById("f-sustain").value),
        r: parseFloat(document.getElementById("f-release").value),
      },
    },
    ampEnv: {
      a: parseFloat(document.getElementById("v-attack").value),
      d: parseFloat(document.getElementById("v-decay").value),
      s: parseFloat(document.getElementById("v-sustain").value),
      r: parseFloat(document.getElementById("v-release").value),
    },
    noise: {
      level: parseFloat(document.getElementById("noise-level").value),
    },
    master: parseFloat(document.getElementById("master").value),
  };
}

async function init() {
  const startBtn = document.getElementById("start-btn");
  const stopBtn = document.getElementById("stop-btn");
  const canvas = document.getElementById("wave-canvas");
  renderer = new WaveformRenderer(canvas);

  startBtn.addEventListener("click", async () => {
    if (!engine) {
      engine = new SynthEngine();
      await engine.init();
      wireControls();
      buildKeyboard(document.getElementById("keyboard"), (freq) => {
        engine.triggerOn(freq, gatherParams());
        renderer.render(gatherParams(), freq);
      }, () => {
        engine.triggerOff();
      });
    }
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener("click", () => {
    if (engine) engine.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });

  // initial render preview
  renderer.render(gatherParams(), 220);
}

function wireControls() {
  const ids = [
    "osc1-wave","osc1-range","osc1-tune","osc1-vol",
    "osc2-wave","osc2-range","osc2-tune","osc2-vol",
    "osc3-wave","osc3-range","osc3-tune","osc3-vol",
    "lfo-wave","lfo-freq","lfo-depth",
    "filter-cutoff","filter-q","filter-env",
    "f-attack","f-decay","f-sustain","f-release",
    "v-attack","v-decay","v-sustain","v-release",
    "noise-level","master"
  ];
  ids.forEach((id) => {
    bindControl(id, () => {
      const params = gatherParams();
      renderer.render(params, engine?.currentFreq || 220);
      if (engine) engine.updateParams(params);
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
