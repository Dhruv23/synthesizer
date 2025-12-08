class BitcrusherProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "bitDepth", defaultValue: 8, minValue: 1, maxValue: 16, automationRate: "k-rate" },
      { name: "reduction", defaultValue: 0.6, minValue: 0.01, maxValue: 1, automationRate: "k-rate" },
    ];
  }

  constructor() {
    super();
    this.phase = 0;
    this.lastSample = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (input.length === 0) return true;
    const depth = parameters.bitDepth[0];
    const reduction = parameters.reduction[0];
    const step = Math.pow(2, depth);
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      for (let i = 0; i < inputChannel.length; i++) {
        this.phase += reduction;
        if (this.phase >= 1.0) {
          this.phase -= 1.0;
          this.lastSample = Math.round(inputChannel[i] * step) / step;
        }
        outputChannel[i] = this.lastSample;
      }
    }
    return true;
  }
}

registerProcessor("bitcrusher-processor", BitcrusherProcessor);
