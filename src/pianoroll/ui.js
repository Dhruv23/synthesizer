// Lightweight piano roll UI logic; inert unless FEATURE_FLAGS.pianoRoll is true.
const GRID_COLOR = "#333";
const NOTE_COLOR = "#4cf1c0";
const PLAYHEAD_COLOR = "#f6f6f6";

export class PianoRollUI {
  constructor(canvas, velocityLane) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.keysCanvas = document.getElementById("piano-keys");
    this.keysCtx = this.keysCanvas?.getContext("2d");
    this.velocityCanvas = document.getElementById("velocity-lane") || velocityLane;
    this.velCtx = this.velocityCanvas?.getContext("2d");
    this.notes = [];
    this.snap = 0.125;
    this.loopBars = 2;
    this.playhead = 0;
    this.zoomX = 1;
    this.zoomY = 1;
    this.scrollX = 0;
    this.scrollY = 0;
    this.autoscroll = true;
    this.selected = new Set();
    this.lastVelocity = 0.8; // remember last-used velocity for new notes
    this.velocityLane = velocityLane;
    this._bind();
    this._draw();
  }

  setSnap(snap) {
    this.snap = snap;
  }

  setLoop(loopBars) {
    this.loopBars = loopBars;
  }

  setNotes(notes) {
    this.notes = notes;
    this._draw();
  }

  setPlayhead(pos) {
    this.playhead = pos;
    this._draw();
  }

  getNotes() {
    return this.notes;
  }

  _bind() {
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const time = this._snapTime(x / this.canvas.width * this.loopBars * 4);
      const pitch = 84 - Math.floor((y / this.canvas.height) * 24);
      const duration = this.snap;
      this.notes.push({ pitch, startTime: time, duration, velocity: 0.8 });
      this._draw();
    });

    window.addEventListener("keydown", (e) => {
      if (!this.canvas) return;
      if (e.code === "Space") {
        e.preventDefault();
        const event = new Event("pr-toggle-play", { bubbles: true });
        this.canvas.dispatchEvent(event);
      }
      if (e.code === "Delete" || e.code === "Backspace") {
        if (this.notes.length) {
          this.notes.pop();
          this._draw();
        }
      }
    });

    this.canvas.addEventListener("mousedown", (e) => this._onPointerDown(e));
    this.canvas.addEventListener("mousemove", (e) => this._onPointerMove(e));
    window.addEventListener("mouseup", (e) => this._onPointerUp(e));

    this.canvas.addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.zoomX = Math.min(4, Math.max(0.5, this.zoomX + delta));
        this._draw();
      } else {
        this.scrollX = Math.max(0, this.scrollX + e.deltaY * 0.001);
        this._draw();
      }
    });

    this.velocityCanvas?.addEventListener("mousedown", (e) => this._onVelocityDown(e));
    this.velocityCanvas?.addEventListener("mousemove", (e) => this._onVelocityMove(e));
    window.addEventListener("mouseup", () => { this.dragVel = null; });

    const velToggle = document.getElementById("velocity-toggle");
    velToggle?.addEventListener("change", (e) => {
      if (this.velocityCanvas) this.velocityCanvas.style.display = e.target.checked ? "block" : "none";
      this._draw();
    });

    const zoomX = document.getElementById("roll-zoom-x");
    const zoomY = document.getElementById("roll-zoom-y");
    const zoomFit = document.getElementById("roll-zoom-fit");
    zoomX?.addEventListener("input", (e) => { this.zoomX = parseFloat(e.target.value); this._draw(); });
    zoomY?.addEventListener("input", (e) => { this.zoomY = parseFloat(e.target.value); this._draw(); });
    zoomFit?.addEventListener("click", () => {
      this.zoomX = 1;
      this.zoomY = 1;
      this.scrollX = 0;
      this.scrollY = 0;
      this._draw();
    });

    const auto = document.getElementById("roll-autoscroll");
    auto?.addEventListener("change", (e) => { this.autoscroll = e.target.checked; });
  }

  _draw() {
    const { width, height } = this.canvas;
    const totalBeats = this.loopBars * 4;
    const viewBeats = totalBeats / this.zoomX;
    const beatWidth = width / viewBeats;

    this.ctx.fillStyle = "#0f1218";
    this.ctx.fillRect(0, 0, width, height);

    // Grid: bars and beats
    for (let b = 0; b <= totalBeats; b += this.snap) {
      const x = (b - this.scrollX) * beatWidth;
      if (x < 0 || x > width) continue;
      this.ctx.beginPath();
      this.ctx.strokeStyle = b % 4 === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)";
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Horizontal stripes for pitch
    for (let p = 0; p < 24; p++) {
      const y = (p / 24) * height;
      this.ctx.fillStyle = p % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)";
      this.ctx.fillRect(0, y, width, height / 24);
    }

    // Notes
    this.notes.forEach((n) => {
      const x = (n.startTime - this.scrollX) * beatWidth;
      const w = Math.max(4, n.duration * beatWidth);
      const y = ((84 - n.pitch) / 24) * height;
      const h = Math.max(10, (height / 24) * this.zoomY);
      const sel = this.selected.has(n);
      this.ctx.fillStyle = sel ? "rgba(111,178,255,0.9)" : "rgba(255,255,255,0.8)";
      this.ctx.fillRect(x, y, w, h);
      this.ctx.fillStyle = "rgba(0,0,0,0.25)";
      this.ctx.fillRect(x + w - 4, y, 4, h); // resize handle
    });

    // Playhead
    const phx = (this.playhead - this.scrollX) * beatWidth;
    this.ctx.strokeStyle = PLAYHEAD_COLOR;
    this.ctx.beginPath();
    this.ctx.moveTo(phx, 0);
    this.ctx.lineTo(phx, height);
    this.ctx.stroke();

    // Keys ruler
    if (this.keysCtx) {
      const kh = this.keysCanvas.height;
      const kw = this.keysCanvas.width;
      this.keysCtx.fillStyle = "#0b0d12";
      this.keysCtx.fillRect(0, 0, kw, kh);
      for (let p = 0; p < 24; p++) {
        const y = (p / 24) * kh;
        const midi = 84 - p;
        const note = midi % 12;
        const isBlack = [1,3,6,8,10].includes(note);
        this.keysCtx.fillStyle = isBlack ? "#1c1f2b" : "#111420";
        this.keysCtx.fillRect(0, y, kw, kh / 24);
        if (note === 0) {
          const octave = Math.floor(midi / 12) - 1;
          this.keysCtx.fillStyle = "#8ea0c2";
          this.keysCtx.fillText(`C${octave}`, 10, y + 14);
        }
      }
    }

    // Velocity lane
    if (this.velCtx && this.velocityCanvas?.style.display !== "none") {
      const vw = this.velocityCanvas.width;
      const vh = this.velocityCanvas.height;
      this.velCtx.fillStyle = "#0d1016";
      this.velCtx.fillRect(0, 0, vw, vh);
      this.velCtx.strokeStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i <= 1; i += 0.1) {
        this.velCtx.beginPath();
        this.velCtx.moveTo(0, vh * (1 - i));
        this.velCtx.lineTo(vw, vh * (1 - i));
        this.velCtx.stroke();
      }
      this.notes.forEach((n) => {
        const x = ((n.startTime - this.scrollX) / totalBeats) * vw * this.zoomX;
        const w = Math.max(4, (n.duration / totalBeats) * vw * this.zoomX);
        const h = (n.velocity || 0.8) * vh;
        const sel = this.selected.has(n);
        this.velCtx.fillStyle = sel ? "rgba(111,178,255,0.9)" : "rgba(255,255,255,0.8)";
        this.velCtx.fillRect(x, vh - h, w, h);
      });
    }
  }

  _posToTime(x) {
    const beatsPerWidth = (this.loopBars * 4) / this.zoomX;
    const time = (x / this.canvas.width) * beatsPerWidth + this.scrollX;
    return this._snapTime(time);
  }

  _posToPitch(y) {
    const rel = y / this.canvas.height;
    const pitch = Math.round(84 - rel * 24);
    return pitch;
  }

  _onPointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = this._posToTime(x);
    const pitch = this._posToPitch(y);

    const hit = this.notes.find((n) => {
      const nx = (n.startTime - this.scrollX) * (this.canvas.width / ((this.loopBars * 4) / this.zoomX));
      const nw = n.duration * (this.canvas.width / ((this.loopBars * 4) / this.zoomX));
      const ny = ((84 - n.pitch) / 24) * this.canvas.height;
      const nh = Math.max(10, (this.canvas.height / 24) * this.zoomY);
      return x >= nx && x <= nx + nw && y >= ny && y <= ny + nh;
    });

    if (hit) {
      if (e.altKey || e.metaKey) {
        const clone = { ...hit, startTime: time, pitch };
        this.notes.push(clone);
        this.selected = new Set([clone]);
        this.lastVelocity = clone.velocity ?? this.lastVelocity;
      } else {
        this.selected = new Set([hit]);
        this.dragging = { note: hit, offset: time - hit.startTime, resizing: x > (hit.startTime - this.scrollX + hit.duration) * (this.canvas.width / ((this.loopBars * 4) / this.zoomX)) - 6 };
      }
    } else {
      const defaults = this._getNoteDefaults();
      const note = { pitch, startTime: time, duration: defaults.duration, velocity: defaults.velocity };
      this.notes.push(note);
      this.selected = new Set([note]);
      this.lastVelocity = note.velocity;
    }
    this._draw();
  }

  _onPointerMove(e) {
    if (!this.dragging) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = this._posToTime(x);
    const pitch = this._posToPitch(y);
    const note = this.dragging.note;
    if (this.dragging.resizing) {
      const newDur = Math.max(this.snap, time - note.startTime);
      note.duration = this._snapTime(newDur);
    } else {
      note.startTime = this._snapTime(time - this.dragging.offset);
      note.pitch = pitch;
    }
    this._draw();
  }

  _onPointerUp() {
    this.dragging = null;
  }

  _onVelocityDown(e) {
    const rect = this.velocityCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const vw = this.velocityCanvas.width;
    const vh = this.velocityCanvas.height;
    const totalBeats = this.loopBars * 4;
    const beatPos = (x / vw) * totalBeats / this.zoomX + this.scrollX;
    const hit = this.notes.find((n) => beatPos >= n.startTime && beatPos <= n.startTime + n.duration);
    if (hit) {
      this.dragVel = hit;
      hit.velocity = Math.max(0, Math.min(1, 1 - y / vh));
      this.lastVelocity = hit.velocity;
      this._draw();
    }
  }

  _onVelocityMove(e) {
    if (!this.dragVel) return;
    const rect = this.velocityCanvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const vh = this.velocityCanvas.height;
    this.dragVel.velocity = Math.max(0, Math.min(1, 1 - y / vh));
    this.lastVelocity = this.dragVel.velocity;
    this._draw();
  }

  _getNoteDefaults() {
    // Defaults derive from current grid/snap and last-used velocity for FL-style behavior.
    return {
      velocity: this.lastVelocity,
      duration: this.snap,
    };
  }

  _snapTime(t) {
    const grid = this.snap;
    return Math.round(t / grid) * grid;
  }
}
