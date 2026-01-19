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
      <!-- SVG Blob Orb -->
      <div class="orb-container" @click="toggle" :class="{ 'is-open': isOpen, 'is-speaking': vadState === 'speaking', 'is-listening': vadState === 'listening' }">
        <!-- Circular background -->
        <div class="orb-background"></div>
        
        <div class="blobs" :style="{ '--audio-level': level }">
          <svg viewBox="0 0 1200 1200">
            <g class="blob blob-1">
              <path />
            </g>
            <g class="blob blob-2">
              <path />
            </g>
            <g class="blob blob-3">
              <path />
            </g>
            <g class="blob blob-4">
              <path />
            </g>
            <g class="blob blob-1 alt">
              <path />
            </g>
            <g class="blob blob-2 alt">
              <path />
            </g>
            <g class="blob blob-3 alt">
              <path />
            </g>
            <g class="blob blob-4 alt">
              <path />
            </g>
          </svg>
        </div>

        <!-- Center mic icon -->
        <div class="orb-center-content">
          <svg viewBox="0 0 24 24" class="mic-icon" :class="{ 'is-active': isOpen }">
            <path
              d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2ZM11 19v3h2v-3h-2Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <!-- Label below -->
        <span class="orb-label">
          {{ isOpen ? (vadState === 'speaking' ? 'Listening to you…' : 'Listening…') : 'Talk' }}
        </span>
      </div>

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
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { useAuth } from '~/stores/auth'

/* ==== knobs you can tweak ==== */
const frameMs        = 50
const startMs        = 200
const endMs          = 300
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
const companion = ref<'spouse_partner' | 'friend' | 'coach' | 'planner' | 'study_buddy'>('spouse_partner')
const level = ref(0)

// Blob orb is now purely CSS/SVG based, no canvas needed

// Rest of your original code below...
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
    level.value = Math.min(rms * 5, 1)

    const now = Date.now()
    if (rms > vadRmsStart) {
      silenceSince = 0
      if (speakingSince === 0) speakingSince = now
      if (now - speakingSince >= startMs && vadState.value !== 'speaking') {
        vadState.value = 'speaking'
        if (lastVadState !== 'speaking') {
          sendVadState('speaking')
          lastVadState = 'speaking'
        }
        if (remoteAudio.value) remoteAudio.value.muted = true
      }
    } else if (rms < vadRmsEnd) {
      speakingSince = 0
      if (silenceSince === 0) silenceSince = now
      if (now - silenceSince >= endMs && vadState.value !== 'listening') {
        vadState.value = 'listening'
        if (lastVadState !== 'listening') {
          sendVadState('finished_talking')
          lastVadState = 'listening'
        }
        if (remoteAudio.value) remoteAudio.value.muted = false
      }
    } else {
      speakingSince = 0
      silenceSince = 0
    }
  }, frameMs)
}

function stopAnalysis() {
  if (analysisTimer) {
    clearInterval(analysisTimer)
    analysisTimer = null
  }
  vadState.value = 'idle'
  level.value = 0
}

async function openSession() {
  try {
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

    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const localTime = new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: userTimeZone })

    let coords = {}
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
      }) as any
      coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }
    } catch (e: any) {
      console.warn("Geolocation permission denied or timed out:", e.message)
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (auth.accessToken) headers.authorization = `Bearer ${auth.accessToken}`

    const r = await fetch(`${gatewayURL}/webrtc-offer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sdp: offer.sdp,
        companion: companion.value,
        clientTimeZone: userTimeZone,
        clientLocalTime: localTime,
        clientGeolocation: coords,
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

function handleServerMessage(message: any) {
  if (message?.type === 'tts_status' && remoteAudio.value) {
    remoteAudio.value.muted = message.playing && vadState.value === 'speaking'
  }
}

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
.orb-container {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  border-radius: 50%;
  
  /* Color variables - idle state */
  --blob-1: #94a3b8;
  --blob-2: #64748b;
  --blob-3: #cbd5e1;
  --blob-4: #f1f5f9;
}

.orb-background {
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  z-index: 1;
  transition: all 400ms ease;
  box-shadow: 
    inset 0 2px 8px rgba(255, 255, 255, 0.5),
    inset 0 -2px 8px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

.orb-container.is-listening .orb-background {
  background: linear-gradient(135deg, #016d77 0%, #1b8790 50%, #3aa1aa 100%);
  box-shadow: 
    inset 0 2px 12px rgba(255, 255, 255, 0.3),
    inset 0 -2px 12px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(1, 109, 119, 0.3);
}

.orb-container.is-speaking .orb-background {
  background: linear-gradient(135deg, #fb8d68 0%, #ff845a 50%, #ffb088 100%);
  box-shadow: 
    inset 0 2px 12px rgba(255, 255, 255, 0.4),
    inset 0 -2px 12px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(251, 141, 104, 0.4);
}

/* Listening state - cool teal colors */
.orb-container.is-listening {
  --blob-1: #016d77;
  --blob-2: #1b8790;
  --blob-3: #3aa1aa;
  --blob-4: #0a4a52;
}

/* Speaking state - warm coral/orange colors */
.orb-container.is-speaking {
  --blob-1: #fb8d68;
  --blob-2: #ff845a;
  --blob-3: #ffb088;
  --blob-4: #e56a3d;
}

.blobs {
  width: 200px;
  height: 200px;
  max-height: 100%;
  max-width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.blobs svg {
  position: relative;
  height: 100%;
  z-index: 2;
}

.blobs .blob {
  animation: rotate 25s infinite alternate ease-in-out;
  transform-origin: 50% 50%;
  opacity: 0.7;
}

.blobs .blob path {
  animation: blob-anim-1 5s infinite alternate cubic-bezier(0.45, 0.2, 0.55, 0.8);
  transform-origin: 50% 50%;
  transform: scale(calc(0.8 + var(--audio-level, 0) * 0.2));
  transition: fill 800ms ease, transform 100ms ease;
}

.blobs .blob.alt {
  animation-direction: alternate-reverse;
  opacity: 0.3;
}

.blobs .blob-1 path {
  fill: var(--blob-1);
  filter: blur(1rem);
}

.blobs .blob-2 {
  animation-duration: 18s;
  animation-direction: alternate-reverse;
}

.blobs .blob-2 path {
  fill: var(--blob-2);
  animation-name: blob-anim-2;
  animation-duration: 7s;
  filter: blur(0.75rem);
  transform: scale(calc(0.78 + var(--audio-level, 0) * 0.2));
}

.blobs .blob-2.alt {
  animation-direction: alternate;
}

.blobs .blob-3 {
  animation-duration: 23s;
}

.blobs .blob-3 path {
  fill: var(--blob-3);
  animation-name: blob-anim-3;
  animation-duration: 6s;
  filter: blur(0.5rem);
  transform: scale(calc(0.76 + var(--audio-level, 0) * 0.15));
}

.blobs .blob-4 {
  animation-duration: 31s;
  animation-direction: alternate-reverse;
  opacity: 0.9;
}

.blobs .blob-4 path {
  fill: var(--blob-4);
  animation-name: blob-anim-4;
  animation-duration: 10s;
  filter: blur(10rem);
  transform: scale(calc(0.5 + var(--audio-level, 0) * 0.3));
}

.blobs .blob-4.alt {
  animation-direction: alternate;
  opacity: 0.8;
}

/* Audio reactive intensity */
.orb-container.is-open .blobs .blob {
  opacity: calc(0.7 + var(--audio-level, 0) * 0.3);
}

@keyframes blob-anim-1 {
  0% {
    d: path("M 100 600 q 0 -500, 500 -500 t 500 500 t -500 500 T 100 600 z");
  }
  30% {
    d: path("M 100 600 q -50 -400, 500 -500 t 450 550 t -500 500 T 100 600 z");
  }
  70% {
    d: path("M 100 600 q 0 -400, 500 -500 t 400 500 t -500 500 T 100 600 z");
  }
  100% {
    d: path("M 150 600 q 0 -600, 500 -500 t 500 550 t -500 500 T 150 600 z");
  }
}

@keyframes blob-anim-2 {
  0% {
    d: path("M 100 600 q 0 -400, 500 -500 t 400 500 t -500 500 T 100 600 z");
  }
  40% {
    d: path("M 150 600 q 0 -600, 500 -500 t 500 550 t -500 500 T 150 600 z");
  }
  80% {
    d: path("M 100 600 q -50 -400, 500 -500 t 450 550 t -500 500 T 100 600 z");
  }
  100% {
    d: path("M 100 600 q 100 -600, 500 -500 t 400 500 t -500 500 T 100 600 z");
  }
}

@keyframes blob-anim-3 {
  0% {
    d: path("M 100 600 q -50 -400, 500 -500 t 450 550 t -500 500 T 100 600 z");
  }
  35% {
    d: path("M 150 600 q 0 -600, 500 -500 t 500 550 t -500 500 T 150 600 z");
  }
  75% {
    d: path("M 100 600 q 100 -600, 500 -500 t 400 500 t -500 500 T 100 600 z");
  }
  100% {
    d: path("M 100 600 q 0 -400, 500 -500 t 400 500 t -500 500 T 100 600 z");
  }
}

@keyframes blob-anim-4 {
  0% {
    d: path("M 150 600 q 0 -600, 500 -500 t 500 550 t -500 500 T 150 600 z");
  }
  30% {
    d: path("M 100 600 q 100 -600, 500 -500 t 400 500 t -500 500 T 100 600 z");
  }
  70% {
    d: path("M 100 600 q -50 -400, 500 -500 t 450 550 t -500 500 T 100 600 z");
  }
  100% {
    d: path("M 150 600 q 0 -600, 500 -500 t 500 550 t -500 500 T 150 600 z");
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.orb-center-content {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.mic-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: transform 200ms ease;
}

.mic-icon.is-active {
  animation: iconPulse 2s ease-in-out infinite;
}

.orb-label {
  position: absolute;
  bottom: -2rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #4b5563;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 500;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Hover effect */
.orb-container:hover .mic-icon {
  transform: scale(1.05);
}

.orb-container:active .mic-icon {
  transform: scale(0.95);
}
</style>
