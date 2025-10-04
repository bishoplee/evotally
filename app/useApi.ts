import { useAuth } from '~/stores/auth'
export function useApi() {
  const auth = useAuth()
  async function get<T>(url: string, query?: any) {
    return await $fetch<T>(url, { query, headers: auth.bearer })
  }
  async function post<T>(url: string, body?: any) {
    return await $fetch<T>(url, { method: 'POST', body, headers: auth.bearer })
  }
  async function patch<T>(url: string, body?: any) {
    return await $fetch<T>(url, { method: 'PATCH', body, headers: auth.bearer })
  }
  async function del<T>(url: string) {
    return await $fetch<T>(url, { method: 'DELETE', headers: auth.bearer })
  }
  return { get, post, patch, del }
}

