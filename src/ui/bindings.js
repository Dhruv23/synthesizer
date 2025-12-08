export function bindControl(id, cb) {
  const el = document.getElementById(id);
  ["input", "change"].forEach((ev) => el.addEventListener(ev, cb));
}
