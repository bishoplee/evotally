# Voice Management API

This guide explains how to manage voices (system and custom) for users.

## Overview

The voice system supports two types of voices:

1. **System Voices**: Pre-configured voices from providers (ElevenLabs, OpenAI, Deepgram, etc.)
2. **Custom Voices**: User-uploaded voice files

## Database Models

### ProviderVoice
Catalog of all system voices available from providers.

```typescript
{
  id: string
  provider: string          // "elevenlabs", "openai", "deepgram"
  providerId: string        // Provider's voice ID
  name: string              // Display name
  description?: string
  language?: string         // "en-US", "es-ES"
  gender?: string           // "male", "female", "neutral"
  accent?: string           // "american", "british"
  ageRange?: string         // "young", "middle-aged", "old"
  useCase?: string          // "narration", "conversational"
  previewUrl?: string       // Audio sample URL
  isActive: boolean         // Can be disabled
  settings?: object         // Provider-specific settings
}
```

### Voice
User's selected or custom voices.

```typescript
{
  id: string
  userId: string
  provider: string          // "elevenlabs", "openai", "custom"
  voiceId: string           // Provider ID or custom voice URL
  label?: string
  stability?: number
  similarityBoost?: number
  settings?: object
  isDefault: boolean
}
```

## User Endpoints

### 1. Get All Available Voices

Get both system and custom voices available to the user.

**Endpoint:** `GET /api/voices/available`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `provider` (optional): Filter by provider (e.g., "elevenlabs")
- `language` (optional): Filter by language (e.g., "en-US")
- `search` (optional): Search by name/description

**Response:**
```json
{
  "systemVoices": [
    {
      "id": "...",
      "type": "system",
      "provider": "elevenlabs",
      "providerId": "21m00Tcm4TlvDq8ikWAM",
      "voiceId": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "label": "Rachel",
      "description": "A calm, professional female voice",
      "language": "en-US",
      "gender": "female",
      "accent": "american",
      "ageRange": "middle-aged",
      "useCase": "narration",
      "previewUrl": "https://...",
      "settings": {},
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "customVoices": [
    {
      "id": "...",
      "type": "custom",
      "provider": "custom",
      "voiceId": "https://storage.com/voice.mp3",
      "name": "My Voice",
      "label": "My Voice",
      "description": "User uploaded voice",
      "isDefault": true,
      "stability": 0.4,
      "similarityBoost": 0.85,
      "settings": {},
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "all": [/* Combined array of both */]
}
```

### 2. Upload Custom Voice

Upload or register a custom voice file.

**Endpoint:** `POST /api/voices/upload`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "voiceId": "https://storage.com/my-voice.mp3",  // URL to uploaded file
  "label": "My Custom Voice",
  "stability": 0.5,
  "similarityBoost": 0.8,
  "makeDefault": true
}
```

**Response:**
```json
{
  "voice": {
    "id": "...",
    "userId": "...",
    "provider": "custom",
    "voiceId": "https://storage.com/my-voice.mp3",
    "label": "My Custom Voice",
    "stability": 0.5,
    "similarityBoost": 0.8,
    "isDefault": true,
    "created_at": "...",
    "updated_at": "..."
  },
  "message": "Custom voice uploaded successfully"
}
```

**Notes:**
- The `voiceId` should be a URL to a voice file already uploaded to your storage
- Users can only have one custom voice (will update if exists)
- Set `makeDefault: true` to make this the user's default voice

### 3. Select a Voice

Select a voice from the catalog or use a custom voice.

**Endpoint:** `POST /api/voices/select`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body (System Voice):**
```json
{
  "type": "system",
  "provider": "elevenlabs",
  "providerId": "21m00Tcm4TlvDq8ikWAM",
  "label": "Rachel",
  "makeDefault": true
}
```

**Body (Custom Voice):**
```json
{
  "type": "custom",
  "voiceId": "voice-id-from-voice-table",
  "makeDefault": true
}
```

**Response:**
```json
{
  "voice": {
    "id": "...",
    "userId": "...",
    "provider": "elevenlabs",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "label": "Rachel",
    "isDefault": true,
    "created_at": "...",
    "updated_at": "..."
  },
  "message": "Voice selected successfully"
}
```

### 4. Get User's Voices (Existing Endpoint)

Get the user's configured voices.

**Endpoint:** `GET /api/voices`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `provider` (optional): Filter by provider

**Response:**
```json
{
  "items": [
    {
      "id": "...",
      "userId": "...",
      "provider": "elevenlabs",
      "voiceId": "21m00Tcm4TlvDq8ikWAM",
      "label": "Rachel",
      "isDefault": true,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### 5. Set Voice as Default (Existing Endpoint)

Set an existing voice as the default.

**Endpoint:** `POST /api/voice/select`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "id": "voice-id"
}
```

### 6. Delete Voice (Existing Endpoint)

Delete a user's voice configuration.

**Endpoint:** `DELETE /api/voice/{id}`

**Headers:**
```
Authorization: Bearer {access_token}
```

## Admin Endpoints

### 1. Get All Provider Voices

Get all system voices in the catalog (admin only).

**Endpoint:** `GET /api/admin/voices`

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

**Query Parameters:**
- `provider` (optional): Filter by provider
- `isActive` (optional): Filter by active status ("true" or "false")

**Response:**
```json
{
  "voices": [
    {
      "id": "...",
      "provider": "elevenlabs",
      "providerId": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "description": "...",
      "language": "en-US",
      "gender": "female",
      "accent": "american",
      "ageRange": "middle-aged",
      "useCase": "narration",
      "previewUrl": "https://...",
      "isActive": true,
      "settings": {},
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "total": 1
}
```

### 2. Add/Update Provider Voice

Add a new system voice or update existing one (admin only).

**Endpoint:** `POST /api/admin/voices`

**Headers:**
```
Authorization: Bearer {admin_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "provider": "elevenlabs",
  "providerId": "21m00Tcm4TlvDq8ikWAM",
  "name": "Rachel",
  "description": "A calm, professional female voice",
  "language": "en-US",
  "gender": "female",
  "accent": "american",
  "ageRange": "middle-aged",
  "useCase": "narration",
  "previewUrl": "https://...",
  "settings": {
    "model_id": "eleven_multilingual_v2"
  }
}
```

**Response:**
```json
{
  "voice": {
    "id": "...",
    "provider": "elevenlabs",
    "providerId": "21m00Tcm4TlvDq8ikWAM",
    "name": "Rachel",
    "...": "..."
  },
  "message": "Provider voice added successfully"
}
```

## Mobile App Integration

All user endpoints (`/api/voices/*` and `/api/voice/*`) are available to mobile apps.

### Example: iOS Implementation

```swift
class VoiceManager {
    private let baseURL = "https://evotally.com"
    private let authManager = AuthManager()

    // Get all available voices
    func getAvailableVoices(provider: String? = nil, language: String? = nil) async throws -> VoicesResponse {
        var urlString = "\(baseURL)/api/voices/available"
        var queryItems: [URLQueryItem] = []
        if let provider = provider {
            queryItems.append(URLQueryItem(name: "provider", value: provider))
        }
        if let language = language {
            queryItems.append(URLQueryItem(name: "language", value: language))
        }

        var components = URLComponents(string: urlString)!
        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }

        var request = URLRequest(url: components.url!)
        request.setValue("Bearer \(try await authManager.getAccessToken())", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(VoicesResponse.self, from: data)
    }

    // Upload custom voice
    func uploadCustomVoice(voiceURL: String, label: String, makeDefault: Bool = false) async throws {
        let url = URL(string: "\(baseURL)/api/voices/upload")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(try await authManager.getAccessToken())", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "voiceId": voiceURL,
            "label": label,
            "makeDefault": makeDefault
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: request)
        _ = try JSONDecoder().decode(VoiceUploadResponse.self, from: data)
    }

    // Select a voice
    func selectVoice(type: String, provider: String, providerId: String, makeDefault: Bool = false) async throws {
        let url = URL(string: "\(baseURL)/api/voices/select")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(try await authManager.getAccessToken())", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "type": type,
            "provider": provider,
            "providerId": providerId,
            "makeDefault": makeDefault
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: request)
        _ = try JSONDecoder().decode(VoiceSelectResponse.self, from: data)
    }
}

struct VoicesResponse: Codable {
    let systemVoices: [SystemVoice]
    let customVoices: [CustomVoice]
    let all: [Voice]
}

struct SystemVoice: Codable {
    let id: String
    let type: String
    let provider: String
    let providerId: String
    let name: String
    let description: String?
    let language: String?
    let gender: String?
    let accent: String?
    let previewUrl: String?
}

struct CustomVoice: Codable {
    let id: String
    let type: String
    let provider: String
    let voiceId: String
    let label: String?
    let isDefault: Bool
}
```

## Common Use Cases

### 1. Display Voice Selection UI
```
1. Call GET /api/voices/available
2. Group by provider
3. Show system voices and custom voices separately
4. Display preview buttons using previewUrl
5. Allow user to select and call POST /api/voices/select
```

### 2. Upload Custom Voice
```
1. User records/uploads audio file
2. Upload file to your storage (S3, etc.)
3. Get the URL of the uploaded file
4. Call POST /api/voices/upload with the URL
```

### 3. Switch Voice Provider
```
1. User selects a different provider (e.g., from ElevenLabs to OpenAI)
2. Call POST /api/voices/select with the new provider and voice ID
3. The system updates the user's voice for that provider
```

### 4. Set Default Voice
```
1. Call POST /api/voices/select with makeDefault: true
2. Or call POST /api/voice/select with existing voice ID
```

## Testing

### Test with curl

**Get available voices:**
```bash
curl https://evotally.com/api/voices/available \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Upload custom voice:**
```bash
curl -X POST https://evotally.com/api/voices/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voiceId": "https://storage.com/voice.mp3",
    "label": "My Voice",
    "makeDefault": true
  }'
```

**Select system voice:**
```bash
curl -X POST https://evotally.com/api/voices/select \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "system",
    "provider": "elevenlabs",
    "providerId": "21m00Tcm4TlvDq8ikWAM",
    "makeDefault": true
  }'
```

## Populating System Voices

To populate the ProviderVoice catalog, use the admin endpoint:

```bash
curl -X POST https://evotally.com/api/admin/voices \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "elevenlabs",
    "providerId": "21m00Tcm4TlvDq8ikWAM",
    "name": "Rachel",
    "description": "A calm, professional female voice",
    "language": "en-US",
    "gender": "female",
    "accent": "american",
    "ageRange": "middle-aged",
    "useCase": "narration",
    "previewUrl": "https://..."
  }'
```

You can batch-populate voices from provider APIs or manually add them.
