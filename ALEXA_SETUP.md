# Alexa Account Linking Setup Guide

This guide explains how to set up account linking between your Alexa skill and this application.

## Overview

The application now supports OAuth 2.0 account linking with Alexa, allowing users to connect their Alexa devices to their accounts.

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Alexa Account Linking
ALEXA_CLIENT_ID=your-alexa-skill-client-id
ALEXA_CLIENT_SECRET=your-alexa-skill-client-secret
```

**Note:** You'll generate these credentials when setting up your Alexa skill.

## API Endpoints

### Authorization Endpoint
- **URL:** `https://your-domain.com/api/alexa/authorize`
- **Method:** GET
- **Description:** Initial OAuth authorization endpoint where Alexa redirects users
- **Parameters:**
  - `client_id` - Your Alexa skill client ID
  - `redirect_uri` - Amazon's redirect URI
  - `state` - OAuth state parameter
  - `response_type` - Must be "code"
  - `scope` (optional) - Requested permissions

### Token Endpoint
- **URL:** `https://your-domain.com/api/alexa/token`
- **Method:** POST
- **Content-Type:** `application/x-www-form-urlencoded`
- **Description:** Token exchange endpoint for Alexa to get access tokens
- **Parameters:**
  - `grant_type` - Either "authorization_code" or "refresh_token"
  - `code` - Authorization code (for authorization_code grant)
  - `redirect_uri` - Must match the original redirect_uri
  - `client_id` - Your Alexa skill client ID
  - `client_secret` - Your Alexa skill client secret
  - `refresh_token` - Refresh token (for refresh_token grant)

### User Authorization Page
- **URL:** `https://your-domain.com/alexa/authorize`
- **Description:** User-facing page where users authorize the Alexa connection
- **Features:**
  - Automatic authorization for logged-in users
  - Login redirect for non-authenticated users
  - Success/error feedback
  - Secure redirect back to Alexa

## Alexa Skill Configuration

### 1. Create an Alexa Skill
1. Go to [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Create a new skill or select an existing one
3. Navigate to **Account Linking** settings

### 2. Configure Account Linking
Set the following in your Alexa skill's Account Linking section:

**Authorization URI:**
```
https://your-domain.com/alexa/authorize
```

**Access Token URI:**
```
https://your-domain.com/api/alexa/token
```

**Client ID:**
- Create a unique identifier (e.g., `alexa-skill-client`)
- Add this to your `.env` as `ALEXA_CLIENT_ID`

**Client Secret:**
- Generate a secure random string (use a password generator)
- Add this to your `.env` as `ALEXA_CLIENT_SECRET`

**Client Authentication Scheme:**
- Select: `HTTP Basic (Recommended)`

**Scope:**
- Leave empty or add custom scopes if needed

**Authorization Grant Type:**
- Select: `Auth Code Grant`

**Access Token Scheme:**
- Select: `HTTP Bearer`

### 3. Redirect URLs
Amazon will provide redirect URLs (usually like `https://pitangui.amazon.com/api/skill/link/...`). These are automatically validated by the authorization endpoint.

## Security Features

### Authorization Codes
- One-time use only
- Expire after 10 minutes
- Validated against client_id and redirect_uri
- Stored securely in database

### Refresh Tokens
- Long-lived (90 days)
- Securely stored with user association
- Can be revoked by deleting from database

### Access Tokens
- Short-lived (15 minutes by default)
- Standard JWT tokens
- Include user ID and tenant information

## Testing Account Linking

### 1. Enable Account Linking in Alexa App
1. Open the Alexa mobile app
2. Go to Skills & Games
3. Find your skill
4. Enable the skill
5. Click "Link Account"

### 2. Expected Flow
1. User is redirected to `your-domain.com/alexa/authorize`
2. If not logged in, user is prompted to log in
3. After login, user is automatically redirected back to Alexa
4. Alexa receives authorization code
5. Alexa exchanges code for access token
6. User can now use the skill with their account

### 3. Testing with curl

**Get Authorization Code:**
```bash
# As a logged-in user, visit:
https://your-domain.com/alexa/authorize?client_id=alexa-skill-client&redirect_uri=https://example.com/callback&state=random-state&response_type=code

# You'll be redirected to:
https://example.com/callback?code=<auth-code>&state=random-state
```

**Exchange for Access Token:**
```bash
curl -X POST https://your-domain.com/api/alexa/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=<auth-code>" \
  -d "redirect_uri=https://example.com/callback" \
  -d "client_id=alexa-skill-client" \
  -d "client_secret=<your-secret>"
```

**Use Refresh Token:**
```bash
curl -X POST https://your-domain.com/api/alexa/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=<refresh-token>" \
  -d "client_id=alexa-skill-client" \
  -d "client_secret=<your-secret>"
```

## Database Models

### AlexaAuthCode
Stores temporary authorization codes:
- `code` - Unique authorization code
- `userId` - Associated user
- `clientId` - Alexa skill client ID
- `redirectUri` - Original redirect URI
- `expiresAt` - Expiration time (10 minutes)
- `used` - Whether code has been exchanged

### AlexaRefreshToken
Stores long-lived refresh tokens:
- `token` - Unique refresh token
- `userId` - Associated user
- `clientId` - Alexa skill client ID
- `expiresAt` - Expiration time (90 days)

## Troubleshooting

### "Invalid client credentials"
- Check that `ALEXA_CLIENT_ID` and `ALEXA_CLIENT_SECRET` in `.env` match your Alexa skill configuration

### "Invalid redirect_uri"
- Ensure the redirect_uri in the request matches exactly what Alexa is sending
- Check that it's an Amazon domain (amazon.com or amazonalexa.com)

### "Authorization code expired"
- Codes expire after 10 minutes
- Alexa should exchange them immediately after receiving

### "Refresh token expired"
- Refresh tokens expire after 90 days
- User will need to re-link their account

## Revoking Access

To revoke a user's Alexa access:

```typescript
// Delete all refresh tokens for a user
await prisma.alexaRefreshToken.deleteMany({
  where: { userId: 'user-id' }
})

// Delete unused auth codes
await prisma.alexaAuthCode.deleteMany({
  where: { userId: 'user-id' }
})
```

## Production Checklist

- [ ] Set strong `ALEXA_CLIENT_ID` and `ALEXA_CLIENT_SECRET` in production
- [ ] Use HTTPS for all endpoints
- [ ] Configure proper CORS if needed
- [ ] Set up monitoring for failed authorization attempts
- [ ] Implement rate limiting on token endpoint
- [ ] Set up alerts for expired tokens cleanup
- [ ] Test account linking with real Alexa devices
- [ ] Document skill invocation name and intents

## Next Steps

After account linking is set up:
1. Implement Alexa skill handler to receive and process user requests
2. Use the access token to authenticate API calls from Alexa
3. Build out skill intents and responses
4. Test with various Alexa devices and scenarios
