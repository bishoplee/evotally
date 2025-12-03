import { defineEventHandler, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  const u = event.context.user
  if (!u) {
    // Option A: return 200 with null (nice for SSR navbar without throwing)
    setResponseStatus(event, 200)
    return { user: null }
    // Option B (stricter): comment the two lines above and use:
    // setResponseStatus(event, 401)
    // return { user: null }
  }

  // Shape whatever you need on the client
  return {
    user: {
      id: String(u.id),
      email: (u as any).email ?? undefined,
      first_name: (u as any).first_name ?? undefined,
      last_name: (u as any).last_name ?? undefined,
      birthday: (u as any).birthday ?? undefined,
      timezone: (u as any).timezone ?? undefined,
      city: (u as any).city ?? undefined,
      region: (u as any).region ?? undefined,
      country: (u as any).country ?? undefined,
      currentCity: (u as any).currentCity ?? undefined,
      currentRegion: (u as any).currentRegion ?? undefined,
      currentCountry: (u as any).currentCountry ?? undefined,
      roles: (u as any).roles ?? [],
      tenantId: (u as any).tenantId ?? null,
      persona: (u as any).persona ?? null,
    }
  }
})
