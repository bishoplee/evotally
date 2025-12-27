# Mobile App Authentication Guide

This guide explains how to securely authenticate mobile apps (iOS/Android) with your backend API.

## Security Features

✅ **Secure by Default:**
- Passwords hashed with bcrypt (cost factor 10+)
- JWT access tokens (short-lived, 15 minutes)
- Opaque refresh tokens (long-lived, stored as SHA-256 hashes)
- Automatic token rotation on refresh
- Token revocation support
- HTTPS required in production
- Guest user protection

## Authentication Flow

### 1. Login (Get Initial Tokens)

**Endpoint:** `POST https://evotally.com/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userPassword123",
  "platform": "ios",  // or "android" (optional, defaults to "web")
  "persona": "spouse"  // optional, defaults to "spouse"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGc...",  // Use for API requests (short-lived)
  "expires_in": 900,              // Access token expires in 15 minutes
  "refresh_token": "xYz...abc",   // Store securely (long-lived)
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "display_name": "John",
    "is_guest": false
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `403` - Guest account cannot log in

### 2. Refresh Token (Get New Access Token)

When the access token expires (or is about to), use the refresh token to get a new one.

**Endpoint:** `POST https://evotally.com/api/auth/refresh`

**Request:**
```json
{
  "refresh_token": "xYz...abc",  // The refresh token from login
  "platform": "ios",              // optional
  "persona": "spouse"             // optional
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGc...",      // New access token
  "expires_in": 900,                  // 15 minutes
  "refresh_token": "aBc...xyz",       // New refresh token (rotated)
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "display_name": "John",
    "is_guest": false
  }
}
```

**Important:** The refresh token is rotated (changed) on each refresh for security. Always store the new refresh token and discard the old one.

**Error Responses:**
- `401` - No refresh token provided / Invalid or expired refresh token
- `403` - Guest account cannot refresh tokens

### 3. Making Authenticated Requests

Include the access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGc...
```

### 4. Logout (Revoke Token)

**Endpoint:** `POST https://evotally.com/api/auth/logout`

**Request Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

## Mobile App Implementation

### iOS (Swift) Example

```swift
import Foundation

class AuthManager {
    private let baseURL = "https://evotally.com"
    private let keychain = KeychainHelper() // Use Keychain for secure storage

    // MARK: - Login
    func login(email: String, password: String) async throws -> AuthResponse {
        let url = URL(string: "\(baseURL)/api/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "email": email,
            "password": password,
            "platform": "ios"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw AuthError.loginFailed
        }

        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)

        // Store tokens securely in Keychain
        try keychain.save(authResponse.access_token, key: "access_token")
        try keychain.save(authResponse.refresh_token, key: "refresh_token")

        return authResponse
    }

    // MARK: - Refresh Token
    func refreshToken() async throws -> AuthResponse {
        guard let refreshToken = try? keychain.load(key: "refresh_token") else {
            throw AuthError.noRefreshToken
        }

        let url = URL(string: "\(baseURL)/api/auth/refresh")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: String] = [
            "refresh_token": refreshToken,
            "platform": "ios"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw AuthError.refreshFailed
        }

        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)

        // Update tokens in Keychain
        try keychain.save(authResponse.access_token, key: "access_token")
        try keychain.save(authResponse.refresh_token, key: "refresh_token")

        return authResponse
    }

    // MARK: - Make Authenticated Request
    func makeAuthenticatedRequest(to endpoint: String) async throws -> Data {
        guard let accessToken = try? keychain.load(key: "access_token") else {
            throw AuthError.notAuthenticated
        }

        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        // If 401, try refreshing token once
        if let httpResponse = response as? HTTPURLResponse,
           httpResponse.statusCode == 401 {
            _ = try await refreshToken()
            return try await makeAuthenticatedRequest(to: endpoint)
        }

        return data
    }

    // MARK: - Logout
    func logout() async throws {
        guard let accessToken = try? keychain.load(key: "access_token") else {
            // Already logged out
            return
        }

        let url = URL(string: "\(baseURL)/api/auth/logout")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        _ = try? await URLSession.shared.data(for: request)

        // Clear tokens from Keychain
        try? keychain.delete(key: "access_token")
        try? keychain.delete(key: "refresh_token")
    }
}

struct AuthResponse: Codable {
    let access_token: String
    let refresh_token: String
    let expires_in: Int
    let user: User
}

struct User: Codable {
    let id: String
    let email: String
    let first_name: String?
    let last_name: String?
    let display_name: String?
    let is_guest: Bool
}

enum AuthError: Error {
    case loginFailed
    case refreshFailed
    case noRefreshToken
    case notAuthenticated
}
```

### Android (Kotlin) Example

```kotlin
import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.*
import kotlinx.serialization.json.*
import java.net.HttpURLConnection
import java.net.URL

class AuthManager(context: Context) {
    private val baseUrl = "https://evotally.com"

    // Use EncryptedSharedPreferences for secure storage
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val securePrefs = EncryptedSharedPreferences.create(
        context,
        "auth_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    // MARK: - Login
    suspend fun login(email: String, password: String): AuthResponse = withContext(Dispatchers.IO) {
        val url = URL("$baseUrl/api/auth/login")
        val connection = url.openConnection() as HttpURLConnection

        connection.apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            doOutput = true

            val body = Json.encodeToString(mapOf(
                "email" to email,
                "password" to password,
                "platform" to "android"
            ))

            outputStream.write(body.toByteArray())
        }

        val responseCode = connection.responseCode
        if (responseCode != 200) {
            throw AuthException("Login failed: $responseCode")
        }

        val response = connection.inputStream.bufferedReader().use { it.readText() }
        val authResponse = Json.decodeFromString<AuthResponse>(response)

        // Store tokens securely
        securePrefs.edit().apply {
            putString("access_token", authResponse.access_token)
            putString("refresh_token", authResponse.refresh_token)
            apply()
        }

        authResponse
    }

    // MARK: - Refresh Token
    suspend fun refreshToken(): AuthResponse = withContext(Dispatchers.IO) {
        val refreshToken = securePrefs.getString("refresh_token", null)
            ?: throw AuthException("No refresh token")

        val url = URL("$baseUrl/api/auth/refresh")
        val connection = url.openConnection() as HttpURLConnection

        connection.apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            doOutput = true

            val body = Json.encodeToString(mapOf(
                "refresh_token" to refreshToken,
                "platform" to "android"
            ))

            outputStream.write(body.toByteArray())
        }

        val responseCode = connection.responseCode
        if (responseCode != 200) {
            throw AuthException("Refresh failed: $responseCode")
        }

        val response = connection.inputStream.bufferedReader().use { it.readText() }
        val authResponse = Json.decodeFromString<AuthResponse>(response)

        // Update tokens
        securePrefs.edit().apply {
            putString("access_token", authResponse.access_token)
            putString("refresh_token", authResponse.refresh_token)
            apply()
        }

        authResponse
    }

    // MARK: - Make Authenticated Request
    suspend fun makeAuthenticatedRequest(endpoint: String): String = withContext(Dispatchers.IO) {
        val accessToken = securePrefs.getString("access_token", null)
            ?: throw AuthException("Not authenticated")

        val url = URL("$baseUrl$endpoint")
        val connection = url.openConnection() as HttpURLConnection

        connection.setRequestProperty("Authorization", "Bearer $accessToken")

        val responseCode = connection.responseCode

        // If 401, refresh and retry
        if (responseCode == 401) {
            refreshToken()
            return@withContext makeAuthenticatedRequest(endpoint)
        }

        connection.inputStream.bufferedReader().use { it.readText() }
    }

    // MARK: - Logout
    suspend fun logout() = withContext(Dispatchers.IO) {
        val accessToken = securePrefs.getString("access_token", null)

        if (accessToken != null) {
            try {
                val url = URL("$baseUrl/api/auth/logout")
                val connection = url.openConnection() as HttpURLConnection
                connection.apply {
                    requestMethod = "POST"
                    setRequestProperty("Authorization", "Bearer $accessToken")
                }
                connection.responseCode // Execute request
            } catch (e: Exception) {
                // Ignore logout errors
            }
        }

        // Clear tokens
        securePrefs.edit().clear().apply()
    }
}

@Serializable
data class AuthResponse(
    val access_token: String,
    val refresh_token: String,
    val expires_in: Int,
    val user: User
)

@Serializable
data class User(
    val id: String,
    val email: String,
    val first_name: String? = null,
    val last_name: String? = null,
    val display_name: String? = null,
    val is_guest: Boolean
)

class AuthException(message: String) : Exception(message)
```

## Security Best Practices

### 1. **Secure Token Storage**
- ✅ iOS: Use Keychain Services
- ✅ Android: Use EncryptedSharedPreferences
- ❌ Never store tokens in plain SharedPreferences/UserDefaults
- ❌ Never store tokens in app bundle/assets

### 2. **HTTPS Only**
- Always use HTTPS in production
- Implement certificate pinning for extra security

### 3. **Token Lifecycle Management**
- Access tokens are short-lived (15 minutes)
- Refresh tokens before access token expires
- Store the new refresh token on each refresh (token rotation)
- Clear tokens on logout

### 4. **Error Handling**
- Handle 401 errors by refreshing token automatically
- Handle 403 errors (guest users) appropriately
- Log out user if refresh fails

### 5. **Rate Limiting**
- The login endpoint may be rate-limited
- Implement exponential backoff for failed login attempts
- Don't hammer the API with rapid refresh requests

### 6. **Guest Users**
- Guest users cannot log in or refresh tokens
- Prompt guest users to create full accounts
- Check `user.is_guest` flag in responses

## Testing

### Test Login with curl
```bash
curl -X POST https://evotally.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "platform": "ios"
  }'
```

### Test Refresh with curl
```bash
curl -X POST https://evotally.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "platform": "ios"
  }'
```

### Test Authenticated Request with curl
```bash
curl https://evotally.com/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### "Invalid credentials" (401)
- Check email and password are correct
- Email is case-insensitive
- Password is case-sensitive

### "Guest accounts cannot log in" (403)
- User has `is_guest: true`
- Prompt user to create full account

### "Invalid or expired refresh token" (401)
- Refresh token expired (90 days)
- Refresh token was revoked
- Token was already used (due to rotation)
- Prompt user to log in again

### Tokens expire too quickly
- Access tokens expire in 15 minutes by default
- Implement automatic refresh before expiration
- Don't manually refresh more than once per minute

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify HTTPS is being used in production
- Ensure tokens are being stored securely
- Check token expiration times
