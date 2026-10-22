import { createClient } from '@supabase/supabase-js';
import { calcularCategoria, isIdadeDeMatriculaValida } from '../../shared/athlete.js';
import { entities as definitions } from '../../shared/entities.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const PRIVATE_BUCKET = 'athlete-documents';
const PUBLIC_BUCKET = 'public-assets';
const PRIVATE_UPLOAD_PREFIX = 'private-upload:';
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const PROTECTED_FIELDS = new Set(['id', 'created_date', 'updated_date']);

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

function getSupabase() {
  if (!supabase) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY antes de publicar o site.');
  }
  return supabase;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function httpError(message, status) {
  return new ApiError(message, status);
}

async function getSessionUser() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session?.user || null;
}

function isAdmin(user) {
  return user?.app_metadata?.role === 'admin';
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw httpError('Autenticação necessária.', 401);
  if (!isAdmin(user)) throw httpError('Acesso negado.', 403);
  return user;
}

function requireEntity(name) {
  const definition = Object.hasOwn(definitions, name) ? definitions[name] : null;
  if (!definition) throw httpError(`Entidade desconhecida: ${name}`, 404);
  return definition;
}

function clean(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw httpError('Dados inválidos.', 400);
  }
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !PROTECTED_FIELDS.has(key) && key !== '__proto__'),
  );
}

function validate(definition, data, partial = false) {
  for (const field of definition.required || []) {
    if (partial && !Object.hasOwn(data, field)) continue;
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw httpError(`Campo obrigatório: ${field}`, 400);
    }
  }
  for (const [field, allowed] of Object.entries(definition.enums || {})) {
    const value = data[field];
    if (value !== undefined && value !== null && value !== '' && !allowed.includes(value)) {
      throw httpError(`Valor inválido para ${field}: ${value}`, 400);
    }
  }
}

function validatePublicAthleteRegistration(data) {
  const requiredFields = [
    'tipoSanguineo',
    'alergiasRestricoes',
    'rua',
    'numero',
    'bairro',
    'cidade',
    'estado',
    'cep',
    'statusAtestado',
  ];
  for (const field of requiredFields) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw httpError(`Campo obrigatório: ${field}`, 400);
    }
  }
  if (!['anexado', 'entrega_posterior', 'nao_possui'].includes(data.statusAtestado)) {
    throw httpError('Status do atestado médico inválido.', 400);
  }
  if (data.statusAtestado === 'anexado' && !data.atestadoUrl) {
    throw httpError('Anexe o atestado médico indicado no formulário.', 400);
  }
  if (data.statusAtestado !== 'anexado' && data.atestadoUrl) {
    throw httpError('O status do atestado não corresponde ao arquivo selecionado.', 400);
  }
}

function matches(doc, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    const value = doc[key];
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && Array.isArray(expected.$in)) {
      return expected.$in.some((item) => String(item) === String(value));
    }
    if (expected === null) return value == null;
    if (typeof expected === 'boolean' || typeof value === 'boolean') return value === expected;
    return String(value) === String(expected);
  });
}

function sortDocs(docs, sort = '-created_date') {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  const direction = descending ? -1 : 1;
  return docs.sort((a, b) => {
    const first = a[field];
    const second = b[field];
    if (first == null && second == null) return 0;
    if (first == null) return 1;
    if (second == null) return -1;
    if (typeof first === 'number' && typeof second === 'number') return (first - second) * direction;
    return String(first).localeCompare(String(second), 'pt-BR', {
      numeric: true,
      sensitivity: 'base',
    }) * direction;
  });
}

async function resolvePrivateUrls(value, cache = new Map(), canReadPrivate = false) {
  if (typeof value === 'string' && value.startsWith(PRIVATE_UPLOAD_PREFIX)) {
    if (!canReadPrivate) return null;
    const path = value.slice(PRIVATE_UPLOAD_PREFIX.length);
    if (!cache.has(path)) {
      const { data, error } = await getSupabase().storage
        .from(PRIVATE_BUCKET)
        .createSignedUrl(path, 3600);
      if (error) throw error;
      cache.set(path, data.signedUrl);
    }
    return cache.get(path);
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => resolvePrivateUrls(item, cache, canReadPrivate)));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value).map(async ([key, item]) => [
          key,
          await resolvePrivateUrls(item, cache, canReadPrivate),
        ]),
      ),
    );
  }
  return value;
}

async function listRows(entity) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await getSupabase()
      .from('app_records')
      .select('id,data,created_date,updated_date')
      .eq('entity', entity)
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...data.map((row) => ({
      id: row.id,
      ...row.data,
      created_date: row.created_date,
      updated_date: row.updated_date,
    })));
    if (data.length < pageSize) return rows;
  }
}

async function present(doc, user) {
  return doc ? resolvePrivateUrls(doc, new Map(), isAdmin(user)) : doc;
}

async function createDoc(name, definition, body, user) {
  let data = clean(body);
  if (!isAdmin(user) && definition.forcePublicCreate) {
    data = { ...data, ...definition.forcePublicCreate };
  }
  data = { ...(definition.defaults || {}), ...data };
  if (name === 'Athlete' && !isAdmin(user)) {
    const registrationSettings = await listRows('RegistrationSettings');
    if (registrationSettings.some((setting) => setting.slug === 'matricula' && setting.accepting === false)) {
      throw httpError('Matrículas suspensas no momento. Entre em contato com a Escolinha para mais informações.', 403);
    }
    validatePublicAthleteRegistration(data);
    if (!isIdadeDeMatriculaValida(data.dataNascimento)) {
      throw httpError('A matrícula é destinada a atletas de 7 a 17 anos completos.', 400);
    }
    data.categoria = calcularCategoria(data.dataNascimento);
    delete data.numeroMatricula;
    validate(definition, data);
    const { data: inserted, error } = await getSupabase().rpc('create_public_athlete', {
      payload: data,
    });
    if (error) throw error;
    return present({
      id: inserted.id,
      ...inserted.data,
      created_date: inserted.created_date,
      updated_date: inserted.updated_date,
    }, user);
  }
  validate(definition, data);
  const now = new Date().toISOString();
  const record = {
    entity: name,
    id: crypto.randomUUID(),
    data,
    created_date: now,
    updated_date: now,
  };
  let inserted = null;
  if (isAdmin(user)) {
    const { data, error } = await getSupabase()
      .from('app_records')
      .insert(record)
      .select('id,data,created_date,updated_date')
      .single();
    if (error) throw error;
    inserted = data;
  } else {
    const { error } = await getSupabase().from('app_records').insert(record);
    if (error) throw error;
  }
  if (!inserted) return present({ id: record.id, ...data, created_date: now, updated_date: now }, user);
  return present({
    id: inserted.id,
    ...inserted.data,
    created_date: inserted.created_date,
    updated_date: inserted.updated_date,
  }, user);
}

function entityApi(name) {
  const definition = requireEntity(name);
  const requirePermission = async (action) => {
    if (definition.perms[action] === 'admin') return requireAdmin();
    return getSessionUser();
  };

  return {
    async list(sort, limit) {
      const user = definition.perms.read === 'admin' ? await requireAdmin() : await getSessionUser();
      let docs = await listRows(name);
      if (!isAdmin(user) && definition.publicReadFilter) {
        docs = docs.filter((doc) => matches(doc, definition.publicReadFilter));
      }
      docs = sortDocs(docs, sort || '-created_date');
      if (limit > 0) docs = docs.slice(0, limit);
      return Promise.all(docs.map((doc) => present(doc, user)));
    },
    async filter(query, sort, limit) {
      const user = definition.perms.read === 'admin' ? await requireAdmin() : await getSessionUser();
      const filters = { ...(query || {}) };
      if (!isAdmin(user) && definition.publicReadFilter) {
        Object.assign(filters, definition.publicReadFilter);
      }
      let docs = sortDocs(
        (await listRows(name)).filter((doc) => matches(doc, filters)),
        sort || '-created_date',
      );
      if (limit > 0) docs = docs.slice(0, limit);
      return Promise.all(docs.map((doc) => present(doc, user)));
    },
    async get(id) {
      if (definition.perms.read === 'admin') await requireAdmin();
      const { data, error } = await getSupabase()
        .from('app_records')
        .select('id,data,created_date,updated_date')
        .eq('entity', name)
        .eq('id', String(id))
        .maybeSingle();
      if (error) throw error;
      if (!data) throw httpError('Registro não encontrado.', 404);
      const doc = {
        id: data.id,
        ...data.data,
        created_date: data.created_date,
        updated_date: data.updated_date,
      };
      const user = await getSessionUser();
      if (!isAdmin(user) && definition.publicReadFilter && !matches(doc, definition.publicReadFilter)) {
        throw httpError('Registro não encontrado.', 404);
      }
      return present(doc, user);
    },
    async create(body) {
      const user = await requirePermission('create');
      return createDoc(name, definition, body, user);
    },
    async update(id, body) {
      const user = await requirePermission('update');
      const data = clean(body);
      validate(definition, data, true);
      const { data: current, error: readError } = await getSupabase()
        .from('app_records')
        .select('data')
        .eq('entity', name)
        .eq('id', String(id))
        .maybeSingle();
      if (readError) throw readError;
      if (!current) throw httpError('Registro não encontrado.', 404);
      const { data: updated, error } = await getSupabase()
        .from('app_records')
        .update({
          data: { ...current.data, ...data },
          updated_date: new Date().toISOString(),
        })
        .eq('entity', name)
        .eq('id', String(id))
        .select('id,data,created_date,updated_date')
        .maybeSingle();
      if (error) throw error;
      if (!updated) throw httpError('Registro não encontrado.', 404);
      return present({
        id: updated.id,
        ...updated.data,
        created_date: updated.created_date,
        updated_date: updated.updated_date,
      }, user);
    },
    async delete(id) {
      await requirePermission('delete');
      const { data, error } = await getSupabase()
        .from('app_records')
        .delete()
        .eq('entity', name)
        .eq('id', String(id))
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw httpError('Registro não encontrado.', 404);
      return { success: true };
    },
    /**
     * @param {Array<Record<string, unknown>>} records
     * @param {{ key?: string[] }} [options]
     */
    async upsert(records, { key } = {}) {
      await requireAdmin();
      if (!Array.isArray(records) || !Array.isArray(key) || !key.length) {
        throw httpError('Informe records[] e key[].', 400);
      }
      const existing = await listRows(name);
      const result = [];
      for (const record of records) {
        const cleanRecord = clean(record);
        const match = existing.find((item) => key.every(
          (field) => String(item[field]) === String(cleanRecord[field]),
        ));
        if (!match) {
          result.push(await createDoc(name, definition, cleanRecord, await requireAdmin()));
          continue;
        }
        const merged = { ...match, ...cleanRecord };
        validate(definition, merged);
        result.push(await entityApi(name).update(match.id, cleanRecord));
      }
      return result;
    },
  };
}

/** @type {Record<string, ReturnType<typeof entityApi>>} */
const entities = new Proxy({}, {
  get(cache, name) {
    if (typeof name !== 'string') return undefined;
    if (!cache[name]) cache[name] = entityApi(name);
    return cache[name];
  },
});

const ALLOWED_MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
};

/**
 * @param {{ file?: File, visibility?: 'public' | 'private' }} options
 */
async function uploadFile({ file, visibility = 'public' } = {}) {
  if (!file) throw new Error('Nenhum arquivo selecionado.');
  if (file.size === 0) throw new Error('O arquivo está vazio.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('O arquivo excede o limite de 25 MB.');
  const extension = `.${file.name.split('.').pop().toLowerCase()}`;
  const contentType = ALLOWED_MIME_TYPES[extension];
  if (!contentType) throw httpError('Tipo de arquivo não permitido.', 415);

  const user = await getSessionUser();
  if (visibility === 'public' && !isAdmin(user)) {
    throw httpError('Somente administradores podem enviar arquivos públicos.', user ? 403 : 401);
  }
  if (!['public', 'private'].includes(visibility)) {
    throw httpError('Visibilidade de arquivo inválida.', 400);
  }

  const bucket = visibility === 'private' ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  const path = `${crypto.randomUUID()}${extension}`;
  const { error } = await getSupabase().storage.from(bucket).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  const fileUrl = visibility === 'private'
    ? `${PRIVATE_UPLOAD_PREFIX}${path}`
    : getSupabase().storage.from(PUBLIC_BUCKET).getPublicUrl(path).data.publicUrl;
  return { file_url: fileUrl, file_name: file.name };
}

const auth = {
  async login(email, password) {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: String(email || '').trim(),
      password,
    });
    if (error) {
      if (error.code === 'invalid_credentials') {
        throw httpError('E-mail ou senha incorretos.', 401);
      }
      throw error;
    }
    if (!isAdmin(data.user)) {
      await getSupabase().auth.signOut();
      throw httpError('Esta conta não tem acesso ao painel administrativo.', 403);
    }
    return {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || data.user.email,
      role: 'admin',
    };
  },
  async me() {
    const { data, error } = await getSupabase().auth.getUser();
    if (error) throw error;
    if (!data.user) throw httpError('Não autenticado.', 401);
    return {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || data.user.email,
      role: isAdmin(data.user) ? 'admin' : 'user',
    };
  },
  async isAuthenticated() {
    const user = await getSessionUser();
    return Boolean(user);
  },
  async logout(redirectTo) {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
    if (typeof redirectTo === 'string') window.location.href = redirectTo;
  },
  onAuthStateChange(callback) {
    return getSupabase().auth.onAuthStateChange(callback);
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
