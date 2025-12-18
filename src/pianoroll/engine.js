// Feature-gated piano roll engine: schedules noteOn/noteOff with transport and loop.
export class PianoRollEngine {
  constructor({ bpm = 120, loopBars = 2, ctx, onNoteOn, onNoteOff }) {
    this.bpm = bpm;
    this.loopBars = loopBars;
    this.ctx = ctx;
    this.onNoteOn = onNoteOn;
    this.onNoteOff = onNoteOff;
    this.notes = [];
    this.playing = false;
    this.lookahead = 0.1; // seconds
    this.interval = 0.025;
    this.timer = null;
    this.startTime = 0;
    this.lastSchedule = 0;
  }

  setNotes(notes) {
    this.notes = notes || [];
  }

  setBpm(bpm) {
    this.bpm = bpm;
  }

  setLoopBars(bars) {
    this.loopBars = bars;
  }

  start() {
    if (this.playing || !this.ctx) return;
    this.playing = true;
    this.startTime = this.ctx.currentTime;
    this.lastSchedule = 0;
    this.timer = setInterval(() => this._scheduler(), this.interval * 1000);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    this.lastSchedule = 0;
  }

  _scheduler() {
    if (!this.playing) return;
    const now = this.ctx.currentTime - this.startTime;
    const loopSeconds = (this.loopBars * 4) * (60 / this.bpm);
    const windowStart = this.lastSchedule;
    const windowEnd = this.lastSchedule + this.lookahead;
    this.notes.forEach((note) => {
      const start = note.startTime % loopSeconds;
      const end = start + note.duration;
      if (start >= windowStart && start < windowEnd) {
        this.onNoteOn?.(note.pitch, note.velocity || 1, this.startTime + start);
        this.onNoteOff?.(note.pitch, this.startTime + end);
      }
    });
    this.lastSchedule += this.interval;
    if (this.lastSchedule > loopSeconds) {
      this.lastSchedule = 0;
      this.startTime = this.ctx.currentTime;
    }
  }
}
