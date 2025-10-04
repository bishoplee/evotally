import { prisma } from '~/server/utils/db'
import { hash } from '~/server/utils/hash'
import { defineEventHandler, readBody, createError } from 'h3' // Added explicit imports for clarity

export default defineEventHandler(async (e) => {
  // 1. Input Validation and Sanitization
  const b = await readBody<{ email: string, password: string, display_name?: string }>(e)
  
  // Basic validation check
  if (!b?.email || !b?.password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required.' })
  }
  
  const email = b.email.toLowerCase().trim()
  const display_name = b.display_name?.trim() || null

  try {
    // 2. Check if User Exists
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      throw createError({ statusCode: 409, statusMessage: 'Email address is already registered.' })
    }

    // 3. Hash Password (Secure Operation)
    const password_hash = await hash(b.password)

    // 4. Create New User in Database
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        display_name,
      },
      // Select only safe data to return
      select: {
        id: true,
        email: true,
        display_name: true,
      }
    })
    
    // 5. Success Response (HTTP 200 OK)
    return { id: user.id, email: user.email, display_name: user.display_name }

  } catch (error) {
    // If the error is already a formal H3 error (like 409), re-throw it
    if (error.statusCode) {
      throw error
    }

    // Catch all other unexpected errors (DB connection failure, Hashing failure, etc.)
    console.error('Registration Error:', error)
    
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'An internal server error occurred during registration.' 
    })
  }
})
