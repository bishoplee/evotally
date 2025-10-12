<template>
  <div class="p-4 bg-white rounded-xl shadow border border-gray-100">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold">Click to Talk</h2>
      <span class="inline-flex items-center gap-2 text-sm" :class="isOpen ? 'text-green-700' : 'text-gray-600'">
        <span class="w-2 h-2 rounded-full" :class="isOpen ? 'bg-green-500' : 'bg-gray-400'"></span>
        {{ isOpen ? 'Listening… (click to stop)' : 'Idle (click to start)' }}
      </span>
    </div>

    <div class="flex items-center gap-3">
      <!-- Pulsating circular Talk button -->
<button
  @click="toggle"
  class="mic-btn"
  :class="{
    'is-open': isOpen,
    'is-speaking': vadState === 'speaking',
    'is-listening': isOpen && vadState === 'listening'
  }"
  :aria-pressed="isOpen"
  :title="isOpen ? 'Stop' : 'Talk'"
  :style="{
    transform: `scale(${(1 + level * 0.15).toFixed(3)})`,
    boxShadow: isOpen
      ? `0 0 ${Math.round(8 + level * 16)}px rgba(1,109,119,0.55), 0 0 ${Math.round(16 + level * 20)}px rgba(251,141,104,0.25)`
      : 'none'
  }"
>
  <!-- ripple rings -->
  <span class="ring ring-1" aria-hidden="true"></span>
  <span class="ring ring-2" aria-hidden="true"></span>

  <!-- mic glyph -->
  <svg viewBox="0 0 24 24" class="mic-icon" aria-hidden="true">
    <path
      d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2ZM11 19v3h2v-3h-2Z"
      fill="currentColor"
    />
  </svg>

  <span class="mic-label">{{ isOpen ? (vadState === 'speaking' ? 'Listening to you…' : 'Listening…') : 'Talk' }}</span>
</button>


      <span class="text-sm text-gray-600">
        {{ status }}
      </span>
    </div>


    <!-- Companion selector (disabled while connected) -->
    <div class="mt-3 flex items-center gap-2">
      <label class="text-xs text-gray-600">Companion:</label>
      <select v-model="companion" :disabled="isOpen"
              class="text-sm border rounded-md px-2 py-1">
        <option value="spouse_partner">Spouse / Partner</option>
        <option value="friend">Friend</option>
        <option value="coach">Coach</option>
        <option value="planner">Planner</option>
        <option value="study_buddy">Study Buddy</option>
      </select>
      <span class="text-xs text-gray-500">Choose before starting.</span>
    </div>

    <div class="mt-3 text-xs text-gray-500">
      VAD: <strong>{{ vadState }}</strong> • Silence timeout: {{ silenceMs }}ms • Idle nudge: {{ idleNudgeSec }}s
    </div>

    <audio ref="remoteAudio" autoplay playsinline class="hidden"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useAuth } from '~/stores/auth'

/* ==== knobs you can tweak ==== */
const frameMs        = 50
const startMs        = 200
const endMs          = 300     // Reduced from 400ms for faster VAD response
const silenceMs      = endMs
const idleNudgeSec   = 25
const vadRmsStart    = 0.015
const vadRmsEnd      = 0.008
/* ============================ */

const runtime = useRuntimeConfig()
const gatewayURL =
  (runtime.public?.gatewayUrl as string) ||
  (import.meta as any).env.VITE_GATEWAY_URL ||
  'http://127.0.0.1:5000'

const auth = useAuth()

const isOpen   = ref(false)
const status   = ref('Click "Talk" to start the mic.')
const vadState = ref<'idle' | 'listening' | 'speaking'>('idle')

/** user-chosen companion/persona for this session */
const companion = ref<'spouse_partner' | 'friend' | 'coach' | 'planner' | 'study_buddy'>('spouse_partner')
const level = ref(0)

let mediaStream: MediaStream | null = null
let audioCtx: AudioContext | null = null
let sourceNode: MediaStreamAudioSourceNode | null = null
let analyser: AnalyserNode | null = null
let rmsBuf: Float32Array | null = null
let analysisTimer: number | null = null
let speakingSince = 0
let silenceSince = 0
let idleTimer: number | null = null

let pc: RTCPeerConnection | null = null
let dataChannel: RTCDataChannel | null = null
const remoteAudio = ref<HTMLAudioElement | null>(null)
const playbackActive = ref(false)
const activeTrackIds = new Set<string>()

/* Ensure AudioContext is resumed */
async function ensureAudioContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume()
      console.log('[Client] AudioContext resumed')
    } catch (e) {
      console.error('[Client] Failed to resume AudioContext:', e)
      status.value = 'AudioContext error, please interact with the page'
    }
  }
}

/* Data Channel Management */
function setupDataChannel() {
  if (!pc) return

  dataChannel = pc.createDataChannel('vad-control', { ordered: true, maxRetransmits: 3 })

  dataChannel.onopen = () => {
    console.log('[Client] Data channel opened - bidirectional communication ready')
    sendVadState('listening')
  }
  dataChannel.onclose = () => { console.log('[Client] Data channel closed') }
  dataChannel.onerror = (error) => {
    console.error('[Client] Data channel error:', error)
    status.value = 'Data channel error, please try again'
  }

  dataChannel.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)
      switch (message.type) {
        case 'vad_ack':
          // ack for timing/debug
          break
        case 'server_waiting':
          status.value = 'Server is waiting for your response'
          break
        case 'tts_status':
          if (message.playing !== undefined) {
            playbackActive.value = message.playing
            if (remoteAudio.value) {
              remoteAudio.value.muted = message.playing && vadState.value === 'speaking'
              if (message.playing) {
                remoteAudio.value.play().catch(e => console.error('[Client] Audio playback failed:', e))
              }
            }
          }
          break
        case 'error':
          status.value = `Server error: ${message.error}`
          break
        default:
          // ignore
          break
      }
    } catch (e) {
      console.error('Failed to parse server message:', e)
    }
  }
}

function sendVadState(state: 'listening' | 'speaking' | 'finished_talking') {
  if (dataChannel && dataChannel.readyState === 'open') {
    try {
      dataChannel.send(JSON.stringify({ type: 'vad_state', state, timestamp: Date.now() }))
    } catch (e) {
      console.error('[Client] Failed to send VAD state:', e)
    }
  }
}

/* Helpers */
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => {
    if (!isOpen.value) return
    try {
      if (!audioCtx) return
      const o = audioCtx.createOscillator()
      const g = audioCtx.createGain()
      o.type = 'sine'; o.frequency.value = 880
      g.gain.value = 0.03
      o.connect(g).connect(audioCtx.destination)
      o.start()
      setTimeout(() => { try { o.stop() } catch {} }, 180)
    } catch {}
    status.value = 'Say something—I\'m here.'
    resetIdleTimer()
  }, idleNudgeSec * 1000)
}

function computeRms(buf: Float32Array) {
  let s = 0
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
  return Math.sqrt(s / buf.length)
}

/* Local VAD loop */
async function startAnalysis() {
  if (!audioCtx || !analyser) return
  await ensureAudioContext()

  if (!rmsBuf || rmsBuf.length !== analyser.fftSize) {
    rmsBuf = new Float32Array(analyser.fftSize)
  }
  vadState.value = 'listening'
  speakingSince = 0
  silenceSince = 0
  let lastVadState: 'listening' | 'speaking' = 'listening'

  if (analysisTimer) clearInterval(analysisTimer)
  analysisTimer = window.setInterval(() => {
    if (!analyser || !rmsBuf) return
    analyser.getFloatTimeDomainData(rmsBuf)
    const rms = computeRms(rmsBuf)
    // normalize rms between the end/start thresholds so 0 = silence, 1 = clearly speaking
    const norm = (rms - vadRmsEnd) / Math.max(1e-6, (vadRmsStart - vadRmsEnd))
    level.value = Math.min(1, Math.max(0, norm))
    const t = Date.now()

    if (vadState.value !== 'speaking') {
      if (rms >= vadRmsStart) {
        if (!speakingSince) speakingSince = t
        if (t - speakingSince >= startMs) {
          vadState.value = 'speaking'
          status.value = '…capturing (server is listening)'
          silenceSince = 0
          resetIdleTimer()
          if (lastVadState !== 'speaking') {
            sendVadState('speaking')
            lastVadState = 'speaking'
            if (remoteAudio.value) {
              remoteAudio.value.muted = true
            }
          }
        }
      } else {
        speakingSince = 0
      }
    } else {
      if (rms <= vadRmsEnd) {
        if (!silenceSince) silenceSince = t
        if (t - silenceSince >= endMs) {
          vadState.value = 'listening'
          status.value = 'Listening…'
          speakingSince = 0
          sendVadState('finished_talking')
          lastVadState = 'listening'
          if (remoteAudio.value) {
            remoteAudio.value.muted = false
            remoteAudio.value.play().catch(() => {})
          }
        }
      } else {
        silenceSince = 0
        resetIdleTimer()
      }
    }
  }, frameMs)
}

function stopAnalysis() {
  if (analysisTimer) clearInterval(analysisTimer)
  analysisTimer = null
  rmsBuf = null
}

/* Open WebRTC session */
async function openSession() {
  if (isOpen.value) return
  try {
    status.value = 'Requesting microphone…'
    await auth.ensure()

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false
    })

    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    await ensureAudioContext()
    sourceNode = audioCtx.createMediaStreamSource(mediaStream)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    sourceNode.connect(analyser)

    pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })

    setupDataChannel()
    mediaStream.getTracks().forEach(t => pc!.addTrack(t, mediaStream!))

    const remoteStream = new MediaStream()
    pc.ontrack = (ev) => {
      if (ev.track.kind === 'audio' && !activeTrackIds.has(ev.track.id)) {
        activeTrackIds.add(ev.track.id)
        remoteStream.getTracks().forEach(t => { if (t.id !== ev.track.id) t.stop() })
        remoteStream.addTrack(ev.track)
        if (remoteAudio.value) {
          remoteAudio.value.srcObject = remoteStream
          remoteAudio.value.muted = vadState.value === 'speaking'
          remoteAudio.value.play().catch(() => {})
        }
        ev.track.onunmute = () => { playbackActive.value = true }
        ev.track.onmute = () => { playbackActive.value = false }
        ev.track.onended = () => { playbackActive.value = false; activeTrackIds.delete(ev.track.id) }
      } else if (ev.track.kind === 'audio') {
        ev.track.stop()
      }
    }

    pc.ondatachannel = (event) => {
      const incomingChannel = event.channel
      incomingChannel.onmessage = (msgEvent) => {
        try { handleServerMessage(JSON.parse(msgEvent.data)) }
        catch {}
      }
    }

    pc.oniceconnectionstatechange = () => {
      const s = pc?.iceConnectionState
      if (s === 'failed' || s === 'closed') {
        status.value = `ICE connection failed: ${s}`
        closeSession()
      }
    }

    pc.onconnectionstatechange = () => {
      const s = pc?.connectionState
      if (s === 'failed' || s === 'disconnected' || s === 'closed') {
        if (s !== 'failed') status.value = `Connection closed: ${s}`
        closeSession()
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (auth.accessToken) headers.authorization = `Bearer ${auth.accessToken}`

    // Call the gateway directly (CORS is enabled there)
    const r = await fetch(`${gatewayURL}/webrtc-offer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sdp: offer.sdp,
        // sessionId: undefined, // optional: pass an existing session id to reuse
        companion: companion.value // <-- user-chosen persona
      })
    })

    if (!r.ok) throw new Error(`Offer failed: ${r.status}`)
    const { sdp } = await r.json()
    await pc.setRemoteDescription({ type: 'answer', sdp })

    await startAnalysis()
    resetIdleTimer()

    isOpen.value = true
    status.value = 'Listening…'
  } catch (e: any) {
    status.value = e?.message || 'Failed to start'
    console.error('[Client] Failed to open session:', e)
    await closeSession()
  }
}

/* Handle server messages passed from ondatachannel */
function handleServerMessage(message: any) {
  if (message?.type === 'tts_status' && remoteAudio.value) {
    remoteAudio.value.muted = message.playing && vadState.value === 'speaking'
  }
}

/* Close everything */
async function closeSession() {
  stopAnalysis()

  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }

  if (dataChannel) {
    try { dataChannel.close() } catch {}
    dataChannel = null
  }

  try { mediaStream?.getTracks().forEach(t => t.stop()) } catch {}
  mediaStream = null

  try { sourceNode?.disconnect() } catch {}
  try { analyser?.disconnect() } catch {}
  sourceNode = null; analyser = null

  try { await audioCtx?.close() } catch {}
  audioCtx = null

  if (pc) {
    try {
      pc.getSenders()?.forEach(s => { try { s.track?.stop() } catch {} })
      pc.getReceivers()?.forEach(r => { try { r.track?.stop(); activeTrackIds.delete(r.track.id) } catch {} })
      pc.close()
    } catch {}
    pc = null
  }

  if (remoteAudio.value) {
    const ms = remoteAudio.value.srcObject as MediaStream | null
    ms?.getTracks().forEach(t => { try { t.stop() } catch {}; activeTrackIds.delete(t.id) })
    remoteAudio.value.srcObject = null
    remoteAudio.value.muted = false
  }

  isOpen.value = false
  vadState.value = 'idle'
  status.value = 'Stopped.'
  activeTrackIds.clear()
}

async function toggle() {
  if (isOpen.value) await closeSession()
  else await openSession()
}

onBeforeUnmount(closeSession)
</script>

<style scoped>
.mic-btn {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  outline: none;
  border: none;
  cursor: pointer;
  user-select: none;

  /* idle */
  background: #111827; /* gray-900 */
  color: white;
  transition: transform 120ms ease, box-shadow 120ms ease, background 200ms ease, color 200ms ease;
}

/* open base */
.mic-btn.is-open {
  background: var(--color-primary-600, #016d77);
}

/* gentle pulse when listening */
.mic-btn.is-listening {
  animation: micPulse 1200ms ease-in-out infinite;
}

/* stronger color when we detect speech (barge-in visual) */
.mic-btn.is-speaking {
  background: var(--color-secondary-600, #fb8d68);
  animation: micPulseFast 750ms ease-in-out infinite;
}

.mic-icon {
  width: 28px;
  height: 28px;
  z-index: 2;
}

.mic-label {
  position: absolute;
  bottom: -1.75rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #4b5563; /* gray-600 */
  white-space: nowrap;
  pointer-events: none;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 2px solid rgba(1, 109, 119, 0.18); /* primary tint */
  z-index: 1;
  opacity: 0;
  transform: scale(1);
  pointer-events: none;
}

.mic-btn.is-open .ring-1 { animation: ringExpand 1600ms ease-out infinite; }
.mic-btn.is-open .ring-2 { animation: ringExpand 1600ms ease-out 800ms infinite; }

/* while speaking, accent the rings to secondary */
.mic-btn.is-speaking .ring {
  border-color: rgba(251, 141, 104, 0.28); /* secondary tint */
}

/* keyframes */
@keyframes micPulse {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.08); }
}

@keyframes micPulseFast {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.12); }
}

@keyframes ringExpand {
  0%   { opacity: 0.0; transform: scale(1);   }
  10%  { opacity: 0.6; }
  100% { opacity: 0.0; transform: scale(1.45); }
}
</style>
