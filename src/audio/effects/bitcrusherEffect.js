import { EffectModule } from "./effectBase.js";

export class BitcrusherEffect extends EffectModule {
  constructor(ctx) {
    super(ctx, "Bitcrusher");
    this.workletNode = null;
    this.bitDepth = 8;
    this.reduction = 0.6;
    this.input.connect(this.output); // passthrough until worklet ready
    this.ready = this.initWorklet();
  }

  async initWorklet() {
    if (!this.ctx.audioWorklet) return;
    if (!this.workletNode) {
      try {
        await this.ctx.audioWorklet.addModule("src/worklets/bitcrusher-processor.js");
        this.workletNode = new AudioWorkletNode(this.ctx, "bitcrusher-processor", {
          parameterData: {
            bitDepth: this.bitDepth,
            reduction: this.reduction,
          },
        });
        this.input.disconnect();
        this.input.connect(this.workletNode).connect(this.output);
      } catch (e) {
        console.error("Failed to load bitcrusher worklet", e);
        this.input.connect(this.output);
      }
    }
  }

  async setParams({ bitDepth, reduction }) {
    await this.ready;
    if (bitDepth !== undefined) {
      this.bitDepth = bitDepth;
      if (this.workletNode) this.workletNode.parameters.get("bitDepth").setValueAtTime(bitDepth, this.ctx.currentTime);
    }
    if (reduction !== undefined) {
      this.reduction = reduction;
      if (this.workletNode) this.workletNode.parameters.get("reduction").setValueAtTime(reduction, this.ctx.currentTime);
    }
  }

  getParams() {
    return { bitDepth: this.bitDepth, reduction: this.reduction };
  }
}
