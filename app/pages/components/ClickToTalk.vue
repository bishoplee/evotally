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
      <button @click="toggle" class="px-4 py-2 rounded-md text-white"
              :class="isOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'">
        {{ isOpen ? 'Stop' : 'Talk' }}
      </button>

      <span class="text-sm text-gray-600">
        {{ status }}
      </span>
    </div>

    <div class="mt-3 text-xs text-gray-500">
      VAD: <strong>{{ vadState }}</strong> • Silence timeout: {{ silenceMs }}ms • Idle nudge: {{ idleNudgeSec }}s
    </div>

    <audio ref="remoteAudio" autoplay playsinline class="hidden"></audio>
  </div>
</template>

<script setup lang="ts">
/**
 * This component opens a WebRTC session to the voice-gateway:
 * - Gets JWT from our Pinia auth store (in-memory access token)
 * - Captures mic and sends the track to the gateway peer connection
 * - Plays remote TTS/audio via a hidden <audio> element
 * - Local VAD just drives the UI (server handles barge-in)
 */
import { ref, onBeforeUnmount } from 'vue'
import { useAuth } from '~/stores/auth'

/* ==== knobs you can tweak ==== */
const frameMs        = 50      // analysis frame
const startMs        = 200      // min voiced ms to mark "speaking" (UI only)
const endMs          = 600      // min silence ms to return to "listening" (UI only)
const silenceMs      = endMs    // exposed in UI
const idleNudgeSec   = 25       // if no speech for N seconds, UI nudge
const vadRmsStart    = 0.015    // RMS threshold to mark speaking
const vadRmsEnd      = 0.008    // RMS to mark end speaking (hysteresis)
/* ============================ */

const runtime = useRuntimeConfig()
const gatewayURL = (runtime.public?.gatewayUrl as string) || (import.meta as any).env.VITE_GATEWAY_URL || 'http://127.0.0.1:5000'

const auth = useAuth()

const isOpen   = ref(false)
const status   = ref('Click “Talk” to start the mic.')
const vadState = ref<'idle' | 'listening' | 'speaking'>('idle')

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
const remoteAudio = ref<HTMLAudioElement | null>(null)
const playbackActive = ref(false)

/* Helpers */
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => {
    if (!isOpen.value) return
    // Local, gentle UI nudge; keep server path clean and keyless
    try {
      // quick beep using WebAudio (allowed after user interacted)
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

/* Local VAD loop (UI only; server handles true barge-in) */
async function startAnalysis() {
  if (!audioCtx || !analyser) return

  if (!rmsBuf || rmsBuf.length !== analyser.fftSize) {
    rmsBuf = new Float32Array(analyser.fftSize)
  }
  vadState.value = 'listening'
  speakingSince = 0
  silenceSince = 0

  if (analysisTimer) clearInterval(analysisTimer)
  analysisTimer = window.setInterval(() => {
    if (!analyser || !rmsBuf) return
    analyser.getFloatTimeDomainData(rmsBuf)
    const rms = computeRms(rmsBuf)
    const t = Date.now()

    if (vadState.value !== 'speaking') {
      if (rms >= vadRmsStart) {
        if (!speakingSince) speakingSince = t
        if (t - speakingSince >= startMs) {
          vadState.value = 'speaking'
          status.value = '…capturing (server is listening)'
          silenceSince = 0
          resetIdleTimer()
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

/* Open WebRTC session to the gateway */
async function openSession() {
  if (isOpen.value) return
  try {
    status.value = 'Requesting microphone…'
    await auth.ensure()

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false
    })

    // Prepare audio graph for UI VAD + remote playback
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    sourceNode = audioCtx.createMediaStreamSource(mediaStream)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    sourceNode.connect(analyser)

    // WebRTC peer
    pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    // Send mic → gateway
    mediaStream.getTracks().forEach(t => pc!.addTrack(t, mediaStream!))

    // Receive TTS/audio ← gateway
    const remoteStream = new MediaStream()
    pc.ontrack = (ev) => {
      remoteStream.addTrack(ev.track)
      if (remoteAudio.value) remoteAudio.value.srcObject = remoteStream
      // Playback activity indicator
      ev.track.onunmute = () => { playbackActive.value = true }
      ev.track.onmute = () => { playbackActive.value = false }
      ev.track.onended = () => { playbackActive.value = false }
    }

    // --- START: Added robustness for ICE and Connection State ---
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
        // If ice state didn't catch it, the overall connection state should.
        if (s !== 'failed') status.value = `Connection closed: ${s}`
        closeSession()
      }
    }
    // --- END: Added robustness for ICE and Connection State ---

    // SDP offer → gateway
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const headers: Record<string,string> = { 'Content-Type': 'application/json' }
    if (auth.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`

    const r = await fetch(`${gatewayURL}/webrtc-offer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sdp: offer.sdp })
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
    await closeSession()
  }
}

/* Close everything */
async function closeSession() {
  stopAnalysis()

  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }

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
      pc.getReceivers()?.forEach(r => { try { r.track?.stop() } catch {} })
      pc.close()
    } catch {}
    pc = null
  }

  if (remoteAudio.value) {
    const ms = remoteAudio.value.srcObject as MediaStream | null
    ms?.getTracks().forEach(t => t.stop())
    remoteAudio.value.srcObject = null
  }

  isOpen.value = false
  vadState.value = 'idle'
  status.value = 'Stopped.'
}

async function toggle() {
  if (isOpen.value) await closeSession()
  else await openSession()
}

onBeforeUnmount(closeSession)
</script>
