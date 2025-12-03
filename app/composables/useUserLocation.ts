import { useAuth } from '~/stores/auth'

export const useUserLocation = () => {
  const auth = useAuth()

  /**
   * Get user's current location and geocode it
   */
  async function getCurrentLocation(): Promise<{
    lat: number
    lng: number
    city: string
    region: string
    country: string
  } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation is not supported by this browser')
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          // Geocode the coordinates to get location details
          try {
            const geocoded = await geocodeCoordinates(lat, lng)
            resolve({
              lat,
              lng,
              city: geocoded.city,
              region: geocoded.region,
              country: geocoded.country,
            })
          } catch (e) {
            console.error('Geocoding failed:', e)
            resolve(null)
          }
        },
        (error) => {
          console.log('Geolocation permission denied or unavailable:', error.message)
          resolve(null)
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 600000, // Cache position for 10 minutes
        }
      )
    })
  }

  /**
   * Geocode coordinates using Nominatim (OpenStreetMap)
   */
  async function geocodeCoordinates(lat: number, lng: number): Promise<{
    city: string
    region: string
    country: string
  }> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Evo-App/1.0', // Required by Nominatim
      },
    })

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()
    const address = data.address || {}

    return {
      city: address.city || address.town || address.village || address.municipality || 'Unknown',
      region: address.state || address.province || address.region || 'Unknown',
      country: address.country || 'Unknown',
    }
  }

  /**
   * Update user's location in the database
   */
  async function updateUserLocation() {
    try {
      if (!auth.isAuthenticated) {
        console.log('User not authenticated, skipping location update')
        return
      }

      const location = await getCurrentLocation()

      if (!location) {
        console.log('Could not get user location')
        return
      }

      // Send location to backend
      await $fetch('/api/user/location', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          lat: location.lat,
          lng: location.lng,
          city: location.city,
          region: location.region,
          country: location.country,
        },
      })

      console.log('User location updated successfully')
    } catch (error) {
      console.error('Failed to update user location:', error)
    }
  }

  return {
    getCurrentLocation,
    updateUserLocation,
  }
}
