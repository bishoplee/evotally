# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
A Nuxt 4 application with Prisma ORM, PostgreSQL database, and JWT authentication. The app features an AI assistant ("Evo") with voice capabilities, user profile management, fact collection, and calendar integration with Google/Outlook.

## Commands

### Development
```bash
npm run dev          # Start dev server on http://localhost:3000
npm install          # Install dependencies (runs prisma generate + nuxt prepare)
```

### Database
```bash
npx prisma generate  # Generate Prisma Client (required after schema changes)
npx prisma migrate dev  # Create and apply migrations
npx prisma migrate dev --name <name>  # Create named migration
npx prisma studio    # Open Prisma Studio GUI
npx prisma db push   # Push schema changes without migrations (dev only)
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
npm run generate     # Generate static site
```

## Architecture

### Directory Structure
- `app/` - Source directory (configured via `srcDir` in nuxt.config.ts)
  - `server/` - Server-side code
    - `api/` - API route handlers (file-based routing)
    - `middleware/` - Server middleware (e.g., auth.global.ts)
    - `utils/` - Server utilities (db.ts, jwt.ts, hash.ts, oauth.ts, evoProfile.ts)
    - `routes/` - Custom server routes
  - `pages/` - Client-side pages (file-based routing)
  - `layouts/` - Layout components
  - `components/` - Reusable Vue components
  - `stores/` - Pinia state stores (auth.ts, evoProfile.ts)
  - `composables/` - Composable functions
  - `middleware/` - Client middleware
  - `assets/css/` - Stylesheets (Tailwind)
  - `plugins/` - Nuxt plugins

### Database Schema (Prisma)
Key models:
- **User** - Core user data with location tracking (permanent + current), timezone, OAuth integration
- **RefreshToken** - JWT refresh tokens with expiration tracking
- **Fact** - User/assistant facts with temporal tracking, importance scoring, and Qdrant integration
- **Session** & **Turn** - Conversation tracking with LLM metadata
- **EvoProfile** - User-specific Evo profile configuration (JSON sections)
- **UserAssistantProfile** - Comprehensive assistant personality/behavior configuration
- **Voice** - Voice provider configurations (ElevenLabs, Azure TTS)
- **UserFact** - Structured fact extraction with categories
- **Event** - Calendar events with flexible date formats
- **Goal** - User goals with status, priority, and timeframes
- **WorkOrSchool** - Work history and education tracking
- **RelationshipEdge** - Relationship graph between entities
- **UserLocation** - Location history with geocoding cache

### Authentication Flow
1. **JWT-based auth** using `jose` library (HS256 algorithm)
2. **Dual-token system**:
   - Access tokens (short-lived, 15min default) - sent in Authorization header
   - Refresh tokens (long-lived, 7d default) - stored in httpOnly cookie
3. **Server middleware** (`app/server/middleware/auth.global.ts`):
   - Verifies Bearer token OR refresh cookie
   - Hydrates `event.context.user` with full user data
   - Public paths: `/api/auth/*`, `/health`
4. **Client store** (`app/stores/auth.ts`):
   - Manages access token in memory
   - `ensure()` method auto-refreshes expired tokens
   - `useApi` composable handles 401s with automatic retry after refresh

### API Patterns
- **File-based routing**: `app/server/api/[resource]/[id].method.ts`
- **Dynamic routes**: Use brackets for params (e.g., `[id].delete.ts`)
- **Index routes**: Use `index.get.ts` for collection endpoints
- **Authentication**: All `/api/*` routes require auth except public paths
- **Error handling**: Use `createError()` from h3
- **Database access**: Import `prisma` from `~/server/utils/db`

### Frontend State Management
- **Pinia stores** for global state (auth, evoProfile)
- **useApi composable** (`app/useApi.ts`) - typed API client with auto-refresh
- **SSR-aware**: Composables handle cookie forwarding on server-side rendering

### Styling
- **TailwindCSS** configured with custom color palette:
  - `primary` - Teal/cyan tones (#016d77 base)
  - `secondary`/`accent` - Coral/orange tones (#ff845a base)
  - `brand` - Alias for primary
- **Configuration**: `tailwind.config.js` with content paths for all Vue files

## Environment Variables
Required in `.env`:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
AUTH_JWT_SECRET="<random-secret>"
ACCESS_TTL_SECONDS="900"           # 15 minutes
REFRESH_TTL_SECONDS="604800"       # 7 days
EMBED_URL="http://127.0.0.1:8010/v1/embeddings"
QDRANT_URL="http://127.0.0.1:6333"
GATEWAY_URL="https://gw.cimb.us"
```

## Key Integration Points

### External Services
- **Qdrant** - Vector database for semantic search (embeddings)
- **ElevenLabs / Azure TTS** - Voice synthesis
- **Google OAuth** - Calendar/contacts integration (`/api/integrations/google/*`)
- **Outlook OAuth** - Calendar/contacts integration (`/api/integrations/outlook/*`)

### Voice Processing
- Voice configurations stored per user in `Voice` model
- Endpoints: `/api/voice` (POST), `/api/voice/[id]` (DELETE), `/api/voice/select` (POST)
- Provider-specific settings (stability, similarity boost) in JSON

### Fact Collection System
- Progressive questioning flow tracked in `FactCollectionSession`
- Bulk import via CSV (`/api/facts/bulk`)
- LLM-extracted facts in `UserFact` with confidence scoring
- Temporal tracking (validFrom, validUntil, status) for fact evolution

## Important Notes

### Prisma Setup
- Always run `prisma generate` after schema changes or fresh install
- Migrations are in `prisma/migrations/`
- The `postinstall` script handles generation automatically

### Server vs Client Context
- Server code has access to `event.context.user` (populated by auth middleware)
- Client code uses `useAuth()` store for user state
- Use `process.server` to conditionally forward cookies in SSR

### OAuth Callback Flow
- Start: `/api/integrations/{provider}/start` - redirects to provider
- Callback: `/api/integrations/{provider}/callback` - handles OAuth response
- Tokens stored in `User.settings` JSON field

### Testing
No test framework currently configured. To add tests, install Vitest:
```bash
npm install -D vitest @vue/test-utils
```

## Code Conventions
- **TypeScript** for type safety (tsconfig references .nuxt generated configs)
- **File naming**: kebab-case for files, PascalCase for Vue components
- **API responses**: Return JSON directly or throw `createError()`
- **Async/await**: Preferred over promises for async operations
- **Database queries**: Use Prisma Client with TypeScript types
- **Dates**: Flexible string formats for user input, ISO strings for timestamps
