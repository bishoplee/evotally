
export const SERVER = import.meta.env.VITE_SERVER || 'http://localhost:8787';

export async function api(path: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers || {});
  const method = (opts.method || 'GET').toUpperCase();
  const isForm = opts.body instanceof FormData;

  if (!isForm && opts.body && method !== 'GET' && method !== 'HEAD') {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${SERVER}${path}`, { ...opts, headers });
}
export async function me() {
  const r = await api('/me');
  return r.json();
}