// Preset store using localStorage. Backward-compatible helpers.
const STORAGE_KEY = "synth-presets";

const INIT_PRESET = {
  name: "Init",
  category: "all",
  featureFlags: {},
  params: null,
  modMatrix: [],
  fx: {},
};

export function exportPreset(params) {
  return JSON.stringify({
    name: params.name || "Preset",
    category: params.category || "all",
    featureFlags: params.featureFlags || {},
    params,
    modMatrix: params.modMatrix || [],
    fx: params.fx || {},
  });
}

export function loadPreset(presetObj, applyFn) {
  try {
    const data = typeof presetObj === "string" ? JSON.parse(presetObj) : presetObj;
    if (applyFn && data.params) applyFn(data.params);
    return data;
  } catch (e) {
    console.error("Invalid preset", e);
    return null;
  }
}

export function getInitPreset() {
  return INIT_PRESET;
}

export function getAllPresets() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const presets = raw ? JSON.parse(raw) : [];
  if (!presets.find((p) => p.name === "Init")) presets.unshift(INIT_PRESET);
  return presets;
}

export function savePreset({ name, params, category = "all" }) {
  const presets = getAllPresets().filter((p) => p.name !== name || p.name === "Init");
  presets.push({
    name,
    category,
    params,
    featureFlags: params.featureFlags || {},
    modMatrix: params.modMatrix || [],
    fx: params.fx || {},
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function deletePreset(name) {
  const presets = getAllPresets().filter((p) => p.name !== name && p.name !== "Init");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
