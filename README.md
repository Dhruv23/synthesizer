# Synthesizer (WebAudio)

Recreation of the reference UI with three oscillators, LFO, filter + envelopes, noise, output, keyboard, and a locked two-period waveform display.

## Tech stack
- Vanilla JS, Web Audio API for real-time sound
- HTML/CSS for layout matching the screenshot
- Canvas-based deterministic waveform renderer (no analyser drift)

## Running
From the project root:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in a modern browser and click **Start Audio**.

## Notes on the oscilloscope
- The waveform panel renders exactly two periods of the current patch using math (no real-time buffer).
- It recomputes on any parameter change or key press.
- The display is centered and does not drift.

## Optional enhancements
- MIDI input
- Presets save/load
- Polyphony and unison detune
- Wavetable oscillator
