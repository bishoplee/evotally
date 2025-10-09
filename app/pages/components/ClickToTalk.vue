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
const gatewayURL = (runtime.public?.gatewayUrl as string) || (import.meta as any).env.VITE_GATEWAY_URL || 'http://127.0.0.1:5000'

const auth = useAuth()

const isOpen   = ref(false)
const status   = ref('Click "Talk" to start the mic.')
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

  dataChannel = pc.createDataChannel('vad-control', {
    ordered: true,
    maxRetransmits: 3
  })

  dataChannel.onopen = () => {
    console.log('[Client] Data channel opened - bidirectional communication ready')
    sendVadState('listening')
  }

  dataChannel.onclose = () => {
    console.log('[Client] Data channel closed')
  }

  dataChannel.onerror = (error) => {
    console.error('[Client] Data channel error:', error)
    status.value = 'Data channel error, please try again'
  }

  // In your frontend code, update the dataChannel.onmessage handler:
  dataChannel.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Received from server:', message);

      switch (message.type) {
        case 'vad_ack':
          console.log(`[Client] Server acknowledged VAD state: ${message.state}`);
          // You can use this acknowledgment for timing or debugging
          break;

        case 'server_waiting':
          console.log('[Client] Server is waiting for response');
          // The server is ready for you to speak
          break;

        case 'tts_status':
          console.log('[Client] TTS status update:', message);
          break;

        case 'error':
          console.error('[Client] Server error:', message.error);
          break;

        default:
          console.log('[Client] Unknown message type:', message.type);
      }
    } catch (e) {
      console.error('Failed to parse server message:', e);
    }
  };
}

function sendVadState(state: 'listening' | 'speaking' | 'finished_talking') {
  if (dataChannel && dataChannel.readyState === 'open') {
    const message = {
      type: 'vad_state',
      state: state,
      timestamp: Date.now()
    }
    try {
      dataChannel.send(JSON.stringify(message))
      console.log('[Client] Sent VAD state:', state)
    } catch (e) {
      console.error('[Client] Failed to send VAD state:', e)
    }
  } else {
    console.warn('[Client] Data channel not open, cannot send VAD state:', state)
  }
}

function handleServerMessage(message: any) {
  console.log('[Client] Received from server:', message)

  switch (message.type) {
    case 'tts_status':
      if (message.playing !== undefined) {
        playbackActive.value = message.playing
        if (remoteAudio.value) {
          remoteAudio.value.muted = message.playing && vadState.value === 'speaking'
          console.log(`[Client] Playback active: ${message.playing}, audio muted: ${remoteAudio.value.muted}`)
          if (message.playing) {
            remoteAudio.value.play().catch(e => console.error('[Client] Audio playback failed:', e))
          }
        }
      }
      break
    case 'server_waiting':
      if (message.hasMoreChunks) {
        status.value = 'Server is waiting for your response'
        if (remoteAudio.value) {
          remoteAudio.value.muted = vadState.value === 'speaking'
          console.log(`[Client] Server waiting, audio muted: ${remoteAudio.value.muted}`)
        }
      }
      break
    case 'error':
      console.error('[Client] Server error:', message.error)
      status.value = `Server error: ${message.error}`
      break
    default:
      console.log('[Client] Unknown message type:', message.type)
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
              console.log('[Client] Muted audio during speaking')
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
            remoteAudio.value.play().catch(e => console.error('[Client] Audio playback failed after unmute:', e))
            console.log('[Client] Unmuted audio after finished talking')
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

    pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    setupDataChannel()
    mediaStream.getTracks().forEach(t => {
      pc!.addTrack(t, mediaStream!)
      console.log(`[Client] Added track: ${t.id}`)
    })

    const remoteStream = new MediaStream()
    pc.ontrack = (ev) => {
      if (ev.track.kind === 'audio' && !activeTrackIds.has(ev.track.id)) {
        console.log(`[Client] Adding audio track: ${ev.track.id}`)
        activeTrackIds.add(ev.track.id)
        // Clear existing tracks from remoteStream
        remoteStream.getTracks().forEach(t => {
          if (t.id !== ev.track.id) {
            t.stop()
            activeTrackIds.delete(t.id)
            console.log(`[Client] Removed stale track: ${t.id}`)
          }
        })
        remoteStream.addTrack(ev.track)
        if (remoteAudio.value) {
          remoteAudio.value.srcObject = remoteStream
          remoteAudio.value.muted = vadState.value === 'speaking'
          remoteAudio.value.play().catch(e => console.error('[Client] Audio playback failed:', e))
          console.log(`[Client] Set remoteStream with track: ${ev.track.id}, muted: ${remoteAudio.value.muted}`)
        }
        ev.track.onunmute = () => {
          playbackActive.value = true
          console.log(`[Client] Track unmuted: ${ev.track.id}`)
        }
        ev.track.onmute = () => {
          playbackActive.value = false
          console.log(`[Client] Track muted: ${ev.track.id}`)
        }
        ev.track.onended = () => {
          playbackActive.value = false
          activeTrackIds.delete(ev.track.id)
          console.log(`[Client] Track ended: ${ev.track.id}`)
        }
      } else if (ev.track.kind === 'audio') {
        console.warn(`[Client] Duplicate audio track ignored: ${ev.track.id}`)
        ev.track.stop()
      }
    }

    pc.ondatachannel = (event) => {
      const incomingChannel = event.channel
      incomingChannel.onmessage = (msgEvent) => {
        try {
          const message = JSON.parse(msgEvent.data)
          handleServerMessage(message)
        } catch (e) {
          console.error('[Client] Failed to parse incoming channel message:', e)
        }
      }
    }

    pc.oniceconnectionstatechange = () => {
      const s = pc?.iceConnectionState
      if (s === 'failed' || s === 'closed') {
        status.value = `ICE connection failed: ${s}`
        console.log(`[Client] ICE connection state: ${s}`)
        closeSession()
      }
    }

    pc.onconnectionstatechange = () => {
      const s = pc?.connectionState
      if (s === 'failed' || s === 'disconnected' || s === 'closed') {
        if (s !== 'failed') status.value = `Connection closed: ${s}`
        console.log(`[Client] Connection state: ${s}`)
        closeSession()
      }
    }

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
    console.error('[Client] Failed to open session:', e)
    await closeSession()
  }
}

/* Close everything */
async function closeSession() {
  stopAnalysis()

  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }

  if (dataChannel) {
    try {
      dataChannel.close()
      console.log('[Client] Data channel closed')
    } catch {}
    dataChannel = null
  }

  try { mediaStream?.getTracks().forEach(t => {
    t.stop()
    console.log(`[Client] Stopped media track: ${t.id}`)
  }) } catch {}
  mediaStream = null

  try { sourceNode?.disconnect() } catch {}
  try { analyser?.disconnect() } catch {}
  sourceNode = null; analyser = null

  try { await audioCtx?.close() } catch {}
  audioCtx = null

  if (pc) {
    try {
      pc.getSenders()?.forEach(s => { try {
        s.track?.stop()
        console.log(`[Client] Stopped sender track: ${s.track?.id}`)
      } catch {} })
      pc.getReceivers()?.forEach(r => { try {
        r.track?.stop()
        activeTrackIds.delete(r.track.id)
        console.log(`[Client] Stopped receiver track: ${r.track.id}`)
      } catch {} })
      pc.close()
      console.log('[Client] RTCPeerConnection closed')
    } catch {}
    pc = null
  }

  if (remoteAudio.value) {
    const ms = remoteAudio.value.srcObject as MediaStream | null
    ms?.getTracks().forEach(t => {
      t.stop()
      activeTrackIds.delete(t.id)
      console.log(`[Client] Removed audio track: ${t.id}`)
    })
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