import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import bcrypt from 'bcryptjs'

type Body = {
  email?: string
  password?: string
  display_name?: string
  first_name?: string
  last_name?: string
  nickname?: string
  timezone?: string
}

function normEmail(e?: string) {
  return String(e || '').trim().toLowerCase()
}

export default defineEventHandler(async (event) => {
  const b = await readBody<Body>(event)

  const email = normEmail(b?.email)
  const password = String(b?.password || '')
  const display_name = b?.display_name?.trim() || null
  const first_name = b?.first_name?.trim() || null
  const last_name = b?.last_name?.trim() || null
  const nickname = b?.nickname?.trim() || null
  const timezone = b?.timezone?.trim() || null

  // Basic validation
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required.' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 422, statusMessage: 'Password must be at least 8 characters.' })
  }

  // Optional: enforce simple email shape (keep it light)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid email address.' })
  }

  // Case-insensitive existence check (safer than findUnique if DB collation is case-sensitive)
  const exists = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  })
  if (exists) {
    throw createError({ statusCode: 409, statusMessage: 'Email address is already registered.' })
  }

  // Hash password with bcrypt
  const password_hash = await bcrypt.hash(password, 10)

  // Create user — only pass defined fields
  const user = await prisma.user.create({
    data: {
      email,                 // store lowercased
      password_hash,         // keep one canonical column name
      display_name,
      first_name,
      last_name,
      nickname,
      timezone,
    } as any,
    select: {
      id: true,
      email: true,
      display_name: true,
      first_name: true,
      last_name: true,
      timezone: true,
    },
  })

  return { id: user.id, email: user.email, display_name: user.display_name }
})
