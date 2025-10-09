import { z } from 'zod'

// Canonical questions (IDs must be stable)
export const EVO_REGISTRY = {
  everyday: { weight: 20, questions: [
    { id: 'start_day', prompt: 'How do you usually start your day?' },
    { id: 'morning_routine', prompt: 'What’s your morning routine like in your own words?' },
    { id: 'how_are_you', prompt: 'When someone asks how you’re doing, what do you usually say?' },
    { id: 'catchphrase', prompt: 'What’s a phrase or saying you use a lot?' },
    { id: 'chat_length', prompt: 'Do you prefer short chats or long conversations?' },
  ]},
  humor: { weight: 15, questions: [
    { id: 'humor_desc', prompt: 'How would you describe your sense of humor?' },
    { id: 'jokes', prompt: 'What kind of jokes make you laugh most?' },
    { id: 'sarcasm', prompt: 'Do you use sarcasm often?' },
    { id: 'funny_you', prompt: 'What’s something people say you always make funny?' },
    { id: 'teasing_react', prompt: 'How do you usually react when someone teases you?' },
  ]},
  personality: { weight: 20, questions: [
    { id: 'thinker_feeler', prompt: 'Are you more of a thinker or a feeler?' },
    { id: 'quiet_or_activity', prompt: 'Do you prefer quiet or activity around you?' },
    { id: 'three_words', prompt: 'What three words describe your personality best?' },
    { id: 'feel_understood', prompt: 'What makes you feel understood?' },
    { id: 'comfort_tone', prompt: 'What kind of tone makes you feel most comfortable?' },
  ]},
  connection: { weight: 15, questions: [
    { id: 'talk_style', prompt: 'How do you like someone to talk to you—direct, gentle, playful?' },
    { id: 'when_upset', prompt: 'When you’re upset, what’s the best way for someone to approach you?' },
    { id: 'listening_type', prompt: 'What’s your preferred type of listening: advice or empathy?' },
    { id: 'being_heard', prompt: 'What does being “heard” mean to you?' },
    { id: 'flow_or_pause', prompt: 'Do you like conversation to flow or to pause for reflection?' },
  ]},
  emotional: { weight: 20, questions: [
    { id: 'feel_calm', prompt: 'What makes you feel calm?' },
    { id: 'triggers', prompt: 'What triggers you emotionally?' },
    { id: 'affection_words', prompt: 'How do you show affection through words?' },
    { id: 'cheers_you', prompt: 'What’s something that always cheers you up?' },
    { id: 'open_up', prompt: 'When do you usually open up emotionally?' },
  ]},
  memory: { weight: 15, questions: [
    { id: 'remember_phrase', prompt: 'What’s a phrase you’d like Evo to remember forever?' },
    { id: 'morning_greeting', prompt: 'How do you want Evo to greet you each morning?' },
    { id: 'meaningful_topics', prompt: 'What are topics Evo should always remember as meaningful to you?' },
    { id: 'never_forget', prompt: 'Are there things Evo should never forget?' },
    { id: 'past_tone', prompt: 'What tone should Evo use when talking about your past?' },
  ]},
  storytelling: { weight: 20, questions: [
    { id: 'detail_or_headlines', prompt: 'Do you like to tell stories with detail or headlines?' },
    { id: 'describe_funny', prompt: 'How do you usually describe funny moments?' },
    { id: 'fav_story', prompt: 'What’s a story you love retelling?' },
    { id: 'reactions_or_listen', prompt: 'When you share a story, do you want reactions or just listening?' },
    { id: 'interruptions', prompt: 'How do you handle interruptions in a story?' },
  ]},
  life: { weight: 20, questions: [
    { id: 'where_time', prompt: 'Where do you spend most of your time?' },
    { id: 'key_people', prompt: 'Who are your key people—family, friends, coworkers?' },
    { id: 'draining_days', prompt: 'What kind of days drain you the most?' },
    { id: 'feel_productive', prompt: 'What makes you feel productive?' },
    { id: 'end_day', prompt: 'How do you like to end your day?' },
  ]},
  future: { weight: 20, questions: [
    { id: 'short_goals', prompt: 'What are your short-term goals right now?' },
    { id: 'this_year', prompt: 'What’s something you’re planning for this year?' },
    { id: 'talk_ambitions', prompt: 'How should Evo talk to you about your ambitions?' },
    { id: 'future_picture', prompt: 'When you dream about your future, what do you picture first?' },
    { id: 'future_or_moment', prompt: 'Do you like to talk about the future or live in the moment?' },
  ]},
  calibration: { weight: 35, questions: [
    { id: 'appreciated_words', prompt: 'What words make you feel appreciated?' },
    { id: 'avoid_phrases', prompt: 'What phrases should Evo avoid using?' },
    { id: 'polite_interrupt', prompt: 'How do you prefer to be interrupted politely?' },
    { id: 'when_silent', prompt: 'When should Evo stay silent?' },
    { id: 'distracted_tired', prompt: 'How should Evo respond if you seem distracted or tired?' },
    { id: 'alive_convo', prompt: 'What makes a conversation feel alive to you?' },
    { id: 'mirror_or_balance', prompt: 'Should Evo mirror your tone, or balance it?' },
    { id: 'sarcastic_vs_serious', prompt: 'How can Evo tell when you’re being sarcastic vs serious?' },
    { id: 'turn_off_style', prompt: 'What’s a conversation style that turns you off?' },
    { id: 'make_you_smile', prompt: 'What’s one way to make you smile through text or voice?' },
  ]},
} as const

export type SectionKey = keyof typeof EVO_REGISTRY
export type AnswersPayload = Record<SectionKey, Record<string, string>>

export const AnswersSchema = z.object({
  sections: z.record(z.string(), z.record(z.string(), z.string().min(1))).optional()
})

const TOTAL_WEIGHT = Object.values(EVO_REGISTRY).reduce((a, s) => a + s.weight, 0) // 200

export function computeScoreAndProgress(sections: Partial<AnswersPayload>) {
  let score = 0
  for (const [key, def] of Object.entries(EVO_REGISTRY) as [SectionKey, typeof EVO_REGISTRY[SectionKey]][]) {
    const answers = sections?.[key] || {}
    const answered = Object.values(answers).filter(v => (v ?? '').trim().length > 0).length
    const totalQs = def.questions.length
    const sectionScore = (answered / totalQs) * def.weight
    score += sectionScore
  }
  const progressPct = Math.round((score / TOTAL_WEIGHT) * 100)
  return { score: Math.round(score), progressPct }
}
