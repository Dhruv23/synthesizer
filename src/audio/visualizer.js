export class Visualizer {
  constructor(ctx, { oscilloscopeCanvas, spectrumCanvas }) {
    this.ctx = ctx;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.oscilloscopeCanvas = oscilloscopeCanvas;
    this.spectrumCanvas = spectrumCanvas;
    this.running = false;
    this.lastFrame = 0;
    this._resizeCanvas(this.oscilloscopeCanvas);
    this._resizeCanvas(this.spectrumCanvas);
  }

  start() {
    this.running = true;
    const scopeCtx = this.oscilloscopeCanvas.getContext("2d");
    const spectrumCtx = this.spectrumCanvas.getContext("2d");
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const freqArray = new Uint8Array(bufferLength);

    const draw = (time) => {
      if (!this.running) return;
      this.analyser.getByteTimeDomainData(dataArray);
      this.analyser.getByteFrequencyData(freqArray);
      this._drawOscilloscope(scopeCtx, dataArray);
      this._drawSpectrum(spectrumCtx, freqArray);
      this.lastFrame = time;
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  stop() {
    this.running = false;
  }

  _drawOscilloscope(ctx, dataArray) {
    const { width, height } = ctx.canvas;
    ctx.fillStyle = "#0b101c";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#4cf1c0";
    ctx.beginPath();
    const sliceWidth = width / dataArray.length;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  _drawSpectrum(ctx, freqArray) {
    const { width, height } = ctx.canvas;
    ctx.fillStyle = "#0b101c";
    ctx.fillRect(0, 0, width, height);
    const barWidth = (width / freqArray.length) * 2.5;
    let x = 0;
    for (let i = 0; i < freqArray.length; i++) {
      const v = freqArray[i] / 255.0;
      const y = v * height;
      ctx.fillStyle = `rgba(138, 180, 255, ${v})`;
      ctx.fillRect(x, height - y, barWidth, y);
      x += barWidth + 1;
    }
  }

  _resizeCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
  }
}
