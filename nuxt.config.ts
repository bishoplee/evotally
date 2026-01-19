// nuxt.config.ts
export default defineNuxtConfig({
  srcDir: 'app',
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  serverDir: 'app/server',
  css: ['~/assets/css/tailwind.css'],
  tailwindcss: {
    viewer: false,                            // optional
    exposeConfig: false
  },
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: 'anonymous'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;500;600;700&family=Roboto:wght@400;500&display=swap'
        }
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'developer', content: 'Oladipo Olaleye - EvoTally Platform 2026' },
        { name: 'build-signature', content: 'EVT-OO-CORE-2026' },
        { name: 'copyright', content: '© 2026 Olaleye Oladipo - EvoTally Platform' }
      ]
    }
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
