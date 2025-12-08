export class AudioContextManager {
  constructor() {
    this.context = null;
    this.options = { sampleRate: 44100, latencyHint: "interactive" };
  }

  async init(options = {}) {
    this.options = { ...this.options, ...options };
    if (this.context) {
      await this.dispose();
    }
    this.context = new AudioContext({
      sampleRate: this.options.sampleRate,
      latencyHint: this.options.latencyHint,
    });
    return this.context;
  }

  async dispose() {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }
}
