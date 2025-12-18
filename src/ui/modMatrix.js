const SOURCES = [
  { value: "none", label: "None" },
  { value: "lfo1", label: "LFO1" },
  { value: "lfo2", label: "LFO2" },
  { value: "env1", label: "Env Amp" },
  { value: "env2", label: "Env Filter" },
  { value: "velocity", label: "Velocity" },
  { value: "modwheel", label: "Mod Wheel" },
  { value: "keytrack", label: "Key Track" },
  { value: "random", label: "Random" },
];

const DESTS = [
  { value: "none", label: "None" },
  { value: "pitch", label: "Osc Pitch" },
  { value: "cutoff", label: "Filter Cutoff" },
  { value: "resonance", label: "Filter Q" },
  { value: "detune", label: "Unison Detune" },
  { value: "pan", label: "Pan" },
  { value: "volume", label: "Volume" },
];

export function buildModMatrixUI() {
  const container = document.getElementById("mod-matrix");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const row = document.createElement("div");
    row.className = "mod-row-item";
    const enable = document.createElement("input");
    enable.type = "checkbox";
    enable.id = `mod-enable-${i}`;
    const src = document.createElement("select");
    src.id = `mod-src-${i}`;
    SOURCES.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.value;
      opt.textContent = s.label;
      src.appendChild(opt);
    });
    const dest = document.createElement("select");
    dest.id = `mod-dest-${i}`;
    DESTS.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.value;
      opt.textContent = d.label;
      dest.appendChild(opt);
    });
    const amt = document.createElement("input");
    amt.type = "range";
    amt.id = `mod-amt-${i}`;
    amt.min = -1;
    amt.max = 1;
    amt.step = 0.01;
    amt.value = 0;
    row.appendChild(enable);
    row.appendChild(src);
    row.appendChild(dest);
    row.appendChild(amt);
    container.appendChild(row);
  }
}

export function readModMatrix() {
  const slots = [];
  for (let i = 0; i < 6; i++) {
    const enable = document.getElementById(`mod-enable-${i}`);
    const src = document.getElementById(`mod-src-${i}`);
    const dest = document.getElementById(`mod-dest-${i}`);
    const amt = document.getElementById(`mod-amt-${i}`);
    if (!enable || !src || !dest || !amt) continue;
    slots.push({
      enabled: enable.checked,
      source: src.value,
      dest: dest.value,
      amount: parseFloat(amt.value),
    });
  }
  return slots;
}
