import { SynthEngine } from "./synthEngine.js";
import { WaveformRenderer } from "./waveformRenderer.js";
import { buildKeyboard } from "./ui/keyboard.js";
import { bindControl } from "./ui/bindings.js";

let engine = null;
let renderer = null;
let renderLoop = null;
const REFRESH_MS = 1000 / 30; // ~30 FPS

function gatherParams() {
  return {
    osc: [
      {
        enabled: document.getElementById("osc1-enabled").checked,
        wave: document.getElementById("osc1-wave").value,
        range: parseFloat(document.getElementById("osc1-range").value),
        tune: parseFloat(document.getElementById("osc1-tune").value),
        volume: parseFloat(document.getElementById("osc1-vol").value),
      },
      {
        enabled: document.getElementById("osc2-enabled").checked,
        wave: document.getElementById("osc2-wave").value,
        range: parseFloat(document.getElementById("osc2-range").value),
        tune: parseFloat(document.getElementById("osc2-tune").value),
        volume: parseFloat(document.getElementById("osc2-vol").value),
      },
      {
        enabled: document.getElementById("osc3-enabled").checked,
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
  renderer = new WaveformRenderer({
    combined: document.getElementById("wave-combined"),
    osc1: document.getElementById("wave-osc1"),
    osc2: document.getElementById("wave-osc2"),
    osc3: document.getElementById("wave-osc3"),
  });

  startBtn.addEventListener("click", async () => {
    if (!engine) {
      engine = new SynthEngine();
      await engine.init();
      wireControls();
      buildKeyboard(document.getElementById("keyboard"), (freq) => {
        engine.triggerOn(freq, gatherParams());
        renderer.renderAll(gatherParams(), freq);
      }, () => {
        engine.triggerOff();
      });
    }
    startRenderLoop();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener("click", () => {
    if (engine) engine.stop();
    stopRenderLoop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });

  // initial render preview
  renderer.renderAll(gatherParams(), 220);
}

function wireControls() {
  const ids = [
    "osc1-wave","osc1-range","osc1-tune","osc1-vol","osc1-enabled",
    "osc2-wave","osc2-range","osc2-tune","osc2-vol","osc2-enabled",
    "osc3-wave","osc3-range","osc3-tune","osc3-vol","osc3-enabled",
    "lfo-wave","lfo-freq","lfo-depth",
    "filter-cutoff","filter-q","filter-env",
    "f-attack","f-decay","f-sustain","f-release",
    "v-attack","v-decay","v-sustain","v-release",
    "noise-level","master"
  ];
  ids.forEach((id) => {
    bindControl(id, () => {
      const params = gatherParams();
      renderer.renderAll(params, engine?.currentFreq || 220);
      if (engine) engine.updateParams(params);
    });
  });
}

function startRenderLoop() {
  stopRenderLoop();
  const loop = () => {
    renderer.renderAll(gatherParams(), engine?.currentFreq || 220);
  };
  loop();
  renderLoop = setInterval(loop, REFRESH_MS);
}

function stopRenderLoop() {
  if (renderLoop) clearInterval(renderLoop);
  renderLoop = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopRenderLoop();
  else if (engine) startRenderLoop();
});

document.addEventListener("DOMContentLoaded", init);
