import { SynthEngine } from "./synthEngine.js";
import { WaveformRenderer } from "./waveformRenderer.js";
import { bindControl } from "./ui/bindings.js";
import { buildModMatrixUI, readModMatrix } from "./ui/modMatrix.js";
import { PianoRollEngine } from "./pianoroll/engine.js";
import { PianoRollUI } from "./pianoroll/ui.js";
import { initPresetUI } from "./ui/presetsUI.js";

let engine = null;
let renderer = null;
let renderLoop = null;
let pianoEngine = null;
let pianoUI = null;
const REFRESH_MS = 1000 / 30; // ~30 FPS

// Feature flags (default off to preserve existing behavior)
const FEATURE_FLAGS = {
  unison: false,
  fx: false,
  modMatrix: false,
  pianoRoll: true,
};

function gatherParams() {
  return {
    osc: [
      {
        enabled: document.getElementById("osc1-enabled").checked,
        unison: parseInt(document.getElementById("osc1-unison").value, 10) || 1,
        detune: parseFloat(document.getElementById("osc1-detune").value),
        spread: parseFloat(document.getElementById("osc1-spread").value),
        randPhase: document.getElementById("osc1-randphase").checked,
        wave: document.getElementById("osc1-wave").value,
        range: parseFloat(document.getElementById("osc1-range").value),
        tune: parseFloat(document.getElementById("osc1-tune").value),
        volume: parseFloat(document.getElementById("osc1-vol").value),
      },
      {
        enabled: document.getElementById("osc2-enabled").checked,
        unison: parseInt(document.getElementById("osc2-unison").value, 10) || 1,
        detune: parseFloat(document.getElementById("osc2-detune").value),
        spread: parseFloat(document.getElementById("osc2-spread").value),
        randPhase: document.getElementById("osc2-randphase").checked,
        wave: document.getElementById("osc2-wave").value,
        range: parseFloat(document.getElementById("osc2-range").value),
        tune: parseFloat(document.getElementById("osc2-tune").value),
        volume: parseFloat(document.getElementById("osc2-vol").value),
      },
      {
        enabled: document.getElementById("osc3-enabled").checked,
        unison: parseInt(document.getElementById("osc3-unison").value, 10) || 1,
        detune: parseFloat(document.getElementById("osc3-detune").value),
        spread: parseFloat(document.getElementById("osc3-spread").value),
        randPhase: document.getElementById("osc3-randphase").checked,
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
    fx: {
      dist: document.getElementById("fx-dist").checked,
      chorus: document.getElementById("fx-chorus").checked,
      delay: document.getElementById("fx-delay").checked,
      reverb: document.getElementById("fx-reverb").checked,
      comp: document.getElementById("fx-comp").checked,
    },
    lfo2: {
      wave: document.getElementById("lfo2-wave").value,
      freq: parseFloat(document.getElementById("lfo2-freq").value),
      depth: parseFloat(document.getElementById("lfo2-depth").value),
      sync: document.getElementById("lfo2-sync").checked,
      division: parseFloat(document.getElementById("lfo2-div").value),
      phase: parseFloat(document.getElementById("lfo2-phase").value) || 0,
      fade: parseFloat(document.getElementById("lfo2-fade").value) || 0,
      oneShot: document.getElementById("lfo2-one").checked,
    },
    modMatrix: readModMatrix(),
    featureFlags: FEATURE_FLAGS,
    bpm: parseFloat(document.getElementById("roll-bpm")?.value || 120),
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
  buildModMatrixUI();
  initPresetUI({ getParams: gatherParams, applyParams });
  const rollToggle = document.getElementById("piano-roll-toggle");
  rollToggle?.addEventListener("click", () => {
    document.body.classList.toggle("roll-mode");
  });
  if (FEATURE_FLAGS.pianoRoll) {
    document.body.classList.add("roll-mode");
  }
  if (FEATURE_FLAGS.pianoRoll) {
    const rollCanvas = document.getElementById("piano-roll");
    pianoUI = new PianoRollUI(rollCanvas);
    pianoEngine = new PianoRollEngine({
      ctx: engine?.ctx,
      bpm: 120,
      loopBars: 2,
      onNoteOn: (pitch, velocity, when) => engine?.triggerOn(freqFromMidi(pitch), gatherParams(), velocity, when),
      onNoteOff: (pitch, when) => engine?.triggerOff(when),
    });
    document.getElementById("roll-play")?.addEventListener("click", () => {
      pianoEngine.setNotes(pianoUI.getNotes());
      pianoEngine.start();
    });
    document.getElementById("roll-stop")?.addEventListener("click", () => pianoEngine.stop());
    document.getElementById("roll-snap")?.addEventListener("change", (e) => pianoUI.setSnap(parseFloat(e.target.value)));
    document.getElementById("roll-loop")?.addEventListener("change", (e) => {
      const bars = parseInt(e.target.value, 10) || 2;
      pianoUI.setLoop(bars);
      pianoEngine?.setLoopBars(bars);
    });
    document.getElementById("roll-bpm")?.addEventListener("change", (e) => {
      const bpm = parseFloat(e.target.value) || 120;
      pianoEngine?.setBpm(bpm);
    });
    document.getElementById("roll-autoscroll")?.addEventListener("change", (e) => {
      if (pianoUI) pianoUI.autoscroll = e.target.checked;
    });
  }

  startBtn.addEventListener("click", async () => {
    if (!engine) {
      engine = new SynthEngine();
      await engine.init();
      wireControls();
    }
    startRenderLoop();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener("click", () => {
    if (engine) engine.stop();
    if (pianoEngine) pianoEngine.stop();
    stopRenderLoop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });

  // initial render preview
  renderer.renderAll(gatherParams(), 220);
}

function wireControls() {
  const ids = [
    "osc1-wave","osc1-range","osc1-tune","osc1-vol","osc1-enabled","osc1-unison","osc1-detune","osc1-spread","osc1-randphase",
    "osc2-wave","osc2-range","osc2-tune","osc2-vol","osc2-enabled","osc2-unison","osc2-detune","osc2-spread","osc2-randphase",
    "osc3-wave","osc3-range","osc3-tune","osc3-vol","osc3-enabled","osc3-unison","osc3-detune","osc3-spread","osc3-randphase",
    "lfo-wave","lfo-freq","lfo-depth",
    "lfo2-wave","lfo2-freq","lfo2-depth","lfo2-sync","lfo2-div","lfo2-phase","lfo2-fade","lfo2-one",
    "filter-cutoff","filter-q","filter-env",
    "f-attack","f-decay","f-sustain","f-release",
    "v-attack","v-decay","v-sustain","v-release",
    "noise-level","master",
    "fx-dist","fx-chorus","fx-delay","fx-reverb","fx-comp"
  ];
  for (let i = 0; i < 6; i++) {
    ids.push(`mod-enable-${i}`, `mod-src-${i}`, `mod-dest-${i}`, `mod-amt-${i}`);
  }
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
    if (engine) engine.applyModulations(gatherParams());
    if (FEATURE_FLAGS.pianoRoll && pianoUI && pianoEngine) {
      const loopDur = (pianoEngine.loopBars * 4);
      const playhead = (pianoEngine.lastSchedule % loopDur);
      pianoUI.setPlayhead(playhead);
    }
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

function freqFromMidi(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

function applyParams(p) {
  if (!p) return;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) {
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  // Oscillators
  ["1","2","3"].forEach((i, idx) => {
    const osc = p.osc?.[idx];
    if (!osc) return;
    setVal(`osc${i}-enabled`, osc.enabled);
    setVal(`osc${i}-unison`, osc.unison || 1);
    setVal(`osc${i}-detune`, osc.detune || 0);
    setVal(`osc${i}-spread`, osc.spread || 0);
    const phaseEl = document.getElementById(`osc${i}-randphase`);
    if (phaseEl) phaseEl.checked = !!osc.randPhase;
    setVal(`osc${i}-wave`, osc.wave);
    setVal(`osc${i}-range`, osc.range);
    setVal(`osc${i}-tune`, osc.tune);
    setVal(`osc${i}-vol`, osc.volume);
  });
  // LFOs
  setVal("lfo-wave", p.lfo?.wave);
  setVal("lfo-freq", p.lfo?.freq);
  setVal("lfo-depth", p.lfo?.depth);
  setVal("lfo2-wave", p.lfo2?.wave);
  setVal("lfo2-freq", p.lfo2?.freq);
  setVal("lfo2-depth", p.lfo2?.depth);
  const syncEl = document.getElementById("lfo2-sync");
  if (syncEl) syncEl.checked = !!p.lfo2?.sync;
  setVal("lfo2-div", p.lfo2?.division);
  setVal("lfo2-phase", p.lfo2?.phase);
  setVal("lfo2-fade", p.lfo2?.fade);
  const oneEl = document.getElementById("lfo2-one");
  if (oneEl) oneEl.checked = !!p.lfo2?.oneShot;

  // Filter and env
  setVal("filter-cutoff", p.filter?.cutoff);
  setVal("filter-q", p.filter?.q);
  setVal("filter-env", p.filter?.envAmount);
  setVal("f-attack", p.filter?.adsr?.a);
  setVal("f-decay", p.filter?.adsr?.d);
  setVal("f-sustain", p.filter?.adsr?.s);
  setVal("f-release", p.filter?.adsr?.r);

  // Amp env
  setVal("v-attack", p.ampEnv?.a);
  setVal("v-decay", p.ampEnv?.d);
  setVal("v-sustain", p.ampEnv?.s);
  setVal("v-release", p.ampEnv?.r);

  // Noise / master
  setVal("noise-level", p.noise?.level);
  setVal("master", p.master);

  // FX toggles
  if (p.fx) {
    ["dist","chorus","delay","reverb","comp"].forEach((k) => {
      const el = document.getElementById(`fx-${k}`);
      if (el) el.checked = !!p.fx[k];
    });
  }

  // Mod matrix
  if (p.modMatrix) {
    p.modMatrix.forEach((slot, i) => {
      setVal(`mod-enable-${i}`, slot.enabled);
      setVal(`mod-src-${i}`, slot.source);
      setVal(`mod-dest-${i}`, slot.dest);
      setVal(`mod-amt-${i}`, slot.amount);
    });
  }

  // Feature flags
  if (p.featureFlags) {
    Object.keys(p.featureFlags).forEach((k) => {
      FEATURE_FLAGS[k] = p.featureFlags[k];
    });
  }
}
    if (FEATURE_FLAGS.pianoRoll) {
      window.addEventListener("pr-toggle-play", () => {
        if (!pianoEngine) return;
        if (pianoEngine.playing) pianoEngine.stop();
        else {
          pianoEngine.setNotes(pianoUI.getNotes());
          pianoEngine.start();
        }
      });
    }
