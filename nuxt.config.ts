// nuxt.config.ts
export default defineNuxtConfig({
  srcDir: 'app',
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  serverDir: 'app/server',
  css: ['~/assets/css/tailwind.css'],        // <-- load Tailwind CSS
  tailwindcss: {
    viewer: false,                            // optional
    exposeConfig: false
  },
  runtimeConfig: {
    authJwtSecret: process.env.AUTH_JWT_SECRET || 'changeme',
    accessTtl: process.env.ACCESS_TTL_SECONDS || '900',
    refreshTtl: process.env.REFRESH_TTL_SECONDS || String(7*24*3600),
    public: {
      embedUrl: process.env.EMBED_URL || 'http://127.0.0.1:8010/v1/embeddings',
      qdrantUrl: process.env.QDRANT_URL || 'http://127.0.0.1:6333',
      gatewayUrl: process.env.GATEWAY_URL || 'https://gw.cimb.us',
    }
  },
  nitro: {
    preset: 'node-server',
    externals: { inline: [] },
    moduleSideEffects: ['@prisma/client']
  },
  vite: { ssr: { noExternal: ['@prisma/client', 'prisma'] } },
  postcss: {                                   // <-- ensure PostCSS runs Tailwind
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  }
})
