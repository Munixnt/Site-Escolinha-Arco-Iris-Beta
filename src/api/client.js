// Cliente da API própria do site (substitui o antigo @base44/sdk).
// Mantém a mesma interface usada pelas telas: api.entities.X.list/filter/create/update/delete/upsert,
// api.integrations.Core.UploadFile e api.auth.me/login/logout.

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'arcoiris_token';

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (t) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage indisponível */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage indisponível */ }
  },
};

async function request(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const h = { ...headers };
  const token = tokenStore.get();
  if (token) h.Authorization = `Bearer ${token}`;
  if (body !== undefined && !raw) h['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: h,
      body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    });
  } catch {
    const err = new Error('Não foi possível conectar ao servidor.');
    err.status = 0;
    throw err;
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    const err = new Error((data && data.message) || `Erro ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function entityApi(name) {
  const base = `/api/entities/${encodeURIComponent(name)}`;
  const qs = (query, sort, limit) => {
    const p = new URLSearchParams();
    if (query && Object.keys(query).length) p.set('q', JSON.stringify(query));
    if (sort) p.set('sort', sort);
    if (limit) p.set('limit', String(limit));
    const s = p.toString();
    return s ? `?${s}` : '';
  };
  return {
    list: (sort, limit) => request(`${base}${qs(null, sort, limit)}`),
    filter: (query, sort, limit) => request(`${base}${qs(query, sort, limit)}`),
    get: (id) => request(`${base}/${encodeURIComponent(id)}`),
    create: (data) => request(base, { method: 'POST', body: data }),
    update: (id, data) => request(`${base}/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
    delete: (id) => request(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    upsert: (records, { key } = {}) =>
      request(`${base}/upsert`, { method: 'POST', body: { records, key } }),
  };
}

const entities = new Proxy({}, {
  get: (cache, name) => {
    if (typeof name !== 'string') return undefined;
    if (!cache[name]) cache[name] = entityApi(name);
    return cache[name];
  },
});

async function uploadFile({ file }) {
  if (!file) throw new Error('Nenhum arquivo selecionado.');
  const data = await request('/api/upload', {
    method: 'POST',
    raw: true,
    body: file,
    headers: {
      'X-File-Name': encodeURIComponent(file.name || 'arquivo'),
      'Content-Type': file.type || 'application/octet-stream',
    },
  });
  return { file_url: data.file_url, file_name: data.file_name };
}

const auth = {
  async login(email, password) {
    const { token, user } = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    tokenStore.set(token);
    return user;
  },
  async me() {
    if (!tokenStore.get()) {
      const err = new Error('Não autenticado.');
      err.status = 401;
      throw err;
    }
    try {
      return await request('/api/auth/me');
    } catch (err) {
      if (err.status === 401) tokenStore.clear(); // token expirado/inválido
      throw err;
    }
  },
  async isAuthenticated() {
    try { await auth.me(); return true; } catch { return false; }
  },
  logout(redirectTo) {
    tokenStore.clear();
    if (typeof redirectTo === 'string') window.location.href = redirectTo;
  },
  redirectToLogin(nextUrl) {
    const next = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : '';
    window.location.href = `/login${next}`;
  },
};

export const api = {
  entities,
  auth,
  integrations: { Core: { UploadFile: uploadFile, UploadPublicFile: uploadFile } },
};
