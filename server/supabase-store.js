import crypto from 'node:crypto';

function throwIfError(error) {
  if (error) throw error;
}

function fromRow(row) {
  return {
    id: row.id,
    ...row.data,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

function toRow(entity, doc) {
  const { id, created_date, updated_date, ...data } = doc;
  return {
    entity,
    id: String(id),
    data,
    created_date: created_date || new Date().toISOString(),
    updated_date: updated_date || created_date || new Date().toISOString(),
  };
}

export class SupabaseStore {
  constructor(client) {
    this.client = client;
  }

  newId() {
    return crypto.randomBytes(12).toString('hex');
  }

  async list(entity) {
    const rows = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await this.client
        .from('app_records')
        .select('id,data,created_date,updated_date')
        .eq('entity', entity)
        .range(offset, offset + pageSize - 1);
      throwIfError(error);
      rows.push(...data.map(fromRow));
      if (data.length < pageSize) return rows;
    }
  }

  async get(entity, id) {
    const { data, error } = await this.client
      .from('app_records')
      .select('id,data,created_date,updated_date')
      .eq('entity', entity)
      .eq('id', String(id))
      .maybeSingle();
    throwIfError(error);
    return data ? fromRow(data) : null;
  }

  async insert(entity, doc) {
    const { data, error } = await this.client
      .from('app_records')
      .insert(toRow(entity, doc))
      .select('id,data,created_date,updated_date')
      .single();
    throwIfError(error);
    return fromRow(data);
  }

  async update(entity, id, patch) {
    const existing = await this.get(entity, id);
    if (!existing) return null;
    const { data, error } = await this.client
      .from('app_records')
      .update({
        data: {
          ...Object.fromEntries(
            Object.entries(existing).filter(([key]) => !['id', 'created_date', 'updated_date'].includes(key)),
          ),
          ...patch,
        },
        updated_date: new Date().toISOString(),
      })
      .eq('entity', entity)
      .eq('id', String(id))
      .select('id,data,created_date,updated_date')
      .maybeSingle();
    throwIfError(error);
    return data ? fromRow(data) : null;
  }

  async delete(entity, id) {
    const { data, error } = await this.client
      .from('app_records')
      .delete()
      .eq('entity', entity)
      .eq('id', String(id))
      .select('id')
      .maybeSingle();
    throwIfError(error);
    return Boolean(data);
  }

  async insertMissing(entity, docs) {
    if (!docs.length) return { inserted: 0, skipped: 0 };
    let inserted = 0;
    const batchSize = 500;
    for (let offset = 0; offset < docs.length; offset += batchSize) {
      const rows = docs.slice(offset, offset + batchSize).map((doc) => toRow(entity, doc));
      const { data, error } = await this.client
        .from('app_records')
        .upsert(rows, {
          onConflict: 'entity,id',
          ignoreDuplicates: true,
        })
        .select('id');
      throwIfError(error);
      inserted += data.length;
    }
    return { inserted, skipped: docs.length - inserted };
  }
}
