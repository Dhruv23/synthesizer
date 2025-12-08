# Modular Web Synth

Feature-rich modular Web Audio synthesizer with unison oscillator, stackable FX, live oscilloscope/spectrum, and interactive UI.

## Technology stack
- Web Audio API for low-latency DSP (44.1/48k selectable)
- ES modules + vanilla JS (no build step)
- Canvas for oscilloscope and spectrum analyzer
- Modern CSS for UI styling

## System architecture
- `src/audio`
  - `context.js` — audio context lifecycle
  - `synthEngine.js` — top-level graph wiring, envelopes, and parameter routing
  - `unison.js` — multi-voice oscillators with detune and stereo spread
  - `adsr.js` — amplitude/filter envelopes
  - `effectChain.js` — ordered, re-orderable effect chain
  - `effects/*` — individual DSP modules (filter, distortion, chorus, flanger, phaser, delay, reverb, bitcrusher, waveshaper, compressor)
  - `visualizer.js` — oscilloscope and FFT display
  - `worklets/bitcrusher-processor.js` — AudioWorklet for bit depth + downsample crushing
- `src/ui` — UI bindings and slider helpers
- `index.html` — layout and controls

## DSP signal flow
```
[Unison Oscillator] -> [Amp ADSR Gain] -> [Biquad Filter + Filter ADSR]
   -> [Effect Chain (re-orderable):
       Distortion -> Chorus -> Flanger -> Phaser -> Delay -> Reverb
       -> Bitcrusher -> Waveshaper -> Compressor]
   -> [Master Gain] -> [Analyser] -> Audio Destination
```

## Class diagram (textual)
- `SynthEngine`
  - owns `UnisonOscillator`, `ADSR` (amp/filter), `FilterEffect`, `EffectChain`, `Visualizer`
  - methods: `triggerOn/Off`, setters for envelopes, filter, unison, FX params
- `UnisonOscillator`
  - manages N oscillators or noise sources with detune + stereo pan spread
- `EffectChain`
  - array of `EffectModule` instances; `moveUp/moveDown/rebuild` to reorder
- `EffectModule` subclasses
  - `FilterEffect`, `DistortionEffect`, `ChorusEffect`, `FlangerEffect`, `PhaserEffect`, `DelayEffect`, `ReverbEffect`, `BitcrusherEffect`, `WaveshaperEffect`, `CompressorEffect`
- `Visualizer`
  - uses `AnalyserNode` to render oscilloscope and spectrum canvases

## Running the synth
1. Start a local server from the repo root (required for AudioWorklet):
   - `python -m http.server 8000`
   - then open `http://localhost:8000` in a browser (Chrome/Edge/Safari tested).
2. Click **Start Audio** (first user gesture unlocks audio).
3. Tweak oscillators, envelopes, filter, and FX. Use **Trigger/Hold Gate** to audition notes.
4. Reorder FX with ↑/↓, toggle each on/off, and watch the scopes update live.

## Testing / validation
- Manual: verify audio starts, oscilloscope responds, and each FX alters the sound when toggled.
- Latency: switch between `Interactive/Balanced/Playback` and 44.1/48k to compare stability.

## Optional enhancements
- MIDI input to gate/trigger notes and map CC to parameters
- LFO routing matrix for modulating pitch/filter/FX depth
- Wavetable or sampler oscillators
- Preset save/load (JSON) and morphing between snapshots
- WAV export by recording the master bus
