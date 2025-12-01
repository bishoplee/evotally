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
      <!-- Enhanced Audio-Reactive Orb -->
      <div class="orb-container" @click="toggle">
        <canvas ref="orbCanvas" class="orb-canvas" width="200" height="200"></canvas>

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

// Canvas refs
const orbCanvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationFrameId: number | null = null

// Orb animation state
interface Particle {
  angle: number
  distance: number
  size: number
  speed: number
  opacity: number
  hue: number
}

const particles: Particle[] = []
const numParticles = 20 // More particles for liveliness
let orbRotation = 0
let orbPulse = 0
let breathePhase = 0

// Initialize particles
function initParticles() {
  particles.length = 0
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      angle: (Math.PI * 2 * i) / numParticles,
      distance: 30 + Math.random() * 15,
      size: 2 + Math.random() * 3,
      speed: 0.008 + Math.random() * 0.015,
      opacity: 0.4 + Math.random() * 0.5,
      hue: Math.random() * 360
    })
  }
}

// Draw the orb
function drawOrb() {
  if (!ctx || !orbCanvas.value) return

  const canvas = orbCanvas.value
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const baseRadius = 50

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Update animation state with more dynamic movement
  const time = Date.now() * 0.001
  orbRotation += 0.01
  breathePhase += 0.02
  orbPulse = Math.sin(breathePhase) * 0.12

  // Calculate audio-reactive radius with breathing effect
  const breathe = Math.sin(time * 1.2) * 0.05
  const audioReactiveRadius = baseRadius * (1 + level.value * 0.4 + orbPulse + breathe)

  // Determine colors based on state with smooth transitions
  let primaryColor, secondaryColor, tertiaryColor, glowColor

  if (vadState.value === 'speaking') {
    // Warm, energetic colors (secondary palette - coral/orange)
    primaryColor = '#fb8d68'
    secondaryColor = '#ff845a'
    tertiaryColor = '#e56a3d'
    glowColor = 'rgba(251, 141, 104, 0.5)'
  } else if (vadState.value === 'listening') {
    // Cool, calm colors (primary palette - teal/cyan)
    primaryColor = '#016d77'
    secondaryColor = '#1b8790'
    tertiaryColor = '#3aa1aa'
    glowColor = 'rgba(1, 109, 119, 0.5)'
  } else {
    // Subtle breathing animation even when idle
    const idlePulse = Math.sin(time * 0.5) * 0.5 + 0.5
    primaryColor = `hsl(200, ${20 + idlePulse * 10}%, ${50 + idlePulse * 5}%)`
    secondaryColor = `hsl(200, ${15 + idlePulse * 8}%, ${60 + idlePulse * 5}%)`
    tertiaryColor = `hsl(200, ${10 + idlePulse * 5}%, ${70 + idlePulse * 5}%)`
    glowColor = `rgba(107, 114, 128, ${0.2 + idlePulse * 0.1})`
  }

  // Draw multi-layer outer glow for depth
  const glowRadius1 = audioReactiveRadius * (isOpen.value ? 1.8 : 1.3)
  const glowRadius2 = audioReactiveRadius * (isOpen.value ? 1.4 : 1.1)

  const glowGradient = ctx.createRadialGradient(centerX, centerY, audioReactiveRadius * 0.5, centerX, centerY, glowRadius1)
  glowGradient.addColorStop(0, glowColor)
  glowGradient.addColorStop(0.5, glowColor.replace(/[\d.]+\)/, '0.2)'))
  glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glowGradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw main orb with enhanced gradient
  const lightAngle = time * 0.3
  const lightX = centerX + Math.cos(lightAngle) * audioReactiveRadius * 0.4
  const lightY = centerY + Math.sin(lightAngle) * audioReactiveRadius * 0.4

  const mainGradient = ctx.createRadialGradient(
    lightX,
    lightY,
    0,
    centerX,
    centerY,
    audioReactiveRadius
  )
  mainGradient.addColorStop(0, primaryColor)
  mainGradient.addColorStop(0.5, secondaryColor)
  mainGradient.addColorStop(1, tertiaryColor)

  ctx.beginPath()
  ctx.arc(centerX, centerY, audioReactiveRadius, 0, Math.PI * 2)
  ctx.fillStyle = mainGradient
  ctx.fill()

  // Add subtle edge highlight
  ctx.beginPath()
  ctx.arc(centerX, centerY, audioReactiveRadius, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255, 255, 255, ${isOpen.value ? 0.3 : 0.15})`
  ctx.lineWidth = isOpen.value ? 2 : 1
  ctx.stroke()

  // Draw floating particles - always visible for liveliness
  particles.forEach((particle, i) => {
    // Update particle with organic movement
    particle.angle += particle.speed * (1 + level.value * 3)

    // Audio-reactive distance with wave effect
    const waveOffset = Math.sin(time * 2 + i * 0.5) * 5
    const reactiveDistance = (particle.distance + waveOffset) * (1 + level.value * 0.8)

    const x = centerX + Math.cos(particle.angle + orbRotation * 1.5) * reactiveDistance
    const y = centerY + Math.sin(particle.angle + orbRotation * 1.5) * reactiveDistance

    // Draw particle trail for movement
    if (isOpen.value && level.value > 0.1) {
      const trailLength = 3
      for (let t = 0; t < trailLength; t++) {
        const trailAngle = particle.angle + orbRotation * 1.5 - (t * 0.02)
        const trailDist = reactiveDistance * (1 - t * 0.05)
        const tx = centerX + Math.cos(trailAngle) * trailDist
        const ty = centerY + Math.sin(trailAngle) * trailDist
        const trailOpacity = particle.opacity * (1 - t / trailLength) * 0.3

        ctx.beginPath()
        ctx.arc(tx, ty, particle.size * (1 - t * 0.2), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${trailOpacity})`
        ctx.fill()
      }
    }

    // Draw main particle with enhanced visibility
    const particleGlow = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 2)
    const baseOpacity = isOpen.value ? particle.opacity * (0.6 + level.value * 0.4) : particle.opacity * 0.3
    particleGlow.addColorStop(0, `rgba(255, 255, 255, ${baseOpacity})`)
    particleGlow.addColorStop(1, `rgba(255, 255, 255, 0)`)

    ctx.beginPath()
    ctx.arc(x, y, particle.size * 2, 0, Math.PI * 2)
    ctx.fillStyle = particleGlow
    ctx.fill()
  })

  // Draw inner shimmer
  if (isOpen.value && level.value > 0.1) {
    const shimmerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      audioReactiveRadius * 0.6
    )
    shimmerGradient.addColorStop(0, `rgba(255, 255, 255, ${level.value * 0.4})`)
    shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.beginPath()
    ctx.arc(centerX, centerY, audioReactiveRadius * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = shimmerGradient
    ctx.fill()
  }

  // Draw animated energy rings when speaking
  if (vadState.value === 'speaking') {
    for (let i = 0; i < 4; i++) {
      const offset = (time * 1.5 + i * 0.4) % 2
      const ringRadius = audioReactiveRadius + offset * 25
      const opacity = (1 - offset / 2) * 0.4 * (1 + level.value * 0.5)

      // Draw pulsing ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }

  // Draw orbiting energy dots when listening
  if (vadState.value === 'listening' && isOpen.value) {
    for (let i = 0; i < 3; i++) {
      const dotAngle = time * 2 + (i * Math.PI * 2 / 3)
      const dotDistance = audioReactiveRadius * 1.2
      const dotX = centerX + Math.cos(dotAngle) * dotDistance
      const dotY = centerY + Math.sin(dotAngle) * dotDistance

      const dotGradient = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 4)
      dotGradient.addColorStop(0, 'rgba(27, 135, 144, 0.8)')
      dotGradient.addColorStop(1, 'rgba(27, 135, 144, 0)')

      ctx.beginPath()
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2)
      ctx.fillStyle = dotGradient
      ctx.fill()
    }
  }

  // Continue animation
  animationFrameId = requestAnimationFrame(drawOrb)
}

// Start orb animation
function startOrbAnimation() {
  if (!orbCanvas.value) return
  ctx = orbCanvas.value.getContext('2d')
  if (!ctx) return

  initParticles()
  drawOrb()
}

// Stop orb animation
function stopOrbAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// Watch for canvas mount
onMounted(() => {
  startOrbAnimation()
})

onBeforeUnmount(() => {
  stopOrbAnimation()
})

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
}

.orb-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
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