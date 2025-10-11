// app/composables/useApi.ts
import { useAuth } from '~/stores/auth'

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export function useApi(base = '') {
  const auth = useAuth()

  const call = async <T>(method: Method, url: string, opts: any = {}): Promise<T> => {
    // Ensure a valid access token (this will hit /api/auth/refresh with cookies)
    await auth.ensure()

    const headers = { ...(opts.headers || {}), ...auth.bearer }
    const request = () =>
      $fetch<T>(base + url, {
        ...opts,
        method,
        headers,
        credentials: 'include', // <-- send refresh_token cookie when needed
      })

    try {
      return await request()
    } catch (err: any) {
      // If access token expired or missing, try to refresh once then retry
      if (err?.status === 401) {
        try {
          await auth.refresh()
          const headers2 = { ...(opts.headers || {}), ...auth.bearer }
          return await $fetch<T>(base + url, {
            ...opts,
            method,
            headers: headers2,
            credentials: 'include',
          })
        } catch {
          // bubble the original 401 if refresh also fails
        }
      }
      throw err
    }
  }

  return {
    get:  <T>(url: string, query?: any) => call<T>('GET', url,  { query }),
    post: <T>(url: string, body?: any)  => call<T>('POST', url, { body }),
    patch:<T>(url: string, body?: any)  => call<T>('PATCH', url, { body }),
    del:  <T>(url: string)              => call<T>('DELETE', url),
  }
}
