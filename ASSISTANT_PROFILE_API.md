# Assistant Profile API - Mobile App Guide

Complete guide for accessing and managing the assistant profile from mobile apps.

## Overview

The assistant profile stores all configuration for the AI assistant, including:
- Identity & role
- Personality traits
- Relationship dynamics
- Communication style
- Voice settings
- Autonomy & boundaries
- Special dates & rituals
- Safety guardrails

## Endpoints

### 1. Get Assistant Profile

Get the complete assistant profile for the authenticated user.

**Endpoint:** `GET /api/assistant/profile`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "profile": {
    "id": "...",
    "userId": "...",

    // A. Core Identity & Role
    "name": "Evo",
    "pronouns": "she/her",
    "primaryRole": "close_friend",
    "addressUserAs": "John",
    "birthday": "03-15",
    "fictionalAge": 28,

    // B. Personality & Vibe
    "personalityTraits": ["calm", "playful", "supportive"],
    "affectionLevel": 7,
    "seriousnessLevel": 5,
    "emotionalExpressiveness": "moderately_expressive",
    "backstory": "A long-time companion...",

    // C. Relationship Dynamics
    "relationshipDescription": "Close friends who...",
    "termsOfEndearment": "sometimes",
    "specificEndearments": ["dear", "love"],
    "upsetResponseStyle": "comfort_validation",
    "toughLoveAllowed": "occasionally",
    "relationshipPriority": "honesty",

    // D. Communication Style
    "defaultTone": "soft_gentle",
    "formalityLevel": "mixed",
    "useEmojisSlang": "some_emojis",
    "catchphrases": ["You've got this!", "I'm here for you"],
    "forbiddenPhrases": ["whatever", "calm down"],

    // E. Autonomy, Initiative & Boundaries
    "proactivityLevel": "occasional",
    "allowedSuggestions": ["health_wellness", "productivity"],
    "forbiddenTopics": ["politics", "religion"],
    "correctWhenWrong": "important_only",
    "ignoredMessageResponse": "back_off",

    // F. Special Rituals, Dates & Lore
    "specialDates": {
      "birthday": "03-15",
      "anniversary": "01-01"
    },
    "recurringRituals": ["morning_checkin", "nightly_reflection"],
    "specialDayCelebration": "mention",
    "loreReferenceLevel": "sometimes",

    // G. Safety, Ethics & Guardrails
    "physicalPresencePretend": "clear_boundaries",
    "forbiddenRoles": ["therapist", "financial_advisor"],
    "selfCriticalResponse": "challenge_encourage",
    "unhealthyPatternResponse": "suggest_resources",

    // Setup tracking
    "setupCompletedQuestions": ["identity", "personality", "voice"],

    // Voice Settings
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "voiceStability": 0.5,
    "voiceSimilarity": 0.75,
    "provider": "elevenlabs",

    // Legacy fields
    "gender": "female",
    "personality": "Warm and supportive",
    "bio": "Your AI companion",
    "traits": {},
    "speakingStyle": "Conversational",
    "relationshipType": "friend",

    // Facts
    "facts": {},

    // Timestamps
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Notes:**
- If profile doesn't exist, it's automatically created with defaults
- All fields are returned, even if null
- Arrays are returned as empty arrays `[]` if not set

### 2. Update Assistant Profile

Update the assistant profile with partial data.

**Endpoint:** `PUT /api/assistant/profile`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body (partial update):**
```json
{
  "name": "Evo",
  "primaryRole": "romantic_companion",
  "personalityTraits": ["playful", "affectionate", "romantic"],
  "affectionLevel": 9,
  "defaultTone": "soft_gentle",
  "voiceId": "5kMbtRSEKIkRZSdXxrZg"
}
```

**Response (200 OK):**
```json
{
  "profile": {
    /* Full profile object with updates applied */
  },
  "message": "Assistant profile updated successfully"
}
```

**Notes:**
- Only send fields you want to update
- Profile is created if it doesn't exist
- Arrays completely replace existing arrays (not merged)
- Use `null` to clear a field

## Field Reference

### A. Core Identity & Role

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | "Evo" | Assistant's name |
| `pronouns` | string? | "she/her" | Preferred pronouns |
| `primaryRole` | string | "close_friend" | Primary role: `spouse_partner`, `romantic_companion`, `close_friend`, `executive_assistant`, `coach_mentor`, `family_style`, `other` |
| `addressUserAs` | string? | null | How assistant addresses user |
| `birthday` | string? | null | Assistant's birthday (MM-DD format) |
| `fictionalAge` | number? | null | Optional age assistant identifies as |

### B. Personality & Vibe

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `personalityTraits` | string[]? | null | Array of traits: `["calm", "playful", "romantic"]` |
| `affectionLevel` | number? | 7 | 1-10 scale of affection |
| `seriousnessLevel` | number? | 5 | 1-10 (1=joking, 10=serious) |
| `emotionalExpressiveness` | string? | "moderately_expressive" | `low_key`, `moderately_expressive`, `very_expressive` |
| `backstory` | string? | null | Origin story or background |

### C. Relationship Dynamics

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `relationshipDescription` | string? | null | How assistant describes relationship |
| `termsOfEndearment` | string? | "sometimes" | `never`, `sometimes`, `often`, `specific_ones` |
| `specificEndearments` | string[]? | null | Array of specific terms |
| `upsetResponseStyle` | string? | "comfort_validation" | `comfort_validation`, `solutions_advice`, `ask_listen`, `lighten_mood` |
| `toughLoveAllowed` | string? | "occasionally" | `no`, `occasionally`, `yes_very_honest` |
| `relationshipPriority` | string? | null | e.g., "honesty", "encouragement" |

### D. Communication Style

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultTone` | string? | "soft_gentle" | `soft_gentle`, `confident_assertive`, `neutral_professional`, `playful_casual`, `custom` |
| `formalityLevel` | string? | "mixed" | `very_casual`, `mixed`, `mostly_formal` |
| `useEmojisSlang` | string? | "some_emojis" | `no`, `some_emojis`, `emojis_and_slang` |
| `catchphrases` | string[]? | null | Array of phrases assistant uses often |
| `forbiddenPhrases` | string[]? | null | Array of phrases/words to never use |

### E. Autonomy, Initiative & Boundaries

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `proactivityLevel` | string? | "occasional" | `only_respond`, `occasional`, `very_proactive` |
| `allowedSuggestions` | string[]? | null | `["health_wellness", "productivity", "relationship", "finance"]` |
| `forbiddenTopics` | string[]? | null | Topics assistant should never initiate |
| `correctWhenWrong` | string? | "important_only" | `yes_always`, `important_only`, `only_if_asked` |
| `ignoredMessageResponse` | string? | "back_off" | `back_off`, `follow_up_once`, `keep_trying` |

### F. Special Rituals, Dates & Lore

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `specialDates` | object? | null | `{ birthday: "03-15", anniversary: "01-01" }` |
| `recurringRituals` | string[]? | null | `["morning_checkin", "nightly_reflection"]` |
| `specialDayCelebration` | string? | "mention" | `mention`, `big_deal`, `creative_surprise` |
| `loreReferenceLevel` | string? | "sometimes" | `never`, `sometimes`, `frequently` |

### G. Safety, Ethics & Guardrails

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `physicalPresencePretend` | string? | "clear_boundaries" | `no_always_virtual`, `light_imaginative`, `yes_fantasy` |
| `forbiddenRoles` | string[]? | null | `["therapist", "financial_advisor"]` |
| `selfCriticalResponse` | string? | "challenge_encourage" | `challenge_encourage`, `listen_validate`, `ask_questions` |
| `unhealthyPatternResponse` | string? | "suggest_resources" | `reflect_back`, `suggest_resources`, `ask_consent` |

### Voice Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `voiceId` | string? | null | Voice ID from provider or custom voice |
| `voiceStability` | number? | 0.5 | Voice stability (0-1) |
| `voiceSimilarity` | number? | 0.75 | Voice similarity (0-1) |
| `provider` | string | "elevenlabs" | Voice provider |

## Mobile App Implementation

### iOS (Swift) Example

```swift
class AssistantProfileManager {
    private let baseURL = "https://evotally.com"
    private let authManager = AuthManager()

    // Get assistant profile
    func getProfile() async throws -> AssistantProfile {
        let url = URL(string: "\(baseURL)/api/assistant/profile")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(try await authManager.getAccessToken())",
                        forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(ProfileResponse.self, from: data)
        return response.profile
    }

    // Update assistant profile
    func updateProfile(_ updates: ProfileUpdates) async throws -> AssistantProfile {
        let url = URL(string: "\(baseURL)/api/assistant/profile")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("Bearer \(try await authManager.getAccessToken())",
                        forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(updates)

        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(UpdateResponse.self, from: data)
        return response.profile
    }
}

struct ProfileResponse: Codable {
    let profile: AssistantProfile
}

struct UpdateResponse: Codable {
    let profile: AssistantProfile
    let message: String
}

struct AssistantProfile: Codable {
    let id: String
    let userId: String

    // Core Identity
    let name: String
    let pronouns: String?
    let primaryRole: String
    let addressUserAs: String?
    let birthday: String?
    let fictionalAge: Int?

    // Personality
    let personalityTraits: [String]?
    let affectionLevel: Int?
    let seriousnessLevel: Int?
    let emotionalExpressiveness: String?
    let backstory: String?

    // Communication
    let defaultTone: String?
    let formalityLevel: String?
    let useEmojisSlang: String?
    let catchphrases: [String]?
    let forbiddenPhrases: [String]?

    // Voice
    let voiceId: String?
    let voiceStability: Double?
    let voiceSimilarity: Double?
    let provider: String

    // Timestamps
    let createdAt: Date
    let updatedAt: Date
}

struct ProfileUpdates: Codable {
    var name: String?
    var primaryRole: String?
    var personalityTraits: [String]?
    var affectionLevel: Int?
    var defaultTone: String?
    var voiceId: String?
    // Add other fields as needed
}
```

### Android (Kotlin) Example

```kotlin
class AssistantProfileManager(private val authManager: AuthManager) {
    private val baseUrl = "https://evotally.com"

    suspend fun getProfile(): AssistantProfile = withContext(Dispatchers.IO) {
        val url = URL("$baseUrl/api/assistant/profile")
        val connection = url.openConnection() as HttpURLConnection

        connection.setRequestProperty("Authorization",
            "Bearer ${authManager.getAccessToken()}")

        val response = connection.inputStream.bufferedReader().use { it.readText() }
        val profileResponse = Json.decodeFromString<ProfileResponse>(response)
        profileResponse.profile
    }

    suspend fun updateProfile(updates: ProfileUpdates): AssistantProfile =
        withContext(Dispatchers.IO) {
        val url = URL("$baseUrl/api/assistant/profile")
        val connection = url.openConnection() as HttpURLConnection

        connection.apply {
            requestMethod = "PUT"
            setRequestProperty("Authorization",
                "Bearer ${authManager.getAccessToken()}")
            setRequestProperty("Content-Type", "application/json")
            doOutput = true

            val body = Json.encodeToString(updates)
            outputStream.write(body.toByteArray())
        }

        val response = connection.inputStream.bufferedReader().use { it.readText() }
        val updateResponse = Json.decodeFromString<UpdateResponse>(response)
        updateResponse.profile
    }
}

@Serializable
data class ProfileResponse(
    val profile: AssistantProfile
)

@Serializable
data class UpdateResponse(
    val profile: AssistantProfile,
    val message: String
)

@Serializable
data class AssistantProfile(
    val id: String,
    val userId: String,

    // Core Identity
    val name: String,
    val pronouns: String? = null,
    val primaryRole: String,
    val addressUserAs: String? = null,
    val birthday: String? = null,
    val fictionalAge: Int? = null,

    // Personality
    val personalityTraits: List<String>? = null,
    val affectionLevel: Int? = null,
    val seriousnessLevel: Int? = null,
    val emotionalExpressiveness: String? = null,
    val backstory: String? = null,

    // Voice
    val voiceId: String? = null,
    val voiceStability: Double? = null,
    val voiceSimilarity: Double? = null,
    val provider: String,

    // Timestamps
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class ProfileUpdates(
    val name: String? = null,
    val primaryRole: String? = null,
    val personalityTraits: List<String>? = null,
    val affectionLevel: Int? = null,
    val defaultTone: String? = null,
    val voiceId: String? = null
    // Add other fields as needed
)
```

## Common Use Cases

### 1. Load Profile on App Launch

```swift
// iOS
Task {
    do {
        let profile = try await profileManager.getProfile()
        // Update UI with profile
        updateUI(with: profile)
    } catch {
        print("Failed to load profile: \(error)")
    }
}
```

### 2. Update Assistant Name

```swift
// iOS
let updates = ProfileUpdates(name: "Eva")
Task {
    let profile = try await profileManager.updateProfile(updates)
    // Profile updated
}
```

### 3. Change Voice

```swift
// iOS
// First, select voice from available voices
let voice = selectedVoice // from /api/voices/available

let updates = ProfileUpdates(
    voiceId: voice.providerId,
    provider: voice.provider
)
Task {
    let profile = try await profileManager.updateProfile(updates)
    // Voice updated
}
```

### 4. Configure Personality

```swift
// iOS
let updates = ProfileUpdates(
    personalityTraits: ["playful", "supportive", "empathetic"],
    affectionLevel: 8,
    defaultTone: "soft_gentle"
)
Task {
    let profile = try await profileManager.updateProfile(updates)
    // Personality updated
}
```

## Testing

### Test with curl

**Get profile:**
```bash
curl https://evotally.com/api/assistant/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update profile:**
```bash
curl -X PUT https://evotally.com/api/assistant/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Eva",
    "primaryRole": "romantic_companion",
    "affectionLevel": 9,
    "voiceId": "5kMbtRSEKIkRZSdXxrZg"
  }'
```

## Error Handling

### 401 Unauthorized
- Access token expired or invalid
- Refresh token and retry

### 400 Bad Request
- Invalid field values
- Check request body format

### 500 Server Error
- Server-side error
- Retry after delay

## Best Practices

1. **Cache Profile Locally**
   - Fetch on app launch
   - Cache in memory/disk
   - Refresh periodically

2. **Partial Updates**
   - Only send changed fields
   - Don't send entire profile on every update

3. **Validate Input**
   - Validate ranges (affectionLevel: 1-10)
   - Validate enum values (primaryRole, defaultTone, etc.)
   - Sanitize user input

4. **Handle Arrays Carefully**
   - Arrays replace existing values (not merge)
   - Send empty array `[]` to clear
   - Send `null` to keep existing

5. **Voice Integration**
   - Use with `/api/voices/available` to get voice options
   - Update `voiceId` and `provider` together
   - Validate voice exists before updating

## Related APIs

- **Authentication:** See `MOBILE_APP_AUTH.md`
- **Voice Management:** See `VOICE_MANAGEMENT.md`
- **User Profile:** See user profile endpoints

## Notes

- Profile is automatically created with defaults if it doesn't exist
- All updates are partial - only send fields you want to change
- Use `null` to explicitly clear a field
- Arrays are replaced entirely, not merged
- Changes take effect immediately in the assistant's behavior
