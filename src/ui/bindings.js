export function bindSlider(id, onInput) {
  const el = document.getElementById(id);
  const valueEl = document.getElementById(`${id}-value`);
  const update = () => {
    if (valueEl) valueEl.textContent = el.value;
    onInput(parseFloat(el.value));
  };
  el.addEventListener("input", update);
  update();
}

export function bindSelect(id, onChange) {
  const el = document.getElementById(id);
  el.addEventListener("change", () => onChange(el.value));
  onChange(el.value);
}
