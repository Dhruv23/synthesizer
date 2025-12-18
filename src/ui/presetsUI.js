import { getInitPreset, exportPreset, loadPreset, savePreset, getAllPresets, deletePreset } from "../presets.js";

export function initPresetUI({ getParams, applyParams }) {
  const toggleBtn = document.getElementById("preset-browser-toggle");
  const browser = document.getElementById("preset-browser");
  const listEl = document.getElementById("preset-list");
  const search = document.getElementById("preset-search");
  const category = document.getElementById("preset-category");
  const nameDisplay = document.getElementById("preset-name-display");
  const prevBtn = document.getElementById("preset-prev");
  const nextBtn = document.getElementById("preset-next");
  const saveBtn = document.getElementById("preset-save");
  const deleteBtn = document.getElementById("preset-delete");
  const closeBtn = document.getElementById("preset-close");

  let presets = [];
  let currentIndex = 0;

  const refreshList = () => {
    presets = getAllPresets();
    listEl.innerHTML = "";
    const term = (search.value || "").toLowerCase();
    presets
      .filter((p) => category.value === "all" || p.category === category.value)
      .filter((p) => p.name.toLowerCase().includes(term))
      .forEach((p, idx) => {
        const item = document.createElement("div");
        item.className = "preset-item" + (idx === currentIndex ? " active" : "");
        item.textContent = p.name;
        item.addEventListener("click", () => loadAtIndex(idx));
        listEl.appendChild(item);
      });
  };

  const loadAtIndex = (idx) => {
    if (idx < 0 || idx >= presets.length) return;
    currentIndex = idx;
    nameDisplay.textContent = presets[idx].name;
    const preset = loadPreset(presets[idx]);
    if (preset?.params) applyParams(preset.params);
    refreshList();
  };

  toggleBtn?.addEventListener("click", () => {
    browser.classList.toggle("open");
    refreshList();
  });
  closeBtn?.addEventListener("click", () => browser.classList.remove("open"));
  search?.addEventListener("input", refreshList);
  category?.addEventListener("change", refreshList);

  prevBtn?.addEventListener("click", () => loadAtIndex(Math.max(0, currentIndex - 1)));
  nextBtn?.addEventListener("click", () => loadAtIndex(Math.min(presets.length - 1, currentIndex + 1)));

  saveBtn?.addEventListener("click", () => {
    const params = getParams();
    const name = prompt("Preset name", nameDisplay.textContent || "Preset");
    if (!name) return;
    savePreset({ name, params });
    nameDisplay.textContent = name;
    refreshList();
  });

  deleteBtn?.addEventListener("click", () => {
    if (!presets[currentIndex]) return;
    if (!confirm(`Delete preset ${presets[currentIndex].name}?`)) return;
    deletePreset(presets[currentIndex].name);
    refreshList();
    if (presets.length) loadAtIndex(0);
  });

  // Init with INIT preset if present
  const init = getInitPreset();
  if (init?.params) applyParams(init.params);
  refreshList();
}
