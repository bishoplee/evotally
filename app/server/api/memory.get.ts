import {createError, defineEventHandler} from 'h3'
import {prisma} from '~/server/utils/db'

export default defineEventHandler(async (event) => {
    const u = event.context.user
    if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const user = await prisma.user.findUnique({
        where: { id: String(u.id) },
        select: {
            id: true,
            email: true,
            display_name: true,
            first_name: true,
            last_name: true,
            timezone: true,
            voices: {
                select: {
                    id: true,
                    provider: true,
                    voiceId: true,
                    stability: true,
                    similarityBoost: true,
                    isDefault: true,
                    label: true,
                    settings: true,
                },
                orderBy: [{ isDefault: 'desc' }, { provider: 'asc' }, { created_at: 'asc' }],
            },
        },
    })
    if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

    const name =
        user.display_name ||
        [user.first_name, user.last_name].filter(Boolean).join(' ') ||
        ''

    const voices = user.voices
    const chosen =
        voices.find(v => v.isDefault) ||
        voices.find(v => v.provider === 'elevenlabs') ||
        voices[0] || null

    return {
        profile: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            timezone: user.timezone || 'America/New_York',
        },
        voices,
        currentVoice: chosen,
    }
})
