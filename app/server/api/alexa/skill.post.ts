import { verifyBearerHeader } from '~/server/utils/jwt'
import { linkAlexaIdentity } from '~/server/utils/alexa'

/**
 * Alexa Skill Handler Endpoint
 *
 * This endpoint receives requests from your Alexa skill.
 * Alexa will send the access token (that we generated) in the Authorization header.
 * The request body will contain the Alexa request with user ID and device info.
 *
 * Example Alexa request structure:
 * {
 *   "session": {
 *     "user": {
 *       "userId": "amzn1.ask.account.XXX",
 *       "accessToken": "our-jwt-token"
 *     }
 *   },
 *   "context": {
 *     "System": {
 *       "device": {
 *         "deviceId": "amzn1.ask.device.XXX"
 *       }
 *     }
 *   },
 *   "request": {
 *     "type": "IntentRequest",
 *     "intent": {
 *       "name": "YourIntentName"
 *     }
 *   }
 * }
 */
export default defineEventHandler(async (e) => {
  const body = await readBody(e)

  // Extract the access token from Authorization header
  const auth = getHeader(e, 'authorization')
  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing authorization header'
    })
  }

  // Verify the access token and get our user ID
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  // Extract Alexa user ID and device ID from the request
  const alexaUserId = body?.session?.user?.userId || body?.context?.System?.user?.userId
  const deviceId = body?.context?.System?.device?.deviceId

  if (!alexaUserId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Alexa user ID in request'
    })
  }

  // Link the Alexa identity to our user (creates or updates ExternalIdentity)
  await linkAlexaIdentity(userId, alexaUserId, deviceId)

  // Handle the actual skill request based on intent type
  const requestType = body?.request?.type
  const intentName = body?.request?.intent?.name

  // Example response structure
  // TODO: Implement your actual skill logic here
  return {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: 'Hello! Your account is linked successfully.'
      },
      shouldEndSession: true
    }
  }
})
