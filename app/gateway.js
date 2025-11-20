#!/usr/bin/env node
'use strict'

/**
 * Voice Gateway (Production-Ready)
 * - Tight 960B frames to RTCAudioSource (fixes byteLength errors)
 * - ffmpeg decode → PCM s16le mono @ 48k
 * - Phrase chunking + backpressure (no TTS drops)
 * - Light speech rewrite pass before TTS (toggle via SPEECH_REWRITE)
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const wrtc = require("@roamhq/wrtc");
const WebSocket = require("ws");
const { spawn } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");
const helmet = require("helmet");
const prometheus = require('prom-client');
const { GeolocationService } = require('./geolocation-service');
const {
  handleFactCollectionInConversation,
  detectFactSessionTrigger,
  detectFactSessionExit,
  FactSessionManager
} = require('./user-triggered-facts');
const { searchLocalPOI} = require('./search-local-poi')
const { updateUserLocation } = require('./tools/update-user-location')
const {MemoryManager, embed, shouldIndexTurn, } = require('./MemoryManager')
const { updateAssistantProfileTool, PROFILE_UPDATE_INSTRUCTIONS, handleUpdateAssistantProfile} = require('./update-assistant-profile')
const { updateUserFact } = require('./tools/update-user-fact')
const {generateUserSummary, shouldGenerateSummary} = require('./tools/user-summary');
const { resourceLimits } = require("node:worker_threads");
const { buildSystemPrompt, detectObviousFacts } = require('./tools/build-prompt');
const { runFactsExtractionAndSave } = require('./tools/factsExtractor_pipeline');
const { saveMemoryDebugTrace, updateMemoryDebugTrace } = require('./tools/debugMemoryTrace');
const { buildSessionTranscript } = require('./tools/build-session-transcript')

const CONTEXT_MAX = 1000;         // max users in cache
const CONTEXT_TTL_MS = 10 * 60 * 1000;
const contextCache = new Map();

// ---- NEW: Question tracking cache ----
// Stores asked questions per user per day to prevent repetition
const dailyQuestionCache = new Map();

// ---- Configuration ----
const {
  PORT = 5000,
  NODE_ENV = "development",
  WHISPER_URL = "ws://127.0.0.1:8001/v1/asr/stream",
  //LLM_URL = "http://127.0.0.1:8002/v1/chat/completions",
//  LLM_MODEL = "llama31-8b",
  LLM_URL,
  OPENAI_API_KEY,
  LLM_MODEL,
  EMBED_URL = "http://127.0.0.1:8010/v1/embeddings",
  QDRANT_URL = "http://127.0.0.1:6333",
  QDRANT_COLLECTION = "messages",
  MEMORY_TOPK = "5",
  EMBED_MODEL = "nomic-ai/nomic-embed-text-v1.5",
  EMBED_DIM = "768",
  ELEVEN_API_KEY,
  ELEVEN_VOICE_ID,
  ELEVEN_MODEL_ID = "eleven_multilingual_v2",
  FFMPEG_BIN = "/usr/bin/ffmpeg",
  ALLOWED_ORIGINS = "https://app.cimb.us,http://localhost:3000",
  MAX_CONCURRENT_PEERS = "50",
  MAX_TTS_QUEUE_SIZE = "8",                 // modest cap; backpressure prevents drops
  REQUEST_TIMEOUT_MS = "45000",
  TTS_OPTIMIZE_LATENCY = "4",
  SPEECH_REWRITE = "1",                    // "0" to disable rewriteForSpeech
  TAVILY_API_KEY,
  SERPAPI_KEY,
  SEARCH_PROVIDER = "tavily",
  SEARCH_MAX_RESULTS = "5",
} = process.env;

const CHUNK_MIN_CHARS  = parseInt(process.env.CHUNK_MIN_CHARS  || "40", 10);
const CHUNK_MAX_CHARS  = parseInt(process.env.CHUNK_MAX_CHARS  || "60", 10);
const CHUNK_HARD_CAP   = parseInt(process.env.CHUNK_HARD_CAP   || "60", 10); // strict ceiling
const CHUNK_MAX_WORDS  = parseInt(process.env.CHUNK_MAX_WORDS  || "12", 10); // keep it snappy
const CHUNK_PAD_PERIOD = process.env.CHUNK_PAD_PERIOD !== "0";
const SPEAK_RATE_MS_PER_CHAR=10;
const INTER_CHUNK_MIN_SLEEP=200
const SPEECH_REWRITE_MODE = process.env.SPEECH_REWRITE_MODE || "minimal";


// Near the top of your file, add:
const TTS_WARMUP_ENABLED = process.env.TTS_WARMUP_ENABLED !== "0";
const TTS_PREFETCH_ENABLED = process.env.TTS_PREFETCH_ENABLED !== "0";
const TTS_BATCH_PROCESSING = process.env.TTS_BATCH_PROCESSING === "1";

const TTS_TIMING_CONFIG = {
  // Natural pause between sentences (avoid overlap, but keep flow)
  INTER_SENTENCE_PAUSE_MS: parseInt(process.env.INTER_SENTENCE_PAUSE_MS || "150", 10),

  // Safety buffer to ensure previous chunk finishes
  TIMING_SAFETY_BUFFER_MS: parseInt(process.env.TIMING_SAFETY_BUFFER_MS || "50", 10),

  // Minimum wait between chunks (prevent rapid-fire)
  MIN_INTER_CHUNK_WAIT_MS: parseInt(process.env.MIN_INTER_CHUNK_WAIT_MS || "100", 10),
};

// ---- Memory Configuration ----
const MEMORY_CONFIG = {
  // Working memory (current conversation)
  WORKING_MEMORY_TURNS: parseInt(process.env.WORKING_MEMORY_TURNS || "8", 10),

  // Short-term memory (recent context window)
  SHORT_TERM_DAYS: parseInt(process.env.SHORT_TERM_DAYS || "7", 10),
  SHORT_TERM_MAX_TURNS: parseInt(process.env.SHORT_TERM_MAX_TURNS || "50", 10),

  // Long-term memory (semantic retrieval)
  LONG_TERM_TOPK: parseInt(process.env.LONG_TERM_TOPK || "5", 10),
  LONG_TERM_MIN_SCORE: parseFloat(process.env.LONG_TERM_MIN_SCORE || "0.7"),

  // Memory consolidation
  CONSOLIDATE_AFTER_TURNS: parseInt(process.env.CONSOLIDATE_AFTER_TURNS || "20", 10),

  // Core memory
  CORE_FACTS_LIMIT: parseInt(process.env.CORE_FACTS_LIMIT || "30", 10),
};


const TOOL_USE_SYSTEM = `
You have access to tools, but should only use them when necessary. Always prioritize the information you already have about the user.

Core Principles:
1. FIRST: Check what you know about the user from their profile, conversation history, and context
2. SECOND: Answer directly using available user information whenever possible
3. ONLY USE TOOLS when you genuinely need external, real-time, or location-specific information

When to USE tools:
- Real-time information (current weather, traffic, news happening RIGHT NOW)
- Specific business lookups (hours, menus, prices for specific establishments)
- Fresh data that changes frequently (stock prices, event schedules)
- "Near me" queries requiring current POI data beyond user's known location

When NOT to use tools:
- User asks about their location → Use their profile location
- User asks about their preferences → Use conversation history and stored facts
- User asks about past conversations → Use memory/context
- General knowledge questions → Answer directly from your knowledge
- Questions about the user themselves → Use available user data first
- Casual conversation → Respond naturally without tools

Rules:
- Default to conversation context and user data FIRST
- Only call tools when you cannot answer with existing information
- Do NOT say "I'll search for that" - either search immediately or answer directly
- After tool use, provide concise, natural answers (no raw JSON)
- If tools return nothing useful, acknowledge briefly or ask one clarifying question
`.trim();

const TOOL_FEWSHOT = [];

// Validate critical configuration
const requiredEnvVars = [
  'WHISPER_URL', 'LLM_URL', 'LLM_MODEL', 'EMBED_URL', 'QDRANT_URL',
  'QDRANT_COLLECTION', 'EMBED_MODEL', 'EMBED_DIM', 'FFMPEG_BIN',
  'ALLOWED_ORIGINS', 'MAX_CONCURRENT_PEERS', 'MAX_TTS_QUEUE_SIZE',
  'REQUEST_TIMEOUT_MS'
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[gateway] Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}
if (!ELEVEN_API_KEY || !ELEVEN_VOICE_ID) {
  console.warn("[gateway] Missing ELEVEN_API_KEY/ELEVEN_VOICE_ID; TTS will fail.");
}

// ---- Constants ----
const BARGE_HOLDOFF_MS = 500;
const RATE_TOKENS = 8;
const RATE_REFILL_MS = 10000;
const ASR_EARS_OFF_MS=400
const PREROLL_SILENT_FRAMES=8
const INTER_CHUNK_SLEEP_MS=200
const ENQUEUE_NEXT_WHEN_QUEUE_AT_OR_BELOW=1

// ---- Monitoring & Metrics ----
const metrics = {
  activePeers: new prometheus.Gauge({
    name: 'voice_gateway_active_peers',
    help: 'Number of active WebRTC peers'
  }),
  asrRequests: new prometheus.Counter({
    name: 'voice_gateway_asr_requests_total',
    help: 'Total ASR transcription requests',
    labelNames: ['status']
  }),
  ttsRequests: new prometheus.Counter({
    name: 'voice_gateway_tts_requests_total',
    help: 'Total TTS generation requests',
    labelNames: ['status']
  }),
  llmRequests: new prometheus.Counter({
    name: 'voice_gateway_llm_requests_total',
    help: 'Total LLM generation requests',
    labelNames: ['status']
  }),
  requestDuration: new prometheus.Histogram({
    name: 'voice_gateway_request_duration_seconds',
    help: 'Request duration in seconds',
    buckets: [0.1, 0.5, 1, 2, 5]
  })
};

// ---- Prisma Client ----
const prisma = new PrismaClient({
  log: NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// ---- App Setup ----
const app = express();
app.set("trust proxy", true);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:", ...ALLOWED_ORIGINS.split(",").map(s => s.trim())],
      mediaSrc: ["'self'", "blob:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

const ALLOWED = new Set(ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean));
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin && ALLOWED.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Peer-Id");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}
app.use(corsMiddleware);

const buckets = new Map();
function peerKey(req) {
  return (req.headers["x-peer-id"] && String(req.headers["x-peer-id"])) || (req.user?.sub) || req.ip;
}
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  const k = peerKey(req);
  const now = Date.now();
  const b = buckets.get(k) || { tokens: RATE_TOKENS, ts: now };
  const elapsed = now - b.ts;
  if (elapsed > 0) {
    const refill = Math.floor(elapsed / RATE_REFILL_MS) * RATE_TOKENS;
    b.tokens = Math.min(RATE_TOKENS, b.tokens + refill);
    b.ts = now;
  }
  if (b.tokens <= 0) {
    metrics.llmRequests.inc({ status: 'rate_limited' });
    return res.status(429).json({ message: "rate limit" });
  }
  b.tokens -= 1;
  buckets.set(k, b);
  next();
});
app.use(express.json({ limit: "2mb" }));

// --Web Tools --

// Add alongside WEB_TOOLS declaration
const WEB_TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the public web for fresh facts, news, prices, schedules, or quickly-changing data.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query string" },
          maxResults: { type: "integer", minimum: 1, maximum: 8, default: 5 }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "web_fetch",
      description: "Fetch and summarize the contents of a specific URL returned by search.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Absolute URL to fetch" },
          maxChars: { type: "integer", description: "Max raw text to return", default: 6000, minimum: 500, maximum: 20000 },
          summarize: { type: "boolean", description: "Whether to include a concise summary", default: true }
        },
        required: ["url"]
      }
    }
  },
  {
  type: "function",
    function: {
    name: "local_point_of_interest_search",
      description: "Search for specific points of interest (like restaurants, parks, or shops) within a 5mile radius of the user's current location.",
      parameters: {
        type: "object",
        properties: {
          search_term: {
            type: "string",
            description: "The name or category of the place to search for (e.g., 'Italian restaurants', 'dog parks', 'bookstores')."
          },
          max_results: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            default: 3
          }
        },
        required: ["search_term"]
      }
    }
  },
  {
  type: "function",
  function: {
    name: "get_local_weather",
    description: "Retrieve the current weather and forecast summary for the user's exact physical location.",
    parameters: {
      type: "object",
      properties: {
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "The desired temperature unit for the weather forecast."
        }
      },
      required: ["unit"]
    }
  }
  },
  {
    type: "function",
    function: {
      name: "update_assistant_profile",
      description: "Update the assistant's profile when the user requests changes to the assistant's name, personality, or other attributes. Use this when the user says things like 'change your name to Amy', 'be more formal', 'your name is Grace now', etc.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The new name for the assistant (e.g., 'Amy', 'Grace', 'Luna'). Only include if user is changing the name."
          },
          personality: {
            type: "string",
            description: "Updated personality description (e.g., 'warm and caring', 'professional', 'witty'). Only include if user requests personality change."
          },
          speakingStyle: {
            type: "string",
            enum: ["casual", "formal", "direct", "verbose"],
            description: "How the assistant should speak. Only include if user requests style change."
          },
          traits: {
            type: "object",
            properties: {
              humor: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Level of humor in responses"
              },
              formality: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Level of formality"
              },
              empathy: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Level of empathy and emotional support"
              },
              directness: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "How direct vs. diplomatic"
              }
            },
            description: "Specific personality traits to update"
          }
        },
        required: []
      }
    }
  },
  {
  type: "function",
  function: {
    name: "update_user_location",
    description: "Update the user's current location - where they are right now, not necessarily where they live. Call this when the user mentions their location: 'I'm in Seattle', 'I'm currently in New York', 'I'm visiting London', 'I'm at the airport in Tokyo', 'I'm traveling through Paris'. Also use for: 'I live in X', 'I moved to X', or any indication of their current whereabouts.",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "The city name where they currently are. Required. Examples: 'Seattle', 'New York City', 'London', 'San Francisco', 'Tokyo'"
        },
        region: {
          type: "string",
          description: "The state, province, or region where they currently are. Optional. Examples: 'Washington', 'California', 'Ontario', 'England'. Use null if not specified or not applicable."
        },
        country: {
          type: "string",
          description: "The country where they currently are. Use full name. Examples: 'United States', 'Canada', 'United Kingdom', 'France', 'Japan'. Default to 'United States' if clearly a US location and not specified."
        }
      },
      required: ["city", "country"]
    }
  }
  },
  {
  type: "function",
  function: {
    name: "update_user_fact",
    description: "Save important personal information about the user when they share it. Use for: occupation, family, health/medical, preferences, hobbies, personal details, goals, etc. Call this proactively when user shares info about themselves.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: [
            "occupation",
            "family",
            "health",
            "preferences",
            "hobbies",
            "personal",
            "goals",
            "education"
          ],
          description: "Category of information: occupation (job/career), family (spouse/kids/parents/pets), health (allergies/conditions/medications), preferences (likes/dislikes/favorites), hobbies (activities/interests), personal (birthday/age/background), goals (aspirations/targets), education (school/degree)"
        },
        fact: {
          type: "string",
          description: "The fact in clear, complete sentence form. Include context. Good: 'User is a software engineer at Google'. Bad: 'Software engineer'. Good: 'User is allergic to peanuts'. Good: 'User has a dog named Max who is 3 years old'."
        },
        key: {
          type: "string",
          description: "Optional: A short key for easy lookup. Examples: 'occupation', 'dog_name', 'birthday', 'peanut_allergy', 'favorite_food'. Use snake_case."
        }
      },
      required: ["category", "fact"]
    }
  }
  }
];

class TTSManager {
  constructor(peerId) {
    this.peerId = peerId;
    this.queue = [];
    this.playing = false;
    this.proc = null;
    this.guardUntil = 0;
    this.audioSource = null;

    // Audio framing
    this.sampleRate = 48000;
    this.samplesPerFrame = 480; // 10ms @ 48kHz (use 960 if your sink wants 20ms)
    this.bytesPerSample = 2;
    this.frameSize = this.samplesPerFrame * this.bytesPerSample;

    // Old buffer (still used for staging decode)
    this.audioBuffer = Buffer.alloc(0);
    this.streamActive = false;
    this.framesSent = 0;
    this.totalBytesReceived = 0;
    this.maxBufferSize = 1024 * 1024;
    this._badFrameWarned = false;

    this.currentChunkStartTime = null;
    this.currentChunkFrameCount = 0;
    this.lastChunkDuration = 0;
    this.playbackHistory = [];

    // Generation tracking
    this.isGenerating = false;
    this.queueOperations = [];

    // NEW: paced playout state
    this.frameQueue = [];       // holds ready 10ms PCM frames
    this.playoutTimer = null;   // timer handle
    this.playoutActive = false; // is playout loop running?
    this.decodeDone = false;    // ffmpeg finished producing PCM
  }

  // === Utility ===
  get msPerFrame() {
    return (this.samplesPerFrame / this.sampleRate) * 1000; // e.g. 10ms
  }

  getStatus() {
    return {
      playing: this.playing,
      queueLength: this.queue.length,
      streamActive: this.streamActive,
      framesSent: this.framesSent,
      totalBytesReceived: this.totalBytesReceived,
      bufferSize: this.audioBuffer.length,
      guardActive: this.guardUntil > Date.now(),
      isGenerating: this.isGenerating,
      frameQueue: this.frameQueue.length,
      playoutActive: this.playoutActive,
      decodeDone: this.decodeDone,
    };
  }

  // === Queue management ===
  addToQueue(text) {
    const cleanText = String(text || "").trim();
    if (!cleanText) {
      console.warn(`[TTS:${this.peerId}] Invalid or empty text, not queuing`);
      return false;
    }

    const cap = parseInt(process.env.MAX_TTS_QUEUE_SIZE || "8", 10);
    if (this.queue.length >= cap) {
      console.warn(`[TTS:${this.peerId}] Queue full (${this.queue.length}/${cap})`);
      return false;
    }

    this.queue.push(cleanText);
    this.queueOperations.push({
      action: 'add',
      text: cleanText.substring(0, 50),
      queueLength: this.queue.length,
      timestamp: Date.now()
    });

    metrics.ttsRequests.inc({ status: 'queued' });
    console.log(`[TTS:${this.peerId}] ✅ Queued [${this.queue.length}/${cap}]: "${cleanText.substring(0, 50)}..."`);

    if (!this.playing) {
      console.log(`[TTS:${this.peerId}] 🎬 Starting playback (was not playing)`);
      setImmediate(() => this.playNext());
    } else {
      console.log(`[TTS:${this.peerId}] 📝 Added to queue while playing (will be processed next)`);
    }
    return true;
  }

  async addChunks(chunks) {
    if (!Array.isArray(chunks)) chunks = [chunks];
    const valid = chunks.map(c => String(c || "").trim()).filter(c => c.length >= 2);
    console.log(`[TTS:${this.peerId}] Adding ${valid.length} chunks to queue`);

    for (let i = 0; i < valid.length; i++) {
      let ok = false, tries = 0;
      while (!ok && tries < 3) {
        ok = this.addToQueue(valid[i]);
        if (!ok) { tries++; await new Promise(r => setTimeout(r, 50)); }
      }
      if (ok && i < valid.length - 1) {
        // pacing between text chunks (not audio frames)
        await new Promise(r => setTimeout(r, 1200));
      }
    }
    return true;
  }

  async playNext() {
    if (this.playing) {
      console.log(`[TTS:${this.peerId}] Already playing, skipping`);
      return;
    }
    if (this.queue.length === 0) {
      console.log(`[TTS:${this.peerId}] Queue empty, nothing to play`);
      return;
    }

    this.playing = true;
    const text = this.queue.shift();
    console.log(`[TTS:${this.peerId}] 🎵 PLAYING NEXT: "${text.substring(0, 50)}..." (${this.queue.length} remaining)`);

    try {
      await this.streamTTS(text);
      console.log(`[TTS:${this.peerId}] ✅ Finished playing: "${text.substring(0, 50)}..."`);
    } catch (error) {
      console.error(`[TTS:${this.peerId}] ❌ Play error:`, error.message);
      metrics.ttsRequests.inc({ status: 'error' });
    } finally {
      this.playing = false;
      if (this.queue.length > 0) {
        console.log(`[TTS:${this.peerId}] 🔄 Continuing with next item (${this.queue.length} remaining)`);
        setImmediate(() => this.playNext());
      } else {
        console.log(`[TTS:${this.peerId}] ✅ Queue empty, playback complete`);
      }
    }
  }

  stopStream() {
    // stop decode + playout immediately
    this.streamActive = false;
    this.decodeDone = true;

    this.audioBuffer = Buffer.alloc(0);
    this.frameQueue = [];
    this.currentChunkFrameCount = 0;

    if (this.playoutTimer) {
      clearTimeout(this.playoutTimer);
      this.playoutTimer = null;
    }
    this.playoutActive = false;

    if (this.proc) {
      this.proc.kill('SIGKILL');
      this.proc = null;
    }
  }

  stop() {
    console.log(`[TTS:${this.peerId}] ⚠️ STOP called - isGenerating: ${this.isGenerating}, queue: ${this.queue.length}, playing: ${this.playing}`);
    if (this.isGenerating) {
      console.log(`[TTS:${this.peerId}] 🛡️ Protected: Still generating, ignoring stop`);
      return;
    }

    console.log(`[TTS:${this.peerId}] Stopping TTS completely`);
    this.queueOperations.push({
      action: 'stop',
      queueLength: this.queue.length,
      playing: this.playing,
      timestamp: Date.now()
    });

    this.queue = [];
    this.playing = false;
    this.stopStream();
    this.framesSent = 0;
    this.totalBytesReceived = 0;
    this.guardUntil = 0;
    this.currentChunkFrameCount = 0;
    this.lastChunkDuration = 0;
  }

  async streamTTS(text) {
    const cleanText = String(text || "").trim();
    if (!cleanText) throw new Error("Empty text provided to TTS");

    const peer = connectionManager.getPeer(this.peerId);
    if (!peer) throw new Error("Peer not found");
    if (!peer.audioSource) throw new Error("No audio source available");
    this.audioSource = peer.audioSource;

    if (!ELEVEN_API_KEY || !ELEVEN_VOICE_ID) throw new Error("Missing ElevenLabs configuration");

    console.log(`[TTS:${this.peerId}] 🎯 Starting TTS: "${cleanText.substring(0, 50)}..." (${cleanText.length} chars)`);

    this.currentChunkStartTime = Date.now();
    this.currentChunkFrameCount = 0;

    // reset stream state (decode + playout)
    this.streamActive = true;
    this.decodeDone = false;
    this.audioBuffer = Buffer.alloc(0);
    this.frameQueue = [];
    this.framesSent = 0;

    await this.streamSingleTTSChunk(cleanText);

    // Wait for paced playout to fully drain (not just decode)
    const deadline = Date.now() + 30000; // 30s safety
    while ((this.playoutActive || this.frameQueue.length > 0) && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 10));
    }

    const actualDuration = this.calculateActualDuration();
    this.lastChunkDuration = actualDuration;
    this.playbackHistory.push({
      text: cleanText,
      textLength: cleanText.length,
      wordCount: cleanText.split(/\s+/).length,
      frames: this.currentChunkFrameCount,
      duration: actualDuration,
      timestamp: Date.now()
    });
    if (this.playbackHistory.length > 5) this.playbackHistory.shift();

    console.log(`[TTS:${this.peerId}] ✅ Chunk completed: ${this.currentChunkFrameCount} frames, ${actualDuration}ms actual duration`);
  }

  calculateActualDuration() {
    const msPerFrame = this.msPerFrame; // e.g. 10ms
    const actualDuration = this.currentChunkFrameCount * msPerFrame;
    console.log(`[TTS:${this.peerId}] 📊 Duration calc: ${this.currentChunkFrameCount} frames × ${msPerFrame}ms = ${actualDuration}ms`);
    return actualDuration;
  }

  estimateChunkDuration(text) {
    const wordCount = String(text || "").split(/\s+/).length;
    const MIN_DURATION_MS = 1500;
    let estimated = wordCount * 350;
    estimated += (text.match(/[.!?]/g) || []).length * 200;
    estimated += (text.match(/[,;:]/g) || []).length * 100;
    estimated = Math.max(estimated, MIN_DURATION_MS);
    console.log(`[TTS:${this.peerId}] 📊 Estimated: ${wordCount} words = ${Math.round(estimated)}ms`);
    return estimated;
  }

  async streamSingleTTSChunk(text) {
    const peer = connectionManager.getPeer(this.peerId);
    let voiceID = peer?.assistantProfile?.voiceId || ELEVEN_VOICE_ID;
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceID)}/stream`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[TTS:${this.peerId}] ElevenLabs request timeout`);
      controller.abort();
    }, parseInt(REQUEST_TIMEOUT_MS) || 20000);

    console.log(`[TTS:${this.peerId}] 📡 Sending ElevenLabs request: "${text.substring(0, 30)}..."`);

    try {
      const response = await fetch(ttsUrl, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          text: String(text),
          model_id: ELEVEN_MODEL_ID,
          optimize_streaming_latency: parseInt(TTS_OPTIMIZE_LATENCY) || 0,
          voice_settings: { stability: 0.7, similarity_boost: 0.8 },
          // If ElevenLabs supports raw PCM @48k, use that and remove ffmpeg
          // output_format: "pcm_48000", // (example) otherwise keep MP3 and transcode:
          output_format: "mp3_44100_128",
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[TTS:${this.peerId}] ElevenLabs API error: ${response.status} - ${errorText}`);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
      if (!response.body) throw new Error('ElevenLabs returned no audio data');

      console.log(`[TTS:${this.peerId}] ✅ ElevenLabs request successful, starting audio processing`);
      await this.processTTSStream(response.body); // decode -> frameQueue (paced separately)
      console.log(`[TTS:${this.peerId}] ✅ Audio decoding completed`);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[TTS:${this.peerId}] ❌ ElevenLabs request failed:`, error.message);
      throw error;
    }
  }

  async processTTSStream(readableStream) {
    return new Promise((resolve, reject) => {
      console.log(`[TTS:${this.peerId}] 🔧 Starting FFmpeg audio processing`);

      const ffmpegArgs = [
        "-hide_banner", "-loglevel", "error",
        "-i", "pipe:0",
        "-f", "s16le", "-acodec", "pcm_s16le",
        "-ac", "1", "-ar", String(this.sampleRate),
        "pipe:1"
      ];

      try {
        this.proc = spawn(FFMPEG_BIN, ffmpegArgs, { stdio: ["pipe", "pipe", "pipe"] });
        console.log(`[TTS:${this.peerId}] ✅ FFmpeg process started`);
      } catch (e) {
        console.error(`[TTS:${this.peerId}] ❌ Failed to start FFmpeg:`, e.message);
        reject(new Error(`FFmpeg failed: ${e.message}`));
        return;
      }

      let audioDataReceived = false;

      this.proc.stdout.on('data', (chunk) => {
        if (!this.streamActive) return;
        audioDataReceived = true;
        this.totalBytesReceived += chunk.length;
        this._processIncomingPCM(chunk); // ⬅️ queue frames + start paced playout
        if (this.totalBytesReceived % 50000 === 0) {
          console.log(`[TTS:${this.peerId}] 🔊 RX ${this.totalBytesReceived} bytes | queued frames: ${this.frameQueue.length}`);
        }
      });

      this.proc.on('error', (error) => {
        console.error(`[TTS:${this.peerId}] ❌ FFmpeg process error:`, error.message);
        reject(new Error(`FFmpeg error: ${error.message}`));
      });

      this.proc.on('close', (code) => {
        console.log(`[TTS:${this.peerId}] 🔚 FFmpeg exited with code ${code}`);

        // flush any residual bytes into frames
        if (this.audioBuffer.length > 0) {
          this._processIncomingPCM(Buffer.alloc(0));
        }

        // mark decode finished; playout loop will drain remaining frames
        this.decodeDone = true;

        if (code === 0 || code === 255) {
          if (!audioDataReceived) {
            console.warn(`[TTS:${this.peerId}] ⚠️ FFmpeg completed but no audio data received`);
            reject(new Error("No audio data received from FFmpeg"));
          } else {
            resolve();
          }
        } else {
          console.error(`[TTS:${this.peerId}] ❌ FFmpeg failed with code ${code}`);
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });

      // pump ElevenLabs body -> ffmpeg stdin
      const pumpToFFmpeg = async () => {
        const reader = readableStream.getReader();
        try {
          while (this.streamActive) {
            const { value, done } = await reader.read();
            if (done) break;
            if (this.proc && !this.proc.stdin.destroyed) {
              const canWrite = this.proc.stdin.write(Buffer.from(value));
              if (!canWrite) await new Promise(r => this.proc.stdin.once('drain', r));
            }
          }
        } catch (error) {
          if (this.streamActive) {
            console.error(`[TTS:${this.peerId}] ❌ Stream read error:`, error.message);
            reject(error);
          }
          return;
        } finally {
          if (this.proc && !this.proc.stdin.destroyed) {
            this.proc.stdin.end();
          }
        }
      };

      pumpToFFmpeg().catch(reject);
    });
  }

  // === NEW: decode -> frame queue, paced playout loop ===
  _processIncomingPCM(chunk) {
    // append to staging buffer
    if (chunk && chunk.length) {
      this.audioBuffer = Buffer.concat([this.audioBuffer, chunk]);
      if (this.audioBuffer.length > this.maxBufferSize) {
        // prevent unbounded growth (rare unless network stalls)
        this.audioBuffer = this.audioBuffer.subarray(-this.maxBufferSize);
      }
    }

    // slice into exact frames
    while (this.audioBuffer.length >= this.frameSize) {
      const frame = this.audioBuffer.subarray(0, this.frameSize);
      this.audioBuffer = this.audioBuffer.subarray(this.frameSize);
      this.frameQueue.push(frame);
    }

    // ensure paced playout is running
    this._startPlayoutLoop();
  }

  _startPlayoutLoop() {
    if (this.playoutActive) return;
    if (!this.streamActive || !this.audioSource) return;

    this.playoutActive = true;

    const tick = () => {
      if (!this.streamActive || !this.audioSource) {
        this.playoutActive = false;
        this.playoutTimer = null;
        return;
      }

      if (this.frameQueue.length > 0) {
        const frame = this.frameQueue.shift();
        this._sendPacedFrame(frame);
      }

      // if decoder is done and queue drained, stop
      if (this.decodeDone && this.frameQueue.length === 0) {
        this.playoutActive = false;
        this.playoutTimer = null;
        // mark stream inactive once fully played out
        this.streamActive = false;
        return;
      }

      this.playoutTimer = setTimeout(tick, this.msPerFrame);
    };

    this.playoutTimer = setTimeout(tick, this.msPerFrame);
  }

  _sendPacedFrame(frameBuffer) {
    if (!frameBuffer || frameBuffer.length !== this.frameSize) return;
    if (!this.streamActive || !this.audioSource) return;

    try {
      const samples = toTightInt16Frame(frameBuffer, this.samplesPerFrame);
      if (!samples) {
        if (!this._badFrameWarned) {
          console.error(`[TTS:${this.peerId}] ❌ Bad frame size`);
          this._badFrameWarned = true;
        }
        return;
      }

      this.audioSource.onData({
        samples,
        sampleRate: this.sampleRate,
        bitsPerSample: 16,
        channelCount: 1,
        numberOfFrames: this.samplesPerFrame,
      });

      this.framesSent++;
      this.currentChunkFrameCount++;
      connectionManager.updateAudioActivity(this.peerId);

      if (this.guardUntil === 0) {
        this.guardUntil = Date.now() + BARGE_HOLDOFF_MS;
      }
    } catch (e) {
      console.error(`[TTS:${this.peerId}] ❌ paced frame error:`, e.message);
    }
  }

  // === Legacy methods kept for compatibility (now route to paced logic) ===
  processAudioFrames() {
    // If any old code calls this, just fold into queue and ensure playout
    while (this.audioBuffer.length >= this.frameSize) {
      const frameBuffer = this.audioBuffer.subarray(0, this.frameSize);
      this.audioBuffer = this.audioBuffer.subarray(this.frameSize);
      this.frameQueue.push(frameBuffer);
    }
    this._startPlayoutLoop();
  }

  sendAudioFrame(frameBuffer) {
    // Not used anymore; we pace via _sendPacedFrame through the playout loop.
    if (!frameBuffer || frameBuffer.length !== this.frameSize) return;
    this.frameQueue.push(frameBuffer);
    this._startPlayoutLoop();
  }

  handleVadState(vadState) {
    const peer = connectionManager.getPeer(this.peerId);
    if (!peer) return;

    console.log(`[TTS:${this.peerId}] VAD state: ${vadState}`);
    if (vadState === 'speaking' && (this.playing || this.streamActive || this.playoutActive)) {
      console.log(`[TTS:${this.peerId}] 🚨 Barge-in detected, stopping TTS`);
      this.stop();
    }
  }

  getRecentOperations(count = 10) {
    return this.queueOperations.slice(-count);
  }
}


class ConnectionManager {
  constructor(maxConnections = 50) {
    this.peers = new Map();
    this.maxConnections = maxConnections;
    this.stats = { totalConnections: 0, activeConnections: 0, failedConnections: 0 };
    this.cleanupInterval = setInterval(() => this.cleanupInactivePeers(), 60000);
  }
  addPeer(peerId, peerData) {
    if (this.peers.size >= this.maxConnections) throw new Error('Maximum connections reached');
    this.peers.set(peerId, {
      ...peerData,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      lastAudioTime: Date.now(),
      connectionState: 'connecting',
      isActive: true
    });
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    metrics.activePeers.set(this.peers.size);
  }
  getPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) peer.lastActivity = Date.now();
    return peer;
  }
  updatePeerState(peerId, state) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.connectionState = state;
      peer.lastActivity = Date.now();
      if (state === 'connected') peer.isActive = true;
      else if (state === 'failed' || state === 'closed') {
        setTimeout(() => {
          const currentPeer = this.peers.get(peerId);
          if (currentPeer && currentPeer.connectionState === state) this.cleanupPeer(peerId);
        }, 2000);
      }
    }
  }
  updateAudioActivity(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) peer.lastAudioTime = Date.now();
  }
  removePeer(peerId) {
    if (this.peers.has(peerId)) {
      this.peers.delete(peerId);
      this.stats.activeConnections--;
      metrics.activePeers.set(this.peers.size);
    }
  }
  cleanupInactivePeers(maxAgeMs = 300000) {
    const now = Date.now();
    let cleaned = 0;
    for (const [peerId, peer] of this.peers.entries()) {
      if (now - peer.lastActivity > maxAgeMs && peer.connectionState !== 'connected') {
        this.cleanupPeer(peerId); cleaned++;
      }
    }
    if (cleaned > 0) console.log(`[cleanup] Removed ${cleaned} inactive peers`);
  }
    cleanupPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    if (peer.sessionId && peer.tenantId) {

      setImmediate(async () => {
        try {
          const shouldSummarize = await shouldGenerateSummary(peer.sessionId);

          if (shouldSummarize) {
            console.log(`[cleanup:${peerId}] Generating conversation summary`);
            await generateUserSummary(peer.tenantId, peer.sessionId);
          }

          try {
            let sessionId = peer.sessionId;
            if (await shouldExtractFacts(sessionId, prisma)) {
              console.log(`[cleanup:${peerId}] Extracting facts`);
              // Use the transcript from this session (user turns only)

              let evidence = await buildSessionEvidence({ prisma, sessionId });
              // Optionally augment with LTM for cross-session recall
            if (peer.memoryManager) {
              //evidence = await augmentWithLTM({ memoryManager: peer.memoryManager, evidence });
            }
              // const turns = await prisma.turn.findMany({
              //   where: { sessionId, role: 'user' },
              //   orderBy: { ts: 'asc' },
              //   select: { text: true }
              // });
              // const transcript = turns.map(t => t.text).join('\n');

              const res = await runFactsExtractionAndSave({
                prisma,
                userId: peer.tenantId,
                transcript: evidence,
                llmUrl: process.env.LLM_URL,
                llmModel: process.env.LLM_MODEL,
                apiKey: process.env.OPENAI_API_KEY
              });


              console.log(`[cleanup:${peerId}] Facts saved ${res.saved}/${res.total}`);
            }
          } catch (e) {
            console.error(`[cleanup:${peerId}] Facts extraction failed:`, e.message);
          }

        } catch (e) {
          console.error(`[cleanup:${peerId}] Summary generation failed:`, e.message);
        }
      });
    }

    try { if (peer.ttsManager) peer.ttsManager.stop(); } catch (e) { console.warn(`[cleanup:${peerId}] TTS stop error:`, e.message); }
    try { if (peer.currentAbort) peer.currentAbort.abort(); } catch (e) { console.warn(`[cleanup:${peerId}] Abort error:`, e.message); }
    try { if (peer.asrWs?.readyState === WebSocket.OPEN) peer.asrWs.close(); } catch (e) { console.warn(`[cleanup:${peerId}] ASR WS close error:`, e.message); }
    try { if (peer.audioSink) peer.audioSink.stop(); } catch (e) { console.warn(`[cleanup:${peerId}] Audio sink stop error:`, e.message); }
    try {
      if (peer.pc) {
        peer.pc.getSenders()?.forEach(s => s.track?.stop());
        peer.pc.getReceivers()?.forEach(r => r.track?.stop());
        peer.pc.close();
      }
    } catch (e) { console.warn(`[cleanup:${peerId}] PC close error:`, e.message); }
    try { if (peer.chunkManager) peer.chunkManager.cleanup(); } catch (e) { console.warn(`[cleanup:${peerId}] Chunk manager cleanup error:`, e.message); }
    if (peer.dataChannel) {
      try { peer.dataChannel.close(); } catch (e) { console.warn(`[cleanup:${peerId}] Data channel close error:`, e.message); }
    }
    if (peer.healthCheckInterval) clearInterval(peer.healthCheckInterval);
    this.removePeer(peerId);
    console.log(`[cleanup:${peerId}] Completed cleanup`);
  }
  shutdown() {
    clearInterval(this.cleanupInterval);
    for (const [peerId] of this.peers) this.cleanupPeer(peerId);
  }
}

// evidence-builder.js (CommonJS)

const MIN_LINE_LEN = Number(process.env.FACTS_MIN_LINE_LEN || 3);
const MAX_EVIDENCE_CHARS = Number(process.env.FACTS_MAX_EVIDENCE_CHARS || 8000);
const ASSISTANT_CONTEXT_WINDOW = Number(process.env.FACTS_ASSISTANT_CTX || 1); // include 1 assistant line before each user reply
const FACTS_LTM_TOPK = Number(process.env.FACTS_LTM_TOPK || 12);
const FACTS_LTM_MIN_SCORE = Number(process.env.FACTS_LTM_MIN_SCORE || 0.45);

function clean(text) {
  if (!text) return '';
  // strip boilerplate that confuses extraction
  return String(text)
    .replace(/\s+/g, ' ')
    .replace(/^assistant\s*:\s*/i, '')
    .replace(/^user\s*:\s*/i, '')
    .trim();
}

function isTrivial(s) {
  const t = s.trim();
  if (t.length < MIN_LINE_LEN) return true;
  // filter pure fillers
  return /^(ok(ay)?|yeah|yep|nope|lol|hmm|uhh?|sure|alright|right|thanks|cool|k)\.?$/i.test(t);
}

/**
 * Build session evidence: user turns + preceding assistant question(s)
 */
async function buildSessionEvidence({ prisma, sessionId }) {
  const turns = await prisma.turn.findMany({
    where: { sessionId },
    orderBy: { ts: 'asc' },
    select: { id: true, role: true, text: true, ts: true }
  });

  const lines = [];
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    if (t.role !== 'user') continue;

    // include preceding assistant turn(s) as context
    let ctxCount = 0;
    let j = i - 1;
    while (j >= 0 && ctxCount < ASSISTANT_CONTEXT_WINDOW) {
      if (turns[j].role === 'assistant') {
        const a = clean(turns[j].text);
        if (a && !isTrivial(a)) {
          lines.push(`assistant: ${a}`);
          ctxCount++;
        }
        break; // usually the immediately previous assistant turn is enough
      }
      j--;
    }

    const u = clean(t.text);
    if (u && !isTrivial(u)) lines.push(`user: ${u}`);
  }

  // dedupe adjacent duplicates
  const dedup = [];
  for (const l of lines) {
    if (dedup.length === 0 || dedup[dedup.length - 1] !== l) dedup.push(l);
  }

  let evidence = dedup.join('\n');
  if (evidence.length > MAX_EVIDENCE_CHARS) {
    evidence = evidence.slice(-MAX_EVIDENCE_CHARS); // keep tail (most recent)
  }
  return evidence;
}

/**
 * Optionally augment with LTM snippets for cross-session recall
 */
async function augmentWithLTM({ memoryManager, evidence }) {
  try {
    const ltm = await memoryManager.getLongTermMemory('fact sweep', {
      topK: FACTS_LTM_TOPK,
      minScore: FACTS_LTM_MIN_SCORE
    });
    if (!Array.isArray(ltm) || ltm.length === 0) return evidence;

    const ltmBlock = ltm.slice(0, FACTS_LTM_TOPK).map(h => {
      const txt = clean(h.text || h.contextualized_text || '');
      if (!txt) return null;
      const when = h.timestamp ? new Date(h.timestamp).toISOString() : '';
      return `memory@${when}: ${txt}`;
    }).filter(Boolean).join('\n');

    const combined = `# Session Context\n${evidence}\n\n# Retrieved Memories\n${ltmBlock}`;
    return combined.length > MAX_EVIDENCE_CHARS
      ? combined.slice(-MAX_EVIDENCE_CHARS)
      : combined;
  } catch {
    return evidence;
  }
}


async function shouldExtractFacts(sessionId, prisma) {
  // Example: extract when session has any user turns not yet processed for facts
  const turns = await prisma.turn.count({ where: { sessionId, role: 'user' } });
  return turns >= 1;
}


function contextGet(userId) {
  const entry = contextCache.get(userId);
  if (!entry) return null;
  // optional soft TTL
  if (Date.now() - entry.ts > CONTEXT_TTL_MS) return null;
  return entry.bundle;
}

function contextSet(userId, bundle) {
  contextCache.set(userId, { bundle, ts: Date.now() });
  if (contextCache.size > CONTEXT_MAX) {
    // naive LRU: delete oldest entry
    let oldestKey = null, oldestTs = Infinity;
    for (const [k, v] of contextCache.entries()) {
      if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; }
    }
    if (oldestKey) contextCache.delete(oldestKey);
  }
}

function contextDel(userId) {
  contextCache.delete(userId);
}


// ---- Audio helpers ----

// Tight 960B frame helper (ensures samples.buffer.byteLength === 960)
function toTightInt16Frame(frameBuffer, samplesPerFrame = 480) {
  if (!frameBuffer || frameBuffer.length !== samplesPerFrame * 2) return null;
  const ab = new ArrayBuffer(frameBuffer.length); // exact 960B
  new Uint8Array(ab).set(frameBuffer);
  return new Int16Array(ab);
}

// Downsample mic 48k → 16k (simple decimator; mono Int16)
function downsample48To16(int16) {
  try {
    if (!(int16 instanceof Int16Array) || int16.length === 0) return new Int16Array(0);
    const out = new Int16Array(Math.floor(int16.length / 3));
    for (let i = 0, j = 0; i + 2 < int16.length; i += 3, j++) out[j] = int16[i];
    return out;
  } catch (error) {
    console.error("[downsample] Error:", error.message);
    return new Int16Array(0);
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

// Simple sentence splitter (replace the missing function)
function splitIntoSentencesPreserveStructure(text) {
  if (!text) return [];
  // Simple sentence splitting by punctuation
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.filter(s => s.trim().length > 0);
}

// ---- Enhanced Data Channel Handler ----
// ---- Enhanced Data Channel Handler ----
function handleClientVadState(peerId, vadState) {
  const peer = connectionManager.getPeer(peerId);
  if (!peer || !peer.dataChannel || peer.dataChannel.readyState !== 'open') {
    console.warn(`[VAD:${peerId}] No peer or data channel closed`);
    return;
  }

  console.log(`[VAD:${peerId}] Received VAD state: ${vadState}`);

  peer.clientVadState = vadState;
  peer.lastClientActivity = Date.now();

  if (peer.ttsManager) {
    // ✅ Only pass to TTS manager if not protected
    if (vadState === 'speaking' && !peer.ttsManager.isGenerating) {
      console.log(`[VAD:${peerId}] Barge-in detected, passing to TTS manager`);
      peer.ttsManager.handleVadState(vadState);
    } else if (vadState === 'speaking' && peer.ttsManager.isGenerating) {
      console.log(`[VAD:${peerId}] 🛡️ Barge-in blocked - still generating response`);
    }
  }

  sendVadAcknowledgment(peerId, vadState);
}

function sendVadAcknowledgment(peerId, vadState) {
  const peer = connectionManager.getPeer(peerId);
  if (!peer?.dataChannel || peer.dataChannel.readyState !== 'open') return;

  try {
    const response = {
      type: 'vad_ack',
      state: vadState,
      timestamp: Date.now(),
      serverTime: new Date().toISOString(),
      chunkStatus: peer.chunkManager ? peer.chunkManager.getStatus() : null
    };
    peer.dataChannel.send(JSON.stringify(response));
  } catch (e) {
    console.error(`[VAD:${peerId}] Failed to send acknowledgment:`, e.message);
  }
}

// --- Light rewrite for speech: keep meaning, remove awkward texty bits ---
// --- Updated rewriteForSpeech Snippet (Add Fix 3) ---

// --- COMPLETE & FINALIZED rewriteForSpeech FUNCTION ---

function rewriteForSpeech(raw, { enable = true } = {}) {
  if (!enable) return String(raw || "");
  let text = String(raw || "").trim();

  // Just clean up obvious speech-unfriendly patterns

  // Remove excessive punctuation
  text = text.replace(/[.!?]{2,}/g, '.');
  text = text.replace(/[,;]{2,}/g, ',');

  // Convert quote marks (TTS handles single quotes better)
  text = text.replace(/"/g, "'");

  // Remove asterisks (often used for emphasis in text)
  text = text.replace(/\*+/g, '');

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Ensure final punctuation
  if (!/[.!?]$/.test(text)) {
    text += '.';
  }

  return text;
}
// ----------------------------------------------------------------------}

/**
 * Universal text normalizer for TTS
 * Handles common patterns that cause poor speech synthesis
 */

function normalizeForTTS(text) {
  if (!text) return "";
  let s = String(text);

  // -------- 0) Unicode normalization (safe canonical form) --------
  // NFKC turns ligatures into base characters without losing content.
  if (s.normalize) s = s.normalize('NFKC');

  // -------- 1) Protect URLs & emails (don’t rewrite them mid-text) --------
  // We’ll replace them with lightweight tokens so downstream rules don’t touch them.
  const placeholders = [];
  s = s.replace(/https?:\/\/\S+|\b[\w.+-]+@[\w.-]+\.\w+\b/g, (m) => {
    const id = placeholders.push(m) - 1;
    return `[[PH_${id}]]`;
  });

  // -------- 2) Quotes, dashes, ellipsis (keep punctuation cues) --------
  // Smart quotes → straight; keep punctuation around them intact.
  s = s
    .replace(/[\u2018\u2019\u2032]/g, "'")   // single quotes / primes
    .replace(/[\u201C\u201D\u2033]/g, '"')  // double quotes / double primes
    .replace(/\u2026/g, '...');             // ellipsis

  // Normalize long dashes to em dash and ensure spacing around them
  // (most TTS will pause slightly on em dash)
  s = s.replace(/[\u2013\u2014]/g, '—');
  s = s.replace(/\s*—\s*/g, ' — ');

  // -------- 3) Accents: generally fine for TTS, avoid heavy transliteration --------
  // (Your old map changed names like “José” → “Jose”; usually unnecessary and undesirable.)
  // If you still want to normalize a FEW edge cases, do it surgically, not blanket.

  // -------- 4) Numbers & symbols (only where it improves speech) --------
  // Temperatures
  s = s.replace(/(\d+)°\s*F\b/gi, '$1 degrees Fahrenheit');
  s = s.replace(/(\d+)°\s*C\b/gi, '$1 degrees Celsius');
  s = s.replace(/(\d+)°(?!\w)/g, '$1 degrees');

  // Math operators: only when surrounded by spaces (to avoid "2020-2021" ranges)
  s = s.replace(/(\d+)\s*[×x]\s*(\d+)/g, '$1 times $2');        // 3×4, or 3 x 4
  s = s.replace(/(\d+)\s*÷\s*(\d+)/g, '$1 divided by $2');      // 8÷2
  s = s.replace(/(\d+)\s\+\s(\d+)/g, '$1 plus $2');             // 3 + 4
  s = s.replace(/(\d+)\s-\s(\d+)/g, '$1 minus $2');             // 7 - 5

  // Ranges: only replace hyphen/en/em dash between pure numbers WITH surrounding spaces
  // e.g., "1 - 2 minutes" → "1 to 2 minutes". Leave "2020-2021" intact.
  s = s.replace(/(\b\d+)\s*[-—]\s*(\d+\b)(?!:)/g, '$1 to $2');

  // Fractions: mixed and standalone
  const fractionMap = {
    '1/2': 'a half', '1/3': 'a third', '2/3': 'two thirds',
    '1/4': 'a quarter', '3/4': 'three quarters',
    '1/8': 'an eighth', '3/8': 'three eighths', '5/8': 'five eighths', '7/8': 'seven eighths'
  };
  for (const [frac, words] of Object.entries(fractionMap)) {
    const f = frac.replace('/', '\\/');
    s = s.replace(new RegExp(`(\\d+)\\s+${f}\\b`, 'g'), `$1 and ${words}`); // 1 1/2
    s = s.replace(new RegExp(`\\b${f}\\b`, 'g'), words);                    // 1/2
  }

  // Times: keep colon; just ensure a space before am/pm
  s = s.replace(/(\b\d{1,2}:\d{2})(am|pm)\b/gi, '$1 $2');

  // -------- 5) Abbreviations (only expand when numeric context exists) --------
  // e.g., "2 tbsp", "5 oz", "10 min" → expand; leave standalone words alone.
  const unitMap = {
    tbsp: 'tablespoon', tsp: 'teaspoon',
    oz: 'ounce', lb: 'pound', lbs: 'pounds',
    qt: 'quart', pt: 'pint', gal: 'gallon',
    ml: 'milliliter', cl: 'centiliter', dl: 'deciliter',
    mg: 'milligram', kg: 'kilogram', g: 'gram',
    km: 'kilometer', cm: 'centimeter', mm: 'millimeter',
    min: 'minute', mins: 'minutes', sec: 'second', secs: 'seconds', hr: 'hour', hrs: 'hours'
  };
  s = s.replace(
    new RegExp(`(\\b\\d+(?:\\.\\d+)?)\\s*(${Object.keys(unitMap).join('|')})\\.?\\b`, 'gi'),
    (m, num, abbr) => {
      const base = unitMap[abbr.toLowerCase()];
      // pluralize if needed
      const n = parseFloat(num);
      const plural = (n !== 1 && !base.endsWith('s')) ? base + 's' : base;
      return `${num} ${plural}`;
    }
  );

  // A few common Latin abbreviations when they appear as separate tokens
  s = s.replace(/\beg\.\b/gi, 'for example');
  s = s.replace(/\bie\.\b/gi, 'that is');
  s = s.replace(/\bvs\.\b/gi, 'versus');

  // -------- 6) Parentheticals: turn SHORT asides into comma pauses --------
  // Only if 5–60 chars to avoid swallowing big blocks
  s = s.replace(/\s*\(([^)]{5,60})\)/g, ', $1,');

  // -------- 7) Whitespace hygiene (preserve paragraphs!) --------
  // Collapse spaces within lines, but KEEP blank lines as paragraph breaks.
  s = s
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');
  // Reduce 3+ newlines to exactly two (paragraph pause)
  s = s.replace(/\n{3,}/g, '\n\n');

  // -------- 8) Restore placeholders (URLs/emails) in a TTS-friendly way --------
  // Replace with short cues rather than “dot com” expansions that bloat speech.
  s = s.replace(/\[\[PH_(\d+)\]\]/g, (_, idxStr) => {
    const idx = Number(idxStr);
    const raw = placeholders[idx] || '';
    if (!raw) return '';
    if (raw.includes('@')) return '[email address]';
    return '[link]';
  });

  let final = sanitizeForSpeech(s)

  return final.trim();
}

/**
 * Smart sentence splitter that preserves natural breaks
 */
function splitIntoSentences(text) {
  if (!text) return [];

  // Split on sentence-ending punctuation, but preserve common abbreviations
  const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<![A-Z]\.)(?<=\.|\?|!)\s+/);

  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Intelligent chunking that adapts to content density
 */
function* phraseChunker(text, {
  min = 25,
  max = 70,
  hardCap = 90,  // Increased for better phrase completion
  maxWords = 15  // Increased slightly
} = {}) {
  if (!text) return;

  // First, split into sentences
  const sentences = smartSplitSentences(text);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // If sentence fits comfortably, yield it whole
    if (trimmed.length <= max) {
      yield ensurePunctuation(trimmed);
      continue;
    }

    // If it's slightly over but not too long, keep it together
    if (trimmed.length <= hardCap) {
      yield ensurePunctuation(trimmed);
      continue;
    }

    // Long sentence: break intelligently
    const chunks = breakLongSentenceIntelligently(trimmed, { max, hardCap, maxWords });
    for (const chunk of chunks) {
      yield chunk;
    }
  }
}

function smartSplitSentences(text) {
  if (!text) return [];

  // Protect common abbreviations
  let protectedWords = String(text)
    .replace(/Mr\./g, 'Mr__PERIOD__')
    .replace(/Mrs\./g, 'Mrs__PERIOD__')
    .replace(/Ms\./g, 'Ms__PERIOD__')
    .replace(/Dr\./g, 'Dr__PERIOD__')
    .replace(/vs\./g, 'vs__PERIOD__')
    .replace(/etc\./g, 'etc__PERIOD__')
    .replace(/e\.g\./g, 'e__PERIOD__g__PERIOD__')
    .replace(/i\.e\./g, 'i__PERIOD__e__PERIOD__');

  // Split on sentence boundaries
  const sentences = protectedWords.split(/(?<=[.!?])\s+(?=[A-Z])/);

  // Restore abbreviations
  return sentences.map(s =>
    s.replace(/__PERIOD__/g, '.')
     .trim()
  ).filter(s => s.length > 0);
}

function breakLongSentenceIntelligently(sentence, { max = 70, hardCap = 90, maxWords = 15 } = {}) {
  const chunks = [];
  let remaining = sentence.trim();

  // If sentence is already reasonable, return as-is
  if (remaining.length <= hardCap && remaining.split(/\s+/).length <= maxWords) {
    return [ensurePunctuation(remaining)];
  }

  const breakPoints = [
    // Sentence boundaries (highest priority)
    { regex: /^(.*?[.!?])\s+/, description: 'sentence_end' },

    // Conjunctions and transitions
    { regex: /^(.*?)\s+(and|or|but|however|therefore|meanwhile)\s+/i, description: 'conjunction' },

    // Commas (only if they create reasonable chunks)
    { regex: /^(.*?,)\s+(.{10,})/, description: 'comma' },

    // Natural phrase boundaries
    { regex: /^(.{30,}?)\s+(that|which|who|when|where)\s+/i, description: 'relative_clause' },

    // Prepositional phrases
    { regex: /^(.{25,}?)\s+(in|on|at|with|from|by|for|to)\s+/i, description: 'preposition' }
  ];

  let safety = 0;
  while (remaining.length > max && safety < 10) {
    safety++;
    let foundBreak = false;

    for (const bp of breakPoints) {
      const match = remaining.match(bp.regex);
      if (match && match[1]) {
        const chunk = match[1].trim();
        const words = chunk.split(/\s+/).length;

        // Quality checks
        if (chunk.length >= 20 && chunk.length <= hardCap && words <= maxWords) {
          chunks.push(ensurePunctuation(chunk));
          remaining = remaining.substring(match[0].length).trim();
          foundBreak = true;
          break;
        }
      }
    }

    if (!foundBreak) {
      // Emergency break: split at last space before hardCap
      const breakAt = remaining.lastIndexOf(' ', hardCap);
      if (breakAt > 20) {
        chunks.push(ensurePunctuation(remaining.substring(0, breakAt)));
        remaining = remaining.substring(breakAt + 1).trim();
      } else {
        // Last resort: hard split
        chunks.push(ensurePunctuation(remaining.substring(0, hardCap)));
        remaining = remaining.substring(hardCap).trim();
      }
    }
  }

  if (remaining.trim()) {
    chunks.push(ensurePunctuation(remaining));
  }

  return chunks;
}


/**
 * Analyze content density to adjust chunking strategy
 */
function analyzeContentDensity(text) {
  const hasNumbers = /\d/.test(text);
  const hasMultipleNumbers = (text.match(/\d+/g) || []).length >= 3;
  const hasLongWords = /\b\w{12,}\b/.test(text);
  const avgWordLength = text.split(/\s+/).reduce((sum, w) => sum + w.length, 0) /
                        (text.split(/\s+/).length || 1);

  return {
    isHeavy: hasMultipleNumbers || hasLongWords || avgWordLength > 6,
    hasNumbers,
    hasMultipleNumbers,
    hasLongWords,
    avgWordLength
  };
}

/**
 * Break long sentences at natural linguistic boundaries
 */
function breakLongSentence(sentence, { max = 70, hardCap = 80, maxWords = 12 }) {
  const chunks = [];
  let remaining = sentence;

  // Priority-ordered break patterns (universal linguistic patterns)
  const breakPatterns = [
    // Strong clause boundaries
    { regex: /^(.*?[;:])\s+/, priority: 1, addComma: false },

    // Coordinating conjunctions (FANBOYS: for, and, nor, but, or, yet, so)
    { regex: /^(.*?)\s+(and|or|but|yet|so|nor)\s+(?=[A-Z])/i, priority: 2, addComma: true },

    // Subordinating conjunctions
    { regex: /^(.*?)\s+(because|since|although|though|while|whereas|if|when|unless|until|before|after|as)\s+/i, priority: 3, addComma: true },

    // Relative pronouns (that introduce clauses)
    { regex: /^(.*?)\s+(which|that|who|whom|whose|where)\s+/i, priority: 4, addComma: true },

    // Transitional phrases
    { regex: /^(.*?)\s+(however|therefore|moreover|furthermore|meanwhile|consequently|nevertheless)\s*,?\s+/i, priority: 5, addComma: false },

    // Natural comma breaks (but check quality)
    { regex: /^(.*?),\s+(?=[a-z])/i, priority: 6, addComma: false },

    // Prepositional phrases (common ones)
    { regex: /^(.*?)\s+(in order to|in addition to|according to|with respect to|in terms of)\s+/i, priority: 7, addComma: true },

    // Last resort: any word boundary in acceptable range
    { regex: /^(.{30,65}?)\s+/, priority: 8, addComma: false }
  ];

  let safetyCounter = 0;
  const MAX_ITERATIONS = 20;

  while (remaining.length > max && safetyCounter < MAX_ITERATIONS) {
    safetyCounter++;
    let bestMatch = null;

    // Try each pattern
    for (const pattern of breakPatterns) {
      const match = remaining.match(pattern.regex);
      if (match && match[1]) {
        const chunk = match[1].trim();
        const wordCount = chunk.split(/\s+/).length;

        // Quality checks
        if (chunk.length >= 20 &&
            chunk.length <= hardCap &&
            wordCount <= maxWords &&
            wordCount >= 3) {  // At least 3 words

          bestMatch = {
            text: chunk,
            remainder: remaining.substring(match[0].length).trim(),
            conjunction: match[2] || null,
            addComma: pattern.addComma,
            priority: pattern.priority
          };
          break;  // Take first (highest priority) match
        }
      }
    }

    if (bestMatch) {
      // Smart punctuation
      let chunkText = bestMatch.text;
      if (bestMatch.addComma && !/[,;:!?.]$/.test(chunkText)) {
        chunkText += ',';
      }

      chunks.push(ensurePunctuation(chunkText));
      remaining = bestMatch.remainder;
    } else {
      // Emergency: force break at word boundary
      const cutPoint = remaining.lastIndexOf(' ', hardCap);
      if (cutPoint > 20) {
        chunks.push(ensurePunctuation(remaining.substring(0, cutPoint)));
        remaining = remaining.substring(cutPoint + 1).trim();
      } else {
        // Give up, take what we have
        break;
      }
    }
  }

  // Don't forget the last piece
  if (remaining.trim()) {
    chunks.push(ensurePunctuation(remaining));
  }

  return chunks;
}

/**
 * Ensure proper ending punctuation
 */
function ensurePunctuation(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";

  // Already has punctuation? Keep it
  if (/[.!?,;:]$/.test(trimmed)) {
    return trimmed;
  }

  // Question patterns get question marks
  if (/^(what|when|where|why|how|who|which|can|could|would|will|should|do|does|did|is|are|was|were|have|has|had)\b/i.test(trimmed)) {
    return `${trimmed}?`;
  }

  // Commands/imperatives
  if (/^(please|let|make|try|remember|don't|do|go|come|take|give|heat|cook|mix|add|remove)\b/i.test(trimmed)) {
    return `${trimmed}.`;
  }

  // If it looks like end of sentence (capital letter at start, complete thought)
  if (/^[A-Z]/.test(trimmed) && trimmed.split(/\s+/).length >= 4) {
    return `${trimmed}.`;
  }

  // Default: comma for continuation (softer pause, better for lists)
  return `${trimmed},`;
}

function analyzeEmotionalTone(text) {
  const hasExclamation = /!/.test(text);
  const hasQuestion = /\?/.test(text);
  const hasEllipsis = /\.{3}/.test(text);

  return {
    excited: hasExclamation,
    questioning: hasQuestion,
    trailing: hasEllipsis,
    // Add comma hints for better prosody
    needsPause: text.length > 50
  };
}

function* phraseChunkerWithTone(text, options = {}) {
  const tone = analyzeEmotionalTone(text);

  for (const chunk of phraseChunker(text, options)) {
    // If original had excitement, keep it
    if (tone.excited && !chunk.includes('!')) {
      // Don't overdo it, but you could add subtle hints
    }
    yield chunk;
  }
}

function smartPunctuate(text, nextConjunction) {
  const trimmed = text.trim();
  if (!trimmed) return "";

  // Already has punctuation? Keep it
  if (/[.!?,;:]$/.test(trimmed)) {
    return trimmed;
  }

  // If next word is a conjunction, use comma for natural pause
  if (nextConjunction && /^(and|or|but|so)$/i.test(nextConjunction)) {
    return `${trimmed},`;
  }

  // If it's a subordinating clause, use comma
  if (nextConjunction && /^(because|since|although|while|if|when)$/i.test(nextConjunction)) {
    return `${trimmed},`;
  }

  // Default: add comma for breath pause (better than period for mid-thought)
  return `${trimmed},`;
}

/**
 * Enhance chunks with SSML for better prosody
 * Specifically handles ingredient lists and instructions
 */
function enhanceChunksWithSSML(chunks) {
  if (!chunks || chunks.length === 0) return chunks;

  return chunks.map((chunk, index) => {
    const isFirst = index === 0;
    const isLast = index === chunks.length - 1;
    const text = String(chunk || "").trim();

    // Detect chunk type
    const isListItem = /^\d+\s+(and\s+)?\w+\s+(cup|tablespoon|teaspoon|ounce|pound|gram)/i.test(text);
    const isQuestion = /\?$/.test(text);
    const isCommand = /^(heat|cook|mix|add|stir|combine|drop|flip|don't)/i.test(text);
    const endsWithComma = /,$/.test(text);

    let ssml = '<speak>';

    // For list items: faster pace, shorter pauses
    if (isListItem) {
      ssml += `<prosody rate="105%">${text}</prosody>`;
      if (!isLast) {
        ssml += '<break time="200ms"/>';
      }
    }
    // For instructions: normal pace
    else if (isCommand) {
      ssml += text;
      if (!isLast && !endsWithComma) {
        ssml += '<break time="300ms"/>';
      }
    }
    // For questions: add emphasis on question word
    else if (isQuestion) {
      const questionMatch = text.match(/^(what|when|where|why|how|who)/i);
      if (questionMatch) {
        const qWord = questionMatch[1];
        const rest = text.substring(qWord.length);
        ssml += `<emphasis level="moderate">${qWord}</emphasis>${rest}`;
      } else {
        ssml += text;
      }
    }
    // Default: just text
    else {
      ssml += text;
      // If ends with comma, add minimal pause
      if (endsWithComma && !isLast) {
        ssml += '<break time="150ms"/>';
      }
    }

    ssml += '</speak>';

    return ssml;
  });
}


// Better sentence splitter
function splitIntoSentences(text) {
  if (!text) return [];

  // Split on sentence boundaries but preserve common abbreviations
  const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=[.!?])\s+/);

  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
}


// ---- Chunk Manager with Client Response Coordination ----
// ---- Chunk Manager with Client Response Coordination ----
class ChunkManager {
  constructor(peerId) {
    this.peerId = peerId;
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.waitingForClientReady = false;
    this.chunkReadyCallback = null;
    this.timeoutId = null;
    this.playbackStartTimes = []; // Track when each chunk started
  }

  async playChunks(chunks) {
    this.chunks = chunks.filter(chunk => String(chunk || "").trim().length >= 2);
    this.currentChunkIndex = 0;

    console.log(`[ChunkManager:${this.peerId}] Starting ${this.chunks.length} chunks`);

    const peer = connectionManager.getPeer(this.peerId);
    if (!peer?.ttsManager) {
      console.error(`[ChunkManager:${this.peerId}] No TTS manager found`);
      return;
    }

    const ttsManager = peer.ttsManager;

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      console.log(`[ChunkManager:${this.peerId}] Processing chunk ${i + 1}/${this.chunks.length}`);

      if (i === 0) {
        // First chunk: play immediately
        this.playbackStartTimes.push(Date.now());
        await this.playChunkImmediately(chunk);
        continue;
      }

      // Calculate when previous chunk should finish
      const prevChunk = this.chunks[i - 1];
      const prevChunkStartTime = this.playbackStartTimes[i - 1];

      // Use TTS manager's actual duration if available
      let estimatedDuration;
      if (ttsManager.lastChunkDuration > 0) {
        estimatedDuration = ttsManager.lastChunkDuration;
        console.log(`[ChunkManager:${this.peerId}] Using actual duration: ${estimatedDuration}ms`);
      } else {
        estimatedDuration = ttsManager.estimateChunkDuration(prevChunk);
        console.log(`[ChunkManager:${this.peerId}] Using estimated duration: ${estimatedDuration}ms`);
      }

      // Calculate elapsed time since previous chunk started
      const elapsedSinceStart = Date.now() - prevChunkStartTime;

      // Wait for remaining time, plus a small buffer for natural pause
      const NATURAL_PAUSE_MS = 150; // Small pause between sentences
      const remainingWait = Math.max(
        (estimatedDuration - elapsedSinceStart) + NATURAL_PAUSE_MS,
        100 // Minimum 100ms wait
      );

      console.log(`[ChunkManager:${this.peerId}] Waiting ${remainingWait}ms (estimated: ${estimatedDuration}ms, elapsed: ${elapsedSinceStart}ms)`);

      await new Promise(resolve => setTimeout(resolve, remainingWait));

      // Record start time for this chunk
      this.playbackStartTimes.push(Date.now());

      // Play the chunk
      const played = await this.enqueueChunkWithRetry(chunk);
      if (!played) {
        console.warn(`[ChunkManager:${this.peerId}] Chunk ${i + 1} failed to play`);
      }
    }

    console.log(`[ChunkManager:${this.peerId}] Finished all chunks`);
    this.cleanup();
  }

  async playChunkImmediately(chunk) {
    console.log(`[ChunkManager:${this.peerId}] Playing first chunk immediately`);
    return await this.enqueueChunkWithRetry(chunk);
  }

  async playChunkWithClientCoordination(chunk) {
    const peer = connectionManager.getPeer(this.peerId);
    if (!peer) {
      console.warn(`[ChunkManager:${this.peerId}] Peer not found`);
      return false;
    }

    console.log(`[ChunkManager:${this.peerId}] Waiting for client ready signal...`);

    this.waitingForClientReady = true;
    return new Promise((resolve) => {
      this.chunkReadyCallback = (success) => {
        this.cleanupTimeout();
        resolve(success);
      };

      this.timeoutId = setTimeout(() => {
        console.warn(`[ChunkManager:${this.peerId}] Timeout after 5000ms, playing chunk`);
        this.enqueueChunkWithRetry(chunk).then(success => {
          this.chunkReadyCallback(success);
        });
      }, this.MAX_WAIT_TIME);

      if (peer.clientFinishedTalking) {
        console.log(`[ChunkManager:${this.peerId}] Client already finished talking, playing chunk`);
        this.handleClientReady();
      }
    });
  }

  handleClientReady() {
    if (!this.waitingForClientReady || !this.chunkReadyCallback) {
      return;
    }

    const currentChunk = this.chunks[this.currentChunkIndex];
    if (!currentChunk) {
      this.chunkReadyCallback(false);
      return;
    }

    console.log(`[ChunkManager:${this.peerId}] Client ready, playing chunk: "${currentChunk.substring(0, 50)}..."`);

    this.enqueueChunkWithRetry(currentChunk).then(success => {
      this.waitingForClientReady = false;
      this.currentChunkIndex++;
      if (this.chunkReadyCallback) {
        this.chunkReadyCallback(success);
      }
    });
  }

  async enqueueChunkWithRetry(chunk) {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      if (speakText(this.peerId, chunk)) {
        console.log(`[TTS:${this.peerId}] ✅ Queued chunk: "${chunk.substring(0, 50)}..."`);
        return true;
      }

      attempts++;
      console.log(`[TTS:${this.peerId}] Queue full, retry ${attempts}/${maxAttempts}`);
      await new Promise(r => setTimeout(r, 50));
    }

    console.error(`[TTS:${this.peerId}] Failed to queue chunk after ${maxAttempts} attempts`);
    return false;
  }

 cleanupTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  cleanup() {
    this.cleanupTimeout();
    this.waitingForClientReady = false;
    this.chunkReadyCallback = null;
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.playbackStartTimes = [];
    console.log(`[ChunkManager:${this.peerId}] Cleaned up`);
  }

  getStatus() {
    return {
      playing: this.playing,
      queueLength: this.queue.length,
      streamActive: this.streamActive,
      framesSent: this.framesSent,
      currentChunkFrames: this.currentChunkFrameCount,
      totalBytesReceived: this.totalBytesReceived,
      bufferSize: this.audioBuffer.length,
      guardActive: this.guardUntil > Date.now(),
      lastChunkDuration: this.lastChunkDuration,
      playbackHistory: this.playbackHistory.length
    };
  }
}

// --- Final-text sanitizer: remove any accidental tool JSON or code blocks ---
function stripToolEchoes(text) {
  if (!text) return "";
  let t = String(text);

  // Remove fenced blocks: ```json ... ``` or any ```
  t = t.replace(/```json[\s\S]*?```/g, "")
       .replace(/```[\s\S]*?```/g, "");

  // Remove inline JSON that looks like our tool payloads
  // (contains "query" & "results" OR "url" & "summary")
  t = t.replace(
    /\{[^{}]{0,3000}"(?:query|url)"\s*:\s*".*?"[^{}]{0,3000}"(?:results|summary)"\s*:\s*(?:\[|\").*?\}[ \t]*/gs,
    ""
  );

  return t.replace(/\s{2,}/g, " ").trim();
}


// ---- Generic helpers ----
async function withRetry(operation, maxRetries = 3, operationName = "operation") {
  for (let i = 0; i < maxRetries; i++) {
    try { return await operation(); }
    catch (error) {
      console.warn(`[retry] ${operationName} attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

// ---- Qdrant Operations ----
async function ensureQdrant() {
  try {
    const col = encodeURIComponent(QDRANT_COLLECTION);
    const info = await fetch(`${QDRANT_URL}/collections/${col}`);
    if (info.ok) {
      const j = await info.json().catch(() => ({}));
      const cfg = j?.result?.config || j?.result || {};
      const size = cfg?.params?.vectors?.size ?? cfg?.params?.vectors?.default?.size ?? cfg?.params?.vectors?.text?.size ?? null;
      if (size && Number(size) === Number(EMBED_DIM)) {
        console.log(`[qdrant] collection '${QDRANT_COLLECTION}' ok (dim=${size})`);
        return;
      }
      console.warn(`[qdrant] '${QDRANT_COLLECTION}' exists but dim != ${EMBED_DIM} (got ${size})`);
      return;
    }
    const create = await fetch(`${QDRANT_URL}/collections/${col}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: { size: Number(EMBED_DIM), distance: "Cosine" } }),
    });
    if (!create.ok) {
      const body = await create.text().catch(() => "");
      throw new Error(`Create failed: ${create.status} ${body}`);
    }
    console.log(`[qdrant] created '${QDRANT_COLLECTION}' (dim=${EMBED_DIM})`);
    await fetch(`${QDRANT_URL}/collections/${col}/index`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field_name: "tenant_id", field_schema: "keyword" }),
    }).catch(() => {});
  } catch (e) {
    console.error("[qdrant] ensure error:", e?.message || e);
    throw e;
  }
}

async function qdrantSearch(peer, vector, k = Number(MEMORY_TOPK)) {
  if (!vector || !Array.isArray(vector)) return [];
  const { tenantId } = peer || {};
  const col = encodeURIComponent(QDRANT_COLLECTION);
  const bodies = [
    { vector, limit: k, filter: { must: [{ key: "tenant_id", match: { value: tenantId } }] } },
    { vector: { name: "default", vector }, limit: k, filter: { must: [{ key: "tenant_id", match: { value: tenantId } }] } },
    { vector: { name: "text", vector }, limit: k, filter: { must: [{ key: "tenant_id", match: { value: tenantId } }] } },
  ];
  for (const body of bodies) {
    try {
      const r = await fetch(`${QDRANT_URL}/collections/${col}/points/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000)
      });
      if (!r.ok) {
        if (r.status === 400) continue;
        console.warn("[qdrantSearch]", r.status);
        return [];
      }
      const j = await r.json().catch(() => ({}));
      const hits = j.result || [];
      return hits
        .filter((h) => (h.score ?? 0) >= 0.2)
        .map((h) => h.payload?.snippet || h.payload?.text)
        .filter(Boolean);
    } catch (e) {
      console.warn("[qdrantSearch] error:", e?.message || e);
      return [];
    }
  }
  return [];
}

// ---- Persistence ----
async function ensureSession({ userId, personaTag, tenantId, sessionId }) {
  return withRetry(async () => {
    // If sessionId provided, try to reuse
    if (sessionId) {
      const s = await prisma.session.findUnique({ where: { id: sessionId } }).catch(() => null);
      if (s) {
        console.log(`[Session] Reusing session ${sessionId}`);
        return s;
      }
    }

    // NEW: If userId provided, try to find recent session to maintain memory continuity
    if (userId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentSession = await prisma.session.findFirst({
        where: {
          userId: userId,
          started_at: { gte: oneHourAgo }
        },
        orderBy: { started_at: 'desc' }
      }).catch(() => null);

      if (recentSession) {
        console.log(`[Session] Reusing recent session ${recentSession.id} for user ${userId} (${Math.round((Date.now() - recentSession.started_at.getTime()) / 60000)} min old)`);
        return recentSession;
      }
    }

    // Create new session
    console.log(`[Session] Creating new session for user ${userId || 'anonymous'}`);
    return prisma.session.create({
      data: {
        userId: userId || null,
        persona_tag: personaTag || null,
        tenant_id: tenantId || null
      }
    });
  }, 2, "ensureSession");
}

async function nextTurnNo(conversationId) {
  const last = await prisma.turn.findFirst({
    where: { conversation_id: conversationId },
    orderBy: { turn_no: "desc" },
    select: { turn_no: true }
  });
  return (last?.turn_no ?? 0) + 1;
}
async function upsertQdrantTurn({ id, tenantId, conversationId, turnNo, role, text, ts }) {
  try {
    const vector = await embed(text);
    if (!vector) return;
    const col = encodeURIComponent(QDRANT_COLLECTION);
    const payload = {
      tenant_id: tenantId || null,
      conversation_id: conversationId,
      turn_no: turnNo,
      role,
      snippet: String(text).slice(0, 200),
      ts: Math.floor(new Date(ts).getTime()/1000),
      turn_id: id,
    };
    const r = await fetch(`${QDRANT_URL}/collections/${col}/points`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: [{ id, vector, payload }] }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.warn("[qdrant] upsert failed", r.status, t);
    }
  } catch (e) {
    console.warn("[qdrant] upsert error:", e?.message || e);
  }
}
async function saveUserTurn({ sessionId, conversationId, text, tenantId, asrMeta }) {
  const turn_no = await nextTurnNo(conversationId);
  const turn = await prisma.turn.create({
    data: {
      sessionId, conversation_id: conversationId, turn_no,
      role: "user", text, tenant_id: tenantId || null, meta: { asr: asrMeta || {} }
    }
  });
  upsertQdrantTurn({ id: turn.id, tenantId, conversationId, turnNo: turn_no, role: "user", text, ts: turn.ts }).catch(() => {});
  return turn;
}
async function saveAssistantTurn({ sessionId, conversationId, finalText, tenantId, genMeta, llmRaw, llmModel, llmUsage }) {
  const turn_no = await nextTurnNo(conversationId);
  const turn = await prisma.turn.create({
    data: {
      sessionId,
      conversation_id: conversationId,
      turn_no,
      role: "assistant",
      text: finalText,
      tenant_id: tenantId || null,
      meta: genMeta || {},
      llm_raw: llmRaw || null,     // <-- NEW
      llm_model: llmModel || null, // <-- NEW
      llm_usage: llmUsage || null, // <-- NEW
    }
  });
  upsertQdrantTurn({ id: turn.id, tenantId, conversationId, turnNo: turn_no, role: "assistant", text: finalText, ts: turn.ts }).catch(() => {});
  return turn;
}

// ---- LLM Streaming ----
// --- User context loader (User + default Voice + EvoProfile + Facts)
async function loadUserContext(userId) {
  const user = await prisma.user.findUnique({
    where: { id: String(userId) },
    include: {
      voices: { orderBy: [{ isDefault: 'desc' }, { created_at: 'asc' }] },
    },
  });
  if (!user) return null;

  const voice =
    user.voices.find(v => v.isDefault) ||
    user.voices.find(v => v.provider === 'elevenlabs') ||
    user.voices[0] || null;

  const evo = await prisma.evoProfile.findUnique({ where: { userId: user.id } }).catch(() => null);
  const sections = (evo?.sections || {});

  // light completion % (answered sections / total) try that
  const allKeys = Object.keys(sections || {});
  const answered = allKeys.filter(k => sections[k] && Object.keys(sections[k] || {}).length > 0);
  const progressPct = allKeys.length ? Math.round((answered.length / allKeys.length) * 100) : 0;

  // a small batch of high-signal facts
  const facts = await prisma.fact.findMany({
    where: { userId: user.id },
    orderBy: { updated_at: 'desc' },
    take: 20,
  });

  return { user, voice, evo: { sections, progressPct }, facts };
}


// ---- FIXED streamLLM FUNCTION ----

async function streamLLM(systemPrompt, userText, onToken, abort) {
  const startTime = Date.now();
  let fullResponse = ""; // Track the full response internally

  try {
    const r = await fetch(LLM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json",  Authorization: `Bearer ${OPENAI_API_KEY}`},
      body: JSON.stringify({
        model: LLM_MODEL,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
      }),
      signal: abort.signal,
    });
    if (!r.ok) { metrics.llmRequests.inc({ status: 'http_error' }); throw new Error(`LLM HTTP ${r.status}`); }
    if (!r.body) throw new Error('LLM response has no body');
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;

      // Process complete lines separated by a newline
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue; // Skip empty lines

        if (!line.startsWith("data:")) {
          // Skip non-data lines (like chunk markers or initial protocol headers)
          continue;
        }

        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
          const j = JSON.parse(payload);
          const delta = j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.text ?? "";
          if (delta) {
            fullResponse += delta; // Add to full response
            onToken(delta);
          }
        } catch (e) {
          // partial JSON or malformed line, leave it in the buffer to combine with the next chunk
        }
      }
    }

    // FINAL FIX: Process any remaining data in the buffer after the stream ends.
    // This is often the final token fragment that didn't end in a newline.
    if (buf.trim().length > 0) {
        // Re-process the remaining buffer contents
        const finalLines = buf.trim().split('\n');
        for (const line of finalLines) {
             const trimmedLine = line.trim();
             if (trimmedLine.startsWith("data:")) {
                const payload = trimmedLine.slice(5).trim();
                 if (payload && payload !== "[DONE]") {
                    try {
                        const j = JSON.parse(payload);
                        const delta = j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.text ?? "";
                        if (delta) {
                            fullResponse += delta;
                            onToken(delta);
                        }
                    } catch (e) {
                         // Cannot parse, discard the final fragment
                         console.warn("[LLM] Final buffer fragment unparsable:", trimmedLine);
                    }
                 }
             }
        }
    }

    const duration = (Date.now() - startTime) / 1000;
    metrics.requestDuration.observe(duration);
    metrics.llmRequests.inc({ status: 'success' });

  } catch (e) {
    metrics.llmRequests.inc({ status: 'error' });
    throw e;
  }
}


// ---- FIXED TTS Manager (No Stream ID Management) ----

// ---- Enhanced TTS Management Functions ----
function getTTSManager(peerId) {
  const peer = connectionManager.getPeer(peerId);
  if (!peer) return null;
  if (!peer.ttsManager) {
    peer.ttsManager = new TTSManager(peerId);
    console.log(`[TTS] Created new TTS manager for peer: ${peerId}`);
  }
  return peer.ttsManager;
}

function speakText(peerId, text) {
  const ttsManager = getTTSManager(peerId);
  if (ttsManager) return ttsManager.addToQueue(text);
  return false;
}

function stopTTS(peerId) {
  const peer = connectionManager.getPeer(peerId);
  if (peer?.ttsManager) peer.ttsManager.stop();
}

function getTTSStatus(peerId) {
  const peer = connectionManager.getPeer(peerId);
  if (!peer) return null;

  const baseStatus = peer.ttsManager ? peer.ttsManager.getStatus() : {
    playing: false,
    queueLength: 0,
    streamActive: false,
    framesSent: 0,
    totalBytesReceived: 0,
    bufferSize: 0,
    guardActive: false
  };

  // Add client VAD state to TTS status
  return {
    ...baseStatus,
    clientVadState: peer.clientVadState || 'idle',
    clientFinishedTalking: peer.clientFinishedTalking || false,
    lastClientActivity: peer.lastClientActivity || 0
  };
}

async function streamLLMToTTS(peerId, systemPrompt, userText) {
  const peer = connectionManager.getPeer(peerId);
  if (!peer) return;

  const ttsManager = getTTSManager(peerId);
  if (!ttsManager) return;

  const abort = new AbortController();
  peer.currentAbort = abort;

  let currentSentence = "";
  let fullResponse = "";

  try {
    // Start LLM stream
    const llmResponse = await fetch(LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText }
        ],
      }),
      signal: abort.signal,
    });

    const reader = llmResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let lineEnd;

      while ((lineEnd = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);

        if (!line || !line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload);
          const token = json.choices?.[0]?.delta?.content || "";

          if (token) {
            fullResponse += token;
            currentSentence += token;

            // Check if we have a complete sentence
            if (isSentenceComplete(currentSentence)) {
              const sentence = currentSentence.trim();

              // Stream this sentence directly to ElevenLabs
              await streamSentenceToElevenLabs(peerId, sentence, ttsManager);

              currentSentence = ""; // Reset for next sentence
            }
          }
        } catch (e) {
          // Partial JSON, continue
        }
      }
    }

    // Handle remaining text
    if (currentSentence.trim()) {
      await streamSentenceToElevenLabs(peerId, currentSentence.trim(), ttsManager);
    }

    // Save to database
    await saveAssistantTurn({
      sessionId: peer.sessionId,
      conversationId: peer.conversationId,
      finalText: fullResponse,
      tenantId: peer.tenantId,
      genMeta: { model: LLM_MODEL },
      llmRaw: null,
      llmModel: LLM_MODEL,
      llmUsage: null
    });

  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error("[streamLLMToTTS] Error:", e.message);
    }
  } finally {
    peer.currentAbort = null;
  }
}

function optimizeStoryForTTS(storyText) {
  let optimized = String(storyText || "");

  // Ensure proper paragraph spacing for stories
  optimized = optimized.replace(/\n\s*\n/g, '\n\n');

  // Add slight pauses for dramatic effect in stories
  optimized = optimized.replace(/([.!?])\s+/g, '$1  ');

  // Ensure each paragraph is properly formatted
  const paragraphs = optimized.split('\n\n');
  const processedParagraphs = paragraphs.map(paragraph => {
    let p = paragraph.trim();

    // Break very long paragraphs
    if (p.length > 300) {
      const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
      let currentChunk = '';
      const chunks = [];

      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > 250) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
      return chunks.join('\n\n');
    }

    return p;
  });

  return processedParagraphs.join('\n\n');
}

async function generateAndSpeak(peerId, userText) {
  const peer = connectionManager.getPeer(peerId);
  if (!peer) {
    console.warn(`[gen:${peerId}] Peer not found`);
    return;
  }

  if (!peer.memoryManager) {
    console.warn(`[gen:${peerId}] No memory manager, creating new one`);
    peer.memoryManager = new MemoryManager(peer.tenantId, peer.sessionId, prisma);
    await peer.memoryManager.initialize();
  }

  // Check for fact collection triggers
  const factAction = await handleFactCollectionInConversation(
    peerId,
    userText,
    peer
  );

  if (factAction) {
    await enqueueTTS(peerId, factAction.message);
    return;
  }

  const memoryManager = peer.memoryManager;
  memoryManager.addToWorkingMemory("user", userText);
  const memoryContext = await memoryManager.buildMemoryContext(userText);
  const memoryPrompt = memoryManager.formatMemoryForPrompt(memoryContext);

  const userTimeZone = peer.userTimeZone || 'America/New_York';
  const currentTimeOfDay = getCurrentTimeOfDay(userTimeZone);
  const currentTimeInfo = getCurrentTimeInfo(userTimeZone);

  console.log(`[gen:${peerId}] 🕐 Current time: ${currentTimeInfo} (${currentTimeOfDay})`);

  const assistantProfile = {
    name: peer?.assistantProfile?.name || 'Evo',
    gender: peer?.assistantProfile?.gender || 'Female',
    role: peer?.assistantProfile?.relationshipType || 'companion_spouse',
    personality: peer?.assistantProfile?.personality || 'warm, empathetic, and engaging',
    traits: peer?.assistantProfile?.traits || {
      humor: 'medium',
      formality: 'low',
      empathy: 'high',
      directness: 'medium'
    },
    voiceId: peer?.assistantProfile?.voiceId
  };

  const system = buildSystemPrompt({
    peer,
    companion: peer.companionTag || 'spouse_partner',
    userProfile: peer.userProfileCache || {},
    evoProfile: peer.evoProfileCache || null,
    memorySnips: [],
    assistantProfile: assistantProfile,
    recent: memoryContext.working,
    timeOfDay: currentTimeInfo,
    isFirstContactToday: peer.isFirstContactToday,
    welcomeStatus: peer.welcomeStatus,
    memoryContext: memoryPrompt,
    summary: peer.userSummary,
    activeFacts: peer.activeFacts || []
  });

  let debugRowId = null;

  try {
    const row = await saveMemoryDebugTrace({
      prisma,
      tenantId: peer.tenantId,
      sessionId: peer.sessionId,
      conversationId: peer.conversationId ?? null,
      inputText: userText,
      memoryPrompt,                        // full formatted memory block
      systemPrompt: system,                // final system prompt sent to the LLM
      longTermHits: memoryContext.longTerm,// reranked hits you retrieved from Qdrant
      shortTermTurns: memoryContext.shortTerm,
      workingTurns: memoryContext.working,
      coreFactsCount: memoryContext.core?.facts?.length ?? 0,
      modelUsed: null,                     // we’ll update after LLM returns
      sources: null,
      usage: null
    });
    debugRowId = row.id;
  } catch (e) {
    console.warn('[debug] failed to save MemoryDebugTrace pre-response:', e?.message || e);
  }


  const abort = new AbortController();
  peer.currentAbort = abort;

  let fullResponse = "";
  let sources = [];
  let raw = [];
  let usage = null;
  let modelUsed = LLM_MODEL;

  const ttsManager = getTTSManager(peerId);
  if (!ttsManager) {
    console.error(`[TTS:${peerId}] No TTS manager found`);
    return;
  }

  // ✅ Wait for any existing TTS to complete
  if (ttsManager.playing || ttsManager.queue.length > 0) {
    console.log(`[gen:${peerId}] ⏳ Waiting for existing TTS to complete...`);
    let waitCount = 0;
    while ((ttsManager.playing || ttsManager.queue.length > 0) && waitCount < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    console.log(`[gen:${peerId}] ✅ Previous TTS cleared, starting generation`);
  }

  // ✅ Mark that we're generating
  ttsManager.isGenerating = true;
  console.log(`[gen:${peerId}] 🛡️ Generation started - TTS protected`);

  try {
    const needsTools = await shouldUseTools(userText, peer);

    if (needsTools) {
      console.log(`[gen:${peerId}] Using tools for query: "${userText.substring(0, 50)}..."`);

      const result = await llmChatWithWebTools(
        [
          { role: "system", content: system },
          { role: "user", content: String(userText || "") }
        ],
        { maxToolRounds: 2, abortSignal: abort.signal, peerId }
      );

      fullResponse = stripToolEchoes((result.content || "").trim());
      sources = Array.isArray(result.sources) ? result.sources : [];
      raw = result.raw || null;
      usage = result.usage || null;
      modelUsed = result.model || LLM_MODEL;

      if (!fullResponse) {
        fullResponse = "I'm sorry. I don't have an answer right now.";
      }

      console.log(`[LLM:${peerId}] Tool-based response: "${fullResponse.substring(0, 120)}..."`);

      // Process the entire response at once for better flow
      await processCompleteResponse(peerId, fullResponse, ttsManager);

    } else {
      // STREAMING MODE - COLLECT FULL RESPONSE FIRST, THEN PROCESS
      console.log(`[gen:${peerId}] 🎙️ Streaming mode: "${userText.substring(0, 50)}..."`);

      const llmResponse = await fetch(LLM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          stream: true,
          messages: [
            { role: "system", content: system },
            { role: "user", content: String(userText || "") }
          ],
          temperature: 0.7,
          max_tokens: 800  // Increased for stories
        }),
        signal: abort.signal,
      });

      if (!llmResponse.ok) {
        throw new Error(`LLM HTTP ${llmResponse.status}`);
      }

      const reader = llmResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Collect the full response first
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let lineEnd;

        while ((lineEnd = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);

          if (!line || !line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload);
            const token = json.choices?.[0]?.delta?.content || "";
            if (token) {
              fullResponse += token;
            }
          } catch (e) {
            // Partial JSON, continue
          }
        }
      }

      // Handle remaining buffer
      if (buffer.trim()) {
        const finalLines = buffer.trim().split('\n');
        for (const line of finalLines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data:")) {
            const payload = trimmedLine.slice(5).trim();
            if (payload && payload !== "[DONE]") {
              try {
                const json = JSON.parse(payload);
                const token = json.choices?.[0]?.delta?.content || "";
                if (token) {
                  fullResponse += token;
                }
              } catch (e) {
                console.warn("[Stream] Final buffer fragment unparsable");
              }
            }
          }
        }
      }

      console.log(`[Stream:${peerId}] ✅ Complete response received: ${fullResponse.length} chars`);

      // Process the complete response for optimal TTS flow
      await processCompleteResponse(peerId, fullResponse, ttsManager);
    }

    // ✅ CRITICAL: Mark generation as complete AFTER all TTS is queued
    ttsManager.isGenerating = false;
    console.log(`[gen:${peerId}] 🎬 Generation complete - TTS unprotected`);

    // Real-time fact extraction
    //setImmediate(() => {
      const conversationText = fullResponse
      ? `user: ${userText}\nassistant: ${fullResponse}`
      : `user: ${userText}`;

      const res = await runFactsExtractionAndSave({
            prisma,
                userId: peer.tenantId,
                transcript: conversationText,
                llmUrl: process.env.LLM_URL,
                llmModel: process.env.LLM_MODEL,
                apiKey: process.env.OPENAI_API_KEY
            });
      // memoryManager.extractFactsRealTime(userText, fullResponse).catch(e => {
      //   console.error(`[Memory] Fact extraction error:`, e.message);
      // });
    //});

    // Save assistant turn
    const conversationContext = {
      recentTurns: memoryContext.working.slice(-8),
      turnNumber: memoryContext.working.length,
      currentQuery: userText,
      sessionId: peer.sessionId,
      currentRole: 'assistant'
    };

    await saveAssistantTurn({
      sessionId: peer.sessionId,
      conversationId: peer.conversationId,
      finalText: fullResponse,
      tenantId: peer.tenantId,
      genMeta: { model: modelUsed, sources },
      llmRaw: raw,
      llmModel: modelUsed,
      llmUsage: usage
    }).catch(e => console.error("[persist] saveAssistantTurn failed:", e.message));

    let conversationId = peer.conversationId;

    setImmediate(() => {
      memoryManager.saveAssistantTurnWithContext(
        fullResponse,
        conversationContext,
        conversationId,
        { sources, usage, model: modelUsed }
      ).catch(e => {
        console.error(`[Memory] saveAssistantTurnWithContext error:`, e.message);
      });
    });

    memoryManager.addToWorkingMemory("assistant", fullResponse);

    if (memoryContext.working.length % MEMORY_CONFIG.CONSOLIDATE_AFTER_TURNS === 0) {
      memoryManager.consolidateMemories().catch(e => {
        console.error(`[Memory:${peerId}] Consolidation error:`, e.message);
      });
    }

  } catch (e) {
    // ✅ Ensure we always unprotect on error
    if (ttsManager) {
      ttsManager.isGenerating = false;
    }

    if (e.name !== 'AbortError') {
      console.error("[generateAndSpeak] Error:", e.message);
      speakText(peerId, "I'm sorry. I could not process that request.");
    }
    throw e;
  } finally {
    peer.currentAbort = null;
  }
}

// NEW: Process complete response for optimal TTS flow
async function processCompleteResponse(peerId, fullResponse, ttsManager) {
  console.log(`[TTS:${peerId}] 🎯 Processing complete response for optimal TTS flow`);

  // Detect story content
  const isStoryContent = fullResponse.length > 300 ||
                       fullResponse.toLowerCase().includes('story') ||
                       fullResponse.split(/\s+/).length > 50;

  let processedText = fullResponse;

  if (isStoryContent) {
    console.log(`[TTS:${peerId}] 📖 Story content detected, applying batch processing`);
    processedText = optimizeStoryForTTS(fullResponse);
  }

  const normalized = normalizeForTTS(processedText);
  const speakReady = rewriteForSpeech(normalized, { enable: SPEECH_REWRITE !== "0" });

  // For stories, use larger chunks to reduce API calls
  const chunkOptions = isStoryContent ? {
    min: 50,      // Larger minimum for stories
    max: 120,     // Larger maximum for stories
    hardCap: 150, // Increased hard cap
    maxWords: 25, // More words per chunk
    storyMode: true
  } : {
    min: 25,
    max: 70,
    hardCap: 75,
    maxWords: 12
  };

  const rawChunks = Array.from(phraseChunker(speakReady, chunkOptions));

  console.log(`[TTS:${peerId}] Generated ${rawChunks.length} chunks (story mode: ${isStoryContent})`);

  if (isStoryContent) {
    // For stories, process in batches to maintain flow
    await processStoryChunks(peerId, rawChunks, ttsManager);
  } else {
    // For regular responses, use standard processing
    const peer = connectionManager.getPeer(peerId);
    if (!peer.chunkManager) {
      peer.chunkManager = new ChunkManager(peerId);
    }
    peer.chunkManager.playChunks(rawChunks).catch(e => {
      console.error(`[TTS:${peerId}] Chunk playback error:`, e.message);
    });
  }
}

// NEW: Process story chunks with optimal batching
async function processStoryChunks(peerId, chunks, ttsManager) {
  console.log(`[TTS:${peerId}] 📚 Processing ${chunks.length} story chunks with optimal batching`);

  // Group chunks into logical paragraphs (2-3 chunks per group)
  const groupedChunks = [];
  let currentGroup = [];

  for (let i = 0; i < chunks.length; i++) {
    currentGroup.push(chunks[i]);

    // Group 2-3 chunks together, or if we're at the end
    if (currentGroup.length >= 2 || i === chunks.length - 1) {
      groupedChunks.push([...currentGroup]);
      currentGroup = [];
    }
  }

  console.log(`[TTS:${peerId}] 📦 Grouped into ${groupedChunks.length} batches`);

  // Process each group sequentially
  for (let groupIndex = 0; groupIndex < groupedChunks.length; groupIndex++) {
    const group = groupedChunks[groupIndex];
    const isLastGroup = groupIndex === groupedChunks.length - 1;

    console.log(`[TTS:${peerId}] 🎵 Processing batch ${groupIndex + 1}/${groupedChunks.length} with ${group.length} chunks`);

    // Process all chunks in this group
    for (let chunkIndex = 0; chunkIndex < group.length; chunkIndex++) {
      const chunk = group[chunkIndex];
      const isLastInGroup = chunkIndex === group.length - 1;

      // Wait if queue is getting full
      while (ttsManager.queue.length >= 2) {
        console.log(`[TTS:${peerId}] ⏳ Queue full (${ttsManager.queue.length}), waiting...`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const queued = ttsManager.addToQueue(chunk);
      console.log(`[TTS:${peerId}] ${queued ? '✅' : '❌'} Queued chunk ${chunkIndex + 1} in batch ${groupIndex + 1}`);

      // Small pause between chunks in same group
      if (!isLastInGroup) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Longer pause between groups (paragraph breaks)
    if (!isLastGroup) {
      console.log(`[TTS:${peerId}] ⏸️ Paragraph break pause`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`[TTS:${peerId}] ✅ All story chunks queued`);
}

// Keep the same optimizeStoryForTTS function
function optimizeStoryForTTS(storyText) {
  let optimized = String(storyText || "");

  // Ensure proper paragraph spacing for stories
  optimized = optimized.replace(/\n\s*\n/g, '\n\n');

  // Add slight pauses for dramatic effect in stories
  optimized = optimized.replace(/([.!?])\s+/g, '$1  ');

  // Ensure each paragraph is properly formatted
  const paragraphs = optimized.split('\n\n');
  const processedParagraphs = paragraphs.map(paragraph => {
    let p = paragraph.trim();

    // Break very long paragraphs
    if (p.length > 300) {
      const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
      let currentChunk = '';
      const chunks = [];

      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > 250) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
      return chunks.join('\n\n');
    }

    return p;
  });

  return processedParagraphs.join('\n\n');
}

// Helper: Determine if query needs web tools
async function shouldUseTools(userText, peer) {
  const text = String(userText || "").toLowerCase();

  // Tool triggers
  const toolTriggers = [
    /search|look up|find|google/i,
    /weather|temperature|forecast/i,
    /near me|nearby|around here|close to/i,
    /restaurant|coffee|food|place to eat/i,
    /what'?s (happening|new|going on)/i,
    /news|current|latest|recent/i,
    /update (my|your|assistant)/i,
    /change (your|assistant) (name|personality|voice)/i,
    /(my|i) (live|am|work)/i,
    /remember (that|this)/i
  ];

  return toolTriggers.some(pattern => pattern.test(text));
}

// Helper: Stream sentence directly to ElevenLabs
// Helper: Stream sentence directly to ElevenLabs
async function streamSentenceToElevenLabs(peerId, text, ttsManager) {
  const peer = connectionManager.getPeer(peerId);
  if (!peer || !peer.audioSource) {
    console.warn(`[Stream:${peerId}] No peer or audio source`);
    return;
  }

  // Set audioSource on ttsManager
  ttsManager.audioSource = peer.audioSource;

  console.log(`[Stream:${peerId}] 🎯 Streaming to ElevenLabs: "${text.substring(0, 50)}..."`);

  const normalized = normalizeForTTS(text);
  const speakReady = rewriteForSpeech(normalized, { enable: SPEECH_REWRITE !== "0" });

  const voiceID = peer?.assistantProfile?.voiceId || ELEVEN_VOICE_ID;
  const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceID)}/stream`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`[Stream:${peerId}] ElevenLabs request timeout`);
    controller.abort();
  }, parseInt(REQUEST_TIMEOUT_MS) || 20000);

  try {
    const response = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        text: speakReady,
        model_id: ELEVEN_MODEL_ID,
        optimize_streaming_latency: 4,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8
        },
        output_format: "mp3_44100_128",  // ✅ Use MP3 (ElevenLabs default, most reliable)
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Stream:${peerId}] ElevenLabs API error: ${response.status} - ${errorText}`);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ElevenLabs returned no audio data');
    }

    console.log(`[Stream:${peerId}] ✅ ElevenLabs request successful, starting FFmpeg processing`);

    // Mark stream as active and process
    ttsManager.streamActive = true;
    ttsManager.currentChunkStartTime = Date.now();
    ttsManager.currentChunkFrameCount = 0;

    // Reset audio buffer for this chunk
    ttsManager.audioBuffer = Buffer.alloc(0);

    await processStreamWithFFmpeg(peerId, response.body, ttsManager);

    // Calculate actual duration
    const actualDuration = ttsManager.calculateActualDuration();
    ttsManager.lastChunkDuration = actualDuration;

    // Store in history
    ttsManager.playbackHistory.push({
      text: text,
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      frames: ttsManager.currentChunkFrameCount,
      duration: actualDuration,
      timestamp: Date.now()
    });

    if (ttsManager.playbackHistory.length > 5) {
      ttsManager.playbackHistory.shift();
    }

    console.log(`[Stream:${peerId}] ✅ Sentence completed: ${ttsManager.currentChunkFrameCount} frames, ${actualDuration}ms`);

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log(`[Stream:${peerId}] Stream aborted`);
    } else {
      console.error(`[Stream:${peerId}] ElevenLabs streaming error:`, error.message);
    }
    throw error;
  }
}

// Updated processStreamWithFFmpeg - auto-detect format
async function processStreamWithFFmpeg(peerId, readableStream, ttsManager) {
  return new Promise((resolve, reject) => {
    console.log(`[Stream:${peerId}] 🔧 Starting FFmpeg audio processing`);

    // ✅ FIXED: Let FFmpeg auto-detect input format, output to WebRTC format
    const ffmpegArgs = [
      "-hide_banner",
      "-loglevel", "error",
      "-i", "pipe:0",              // Auto-detect input format (MP3, PCM, etc.)
      "-f", "s16le",               // Output format: signed 16-bit little-endian PCM
      "-acodec", "pcm_s16le",      // Output codec
      "-ac", "1",                  // Output: mono
      "-ar", "48000",              // Output: 48kHz (required for WebRTC)
      "pipe:1"                     // Write to stdout
    ];

    let proc;
    try {
      proc = spawn(FFMPEG_BIN, ffmpegArgs, {
        stdio: ["pipe", "pipe", "pipe"]
      });
      ttsManager.proc = proc;
      console.log(`[Stream:${peerId}] ✅ FFmpeg process started (PID: ${proc.pid})`);
    } catch (e) {
      console.error(`[Stream:${peerId}] ❌ Failed to start FFmpeg:`, e.message);
      ttsManager.streamActive = false;
      reject(new Error(`FFmpeg failed: ${e.message}`));
      return;
    }

    let audioDataReceived = false;
    let bytesProcessed = 0;
    let stderrOutput = '';

    // Handle FFmpeg output (converted audio)
    proc.stdout.on('data', (chunk) => {
      if (!ttsManager.streamActive) {
        console.warn(`[Stream:${peerId}] Stream not active, discarding data`);
        return;
      }

      audioDataReceived = true;
      bytesProcessed += chunk.length;
      ttsManager.totalBytesReceived += chunk.length;

      ttsManager.audioBuffer = Buffer.concat([ttsManager.audioBuffer, chunk]);
      ttsManager.processAudioFrames();

      // Log progress less frequently to reduce spam
      if (bytesProcessed % 100000 === 0) {
        console.log(`[Stream:${peerId}] 🔊 Processed ${bytesProcessed} bytes, ${ttsManager.framesSent} frames sent`);
      }
    });

    // Collect stderr for debugging
    proc.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    proc.on('error', (error) => {
      console.error(`[Stream:${peerId}] ❌ FFmpeg process error:`, error.message);
      ttsManager.streamActive = false;
      reject(new Error(`FFmpeg error: ${error.message}`));
    });

    proc.on('close', (code) => {
      console.log(`[Stream:${peerId}] 🔚 FFmpeg exited with code ${code}`);

      // Show stderr if there was an error
      if (code !== 0 && code !== 255 && stderrOutput) {
        console.error(`[Stream:${peerId}] FFmpeg stderr:\n${stderrOutput}`);
      }

      // Process any remaining audio data
      if (ttsManager.audioBuffer.length > 0) {
        console.log(`[Stream:${peerId}] Processing final ${ttsManager.audioBuffer.length} bytes`);
        ttsManager.processAudioFrames();
      }

      ttsManager.streamActive = false;
      ttsManager.proc = null;

      if (code === 0 || code === 255) {
        if (!audioDataReceived) {
          console.warn(`[Stream:${peerId}] ⚠️ FFmpeg completed but no audio data received`);
          reject(new Error("No audio data received from FFmpeg"));
        } else {
          console.log(`[Stream:${peerId}] ✅ Stream completed: ${ttsManager.framesSent} frames sent (${bytesProcessed} bytes processed)`);
          resolve();
        }
      } else {
        console.error(`[Stream:${peerId}] ❌ FFmpeg failed with code ${code}`);
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });

    // Pump ElevenLabs data to FFmpeg
    const pumpToFFmpeg = async () => {
      const reader = readableStream.getReader();
      try {
        let totalReceived = 0;
        while (ttsManager.streamActive) {
          const { value, done } = await reader.read();
          if (done) {
            console.log(`[Stream:${peerId}] ElevenLabs stream complete (${totalReceived} bytes received)`);
            break;
          }

          totalReceived += value.length;

          if (proc && proc.stdin && !proc.stdin.destroyed) {
            const canWrite = proc.stdin.write(Buffer.from(value));
            if (!canWrite) {
              await new Promise(resolve => proc.stdin.once('drain', resolve));
            }
          } else {
            console.warn(`[Stream:${peerId}] FFmpeg stdin destroyed, stopping pump`);
            break;
          }
        }
      } catch (error) {
        if (ttsManager.streamActive) {
          console.error(`[Stream:${peerId}] ❌ Stream read error:`, error.message);
          reject(error);
        }
        return;
      } finally {
        if (proc && proc.stdin && !proc.stdin.destroyed) {
          console.log(`[Stream:${peerId}] Closing FFmpeg stdin`);
          proc.stdin.end();
        }
      }
    };

    pumpToFFmpeg().catch(reject);
  });
}

// Helper: Check if sentence is complete (already in your code, but here for reference)

function isSentenceComplete(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Must end with sentence punctuation
  if (!/[.!?]$/.test(trimmed)) return false;

  // Must have minimum length to avoid false positives
  if (trimmed.length < 10) return false;

  // Must have at least 2 words
  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 2) return false;

  // Avoid breaking on abbreviations
  const commonAbbreviations = ['mr', 'mrs', 'ms', 'dr', 'prof', 'vs', 'etc', 'e.g', 'i.e'];
  const lastWord = trimmed.split(/\s+/).pop().toLowerCase().replace(/[.!?]/g, '');
  if (commonAbbreviations.includes(lastWord)) {
    return false;
  }

  return true;
}

function sanitizeForSpeech(text) {
  if (!text) return "";
  let clean = String(text);

  // --- Strip markdown/link noise ---
  clean = clean
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // [title](url) -> title
    .replace(/`([^`]+)`/g, '$1')               // inline code
    .replace(/[*_~`#>]+/g, '');                // md markers

  // --- Remove bullets at line starts (•, -, *) ---
  clean = clean.replace(/^\s*[-*+•]\s+/gm, '');

  // --- Remove numbering at line starts (1. , 2. ) ---
  clean = clean.replace(/^\s*\d+\.\s+/gm, '');

  // --- Remove INLINE numbering like "...: 1. Foo 2. Bar 3. Baz" ---
  // also handles "(1) Foo (2) Bar"
  clean = clean
    .replace(/(^|[\s:])\d+\.\s+/g, '$1')     // " 1. " -> " "
    .replace(/(^|[\s:])\(\d+\)\s+/g, '$1');  // " (1) " -> " "

  // --- Collapse multiple numbered/bulleted segments into natural prose ---
  // Convert common list separators to semicolons for smooth TTS
  // e.g., "Foo - desc  Bar - desc" or "Foo — desc  Bar — desc"
  clean = clean
    .replace(/\s*[-–—]\s*/g, ' — ')     // normalize dash spacing
    .replace(/\s{2,}/g, ' ')            // tighten spaces
    .replace(/\s*;\s*/g, '; ');         // normalize semicolons

  // If we detect many short segments, prefer semicolons between them.
  // Turn residual ". " between short phrases into "; " to avoid machine-gun periods.
  const manyItems = (clean.match(/\b(?:—|,)\s/g) || []).length >= 3
                 || (clean.match(/\b[A-Z][^.;:]{1,40}\s—\s/g) || []).length >= 3;
  if (manyItems) {
    clean = clean
      // Replace ") . " or ".) " patterns safely
      .replace(/([^\s])\.\s+(?=[A-Z0-9])/g, '$1; ');
  }

  // --- Remove raw URLs (if any leaked) ---
  clean = clean.replace(/https?:\/\/\S+/gi, '');

  // --- Punctuation spacing & whitespace ---
  clean = clean.replace(/\s+([.,!?;:])/g, '$1');
  clean = clean.replace(/([.,!?;:])([^\s])/g, '$1 $2');
  clean = clean.replace(/\s{2,}/g, ' ').trim();

  return clean;
}


async function generateAndSpeak(peerId, userText) {
  const peer = connectionManager.getPeer(peerId);
  if (!peer) {
    console.warn(`[gen:${peerId}] Peer not found`);
    return;
  }

  if (!peer.memoryManager) {
    console.warn(`[gen:${peerId}] No memory manager, creating new one`);
    peer.memoryManager = new MemoryManager(peer.tenantId, peer.sessionId, prisma);
    await peer.memoryManager.initialize();
  }

  // Check for fact collection triggers
  // const factAction = await handleFactCollectionInConversation(
  //   peerId,
  //   userText,
  //   peer
  // );

  // if (factAction) {
  //   await enqueueTTS(peerId, factAction.message);
  //   return;
  // }

  const memoryManager = peer.memoryManager;
  memoryManager.addToWorkingMemory("user", userText);
  const memoryContext = await memoryManager.buildMemoryContext(userText);
  const memoryPrompt = memoryManager.formatMemoryForPrompt(memoryContext);

  const userTimeZone = peer.userTimeZone || 'America/New_York';
  const currentTimeOfDay = getCurrentTimeOfDay(userTimeZone);
  const currentTimeInfo = getCurrentTimeInfo(userTimeZone);

  console.log(`[gen:${peerId}] 🕐 Current time: ${currentTimeInfo} (${currentTimeOfDay})`);

  const assistantProfile = {
    name: peer?.assistantProfile?.name || 'Evo',
    gender: peer?.assistantProfile?.gender || 'Female',
    role: peer?.assistantProfile?.relationshipType || 'companion_spouse',
    personality: peer?.assistantProfile?.personality || 'warm, empathetic, and engaging',
    traits: peer?.assistantProfile?.traits || {
      humor: 'medium',
      formality: 'low',
      empathy: 'high',
      directness: 'medium'
    },
    voiceId: peer?.assistantProfile?.voiceId
  };

  const system = buildSystemPrompt({
    peer,
    companion: peer.companionTag || 'spouse_partner',
    userProfile: peer.userProfileCache || {},
    evoProfile: peer.evoProfileCache || null,
    memorySnips: [],
    assistantProfile: assistantProfile,
    recent: memoryContext.working,
    timeOfDay: currentTimeInfo,
    isFirstContactToday: peer.isFirstContactToday,
    welcomeStatus: peer.welcomeStatus,
    memoryContext: memoryPrompt,
    summary: peer.userSummary,
    activeFacts: peer.activeFacts || []
  });

  let debugRowId = null;

  try {
    const row = await saveMemoryDebugTrace({
      prisma,
      tenantId: peer.tenantId,
      sessionId: peer.sessionId,
      conversationId: peer.conversationId ?? null,
      inputText: userText,
      memoryPrompt,                         // full formatted memory block
      systemPrompt: system,                 // final system prompt sent to the LLM
      longTermHits: memoryContext.longTerm, // reranked hits retrieved from Qdrant
      shortTermTurns: memoryContext.shortTerm,
      workingTurns: memoryContext.working,
      coreFactsCount: memoryContext.core?.facts?.length ?? 0,
      modelUsed: null,                      // will update after LLM returns
      sources: null,
      usage: null
    });
    debugRowId = row?.id || null;
  } catch (e) {
    console.warn('[debug] failed to save MemoryDebugTrace pre-response:', e?.message || e);
  }

  const abort = new AbortController();
  peer.currentAbort = abort;

  let fullResponse = "";
  let sources = [];
  let raw = [];
  let usage = null;
  let modelUsed = LLM_MODEL;

  const ttsManager = getTTSManager(peerId);
  if (!ttsManager) {
    console.error(`[TTS:${peerId}] No TTS manager found`);
    return;
  }

  // ✅ Wait for any existing TTS to complete
  if (ttsManager.playing || ttsManager.queue.length > 0) {
    console.log(`[gen:${peerId}] ⏳ Waiting for existing TTS to complete...`);
    let waitCount = 0;
    while ((ttsManager.playing || ttsManager.queue.length > 0) && waitCount < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    console.log(`[gen:${peerId}] ✅ Previous TTS cleared, starting generation`);
  }

  // ✅ Mark that we're generating
  ttsManager.isGenerating = true;
  console.log(`[gen:${peerId}] 🛡️ Generation started - TTS protected`);

  try {
    const needsTools = await shouldUseTools(userText, peer);

    // FORCE BATCH PROCESSING FOR ALL CONTENT - NO STREAMING TO TTS
    console.log(`[gen:${peerId}] 🎯 Using batch processing for: "${userText.substring(0, 50)}..."`);

    if (needsTools) {
      console.log(`[gen:${peerId}] Using tools for query`);

      const result = await llmChatWithWebTools(
        [
          { role: "system", content: system },
          { role: "user", content: String(userText || "") }
        ],
        { maxToolRounds: 2, abortSignal: abort.signal, peerId }
      );

      fullResponse = stripToolEchoes((result.content || "").trim());
      sources = Array.isArray(result.sources) ? result.sources : [];
      raw = result.raw || null;
      usage = result.usage || null;
      modelUsed = result.model || LLM_MODEL;

    } else {
      // NON-STREAMING LLM CALL - GET COMPLETE RESPONSE FIRST
      console.log(`[gen:${peerId}] 📝 Getting complete LLM response (non-streaming)`);

      const llmResponse = await fetch(LLM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          stream: false,  // ← CRITICAL: No streaming
          messages: [
            { role: "system", content: system },
            { role: "user", content: String(userText || "") }
          ],
          temperature: 0.7,
          max_tokens: 800
        }),
        signal: abort.signal,
      });

      if (!llmResponse.ok) {
        throw new Error(`LLM HTTP ${llmResponse.status}`);
      }

      const json = await llmResponse.json();
      fullResponse = json.choices[0].message.content;
      usage = json.usage;
      modelUsed = json.model;
    }

    if (!fullResponse) {
      fullResponse = "I'm sorry. I don't have an answer right now.";
    }

    console.log(`[gen:${peerId}] ✅ Complete response: "${fullResponse.substring(0, 100)}..." (${fullResponse.length} chars)`);

    // PROCESS ENTIRE RESPONSE AS A BATCH
    await processCompleteResponseBatch(peerId, fullResponse, ttsManager);

    // ✅ CRITICAL: Mark generation as complete AFTER all TTS is queued
    ttsManager.isGenerating = false;
    console.log(`[gen:${peerId}] 🎬 Generation complete - TTS unprotected`);

    // Real-time fact extraction
    setImmediate(() => {
      memoryManager.extractFactsRealTime(userText, fullResponse).catch(e => {
        console.error(`[Memory] Fact extraction error:`, e.message);
      });
    });

    // Save assistant turn
    const conversationContext = {
      recentTurns: memoryContext.working.slice(-8),
      turnNumber: memoryContext.working.length,
      currentQuery: userText,
      sessionId: peer.sessionId,
      currentRole: 'assistant'
    };

    await saveAssistantTurn({
      sessionId: peer.sessionId,
      conversationId: peer.conversationId,
      finalText: fullResponse,
      tenantId: peer.tenantId,
      genMeta: { model: modelUsed, sources },
      llmRaw: raw,
      llmModel: modelUsed,
      llmUsage: usage
    }).catch(e => console.error("[persist] saveAssistantTurn failed:", e.message));

    let conversationId = peer.conversationId;

    setImmediate(() => {
      memoryManager.saveAssistantTurnWithContext(
        fullResponse,
        conversationContext,
        conversationId,
        { sources, usage, model: modelUsed }
      ).catch(e => {
        console.error(`[Memory] saveAssistantTurnWithContext error:`, e.message);
      });
    });

    memoryManager.addToWorkingMemory("assistant", fullResponse);

    if (memoryContext.working.length % MEMORY_CONFIG.CONSOLIDATE_AFTER_TURNS === 0) {
      memoryManager.consolidateMemories().catch(e => {
        console.error(`[Memory:${peerId}] Consolidation error:`, e.message);
      });
    }

  } catch (e) {
    // ✅ Ensure we always unprotect on error
    if (ttsManager) {
      ttsManager.isGenerating = false;
    }

    if (e.name !== 'AbortError') {
      console.error("[generateAndSpeak] Error:", e.message);
      speakText(peerId, "I'm sorry. I could not process that request.");
    }
    throw e;
  } finally {
    peer.currentAbort = null;
  }
}

// NEW: Batch process complete response with optimal chunking
async function processCompleteResponseBatch(peerId, fullResponse, ttsManager) {
  console.log(`[TTS:${peerId}] 🎯 Batch processing complete response`);

  const isStoryContent = fullResponse.length > 200 ||
                       fullResponse.toLowerCase().includes('story') ||
                       /(once upon|there was|every day|suddenly|finally)/i.test(fullResponse);

  let processedText = fullResponse;

  if (isStoryContent) {
    console.log(`[TTS:${peerId}] 📖 Story content detected, using story-optimized processing`);
    processedText = optimizeStoryForTTS(fullResponse);
  }

  const normalized = normalizeForTTS(processedText);
  const speakReady = rewriteForSpeech(normalized, { enable: SPEECH_REWRITE !== "0" });

  // Use larger, more natural chunks
  const chunkOptions = isStoryContent ? {
    min: 60,
    max: 150,     // Much larger for stories
    hardCap: 180,
    maxWords: 30,
    storyMode: true
  } : {
    min: 40,
    max: 100,
    hardCap: 120,
    maxWords: 20
  };

  const rawChunks = Array.from(phraseChunker(speakReady, chunkOptions));

  console.log(`[TTS:${peerId}] Generated ${rawChunks.length} chunks (story: ${isStoryContent})`);

  if (rawChunks.length === 0) {
    console.warn(`[TTS:${peerId}] No chunks generated from response`);
    return;
  }

  // Log chunk preview
  rawChunks.forEach((chunk, i) => {
    console.log(`[TTS:${peerId}] Chunk ${i+1}: "${chunk.substring(0, 40)}..." (${chunk.length} chars)`);
  });

  // Process chunks with optimal strategy
  if (isStoryContent) {
    await processStoryChunksBatch(peerId, rawChunks, ttsManager);
  } else {
    await processRegularChunksBatch(peerId, rawChunks, ttsManager);
  }
}

// NEW: Process story chunks with minimal API calls
async function processStoryChunksBatch(peerId, chunks, ttsManager) {
  console.log(`[TTS:${peerId}] 📚 Processing ${chunks.length} story chunks with batch strategy`);

  // Combine small chunks to reduce API calls
  const optimizedChunks = [];
  let currentCombined = '';

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // If combining with current would be reasonable size, combine them
    if (currentCombined && (currentCombined.length + chunk.length) <= 180) {
      currentCombined += ' ' + chunk;
    } else {
      // Push previous combined chunk if it exists
      if (currentCombined) {
        optimizedChunks.push(currentCombined);
      }
      // Start new combined chunk
      currentCombined = chunk;
    }
  }

  // Don't forget the last chunk
  if (currentCombined) {
    optimizedChunks.push(currentCombined);
  }

  console.log(`[TTS:${peerId}] 📦 Optimized ${chunks.length} → ${optimizedChunks.length} chunks`);

  // Queue optimized chunks with pacing
  for (let i = 0; i < optimizedChunks.length; i++) {
    const chunk = optimizedChunks[i];
    const isLast = i === optimizedChunks.length - 1;

    // Wait if queue has items (but allow some overlap for natural flow)
    while (ttsManager.queue.length >= 2) {
      console.log(`[TTS:${peerId}] ⏳ Queue has ${ttsManager.queue.length} items, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const queued = ttsManager.addToQueue(chunk);
    console.log(`[TTS:${peerId}] ${queued ? '✅' : '❌'} Queued optimized chunk ${i+1}/${optimizedChunks.length} (${chunk.length} chars)`);

    // Natural pause between story segments (but not after the last one)
    if (!isLast) {
      const pauseTime = chunk.endsWith('.') ? 200 : 100;
      await new Promise(resolve => setTimeout(resolve, pauseTime));
    }
  }

  console.log(`[TTS:${peerId}] ✅ All story chunks queued (${optimizedChunks.length} total)`);
}

// NEW: Process regular chunks
async function processRegularChunksBatch(peerId, chunks, ttsManager) {
  console.log(`[TTS:${peerId}] Processing ${chunks.length} regular chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLast = i === chunks.length - 1;

    // Wait if queue is getting full
    while (ttsManager.queue.length >= 3) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const queued = ttsManager.addToQueue(chunk);
    console.log(`[TTS:${peerId}] ${queued ? '✅' : '❌'} Queued chunk ${i+1}/${chunks.length}`);

    // Small pause between chunks for natural flow
    if (!isLast) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

// Enhanced story optimization
function optimizeStoryForTTS(storyText) {
  let optimized = String(storyText || "");

  // Remove excessive newlines but keep paragraph breaks
  optimized = optimized.replace(/\n\s*\n/g, '\n\n');
  optimized = optimized.replace(/\n+/g, ' ');

  // Ensure proper spacing after sentences
  optimized = optimized.replace(/([.!?])([A-Z])/g, '$1 $2');

  // Clean up excessive punctuation
  optimized = optimized.replace(/[.!?]{2,}/g, '.');
  optimized = optimized.replace(/[,;]{2,}/g, ',');

  return optimized.trim();
}


/**
 * Unified TTS function for both LLM responses and fact collection
 * Uses your existing chunk-based playback system
 */
async function enqueueTTS(peerId, text) {
  const peer = connectionManager.getPeer(peerId);
  if (!peer) {
    console.warn(`[TTS:${peerId}] Peer not found`);
    return;
  }

  // Normalize and rewrite for speech (your existing functions)
  const normalized = normalizeForTTS(text);
  const speakReady = rewriteForSpeech(normalized, {
    enable: SPEECH_REWRITE !== "0"
  });


  if (!peer.ttsManager) {
    console.log(`[dev/tts:${peerId}] TTS manager missing, creating new one`);
    peer.ttsManager = new TTSManager(peerId);
  }

  // Generate chunks (your existing logic)
  const rawChunks = Array.from(
    phraseChunker(speakReady, {
      min: 25,
      max: 70,
      hardCap: 75,
      maxWords: 12
    })
  );

  console.log(`[TTS:${peerId}] Generated ${rawChunks.length} chunks from fact system`);

  // Log chunks in development
  if (NODE_ENV === 'development') {
    rawChunks.forEach((chunk, i) => {
      console.log(`[TTS:${peerId}] Chunk ${i + 1}: "${chunk}" (${chunk.length} chars)`);
    });
  }

  // Initialize ChunkManager if needed
  if (!peer.chunkManager) {
    peer.chunkManager = new ChunkManager(peerId);
  }

  // Play chunks using your existing system
  try {
    await peer.chunkManager.playChunks(rawChunks);
  } catch (error) {
    console.error(`[TTS:${peerId}] Chunk playback error:`, error.message);
  }
}

// Helper: Detect complete sentences
function isSentenceComplete(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Check if ends with sentence punctuation
  if (!/[.!?]$/.test(trimmed)) return false;

  // Must have minimum length (avoid false positives like "Dr.")
  if (trimmed.length < 15) return false;

  // Must have at least 3 words
  if (trimmed.split(/\s+/).length < 3) return false;

  return true;
}



/** Returns [{title, url, snippet}] */
async function webSearch(query, { maxResults = parseInt(SEARCH_MAX_RESULTS, 10) } = {}) {
  const q = String(query || "").trim();
  if (!q) return [];


  if (q.includes('near me')) {
    const location = peer.userLocation;
    const searchQuery = `${q} in ${location.city} ${location.region}`;
  // Search with location context
  }

  try {
    if (SEARCH_PROVIDER === "tavily" && TAVILY_API_KEY) {
      const r = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": TAVILY_API_KEY },
        body: JSON.stringify({
          query: searchQuery,
          search_depth: "advanced",
          include_answer: false,
          include_images: false,
          max_results: maxResults,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) return [];
      const j = await r.json().catch(() => ({}));
      const arr = Array.isArray(j.results) ? j.results : [];
      return arr.map((it) => ({
        title: it.title || it.url || "result",
        url: it.url,
        snippet: (it.content || it.snippet || "").slice(0, 600),
      }));
    }

    if (SEARCH_PROVIDER === "serpapi" && SERPAPI_KEY) {
      const u = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&num=${maxResults}&api_key=${encodeURIComponent(SERPAPI_KEY)}`;
      const r = await fetch(u, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) return [];
      const j = await r.json().catch(() => ({}));
      const arr = Array.isArray(j.organic_results) ? j.organic_results : [];
      return arr.slice(0, maxResults).map((it) => ({
        title: it.title || it.link || "result",
        url: it.link,
        snippet: (it.snippet || (it.snippet_highlighted_words || []).join(" ") || "").slice(0, 600),
      }));
    }
  } catch (_) {}

  return [];
}

// --- Weather helpers -------------------------------------------------

function weatherCodeToText(code, isDay = 1) {
  const map = {
    0: "clear sky",
    1: "mainly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "fog",
    48: "depositing rime fog",
    51: "light drizzle",
    53: "moderate drizzle",
    55: "dense drizzle",
    56: "light freezing drizzle",
    57: "dense freezing drizzle",
    61: "light rain",
    63: "moderate rain",
    65: "heavy rain",
    66: "light freezing rain",
    67: "heavy freezing rain",
    71: "light snow",
    73: "moderate snow",
    75: "heavy snow",
    77: "snow grains",
    80: "light rain showers",
    81: "moderate rain showers",
    82: "violent rain showers",
    85: "light snow showers",
    86: "heavy snow showers",
    95: "thunderstorm",
    96: "thunderstorm with light hail",
    99: "thunderstorm with heavy hail",
  };
  // Night tweak for the very clearest codes
  if ((code === 0 || code === 1) && !isDay) return "clear night";
  return map[code] || "conditions unavailable";
}

/**
 * Fetch current weather + today's hi/lo.
 * Default provider: Open-Meteo (no API key).
 * Optional provider: WeatherAPI.com (set env WEATHERAPI_KEY for city names, etc).
 *
 * @param {number} lat
 * @param {number} lon
 * @param {"fahrenheit"|"celsius"|"imperial"|"metric"} unit
 * @returns {Promise<{
 *   provider: string,
 *   unit: "F"|"C",
 *   city?: string,
 *   current: { temp?: number, wind?: number, code?: number, description?: string },
 *   daily?: { high?: number, low?: number, precip?: number },
 *   summary: string
 * }>}
 */
async function fetchWeatherFromExternalAPI(lat, lon, unit = "fahrenheit") {
  const isImperial = /^(f(ahrenheit)?|imperial|us)$/i.test(String(unit));
  const UNIT = isImperial ? "F" : "C";

  // If you provide WEATHERAPI_KEY, use WeatherAPI.com (nicer location names)
  const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;
  if (WEATHERAPI_KEY) {
    try {
      const url = new URL("https://api.weatherapi.com/v1/forecast.json");
      url.searchParams.set("key", WEATHERAPI_KEY);
      url.searchParams.set("q", `${lat},${lon}`); // lat,lon
      url.searchParams.set("days", "1");
      url.searchParams.set("aqi", "no");
      url.searchParams.set("alerts", "no");

      const r = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error(`WeatherAPI HTTP ${r.status}`);
      const j = await r.json();

      const loc = j.location || {};
      const cur = j.current || {};
      const f = j.forecast?.forecastday?.[0];
      const day = f?.day || {};

      const temp = isImperial ? cur.temp_f : cur.temp_c;
      const wind = isImperial ? cur.wind_mph : cur.wind_kph;
      const high = isImperial ? day.maxtemp_f : day.maxtemp_c;
      const low  = isImperial ? day.mintemp_f : day.mintemp_c;
      const precip = isImperial ? day.totalprecip_in : day.totalprecip_mm;

      const city = [loc.name, loc.region, loc.country].filter(Boolean).join(", ");
      const desc = (cur.condition?.text || ""); // already human readable

      const summary = `${Math.round(temp)}°${UNIT}, ${desc}${Number.isFinite(high) ? `, high ${Math.round(high)}°` : ""}${Number.isFinite(low) ? `, low ${Math.round(low)}°` : ""}.`;

      return {
        provider: "weatherapi.com",
        unit: UNIT,
        city,
        current: { temp, wind, code: cur.condition?.code ?? null, description: desc },
        daily: { high, low, precip },
        summary
      };
    } catch (e) {
      // Fall through to Open-Meteo on failure
      console.warn("[weather] WeatherAPI failed, falling back:", e.message);
    }
  }

  // Open-Meteo: no key, fast, reliable
  const base = "https://api.open-meteo.com/v1/forecast";
  const u = new URL(base);
  u.searchParams.set("latitude", String(lat));
  u.searchParams.set("longitude", String(lon));
  u.searchParams.set("current_weather", "true");
  u.searchParams.set("timezone", "auto");
  u.searchParams.set("hourly", "precipitation_probability,weathercode,apparent_temperature");
  u.searchParams.set("daily", "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum");
  u.searchParams.set("temperature_unit", isImperial ? "fahrenheit" : "celsius");
  u.searchParams.set("windspeed_unit", isImperial ? "mph" : "kmh");
  u.searchParams.set("precipitation_unit", isImperial ? "inch" : "mm");

  const r = await fetch(u.toString(), { signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`);
  const j = await r.json();

  const cur = j.current_weather || {};
  const daily = j.daily || {};
  const hi = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : undefined;
  const lo = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : undefined;
  const precip = Array.isArray(daily.precipitation_sum) ? daily.precipitation_sum[0] : undefined;

  const desc = weatherCodeToText(cur.weathercode, cur.is_day);
  const summary = `${Math.round(cur.temperature)}°${UNIT}, ${desc}${Number.isFinite(hi) ? `, high ${Math.round(hi)}°` : ""}${Number.isFinite(lo) ? `, low ${Math.round(lo)}°` : ""}.`;

  return {
    provider: "open-meteo",
    unit: UNIT,
    // No reverse geocode here (keeps it fast, no extra dependency)
    current: { temp: cur.temperature, wind: cur.windspeed, code: cur.weathercode, description: desc },
    daily: { high: hi, low: lo, precip },
    summary
  };
}

/**
 * Get approximate location from IP address using ip-api.com (free)
 */
async function getLocationFromIP(ipAddress) {
  // Skip private IPs
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
    return null;
  }

  try {
    const url = `http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.status !== 'success') return null;

    console.log(`[Location] IP geolocation: ${data.city}, ${data.regionName}`);

    return {
      city: data.city,
      region: data.regionName,
      country: data.country,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone
    };
  } catch (e) {
    console.warn(`[Location] IP geolocation failed:`, e.message);
    return null;
  }
}

// Update resolveUserLocation to include IP lookup:
async function resolveUserLocation(userId, cityOverride = null, ipAddress = null) {
  // 1. Explicit city (same as before)
  if (cityOverride) {
    console.log(`[Location] Using explicit city: ${cityOverride}`);
    try {
      const coords = await geocodeCity(cityOverride);
      return {
        source: 'explicit',
        city: cityOverride,
        lat: coords.lat,
        lon: coords.lon
      };
    } catch (e) {
      console.warn(`[Location] Failed to geocode ${cityOverride}:`, e.message);
    }
  }

  // 2. User profile (same as before)
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentCity: true,
        currentRegion: true,
        currentCountry: true,
        timezone: true
      }
    }).catch(() => null);

    if (user?.currentCity) {
      const locationStr = [user.currentCity, user.currentRegion, user.currentCountry]
        .filter(Boolean)
        .join(', ');

      console.log(`[Location] Using user profile: ${locationStr}`);

      try {
        const coords = await geocodeCity(locationStr);
        console.log('LOCATION: - got coords from geocode', coords)
        return {
          source: 'profile',
          city: user.currentCity,
          region: user.currentRegion,
          country: user.currentCountry,
          lat: coords.lat,
          lon: coords.lon,
          timezone: user.timezone
        };
      } catch (e) {
        console.warn(`[Location] Failed to geocode profile location:`, e.message);
      }
    }
  }

  // // 3. NEW: Try IP-based geolocation
  // if (ipAddress) {
  //   const ipLocation = await getLocationFromIP(ipAddress);
  //   if (ipLocation) {
  //     return
  //       source: 'ip',
  //       ...ipLocation
  //     };
  //   }
  // }

  // 4. Default fallback
  console.log(`[Location] Using default location: New York, NY`);
  return {
    source: 'default',
    city: 'New York',
    region: 'NY',
    country: 'United States',
    lat: 40.7128,
    lon: -74.0060,
    timezone: 'America/New_York'
  };
}


/**
 * Lets the model call web_search and web_fetch; returns final answer + sources.
 */
/**
 * Calls the model with web tools; handles tool calls and returns a clean answer.
 * Requires vLLM to be started with:
 *   --enable-auto-tool-choice --tool-call-parser llama
 */
async function llmChatWithWebTools(
  messages,
  { maxToolRounds = 2, abortSignal, peerId } = {}
) {
  // If TOOL_FEWSHOT is causing bias, remove it:
  // const convo = [{ role: "system", content: TOOL_USE_SYSTEM }, ...messages];
  const convo = [{ role: "system", content: TOOL_USE_SYSTEM }, ...TOOL_FEWSHOT, ...messages];

  const sources = [];
  const rawResponses = [];

  for (let round = 0; round <= maxToolRounds; round++) {
    const r = await fetch(LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: convo,
        tools: WEB_TOOLS,
        tool_choice: "auto",
        // tune as you like:
        max_tokens: 300,
        temperature: 0.4,
        stream: false,
        n: 1,
      }),
      signal: abortSignal ?? AbortSignal.timeout(parseInt(process.env.REQUEST_TIMEOUT_MS || "45000", 10)),
    });

    if (!r.ok) {
      console.log('The request', {
        model: LLM_MODEL,
        messages: convo,
        tools: WEB_TOOLS,
        tool_choice: "auto",
        // tune as you like:
        max_tokens: 300,
        temperature: 0.7,
        stream: false,
        n: 1,
      })
      throw new Error(`LLM HTTP  - ${LLM_URL}  - Model ${LLM_MODEL}  ${r.status}`)
    };
    const j = await r.json().catch(() => ({}));
    rawResponses.push(j);


    const choice = j.choices?.[0] || {};
    const msg = choice.message || {};
    const toolCalls = msg.tool_calls || [];

    console.log('[llm] Response:', {
      hasToolCalls: !!toolCalls.length,
      toolCalls: toolCalls.map(tc => tc.function?.name),
      content: msg.content?.substring(0, 100)
    });

    // No tools — return final
    if (!toolCalls.length) {
      return {
        content: stripToolEchoes(msg.content || ""),
        sources,
        raw: rawResponses,
        usage: j.usage || null,
        model: j.model || LLM_MODEL,
      };
    }

    console.log('[llm] Tool calls requested:', toolCalls.length);

    convo.push({
      role: 'assistant',
      content: msg.content || null,
      tool_calls: toolCalls
    });

    // Pull peer context once
    const peer = peerId ? connectionManager.getPeer(peerId) : null;
    const userId = peer?.tenantId || peer?.user?.id || null; // if you set it
    const userLocation = peer?.userLocation || null;        // expected shape: { lat, lon }
    const lat = userLocation?.lat ?? null;
    const lon = userLocation?.lon ?? null;

    console.log('this is the user location', userLocation);
    console.log('Peer', peer);

    // Handle tools
    for (const call of toolCalls) {
      if (call.type !== "function") continue;

      const fn = call.function?.name;
      console.log(`[llm] Calling tool: ${fn}`);

      let args = {};
      try { args = JSON.parse(call.function?.arguments || "{}"); }
      catch (err) { console.error(`[llm] Failed to parse args for ${fn}:`, err); }

      // ----------------- web_search -----------------
      if (fn === "web_search") {
        const query = String(args.query || "").trim();
        const maxResults = Math.max(1, Math.min(8, Number(args.maxResults || 5)));
        const isLocalQuery = /near me|nearby|around here|close to me/i.test(query);

        try {
          if (isLocalQuery && lat != null && lon != null) {
            // Convert to local POI when the user intent is local and we have coords
            console.log(`[llm] Converting web_search → local POI: "${query}" @ ${lat},${lon}`);
            const poiResults = await searchLocalPOI(lat, lon, query, maxResults);

            const payload = JSON.stringify({
              query,
              location: { lat, lon },
              results: poiResults.map(r => ({
                title: r.name || r.title || 'Place',
                url: r.url,
                snippet: [r.address, r.rating ? `${r.rating} stars` : ""].filter(Boolean).join(" • "),
                lat: r.lat, lon: r.lon,
              })),
            });

            // Track sources
            poiResults.forEach(r => { if (r.url) sources.push({ title: r.name || r.title || 'Place', url: r.url }); });

            convo.push({ role: "tool", tool_call_id: call.id, name: "web_search", content: payload });
          } else {
            // Regular web search
            const results = await webSearch(query, { maxResults, userLocation: userLocation || undefined });
            results.forEach((r) => sources.push({ title: r.title, url: r.url }));

            const payload = JSON.stringify({
              query,
              results: results.map(r => ({ title: r.title, url: r.url, snippet: r.snippet })),
            });

            convo.push({ role: "tool", tool_call_id: call.id, name: "web_search", content: payload });
          }
        } catch (error) {
          console.error(`[llm] web_search error:`, error);
          convo.push({ role: "tool", tool_call_id: call.id, name: "web_search", content: JSON.stringify({ error: "Search failed" }) });
        }
      }

      if (fn === "update_assistant_profile") {
        try {
          const currentProfile = peer?.assistantProfile || {};
          const result = await handleUpdateAssistantProfile(args, userId, currentProfile);

          if (result.success) {
            // Update peer's cached profile
            if (peer && peer.assistantProfile) {
              if (result.updatedProfile.name) {
                peer.assistantProfile.name = result.updatedProfile.name;
              }
              if (result.updatedProfile.personality) {
                peer.assistantProfile.personality = result.updatedProfile.personality;
              }
              if (result.updatedProfile.speakingStyle) {
                peer.assistantProfile.speakingStyle = result.updatedProfile.speakingStyle;
              }
              if (result.updatedProfile.traits) {
                peer.assistantProfile.traits = result.updatedProfile.traits;
              }
            }

            const payload = JSON.stringify({
              success: true,
              changes: result.changes,
              message: `Successfully updated: ${result.changes.join(', ')}`
            });

            convo.push({ role: "tool", tool_call_id: call.id, name: fn, content: payload });
          } else {
            convo.push({
              role: "tool",
              tool_call_id: call.id,
              name: fn,
              content: JSON.stringify({ success: false, error: result.error })
            });
          }
        } catch (error) {
          console.error(`[llm] update_assistant_profile error:`, error);
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            name: fn,
            content: JSON.stringify({ success: false, error: "Failed to update profile" })
          });
        }
        continue;
      }

      if (fn === 'update_user_fact') {
        try {
          const context = {
            prisma,
            userId: peer?.tenantId,
            peer
          };

          const result = await updateUserFact(args, context);

          if (result.success) {
            console.log(`[UserFact] Saved: [${result.category}] ${args.fact}`);

            const payload = JSON.stringify({
              success: true,
              message: result.message
            });

            convo.push({
              role: "tool",
              tool_call_id: call.id,
              name: fn,
              content: payload
            });
          } else {
            convo.push({
              role: "tool",
              tool_call_id: call.id,
              name: fn,
              content: JSON.stringify({ success: false, error: result.message })
            });
          }
        } catch (error) {
          console.error(`[llm] update_user_fact error:`, error);
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            name: fn,
            content: JSON.stringify({ success: false, error: "Failed to save fact" })
          });
        }
        continue;
      }

      if (fn === 'update_user_location') {
         //try {
          const context = {
            prisma,
            peerId,
            userId,
            peer,
            connectionManager
          };

          console.log('updating user location')
          const result = await updateUserLocation(args, context);

          if (result.success) {
            // Update peer's cached location
            if (peer) {
              peer.userLocation = result.location;

              // Also update profile cache
              if (peer.userProfileCache) {
                peer.userProfileCache.currentCity = result.location.city;
                peer.userProfileCache.currentRegion = result.location.region;
                peer.userProfileCache.currentCountry = result.location.country;
              }
            }

            const payload = JSON.stringify({
              success: true,
              message: result.message,
              location: result.location
            });

            convo.push({ role: "tool", tool_call_id: call.id, name: fn, content: payload });
          } else {
            convo.push({
              role: "tool",
              tool_call_id: call.id,
              name: fn,
              content: JSON.stringify({ success: false, error: result.message })
            });
          }
        // } catch (error) {
        //   console.error(`[llm] update_user_location error:`, error);
        //   convo.push({
        //     role: "tool",
        //     tool_call_id: call.id,
        //     name: fn,
        //     content: JSON.stringify({ success: false, error: "Failed to update location" })
        //   });
        // }
        continue;
      }

      // ----------------- web_fetch -----------------
      if (fn === "web_fetch") {
        const url = String(args.url || "").trim();
        const maxChars = Math.max(500, Math.min(20000, Number(args.maxChars || 6000)));
        const summarize = args.summarize !== false;

        try {
          const fetched = await webFetch(url, { maxChars, summarize });
          if (fetched?.ok) sources.push({ title: fetched.title || url, url: fetched.url });

          const payload = JSON.stringify({
            url,
            ok: !!fetched?.ok,
            title: fetched?.title || "",
            excerpt: fetched?.excerpt || "",
            summary: fetched?.summary || "",
          });
          convo.push({ role: "tool", tool_call_id: call.id, name: "web_fetch", content: payload });
        } catch (error) {
          console.error(`[llm] web_fetch error:`, error);
          convo.push({ role: "tool", tool_call_id: call.id, name: "web_fetch", content: JSON.stringify({ error: "Fetch failed" }) });
        }
      }

      // -------------- get_local_weather --------------
      if (fn === "get_local_weather") {
        if (lat == null || lon == null) {
          console.warn('[llm] get_local_weather: No location available');
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            name: fn,
            content: JSON.stringify({ error: "Location unavailable. Ask user to share location." }),
          });
          continue;
        }

        try {
          const unit = String(args.unit || "fahrenheit");
          const w = await fetchWeatherFromExternalAPI(lat, lon, unit);
          const payload = JSON.stringify({
            location: w.city || "Your location",
            unit: w.unit,
            provider: w.provider,
            summary: w.summary,
            current: w.current,
            daily: w.daily,
          });
          convo.push({ role: "tool", tool_call_id: call.id, name: fn, content: payload });
        } catch (error) {
          console.error(`[llm] get_local_weather error:`, error);
          convo.push({ role: "tool", tool_call_id: call.id, name: fn, content: JSON.stringify({ error: "Weather fetch failed" }) });
        }
      }

      // ----- local_point_of_interest_search (direct tool) -----
      if (fn === "local_point_of_interest_search") {


        try {

          const searchTerm = String(args.search_term || "").trim();
          const maxResults = Math.max(1, Math.min(10, Number(args.max_results || 5)));

          // Get userId from peer context
          const peer = connectionManager.getPeer(peerId);
          const userId = peer?.tenantId; // or however you access userId

          if (!peer?.userLocation) {
              console.warn('[llm] No user location available');
              convo.push({
                role: "tool",
                tool_call_id: call.id,
                name: fn,
                content: JSON.stringify({
                  error: "NO_LOCATION",
                  message: "I don't know your current location. Please share your location or tell me where you are."
                })
              });
              continue;
          }

          // Call with correct signature
          const poiResponse = await searchLocalPOI(searchTerm, userId, {
            maxResults: maxResults,
            userLocation: userLocation
          });

        // Check if it returned an error
            if (poiResponse.error) {
              console.log('we had a poi error');
              convo.push({
                role: "tool",
                tool_call_id: call.id,
                name: fn,
                content: JSON.stringify({
                  error: poiResponse.message || "POI search failed"
                })
              });
              continue;
            }

            const payload = JSON.stringify({
              query: searchTerm,
              location: poiResponse.location,
              answer: poiResponse.answer,
              results: poiResponse.results.map(r => ({
                title: r.title,
                url: r.url,
                content: r.content,
                score: r.score
              })),
            });

      poiResponse.results.forEach(r => {
        if (r.url) sources.push({ title: r.title || 'Place', url: r.url });
      });

      convo.push({ role: "tool", tool_call_id: call.id, name: fn, content: payload });} catch (error) {
              console.error(`[llm] local_point_of_interest_search error:`, error);
              convo.push({
                role: "tool",
                tool_call_id: call.id,
                name: fn,
                content: JSON.stringify({ error: "POI search failed", details: error.message }),
              });
            }
          }
        } // end for toolCalls
      } // end for rounds

  return {
    content: "Sorry, I couldn't find enough reliable information to answer confidently.",
    sources,
    raw: rawResponses,
    usage: null,
    model: LLM_MODEL,
  };
}


function parseLatLonFromGoogleMapsUrl(url) {
  try {
    // Patterns like: https://www.google.com/maps/place/.../@37.7749,-122.4194,15z
    const m = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(url);
    if (m) return { lat: Number(m[1]), lon: Number(m[2]) };
    // Or query params: ...?q=37.7749,-122.4194
    const u = new URL(url);
    const q = u.searchParams.get('q');
    if (q) {
      const parts = q.split(',').map(Number);
      if (parts.length >= 2 && parts.every(n => !Number.isNaN(n))) {
        return { lat: parts[0], lon: parts[1] };
      }
    }
  } catch (_) {}
  return { lat: null, lon: null };
}
function extractRating(snippet = "") {
  // catch "4.6 stars", "Rating: 4.5", "4.3 ★"
  const m = snippet.match(/(\d(?:\.\d)?)\s*(?:stars?|★|rating)/i);
  return m ? Number(m[1]) : null;
}
function extractAddressFromSnippet(snippet = "") {
  // grab a plausible address-like phrase if present
  const lines = String(snippet).split(/\n|·|\u2022|–|—/).map(s => s.trim());
  const addr = lines.find(l => /\d{1,5}\s+[A-Za-z0-9.'\- ]+\s+(St|Ave|Blvd|Rd|Road|Street|Avenue|Boulevard|Lane|Ln|Dr|Drive|Way|Place|Pl|Court|Ct)\b/i.test(l));
  return addr || "";
}

/**
 * Search local points of interest using Tavily web search, biased to POI sites.
 * @param {number} lat
 * @param {number} lon
 * @param {string} searchTerm
 * @param {number} maxResults
 * @returns {Promise<Array<{name:string,address:string,rating:number|null,lat:number|null,lon:number|null,url:string,source:string}>>}
 */
async function searchLocalPOIss(lat, lon, searchTerm, maxResults = 3) {
  const q = String(searchTerm || "restaurant").trim();
  const limit = Math.max(1, Math.min(10, Number(maxResults) || 3));

  if (!TAVILY_API_KEY) {
    console.warn("[poi:tavily] TAVILY_API_KEY missing.");
    return [];
  }

  // Bias toward POI aggregators for structured snippets/urls
  const query = `${q} near ${lat.toFixed(4)}, ${lon.toFixed(4)} site:google.com/maps OR site:yelp.com OR site:tripadvisor.com`;

  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": TAVILY_API_KEY
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        max_results: Math.min(8, limit * 3) // overfetch a bit, then filter
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!r.ok) {
      console.warn("[poi:tavily] HTTP", r.status, await r.text().catch(() => ""));
      return [];
    }
    const j = await r.json().catch(() => ({}));
    const results = Array.isArray(j.results) ? j.results : [];

    // Normalize & lightly parse
    const mapped = results.map((it) => {
      const title = (it.title || "").trim();
      const url = (it.url || "").trim();
      const snippet = (it.content || it.snippet || "").trim();

      // Clean common suffixes
      const name = title
        .replace(/\s*-+\s*Google Maps.*$/i, "")
        .replace(/\s*-+\s*Yelp.*$/i, "")
        .replace(/\s*-+\s*Tripadvisor.*$/i, "")
        .trim();

      const { lat: gLat, lon: gLon } = /google\.com\/maps/i.test(url)
        ? parseLatLonFromGoogleMapsUrl(url)
        : { lat: null, lon: null };

      return {
        name: name || q,
        address: extractAddressFromSnippet(snippet),
        rating: extractRating(snippet),
        lat: gLat,
        lon: gLon,
        url,
        source: "tavily"
      };
    });

    // De-dup by name+url (rough)
    const seen = new Set();
    const deduped = [];
    for (const m of mapped) {
      const key = `${m.name}|${m.url}`;
      if (!seen.has(key)) { seen.add(key); deduped.push(m); }
      if (deduped.length >= limit) break;
    }

    return deduped;
  } catch (e) {
    console.warn("[poi:tavily] error:", e?.message || e);
    return [];
  }
}


// --- Helpers: HTML → text and main-content extraction ---
function decodeEntities(s) {
  const m = { "&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"', "&#39;":"'", "&nbsp;":" " };
  return String(s || "")
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (k) => m[k] || k)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n,10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n,16)));
}

function stripScriptsStyles(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
}

function extractTitle(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? decodeEntities(m[1]).trim().replace(/\s+/g, " ").slice(0, 200) : "";
}

function htmlToText(html) {
  let h = stripScriptsStyles(String(html || ""));
  // collapse certain blocks to newlines for readable text
  h = h.replace(/<(?:h\d|p|div|article|section|header|footer|main|li|br|tr|td|th)[^>]*>/gi, "\n");
  h = h.replace(/<\/(?:h\d|p|div|article|section|header|footer|main|li|tr|td|th)>/gi, "\n");
  // remove the rest of tags
  h = h.replace(/<[^>]+>/g, "");
  // decode entities and clean whitespace
  const t = decodeEntities(h)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return t;
}

function extractMainHtml(html) {
  // Try article or main if present; otherwise fall back to body
  const article = /<article[\s\S]*?>([\s\S]*?)<\/article>/i.exec(html)?.[1];
  if (article) return article;
  const main = /<main[\s\S]*?>([\s\S]*?)<\/main>/i.exec(html)?.[1];
  if (main) return main;
  const body = /<body[\s\S]*?>([\s\S]*?)<\/body>/i.exec(html)?.[1];
  return body || html;
}

// --- Fetch + extract + optional summarize ---
async function webFetch(url, { maxChars = 6000, summarize = true } = {}) {
  const u = String(url || "").trim();
  if (!/^https?:\/\//i.test(u)) {
    return { ok: false, error: "Invalid URL (must start with http/https)" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const r = await fetch(u, {
      redirect: "follow",
      headers: { "User-Agent": "voice-gateway/1.0 (+bot)" },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!r.ok) {
      return { ok: false, error: `HTTP ${r.status}` };
    }

    const ctype = (r.headers.get("content-type") || "").toLowerCase();
    // Only handle text-ish content here
    if (!/text\/html|text\/plain|application\/json/.test(ctype)) {
      return { ok: false, error: `Unsupported content-type: ${ctype}` };
    }

    // Limit body to ~1MB to avoid memory spikes
    const reader = r.body?.getReader();
    let raw = "";
    if (reader) {
      const dec = new TextDecoder();
      let size = 0, limit = 1_000_000;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) break;
        raw += dec.decode(value, { stream: true });
      }
      raw += dec.decode();
    } else {
      raw = await r.text();
      if (raw.length > 1_000_000) raw = raw.slice(0, 1_000_000);
    }

    let title = "";
    let text = "";

    if (/text\/html/.test(ctype)) {
      title = extractTitle(raw);
      const mainHtml = extractMainHtml(raw);
      text = htmlToText(mainHtml);
    } else if (/application\/json/.test(ctype)) {
      try {
        const j = JSON.parse(raw);
        text = JSON.stringify(j, null, 2);
      } catch {
        text = raw;
      }
    } else {
      text = raw;
    }

    text = text.trim();
    if (!text) return { ok: false, error: "Empty page" };

    const excerpt = text.slice(0, maxChars);

    let summary = "";
    if (summarize) {
      try {
        summary = await summarizeFetchedText({ title, url: u, text: excerpt });
      } catch {
        summary = "";
      }
    }

    return {
      ok: true,
      url: u,
      title,
      length: text.length,
      excerpt,
      summary
    };
  } catch (e) {
    clearTimeout(timeout);
    return { ok: false, error: e.message || "fetch failed" };
  }
}

// --- Use your LLM to make a compact, neutral summary of the fetched content ---
async function summarizeFetchedText({ title, url, text }) {
  const sys = [
    "Summarize the fetched page for a general audience.",
    "Be concise and factual. Include concrete figures/dates when present.",
    "Output 4–6 short sentences. No numbered lists. End each sentence with a period.",
  ].join(" ");

  const user = `Title: ${title || "(untitled)"}\nURL: ${url}\n\nCONTENT START\n${text}\nCONTENT END`;

  const r = await fetch(LLM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: LLM_MODEL,
      stream: false,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user }
      ]
    }),
    signal: AbortSignal.timeout(parseInt(process.env.REQUEST_TIMEOUT_MS || "45000", 10))
  });

  if (!r.ok) return "";
  const j = await r.json().catch(() => ({}));
  return j.choices?.[0]?.message?.content?.trim?.() || "";
}




// Phrase chunker: short, speech-first chunks with a strict hard cap
// function* phraseChunker(
//   text,
//   {
//     min = CHUNK_MIN_CHARS,
//     max = CHUNK_MAX_CHARS,
//     hardCap = CHUNK_HARD_CAP,
//     maxWords = CHUNK_MAX_WORDS,
//   } = {}
// ) {
//   if (!text) return;

//   const addPeriod = (s) => {
//     const t = String(s || "").trim();
//     if (!t) return "";
//     if (!CHUNK_PAD_PERIOD) return t;
//     return /[.!?]$/.test(t) ? t : `${t}.`;
//   };

//   const lines = String(text)
//     .split(/\r?\n+/)
//     .map((s) => s.trim())
//     .filter(Boolean);

//   for (let line of lines) {
//     // Bullets pass through, but still enforce hard cap
//     if (/^([•\-\*\u2022]|\d+\.)\s+/.test(line)) {
//       let l = line.trim();
//       while (l.length > hardCap) {
//         yield addPeriod(l.slice(0, hardCap));
//         l = l.slice(hardCap);
//       }
//       if (l) yield addPeriod(l);
//       continue;
//     }

//     // Prefer sentence boundaries first
//     const sentences = line.match(/[^.!?]+[.!?]|[^.!?]+$/g) || [line];
//     for (const sentenceRaw of sentences) {
//       let s = sentenceRaw.trim();
//       if (!s) continue;

//       if (s.length <= hardCap) {
//         yield addPeriod(s);
//         continue;
//       }

//       // Split by soft delimiters to form sub-phrases
//       const softParts = s
//         .split(/\s*(?:,|;|\s+\band\b|\s+\bor\b|\s+\bthen\b|\s+\bwhich\b)\s*/i)
//         .map((x) => x.trim())
//         .filter(Boolean);

//       let buf = "";
//       for (const part of softParts) {
//         const candidate = buf ? `${buf} ${part}` : part;

//         const wordCount = candidate.split(/\s+/).filter(Boolean).length;
//         const tooLong = candidate.length > hardCap || wordCount > maxWords;

//         if (tooLong) {
//           if (buf) {
//             // emit what we have and start a new one with current part
//             yield addPeriod(buf);
//             buf = part.length > hardCap ? "" : part;
//           } else {
//             // Hard slice last resort when a single part is too long
//             let chunk = part;
//             while (chunk.length > hardCap) {
//               yield addPeriod(chunk.slice(0, hardCap));
//               chunk = chunk.slice(hardCap);
//             }
//             buf = chunk;
//           }
//         } else {
//           buf = candidate;
//         }
//       }
//       if (buf) yield addPeriod(buf);
//     }
//   }
// }


// ---- WebRTC Connection Health Monitoring ----
function setupPeerHealthCheck(peerId) {
  const healthCheck = setInterval(() => {
    const peer = connectionManager.getPeer(peerId);
    if (!peer) { clearInterval(healthCheck); return; }
    const timeSinceActivity = Date.now() - peer.lastActivity;
    if (timeSinceActivity > 60000 && peer.connectionState !== 'connected') {
      console.error(`[WebRTC:${peerId}] No activity for 60s and connection not active, cleaning up`);
      clearInterval(healthCheck);
      connectionManager.cleanupPeer(peerId);
    }
  }, 15000);
  const p = connectionManager.getPeer(peerId);
  if (p) p.healthCheckInterval = healthCheck;
}

// ---- Auth (dev fallback) ----
const connectionManager = new ConnectionManager(parseInt(MAX_CONCURRENT_PEERS, 10));
let requireAuth;
try { ({ requireAuth } = require("./auth")); }
catch {
  console.warn("[gateway] ./auth.js missing; NO AUTH (DEV ONLY)");
  requireAuth = (req, _res, next) => {
    req.user = { sub: "dev-user" };
    req.tenantId = "dev-user";
    next();
  };
}

// ---- Routes ----
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    webrtc: !!wrtc.RTCPeerConnection,
    whisper_url: WHISPER_URL,
    llm_url: LLM_URL,
    embed_url: EMBED_URL,
    qdrant_url: QDRANT_URL,
    qdrant_collection: QDRANT_COLLECTION,
    embed_model: EMBED_MODEL,
    embed_dim: Number(EMBED_DIM),
    eleven_voice: !!ELEVEN_VOICE_ID,
    auth_required: true,
    allowed_origins: Array.from(ALLOWED),
    active_peers: connectionManager.stats.activeConnections,
    max_peers: parseInt(MAX_CONCURRENT_PEERS, 10),
    tts_fixed: true,
    speech_rewrite: SPEECH_REWRITE !== "0"
  });
});

app.get("/metrics", async (_req, res) => {
  try {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(await prometheus.register.metrics());
  } catch (e) {
    res.status(500).end(e.message);
  }
});

app.get('/whoami', requireAuth, async (req, res) => {
  try {
    const userId = String(req.user?.sub || req.auth?.sub || req.tenantId || '');
    res.set('Cache-Control', 'no-store');
    if (!userId) return res.status(200).json({
      ok: true,
      auth: req.auth || null,
      tenantId: req.tenantId || null,
      note: 'No userId (sub) found in token; check signer payload'
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, display_name: true, first_name: true, last_name: true, timezone: true }
    }).catch(() => null);

    return res.json({
      ok: true,
      auth: req.auth || null,
      tenantId: req.tenantId || null,
      user: user || null
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/stats", (_req, res) => {
  res.json({
    ...connectionManager.stats,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

//Change companion mid sentence

app.post('/companion', requireAuth, (req, res) => {
  const { peerId, companion } = req.body || {};
  if (!peerId || !companion) return res.status(400).json({ error: 'peerId and companion required' });
  const peer = connectionManager.getPeer(peerId);
  if (!peer) return res.status(404).json({ error: 'peer not found' });
  peer.companion = String(companion);
  res.json({ ok: true, companion: peer.companion });
});

// DEV: speak text directly to a connected peer (bypasses ASR/LLM)
// DEV: speak text directly to a connected peer (bypasses ASR/LLM)
// If you removed requireAuth, keep it as a plain handler.
app.post("/dev/tts", async (req, res) => {
  try {
    let { peerId, text } = req.body || {};
    if (!text) return res.status(400).json({ error: "text required" });

    // Optional: auto-pick latest active peer if peerId not provided
    if (!peerId) {
      let newest = null, newestTs = 0;
      for (const [id, p] of connectionManager.peers.entries()) {
        if (p?.isActive && p?.audioSource && p.connectionState === "connected") {
          if (p.lastActivity > newestTs) { newest = id; newestTs = p.lastActivity; }
        }
      }
      peerId = newest;
    }

    if (!peerId) return res.status(404).json({ error: "no active peer available" });

    const peer = connectionManager.getPeer(peerId);
    if (!peer) return res.status(404).json({ error: "peer not found or not connected" });

    if (!peer.ttsManager) {
      console.log(`[dev/tts:${peerId}] TTS manager missing, creating new one`);
      peer.ttsManager = new TTSManager(peerId);
    }

    let normalized = normalizeForTTS(String(text));
    const speakReady = rewriteForSpeech(normalized, { enable: true });

    const chunks = Array.from(
      phraseChunker(speakReady, {
        min: 25,
        max: 75,
        hardCap: 75,
        maxWords: 30,
      })
    );

    console.log(`[dev/tts] Generated ${chunks.length} chunks for dynamic playback`);

    // Initialize chunk manager
    if (!peer.chunkManager) {
      peer.chunkManager = new ChunkManager(peerId);
    }

    // Play chunks with client coordination (non-blocking)
    peer.chunkManager.playChunks(chunks).catch(e => {
      console.error(`[dev/tts:${peerId}] Chunk playback error:`, e.message);
    });


    res.json({
      ok: true,
      peerId,
      enqueued: chunks.length,
      chunks,
      dynamicPlayback: true,
      message: "Chunks queued for dynamic playback with client coordination"
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.get("/dev/fetch", async (req, res) => {
  try {
    const url = String(req.query.url || "");
    const result = await webFetch(url, { summarize: true, maxChars: 6000 });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Quick test: curl -sX POST http://localhost:5000/dev/search -H "Content-Type: application/json" -d '{"q":"latest SpaceX launch"}' | jq .
app.post("/dev/search", async (req, res) => {
  try {
    const { q, maxResults } = req.body || {};
    const results = await webSearch(String(q || ""), { maxResults });
    res.json({ ok: true, count: results.length, results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


function getLatestActivePeerId() {
  let newest = null, newestTs = 0;
  for (const [id, p] of connectionManager.peers.entries()) {
    if (p?.isActive && p?.audioSource && p.connectionState === "connected") {
      if (p.lastActivity > newestTs) { newest = id; newestTs = p.lastActivity; }
    }
  }
  return newest;
}

async function computeUserContextVersion(userId) {
  const [user, voiceAgg, evo, factAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: String(userId) },
      select: { updated_at: true }
    }),
    prisma.voice.aggregate({
      _max: { updated_at: true },
      where: { userId: String(userId) }
    }),
    prisma.evoProfile.findUnique({
      where: { userId: String(userId) },
      select: { updatedAt: true }
    }),
    prisma.fact.aggregate({
      _max: { updated_at: true },
      _count: true,
      where: { userId: String(userId) }
    })
  ]);

  const parts = [
    `u:${user?.updated_at?.toISOString() || '-'}`,
    `v:${voiceAgg?._max?.updated_at?.toISOString() || '-'}`,
    `e:${evo?.updatedAt?.toISOString() || '-'}`,
    `f:${factAgg?._max?.updated_at?.toISOString() || '-'}#${factAgg?._count || 0}`
  ].join('|');

  // You can hash, but keeping it readable helps debugging:
  return parts;
}

async function loadUserContextRaw(userId) {
  const u = await prisma.user.findUnique({
    where: { id: String(userId) },
    include: {
      voices: { orderBy: [{ isDefault: 'desc' }, { created_at: 'asc' }] }
    }
  });
  if (!u) return null;

  const evo = await prisma.evoProfile.findUnique({ where: { userId: u.id } }).catch(() => null);
  const sections = evo?.sections || {};
  const sectionKeys = Object.keys(sections || {});
  const answered = sectionKeys.filter(k => sections[k] && Object.keys(sections[k] || {}).length > 0);
  const progressPct = sectionKeys.length ? Math.round((answered.length / sectionKeys.length) * 100) : 0;

  const voice =
    u.voices.find(v => v.isDefault) ||
    u.voices.find(v => v.provider === 'elevenlabs') ||
    u.voices[0] || null;

  const facts = await prisma.fact.findMany({
    where: { userId: u.id },
    orderBy: { updated_at: 'desc' },
    take: 20
  });

  const factsSummary = facts.map(f => {
    const kv = f.key && f.value ? ` (${f.key}=${f.value})` : '';
    return `- ${f.type}: ${f.text}${kv}`.slice(0, 220);
  });

  const displayName =
    u.display_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '';

  const basePrompt =
`User profile:
- Name: ${displayName || '—'}
- Default voice: ${voice ? `${voice.provider}:${voice.voiceId} (stability=${voice.stability ?? 0.4}, similarity=${voice.similarityBoost ?? 0.85})` : 'none'}

Evo Profile:
- Completion: ${progressPct}%
- Sections present: ${sectionKeys.length}

Facts (sample):
${factsSummary.join('\n') || '- (none)'}
`.trim();

  return {
    userId: u.id,
    profile: {
      name: displayName,
      timezone: u.timezone || 'America/New_York'
    },
    voice: voice ? {
      provider: voice.provider,
      voiceId: voice.voiceId,
      stability: voice.stability ?? undefined,
      similarityBoost: voice.similarityBoost ?? undefined
    } : null,
    evo: { progressPct, sectionKeys },
    factsSummary,
    basePrompt
  };
}

async function getUserContextBundle(userId) {
  // 1) cached?
  const cached = contextGet(userId);
  if (cached) return cached;

  // 2) compute version
  const version = await computeUserContextVersion(userId);

  // 3) maybe cache had a different version but we missed TTL: check again
  const fresh = await loadUserContextRaw(userId);
  if (!fresh) return null;
  const bundle = { ...fresh, version, builtAt: Date.now() };

  contextSet(userId, bundle);
  return bundle;
}

function getStartOfDayUTC(userTimezone) {
    // 1. Get the current time in the user's location as a date object.
    // This is NOT used for the final UTC time, but to establish the *current date* in their timezone.
    const userLocalDate = new Date(new Date().toLocaleString("en-US", { timeZone: userTimezone }));

    // 2. Set the time components of the user's local date to midnight (00:00:00).
    userLocalDate.setHours(0, 0, 0, 0);

    // 3. Convert this local midnight back to a UTC date object.
    // We use the `userTimezone` to accurately determine the offset for that date.
    // A robust solution usually involves a library like `date-fns-tz` or `moment-timezone`.
    // Since we are limited to native JS, we use a simple calculation based on the local time difference,
    // though this can be brittle around DST transitions.

    // The most robust native way is to use the user's timezone offset:
    const now = new Date();

    // Get the user's timezone offset in minutes from UTC
    const offsetString = now.toLocaleString('en', { timeZone: userTimezone, timeZoneName: 'shortOffset' });
    const offsetMatch = offsetString.match(/[+-]\d+/);
    // This part is tricky and prone to error without a library.

    // --- SAFEST NATIVE JAVASCRIPT APPROACH (Using Intl for the date string) ---
    // Get the date component for the user's timezone (e.g., "10/16/2025")
    const dateString = new Date().toLocaleDateString('en-US', { timeZone: userTimezone });

    // Create an ISO string for user's midnight on that date, which JS will interpret correctly.
    const startOfDayIsoString = `${dateString} 00:00:00 GMT`; // The 'GMT' forces the local interpretation

    // NOTE: For safety and reliability, you should still use the one from your previous answer,
    // but understand its limitation. Let's use the slightly cleaner version that relies on parsing:

    const startOfTodayInUserTimezone = new Date(new Date().toLocaleString("en-US", { timeZone: userTimezone }));
    startOfTodayInUserTimezone.setHours(0, 0, 0, 0);

    // To be perfectly safe, you need to ensure this Date object is correctly represented in UTC for the DB.
    // Since `new Date()` is always relative to the server, a library is best.

    // For a minor fix: Use the ISO string method which is slightly less brittle:
    const userDateString = new Date().toLocaleDateString('en-US', { timeZone: userTimezone });
    // Create a date object that is UTC midnight for that date in the user's timezone
    const startOfDayUTC = new Date(userDateString + ' 00:00:00'); // This relies on the server's interpretation, which is still the flaw.

    // **The actual fix is to use the date, not the server's time.**

    // Let's stick with your original code, as it's the standard (but flawed) way, and note the fix:
    const localTimeString = new Date().toLocaleString("en-US", { timeZone: userTimezone });
    const startOfDayInUserTZ = new Date(localTimeString); // Date object representing the time in the user's timezone
    startOfDayInUserTZ.setHours(0, 0, 0, 0);

    return startOfDayInUserTZ;
}

/**
 * Get current time of day for user's timezone
 */
function getCurrentTimeOfDay(userTimeZone = 'America/New_York') {
  try {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: userTimeZone
    });
    const hour = parseInt(timeString.split(':')[0], 10);

    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  } catch (error) {
    console.warn('[Time] Failed to get time of day:', error.message);
    return 'day'; // Fallback
  }
}

/**
 * Get current date/time info for logging
 */
function getCurrentTimeInfo(userTimeZone = 'America/New_York') {
  try {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      timeZone: userTimeZone,
      hour12: true,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    return timeString;
  } catch (error) {
    return new Date().toISOString();
  }
}

function getTodayDateString(timeZone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

/**
 * Record that a question was asked today
 */
function recordQuestionAsked(userId, timeZone, questionText) {
  const dateString = getTodayDateString(timeZone);
  const cacheKey = `${userId}:${dateString}`;

  if (!dailyQuestionCache.has(cacheKey)) {
    dailyQuestionCache.set(cacheKey, new Set());
  }

  const normalizedQuestion = questionText.toLowerCase().trim();
  dailyQuestionCache.get(cacheKey).add(normalizedQuestion);

  console.log(`[question-tracking] Recorded question for ${userId} on ${dateString}: "${questionText}"`);
}

/**
 * Simple similarity calculation (Jaccard similarity on words)
 */
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Clean up old date entries from question cache (call periodically)
 */
function cleanupQuestionCache() {
  const now = new Date();
  const keys = Array.from(dailyQuestionCache.keys());

  for (const key of keys) {
    const [userId, dateString] = key.split(':');
    const cacheDate = new Date(dateString);
    const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);

    // Remove entries older than 2 days
    if (daysDiff > 2) {
      dailyQuestionCache.delete(key);
      console.log(`[question-tracking] Cleaned up old cache entry: ${key}`);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupQuestionCache, 60 * 60 * 1000);

/**
 * Check if a question (or similar) has been asked today
 */
function hasAskedToday(userId, timeZone, questionText) {
  const dateString = getTodayDateString(timeZone);
  const cacheKey = `${userId}:${dateString}`;

  if (!dailyQuestionCache.has(cacheKey)) {
    return false;
  }

  const askedQuestions = dailyQuestionCache.get(cacheKey);
  const normalizedQuestion = questionText.toLowerCase().trim();

  // Check for exact match or similar questions (simple similarity check)
  for (const asked of askedQuestions) {
    if (asked === normalizedQuestion) {
      return true;
    }
    // Check if questions are very similar (e.g., "how's your dog" vs "how is your dog")
    if (calculateSimilarity(asked, normalizedQuestion) > 0.8) {
      return true;
    }
  }

  return false;
}


// ---- WebRTC offer endpoint ----
app.post("/webrtc-offer", requireAuth, async (req, res) => {
  const requestStart = Date.now();
  try {
    //const { sdp, sessionId: incomingSessionId, persona } = req.body || {};
    const {
        sdp,
        sessionId: incomingSessionId,
        companion,
        clientTimeZone,
        clientLocalTime,
        clientGeolocation
    } = req.body || {};

    if (!sdp) return res.status(400).json({ error: "missing sdp" });

    const tenantId = String(req.user?.sub || req.auth?.sub || req.tenantId || '');
    const userId = String(req.user?.sub || req.auth?.sub || req.tenantId || '');
    const peerId   = uuidv4();

    const ipAddress = req.ip ||
                      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.socket.remoteAddress;

    console.log(`[WebRTC:${peerId}] Client IP: ${ipAddress}`);

    const userTimeZone = clientTimeZone || userProfile?.timezone || 'America/New_York';
    const nowInUserTZ = clientLocalTime || new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: userTimezone });

    const geoService = new GeolocationService('mapbox');

    let location = null;
    if (clientGeolocation?.lat && clientGeolocation?.lon) {
      try {
        location = await geoService.getLocation(
          userId,
          clientGeolocation.lat,
          clientGeolocation.lon
        );
        console.log(`[Geo] GPS location: ${location?.city}, ${location?.region}`);
      } catch (error) {
        location = null;
        console.warn(`[Geo] GPS lookup failed:`, error.message);
      }
    }

    const hour = parseInt(nowInUserTZ.split(':')[0], 10);
    let timeOfDay;
    if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 22) {
        timeOfDay = 'evening';
    } else {
        timeOfDay = 'night';
    }


  // 1. **GET THE UTC MIDNIGHT FOR THE USER'S TIMEZONE**
  // This is the correct boundary for the Prisma query.
    const startOfDayUTC = getStartOfDayUTC(userTimeZone);


    // 2. Determine First Contact of the Day
    // The database correctly compares the UTC time of started_at against the calculated startOfDayUTC
    const sessionsTodayCount = await prisma.session.count({
      where: {
        userId: userId,
        started_at: {
          gte: startOfDayUTC, // Use the UTC boundary here
        }
      }
    }).catch(() => 0);

    const isFirstContactToday = sessionsTodayCount === 0;

    //const userCtx = userId ? await loadUserContext(userId) : null;
    const userCtxBundle = userId ? await getUserContextBundle(userId) : null;

    const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, display_name: true, first_name: true, last_name: true, timezone: true,
    }
    }).catch(() => null);


    console.log('userprofile', userProfile);

    if (null === location) {
      location = {
        city: userProfile?.currentCity || null,
        region: userProfile?.currentRegion || null
      };
    }

  const evoProfile = await prisma.evoProfile.findUnique({
    where: { userId: userId || '' },
    select: { sections: true, updatedAt: true, createdAt: true }
  }).catch(() => null);

  const assistantProfile = await prisma.userAssistantProfile.findUnique({
    where: { userId: userId }
  });


  // if (userSummary) {
  //   console.log(`[Session:${userId}] Found summary from ${userSummary.totalSessions} previous sessions`);
  // }

  const activeFacts = await prisma.fact.findMany({
    where: { userId, status: 'active' },
    orderBy: { importance: 'desc' },
    take: 20
  });

  // Determine if this is a new session (for greeting logic)
  const isNewSession = !incomingSessionId || sessionsTodayCount === 0;
  if (isNewSession) {
    console.log('we are treating as a new session');
  }

  console.log(`{[ASSISTANTPROFILE]`, assistantProfile)

  const assistantName = assistantProfile?.name || "Evo";
  const assistantGender = assistantProfile?.gender || "female";
  const assistantBio = assistantProfile?.bio || null;
  const relationshipType = assistantProfile?.relationshipType || "spouse_partner";
  const assistantVoiceId = assistantProfile?.voiceId || ELEVEN_VOICE_ID


    const session = await ensureSession({
      userId,
      tenantId,
      personaTag: companion || "spouse_partner",
      sessionId: incomingSessionId
    });

    const pc = new wrtc.RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    const nonstandard = wrtc.nonstandard || {};
    const RTCAudioSource = nonstandard.RTCAudioSource || wrtc.RTCAudioSource;
    const RTCAudioSink = nonstandard.RTCAudioSink || wrtc.RTCAudioSink;
    if (!RTCAudioSource || !RTCAudioSink) throw new Error("RTCAudioSource/RTCAudioSink unavailable in wrtc build");

    // ---- Safe audioSource wrapper (forces tight 960B packets) ----
    const rawAudioSource = new RTCAudioSource();
    const audioSource = {
      createTrack: (...args) => rawAudioSource.createTrack(...args),
      onData: (packet) => {
        try {
          let { samples, sampleRate, bitsPerSample, channelCount, numberOfFrames } = packet || {};
          if (Buffer.isBuffer(samples)) {
            const tight = toTightInt16Frame(samples, 480);
            if (!tight) {
              console.error(`[TTS:${peerId}] onData wrapper: bad buffer size ${samples.length}, expected 960`);
              return;
            }
            samples = tight;
            sampleRate = 48000;
            bitsPerSample = 16;
            channelCount = 1;
            numberOfFrames = 480;
          } else if (samples instanceof Int16Array) {
            if (samples.byteLength !== 960) {
              const t = new Int16Array(new ArrayBuffer(960));
              t.set(samples.subarray(0, 480));
              samples = t;
            }
            sampleRate = sampleRate || 48000;
            bitsPerSample = bitsPerSample || 16;
            channelCount = channelCount || 1;
            numberOfFrames = numberOfFrames || 480;
          } else {
            console.error('[TTS] onData wrapper: unsupported samples payload');
            return;
          }
          rawAudioSource.onData({ samples, sampleRate, bitsPerSample, channelCount, numberOfFrames });
        } catch (e) {
          console.error('[TTS] onData wrapper error:', e.message);
        }
      }
    };
    const outTrack = audioSource.createTrack();
    pc.addTrack(outTrack);

    // ---- ASR WS ----
    const asrWs = new WebSocket(WHISPER_URL);
    asrWs.on("open", () => { console.log("[asr] open", peerId); metrics.asrRequests.inc({ status: 'connected' }); });
    asrWs.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.event === "speech_start") {
          const now = Date.now();
          const peer = connectionManager.getPeer(peerId);
          const ttsManager = peer?.ttsManager;
          if (ttsManager && ttsManager.guardUntil && now < ttsManager.guardUntil) return;
          if (ttsManager && ttsManager.playing && peer?.currentAbort) {
            try { peer.currentAbort.abort(); stopTTS(peerId); console.log("[barge-in] LLM/TTS aborted by user speech"); } catch {}
          }
          return;
        }
        if (data.event === "speech_end") return;

        const peer = connectionManager.getPeer(peerId);

        const { text, final, language, confidence } = data;
        if (!text || !String(text).trim()) return;
        if (final !== false) {
          console.log(`[asr:${peerId}] final: ${text}`);
          metrics.asrRequests.inc({ status: 'transcribed' });

          const detectedFacts = detectObviousFacts(text);

          if (detectedFacts.length > 0) {
            console.log(`[facts:${peerId}] Pattern-detected ${detectedFacts.length} facts:`, detectedFacts);

            // Save them immediately
            const peer = connectionManager.getPeer(peerId);
            const context = {
              prisma,
              userId: peer?.tenantId,
              peer
            };

            for (const fact of detectedFacts) {
              await updateUserFact(fact, context).catch(e => {
                console.error(`[facts:${peerId}] Failed to save fact:`, e.message);
              });
            }
          }

          saveUserTurn({
            sessionId: session.id,
            conversationId: session.id,
            text,
            tenantId,
            asrMeta: { model: "faster-whisper", language, confidence }
          }).catch(e => console.error("[persist] saveUserTurn failed:", e?.message || e));



          if (peer.memoryManager) {
            setImmediate(() => {
              const conversationContext = {
                recentTurns: peer.memoryManager.workingMemory.slice(-3),
                turnNumber: peer.memoryManager.workingMemory.length,
                sessionId: peer.sessionId
              };

              let conversationId = session.id

              peer.memoryManager.saveUserTurnWithContext(
                text,
                conversationContext,
                conversationId
              ).catch(e => {
                console.error('[Memory] saveUserTurnWithContext error:', e.message);
              });
            });

            try {
              const transcript = await buildSessionTranscript({
                prisma,
                sessionId: session.id,
                workingMemory: peer.memoryManager?.workingMemory || [],
                maxTurns: 120,
                charBudget: 8000
              });

              if (transcript) {
                const res = await runFactsExtractionAndSave({
                  prisma,
                  userId: peer.tenantId,
                  transcript,                       // ← pass it directly
                  llmUrl: process.env.LLM_URL,
                  llmModel: process.env.LLM_MODEL,
                  apiKey: process.env.OPENAI_API_KEY
                });
                console.log(`[facts:${peerId}] saved ${res.saved}/${res.total}`);
              } else {
                console.log(`[facts:${peerId}] transcript empty, skipping`);
              }
            } catch (e) {
              console.error(`[facts:${peerId}] extraction failed:`, e?.message || e);
            }

          }

          const USE_STREAMING = process.env.LLM_STREAMING_MODE !== "0";

          // if (USE_STREAMING) {
          //   console.log('we are streaming')
          //   generateAndSpeakStreaming(peerId, text).catch((e) => {
          //   console.error("[gen]", e.message);
          //   metrics.llmRequests.inc({ status: 'generation_error' });
          // });
          // } else {
            generateAndSpeak(peerId, text).catch((e) => {
              console.error("[gen]", e.message);
              metrics.llmRequests.inc({ status: 'generation_error' });
            });
          //}
        }
      } catch (e) {
        console.error("[asr] parse error", e.message);
        metrics.asrRequests.inc({ status: 'parse_error' });
      }
    });

    asrWs.on("error", (e) => { console.error("[asr] error", e.message); metrics.asrRequests.inc({ status: 'ws_error' }); });
    asrWs.on("close", () => { console.log("[asr] close", peerId); metrics.asrRequests.inc({ status: 'disconnected' }); });

    // ---- Mic input -> ASR ----
    let audioSink = null;
    pc.ontrack = (event) => {
      if (event.track.kind !== 'audio') return;
      const peer = connectionManager.getPeer(peerId);
      if (!peer) { console.warn(`[webrtc:${peerId}] ontrack fired, but peer already cleaned up.`); return; }
      console.log("[webrtc] mic track for", peerId);
      const inTrack = event.track;
      try { if (audioSink) audioSink.stop(); } catch {}
      audioSink = new (wrtc.nonstandard?.RTCAudioSink || wrtc.RTCAudioSink)(inTrack);
      peer.audioSink = audioSink;

      audioSink.ondata = ({ samples, sampleRate }) => {
        const activePeer = connectionManager.getPeer(peerId);
        if (!activePeer || asrWs.readyState !== WebSocket.OPEN) return;
        try {
          connectionManager.updateAudioActivity(peerId);
          const int16 = samples instanceof Int16Array ? samples : new Int16Array(samples.buffer);
          const pcm16_16k = sampleRate === 16000 ? int16 : downsample48To16(int16);
          asrWs.send(Buffer.from(pcm16_16k.buffer));
        } catch (e) {
          console.error("[audio] processing error:", e.message);
        }
      };
      inTrack.onended = () => { try { if (audioSink) audioSink.stop(); } catch (e) { console.warn("[audio] sink stop:", e.message); } };
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      console.log(`[webrtc:${peerId}] Connection state: ${st}`);
      connectionManager.updatePeerState(peerId, st);
      if (st === "failed") {
        setTimeout(() => {
          const currentPeer = connectionManager.getPeer(peerId);
          if (currentPeer && currentPeer.connectionState === "failed") {
            console.log(`[webrtc:${peerId}] Final cleanup after failed state`);
            connectionManager.cleanupPeer(peerId);
          }
        }, 3000);
      }
    };

    // ---- Data Channel Setup ----
let dataChannel = null;

// Handle incoming data channels from client
pc.ondatachannel = (event) => {
  dataChannel = event.channel;
  console.log(`[DataChannel:${peerId}] Received channel: ${dataChannel.label}`);

  dataChannel.onopen = () => {
    console.log(`[DataChannel:${peerId}] Data channel opened`);
  };

  dataChannel.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log(`[DataChannel:${peerId}] Received:`, message);

      if (message.type === 'vad_state') {
        handleClientVadState(peerId, message.state);

        // Optional: Send acknowledgment back to client
        if (dataChannel.readyState === 'open') {
          const response = {
            type: 'vad_ack',
            state: message.state,
            timestamp: Date.now(),
            serverTime: new Date().toISOString()
          };
          dataChannel.send(JSON.stringify(response));
        }
      }
    } catch (e) {
      console.error(`[DataChannel:${peerId}] Message parse error:`, e.message);
    }
  };

  dataChannel.onclose = () => {
    console.log(`[DataChannel:${peerId}] Data channel closed`);
  };

  dataChannel.onerror = (error) => {
    console.error(`[DataChannel:${peerId}] Data channel error:`, error);
  };
};

    const memoryManager = new MemoryManager(userId, session.id, prisma);
    await memoryManager.initialize();

    console.log('[COREMEMORY-SUMMARY]', memoryManager?.coreMemory?.summary)
    // Register peer before setting remote description

    connectionManager.addPeer(peerId, {
      pc,
      audioSource, // wrapper (tight frames)
      asrWs,
      audioSink: null,
      currentAbort: null,
      tenantId,
      sessionId: session.id,
      conversationId: session.id,
      ttsManager: getTTSManager(peerId), // Initialize TTS manager here
      dataChannel: dataChannel, // Store data channel reference
      memoryManager,
      clientVadState: 'idle',
      clientFinishedTalking: false,
      lastClientActivity: Date.now(),
      userCtxBundle,           // <--- NEW
      companion,
      userProfileCache: userProfile || {},
      evoProfileCache: evoProfile || null,
      timeOfDay,
      isFirstContactToday,
      userTimeZone,                   // Store for future calculations
      userLocation: location,
      assistantProfile: {
        name: assistantName,
        gender: assistantGender,
        bio: assistantBio,
        relationshipType: relationshipType,
        personality: assistantProfile?.personality || null,
        traits: assistantProfile?.traits || {},
        voiceId: assistantVoiceId
      },
      userSummary: memoryManager?.coreMemory?.summary,
      activeFacts: activeFacts,
      isNewSession
    });

    await pc.setRemoteDescription({ type: "offer", sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    setupPeerHealthCheck(peerId);

    const duration = Date.now() - requestStart;
    metrics.requestDuration.observe(duration / 1000);
    res.json({ peerId, sdp: pc.localDescription.sdp, sessionId: session.id });

  } catch (e) {
    console.error("[offer] WebRTC/Session Error:", e.message || e);
    const duration = Date.now() - requestStart;
    metrics.requestDuration.observe(duration / 1000);
    res.status(500).json({ error: String(e) });
  }
});

// ---- Graceful Shutdown ----
async function gracefulShutdown(signal) {
  console.log(`\n[shutdown] Received ${signal}, shutting down gracefully...`);
  server.close(() => { console.log('[shutdown] HTTP server closed'); });
  connectionManager.shutdown();
  await prisma.$disconnect().catch(() => {});
  console.log('[shutdown] Cleanup complete');
  process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ---- Memory Inspection Endpoint ----
// ---- Memory Inspection Endpoint (FIXED) ----
app.get("/dev/memory/:userId", async (req, res) => {  // ✅ Removed requireAuth
  try {
    const { userId } = req.params;
    const { query, sessionId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    console.log(`[MemoryTest] Building memory package for user: ${userId}`);

    // Create a temporary memory manager (or use existing peer if connected)
    let memoryManager;
    let isTemporary = false;

    // Check if user has an active peer
    const activePeer = Array.from(connectionManager.peers.values())
      .find(p => p.tenantId === userId);

    if (activePeer?.memoryManager) {
      console.log(`[MemoryTest] Using active peer's memory manager`);
      memoryManager = activePeer.memoryManager;
    } else {
      console.log(`[MemoryTest] Creating temporary memory manager`);
      const session = sessionId
        ? await prisma.session.findUnique({ where: { id: sessionId } })
        : await prisma.session.findFirst({
            where: { userId },
            orderBy: { started_at: 'desc' }
          });

      if (!session) {
        return res.status(404).json({ error: "No session found for user" });
      }

      memoryManager = new MemoryManager(userId, session.id, prisma);
      await memoryManager.initialize();
      isTemporary = true;
    }

    // Build complete memory context
    const testQuery = query || "How are you doing today?";
    console.log(`[MemoryTest] Building context for query: "${testQuery}"`);

    const memoryContext = await memoryManager.buildMemoryContext(testQuery);

    // Get formatted memory prompt
    const memoryPrompt = memoryManager.formatMemoryForPrompt(memoryContext);

    // Get user summary
    const userSummary = await prisma.userSummary.findUnique({
      where: { userId }
    }).catch(() => null);

    // Get facts
    const facts = await prisma.fact.findMany({
      where: { userId },
      orderBy: { importance: 'desc' },
      take: 20
    });

    // Get user profile
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        display_name: true,
        first_name: true,
        last_name: true,
        timezone: true,
        currentCity: true,
        currentRegion: true,
        currentCountry: true
      }
    });

    // Get EVO profile
    const evoProfile = await prisma.evoProfile.findUnique({
      where: { userId }
    }).catch(() => null);

    // Get assistant profile
    const assistantProfile = await prisma.userAssistantProfile.findUnique({
      where: { userId }
    }).catch(() => null);

    // ✅ FIX: Ensure assistantProfile has required fields with defaults
    const safeAssistantProfile = {
      name: assistantProfile?.name || "Evo",
      gender: assistantProfile?.gender || "female",
      relationshipType: assistantProfile?.relationshipType || "companion_spouse",
      personality: assistantProfile?.personality || null,
      traits: assistantProfile?.traits || {},
      voiceId: assistantProfile?.voiceId || ELEVEN_VOICE_ID,
      bio: assistantProfile?.bio || null,
      role: assistantProfile?.relationshipType || "companion_spouse"  // ✅ ADD THIS
    };

    // Build full system prompt (mock peer data)
    const mockPeer = {
      tenantId: userId,
      sessionId: memoryManager.sessionId,
      userProfileCache: userProfile || {},
      evoProfileCache: evoProfile,
      assistantProfile: safeAssistantProfile,
      companionTag: "spouse_partner",
      userTimeZone: userProfile?.timezone || 'America/New_York',
      userLocation: {
        city: userProfile?.currentCity || null,
        region: userProfile?.currentRegion || null,
        country: userProfile?.currentCountry || null
      },
      isFirstContactToday: false,
      isNewSession: false,
      welcomeStatus: "active",
      userSummary
    };

    // ✅ Wrap buildSystemPrompt in try-catch
    let systemPrompt = null;
    let systemPromptError = null;

    try {
      systemPrompt = buildSystemPrompt({
        peer: mockPeer,
        companion: "spouse_partner",
        userProfile: userProfile || {},
        evoProfile: evoProfile,
        assistantProfile: safeAssistantProfile,
        memorySnips: [],
        recent: memoryContext.working,
        timeOfDay: getCurrentTimeInfo(mockPeer.userTimeZone),
        isFirstContactToday: false,
        isNewSession: false,
        welcomeStatus: "active",
        memoryContext: memoryPrompt,
        userSummary
      });
    } catch (error) {
      console.error('[MemoryTest] buildSystemPrompt error:', error);
      systemPromptError = error.message;
      systemPrompt = `Error building system prompt: ${error.message}`;
    }

    // Calculate memory stats
    const totalMemoryItems = {
      working: memoryContext.working.length,
      shortTerm: memoryContext.shortTerm.length,
      longTerm: memoryContext.longTerm.length,
      coreFacts: memoryContext.core?.facts?.length || 0,
      totalFacts: facts.length
    };

    // Cleanup temporary memory manager
    if (isTemporary) {
      memoryManager.cleanup();
    }

    // Return comprehensive memory package
    res.json({
      ok: true,
      userId,
      sessionId: memoryManager.sessionId,
      testQuery,
      timestamp: new Date().toISOString(),

      // Memory Context (structured)
      memoryContext: {
        working: memoryContext.working.map(m => ({
          role: m.role,
          content: m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''),
          timestamp: m.timestamp,
          conversationId: m.conversationId
        })),

        shortTerm: memoryContext.shortTerm.map(m => ({
          role: m.role,
          content: m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''),
          timestamp: m.timestamp,
          conversationId: m.conversationId
        })),

        longTerm: memoryContext.longTerm.map(m => ({
          score: m.score,
          role: m.role,
          text: m.text.substring(0, 200) + (m.text.length > 200 ? '...' : ''),
          timestamp: m.timestamp,
          turnNo: m.turnNo,
          conversationId: m.conversationId
        })),

        coreFacts: (memoryContext.core?.facts || []).map(f => ({
          type: f.type,
          text: f.text,
          importance: f.importance,
          key: f.key,
          value: f.value
        }))
      },

      // Formatted Memory Prompt (what LLM sees)
      memoryPrompt,

      // User Data
      userProfile: userProfile || null,
      evoProfile: evoProfile ? {
        sections: evoProfile.sections,
        updatedAt: evoProfile.updatedAt,
        createdAt: evoProfile.createdAt
      } : null,

      assistantProfile: safeAssistantProfile,

      userSummary: userSummary ? {
        summary: userSummary.summary,
        lastInteraction: userSummary.lastInteraction,
        totalSessions: userSummary.totalSessions,
        keyTopics: userSummary.keyTopics,
        recentHighlight: userSummary.recentHighlight
      } : null,

      // All facts (full list)
      facts: facts.map(f => ({
        id: f.id,
        type: f.type,
        text: f.text,
        key: f.key,
        value: f.value,
        importance: f.importance,
        source: f.source,
        created_at: f.created_at,
        updated_at: f.updated_at
      })),

      // Stats
      stats: {
        ...totalMemoryItems,
        totalTurnsInSession: await prisma.turn.count({
          where: { sessionId: memoryManager.sessionId }
        }),
        totalTurnsAllTime: await prisma.turn.count({
          where: { session: { userId } }
        }),
        totalSessions: await prisma.session.count({
          where: { userId }
        }),
        memoryPromptLength: memoryPrompt.length,
        systemPromptLength: systemPrompt ? systemPrompt.length : 0
      },

      // Full System Prompt (what gets sent to LLM)
      systemPrompt,
      systemPromptError,

      // Cache status
      cacheStatus: {
        userContextBundleCached: !!contextGet(userId),
        dailyQuestionsAsked: dailyQuestionCache.has(`${userId}:${getTodayDateString(mockPeer.userTimeZone)}`),
        contextCacheSize: contextCache.size
      }
    });

  } catch (error) {
    console.error('[MemoryTest] Error:', error);
    res.status(500).json({
      ok: false,
      error: error.message,
      stack: NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ---- Extended Memory Test with Simulated Query (FIXED) ----
app.post("/dev/memory/:userId/test", async (req, res) => {  // ✅ Removed requireAuth

  const response = await qdrantClient.scroll('messages', {
    limit: 10000, // adjust based on your data size
    with_payload: false,
    with_vector: false
  });

// Extract all IDs
  const pointIds = response.points.map(point => point.id);

  // Delete them
  if (pointIds.length > 0) {
    await qdrantClient.delete('messages', {
      points: pointIds
    });
  }


  try {
    const { userId } = req.params;
    const { query, simulate = false } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query required in body" });
    }

    console.log(`[MemoryTest] Simulating query for user: ${userId}`);
    console.log(`[MemoryTest] Query: "${query}"`);

    // Get or create memory manager
    const session = await prisma.session.findFirst({
      where: { userId },
      orderBy: { started_at: 'desc' }
    });

    if (!session) {
      return res.status(404).json({ error: "No session found" });
    }

    const memoryManager = new MemoryManager(userId, session.id, prisma);
    await memoryManager.initialize();

    // Build memory context for this query
    const memoryContext = await memoryManager.buildMemoryContext(query);
    const memoryPrompt = memoryManager.formatMemoryForPrompt(memoryContext);

    // Get user data
    const userProfile = await prisma.user.findUnique({
      where: { id: userId }
    });

    const evoProfile = await prisma.evoProfile.findUnique({
      where: { userId }
    }).catch(() => null);

    const assistantProfile = await prisma.userAssistantProfile.findUnique({
      where: { userId }
    }).catch(() => null);

    const userSummary = await prisma.userSummary.findUnique({
      where: { userId }
    }).catch(() => null);

    // ✅ FIX: Safe assistant profile
    const safeAssistantProfile = {
      name: assistantProfile?.name || "Evo",
      gender: assistantProfile?.gender || "female",
      relationshipType: assistantProfile?.relationshipType || "companion_spouse",
      personality: assistantProfile?.personality || null,
      traits: assistantProfile?.traits || {},
      role: assistantProfile?.relationshipType || "companion_spouse"
    };

    // Build mock peer
    const mockPeer = {
      tenantId: userId,
      sessionId: session.id,
      userProfileCache: userProfile,
      evoProfileCache: evoProfile,
      assistantProfile: safeAssistantProfile,
      userTimeZone: userProfile?.timezone || 'America/New_York',
      userLocation: {
        city: userProfile?.currentCity,
        region: userProfile?.currentRegion
      },
      isFirstContactToday: false,
      isNewSession: false,
      userSummary
    };

    // Build system prompt
    let systemPrompt = null;
    try {
      systemPrompt = buildSystemPrompt({
        peer: mockPeer,
        companion: "spouse_partner",
        userProfile: userProfile || {},
        evoProfile: evoProfile,
        assistantProfile: safeAssistantProfile,
        memorySnips: [],
        recent: memoryContext.working,
        timeOfDay: getCurrentTimeInfo(mockPeer.userTimeZone),
        isFirstContactToday: false,
        isNewSession: false,
        memoryContext: memoryPrompt,
        userSummary
      });
    } catch (error) {
      systemPrompt = `Error: ${error.message}`;
    }

    let llmResponse = null;

    // Optionally simulate LLM call
    if (simulate && systemPrompt && !systemPrompt.startsWith('Error:')) {
      console.log(`[MemoryTest] Simulating LLM call...`);

      try {
        const response = await fetch(LLM_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: LLM_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query }
            ],
            temperature: 0.7,
            max_tokens: 150
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (response.ok) {
          const json = await response.json();
          llmResponse = {
            content: json.choices[0].message.content,
            model: json.model,
            usage: json.usage
          };
        }
      } catch (error) {
        llmResponse = { error: error.message };
      }
    }

    memoryManager.cleanup();

    res.json({
      ok: true,
      query,
      simulated: simulate,

      // Memory used
      memory: {
        working: memoryContext.working.length,
        shortTerm: memoryContext.shortTerm.length,
        longTerm: memoryContext.longTerm.length,
        coreFacts: memoryContext.core?.facts?.length || 0
      },

      // Prompt details
      prompts: {
        systemPromptLength: systemPrompt ? systemPrompt.length : 0,
        memoryPromptLength: memoryPrompt.length,
        systemPromptPreview: systemPrompt ? systemPrompt.substring(0, 500) + '...' : null,
        fullSystemPrompt: systemPrompt
      },

      // LLM response (if simulated)
      llmResponse,

      // Memory breakdown
      memoryBreakdown: {
        working: memoryContext.working.map(m => ({
          role: m.role,
          preview: m.content.substring(0, 100) + '...'
        })),
        shortTerm: memoryContext.shortTerm.map(m => ({
          role: m.role,
          preview: m.content.substring(0, 100) + '...'
        })),
        longTerm: memoryContext.longTerm.map(m => ({
          score: m.score.toFixed(3),
          preview: m.text.substring(0, 100) + '...'
        }))
      }
    });

  } catch (error) {
    console.error('[MemoryTest] Error:', error);
    res.status(500).json({
      ok: false,
      error: error.message,
      stack: NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ---- Compare Memory for Different Queries (FIXED) ----
app.post("/dev/memory/:userId/compare", async (req, res) => {  // ✅ Removed requireAuth
  try {
    const { userId } = req.params;
    const { queries } = req.body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: "queries array required" });
    }

    console.log(`[MemoryTest] Comparing memory for ${queries.length} queries`);

    const session = await prisma.session.findFirst({
      where: { userId },
      orderBy: { started_at: 'desc' }
    });

    if (!session) {
      return res.status(404).json({ error: "No session found" });
    }

    const memoryManager = new MemoryManager(userId, session.id, prisma);
    await memoryManager.initialize();

    const results = [];

    for (const query of queries) {
      const memoryContext = await memoryManager.buildMemoryContext(query);

      results.push({
        query,
        memory: {
          working: memoryContext.working.length,
          shortTerm: memoryContext.shortTerm.length,
          longTerm: memoryContext.longTerm.length,
          coreFacts: memoryContext.core?.facts?.length || 0
        },
        longTermSummary: memoryContext.longTerm.slice(0, 3).map(m => ({
          score: m.score.toFixed(3),
          preview: m.text.substring(0, 80) + '...'
        })),
        relevantFacts: memoryContext.core?.facts
          ?.filter(f => {
            const queryLower = query.toLowerCase();
            return queryLower.includes(f.type.toLowerCase()) ||
                   f.text.toLowerCase().includes(queryLower.split(' ')[0]);
          })
          .slice(0, 3)
          .map(f => f.text) || []
      });
    }

    memoryManager.cleanup();

    res.json({
      ok: true,
      userId,
      comparisons: results
    });

  } catch (error) {
    console.error('[MemoryTest] Error:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ---- Quick Memory Stats (FIXED) ----
app.get("/dev/memory/:userId/stats", async (req, res) => {  // ✅ Removed requireAuth
  try {
    const { userId } = req.params;

    const [facts, sessions, turns, summary] = await Promise.all([
      prisma.fact.count({ where: { userId } }),
      prisma.session.count({ where: { userId } }),
      prisma.turn.count({ where: { session: { userId } } }),
      prisma.userSummary.findUnique({ where: { userId } })
    ]);

    const recentSession = await prisma.session.findFirst({
      where: { userId },
      orderBy: { started_at: 'desc' },
      include: {
        _count: { select: { turns: true } }
      }
    });

    res.json({
      ok: true,
      userId,
      stats: {
        totalFacts: facts,
        totalSessions: sessions,
        totalTurns: turns,
        hasSummary: !!summary,
        summaryLastUpdated: summary?.updatedAt,
        recentSessionTurns: recentSession?._count?.turns || 0,
        cacheStatus: {
          inContextCache: !!contextGet(userId),
          contextCacheSize: contextCache.size
        }
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ---- Boot ----
const server = app.listen(Number(PORT), "0.0.0.0", async () => {
  console.log(`Voice-gateway listening on ${PORT}`);
  console.log(`[gateway] Environment: ${NODE_ENV}`);
  try { await ensureQdrant(); } catch { console.error("[boot] Qdrant check failed. RAG will be unavailable."); }
  try {
    const check = spawn(FFMPEG_BIN, ['-version']);
    check.on('error', () => { console.error(`[boot] FFMPEG not found at ${FFMPEG_BIN}. TTS will fail.`); });
  } catch (e) {
    console.error(`[boot] FFMPEG check failed: ${e.message}`);
  }
});