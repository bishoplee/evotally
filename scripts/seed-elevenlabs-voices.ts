import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_VOICES = [
  { name: 'Jason',        tagline: 'Young man',                                  id: '5kMbtRSEKIkRZSdXxrZg' },
  { name: 'Miss Walker',  tagline: 'Southern Voice · Female',                    id: 'DLsHlh26Ugcm6ELvS0qi' },
  { name: 'Ms Moi',       tagline: 'Female American Voice',                      id: 'zubqz6JC54rePKNCKZLG' },
  { name: 'Miss Maysie',  tagline: 'Female · Conversational · Calm & Reassuring', id: 'QPBKI85w0cdXVqMSJ6WB' },
  { name: 'Biyanca',      tagline: 'Female · Conversational',                    id: '46o7SwbGIeXFJ5xZ3ZGX' },
  { name: 'Rusell',       tagline: 'Male · Young American',                      id: 'ZauUyVXAz5znrgRuElJ5' },
]

async function seedElevenLabsVoices() {
  console.log('🎤 Seeding ElevenLabs voices...')

  for (const voice of DEFAULT_VOICES) {
    // Parse tagline to extract gender and other attributes
    const taglineLower = voice.tagline.toLowerCase()
    const gender = taglineLower.includes('female') ? 'female' :
                   taglineLower.includes('male') ? 'male' : null

    const isConversational = taglineLower.includes('conversational')
    const useCase = isConversational ? 'conversational' : 'general'

    // Determine age range from tagline
    let ageRange = 'middle-aged' // default
    if (taglineLower.includes('young')) {
      ageRange = 'young'
    }

    // Determine accent
    const accent = taglineLower.includes('southern') ? 'southern' :
                   taglineLower.includes('american') ? 'american' : null

    try {
      const result = await prisma.providerVoice.upsert({
        where: {
          provider_providerId: {
            provider: 'elevenlabs',
            providerId: voice.id
          }
        },
        create: {
          provider: 'elevenlabs',
          providerId: voice.id,
          name: voice.name,
          description: voice.tagline,
          language: 'en-US',
          gender: gender,
          accent: accent,
          ageRange: ageRange,
          useCase: useCase,
          isActive: true,
          settings: {}
        },
        update: {
          name: voice.name,
          description: voice.tagline,
          language: 'en-US',
          gender: gender,
          accent: accent,
          ageRange: ageRange,
          useCase: useCase,
          isActive: true
        }
      })

      console.log(`✅ ${voice.name} (${voice.id}) - ${result.id}`)
    } catch (error) {
      console.error(`❌ Failed to seed ${voice.name}:`, error)
    }
  }

  console.log('✨ Done seeding ElevenLabs voices!')
}

seedElevenLabsVoices()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
