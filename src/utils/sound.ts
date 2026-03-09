let audioCtx: AudioContext | null = null;
let bgmGain: GainNode | null = null;
let bgmPlaying = false;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** Play a short tone */
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.15,
  delay = 0
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

/** Ascending arpeggio — pin/dart sound */
export function playPinSound() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    playTone(freq, 0.12, "square", 0.12, i * 0.06);
  });
  // Impact thud
  playTone(120, 0.15, "triangle", 0.2, 0.25);
}

/** Descending womp — dismiss sound */
export function playDismissSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

/** Card flip / appear sound */
export function playCardSound() {
  playTone(800, 0.05, "square", 0.08);
  playTone(1200, 0.05, "square", 0.06, 0.04);
}

/** UI click sound */
export function playClickSound() {
  playTone(1000, 0.03, "square", 0.08);
}

/** Star milestone fanfare — Mario 1-UP style */
export function playMilestoneSound() {
  const notes = [784, 988, 1175, 1319, 1568, 1760, 2093];
  notes.forEach((freq, i) => {
    playTone(freq, 0.12, "square", 0.13, i * 0.07);
  });
  // Shimmering tail
  playTone(2093, 0.4, "sine", 0.08, 0.5);
  playTone(2637, 0.3, "sine", 0.05, 0.55);
}

/** Export success fanfare */
export function playExportSound() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    playTone(freq, 0.2, "square", 0.1, i * 0.1);
  });
}

// ── Background music (simple chiptune loop) ──

const BGM_TEMPO = 140;
const BEAT = 60 / BGM_TEMPO;

// Melody: simple catchy retro loop (note frequencies)
const melody: [number, number][] = [
  // [freq, beats]
  [330, 1], [392, 1], [440, 1], [523, 1],
  [494, 1], [440, 0.5], [392, 0.5], [330, 1], [0, 1],
  [294, 1], [330, 1], [392, 1], [440, 1],
  [392, 1], [330, 0.5], [294, 0.5], [262, 1], [0, 1],
  [330, 1], [392, 1], [523, 1], [494, 0.5], [440, 0.5],
  [392, 1], [440, 1], [523, 1], [0, 1],
  [587, 1], [523, 1], [440, 1], [392, 1],
  [330, 0.5], [294, 0.5], [262, 1], [330, 2],
];

// Bass line
const bassLine: [number, number][] = [
  [131, 2], [131, 2], [147, 2], [147, 2],
  [110, 2], [110, 2], [131, 2], [131, 2],
  [131, 2], [131, 2], [147, 2], [147, 2],
  [165, 2], [165, 2], [131, 2], [131, 2],
];

let bgmTimeout: ReturnType<typeof setTimeout> | null = null;

function playMelodyLoop() {
  if (!bgmPlaying || !bgmGain) return;

  const ctx = getCtx();
  let time = 0;

  // Play melody
  for (const [freq, beats] of melody) {
    if (freq > 0) {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      noteGain.gain.setValueAtTime(0.06, ctx.currentTime + time);
      noteGain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + time + beats * BEAT * 0.9
      );
      osc.connect(noteGain);
      noteGain.connect(bgmGain);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + beats * BEAT);
    }
    time += beats * BEAT;
  }

  // Play bass
  let bassTime = 0;
  for (const [freq, beats] of bassLine) {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    noteGain.gain.setValueAtTime(0.04, ctx.currentTime + bassTime);
    noteGain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + bassTime + beats * BEAT * 0.9
    );
    osc.connect(noteGain);
    noteGain.connect(bgmGain);
    osc.start(ctx.currentTime + bassTime);
    osc.stop(ctx.currentTime + bassTime + beats * BEAT);
    bassTime += beats * BEAT;
  }

  // Schedule next loop
  const loopDuration = time * 1000;
  bgmTimeout = setTimeout(playMelodyLoop, loopDuration);
}

export function startBgm() {
  if (bgmPlaying) return;
  const ctx = getCtx();
  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.5;
  bgmGain.connect(ctx.destination);
  bgmPlaying = true;
  playMelodyLoop();
}

export function stopBgm() {
  bgmPlaying = false;
  if (bgmTimeout) {
    clearTimeout(bgmTimeout);
    bgmTimeout = null;
  }
}

export function setBgmVolume(vol: number) {
  if (bgmGain) bgmGain.gain.value = vol;
}

export function isBgmPlaying() {
  return bgmPlaying;
}
