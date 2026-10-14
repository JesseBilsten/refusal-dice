/**
 * Dice sounds, synthesized with the Web Audio API (no audio files): a
 * rattle of short filtered-noise clicks for each die, then a settle.
 * Only plays after a user gesture has unlocked audio, and only when the
 * player has turned sound on.
 */

let ctx = null

function audio() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!ctx) ctx = new Ctx()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function click(ac, at, volume, pitch) {
  const length = Math.floor(ac.sampleRate * 0.03)
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++)
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4)

  const source = ac.createBufferSource()
  source.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = pitch
  filter.Q.value = 2.5
  const gain = ac.createGain()
  gain.gain.value = volume
  source.connect(filter).connect(gain).connect(ac.destination)
  source.start(at)
}

/** The rattle of `count` dice landing */
export function playRollSound(count = 5) {
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime + 0.01
  for (let d = 0; d < Math.max(1, count); d++) {
    const hits = 3 + Math.floor(Math.random() * 3)
    for (let h = 0; h < hits; h++) {
      const t = now + Math.random() * 0.35 + h * 0.06
      click(ac, t, 0.25 * (1 - h / (hits + 1)), 1800 + Math.random() * 1800)
    }
  }
}
