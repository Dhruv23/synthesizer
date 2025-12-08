const NOTES = [
  { name: "C", isBlack: false },
  { name: "C#", isBlack: true },
  { name: "D", isBlack: false },
  { name: "D#", isBlack: true },
  { name: "E", isBlack: false },
  { name: "F", isBlack: false },
  { name: "F#", isBlack: true },
  { name: "G", isBlack: false },
  { name: "G#", isBlack: true },
  { name: "A", isBlack: false },
  { name: "A#", isBlack: true },
  { name: "B", isBlack: false },
];

export function buildKeyboard(container, onDown, onUp) {
  container.innerHTML = "";
  const startNote = 48; // C3
  const total = 21; // almost two octaves
  for (let i = 0; i < total; i++) {
    const note = startNote + i;
    const info = NOTES[note % 12];
    const key = document.createElement("div");
    key.className = "key" + (info.isBlack ? " black" : "");
    key.dataset.note = note;
    key.addEventListener("mousedown", () => {
      onDown(midiToFreq(note));
    });
    key.addEventListener("mouseup", () => onUp());
    key.addEventListener("mouseleave", (e) => {
      if (e.buttons === 1) onUp();
    });
    container.appendChild(key);
  }
}

function midiToFreq(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
}
