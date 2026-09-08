// Real shared backend via Supabase. Exposes the same `base44.auth.*` /
// `base44.entities.*` / `base44.integrations.*` shape the pages already use,
// so no page or component code needs to change — only this client and the
// two auth pages whose flows depend on real email delivery (Register,
// ResetPassword) differ from the earlier localStorage-only demo.
import { createClient } from '@supabase/supabase-js';

// The `anon`/"publishable" key is designed to be shipped in the client
// bundle — it has no privileges beyond what the Row Level Security
// policies in supabase/schema.sql grant. Safe to commit.
const SUPABASE_URL = 'https://ropbspqfzxvegvketpon.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_QdKgTgbZ_SYGm7xmWZmTHA_eUzgfPW_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function authError(message, status = 401) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseSort(sort) {
  if (!sort) return null;
  const desc = sort.startsWith('-');
  return { column: desc ? sort.slice(1) : sort, ascending: !desc };
}

function applySortLimit(query, sort, limit) {
  const parsed = parseSort(sort);
  if (parsed) query = query.order(parsed.column, { ascending: parsed.ascending });
  if (limit) query = query.limit(limit);
  return query;
}

function makeEntity(table) {
  return {
    async list(sort, limit) {
      let query = supabase.from(table).select('*');
      query = applySortLimit(query, sort, limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async filter(match = {}, sort, limit) {
      let query = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(match)) {
        query = query.eq(key, value);
      }
      query = applySortLimit(query, sort, limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) throw authError(`${table} not found`, 404);
      return data;
    },
    async create(data) {
      const { data: row, error } = await supabase.from(table).insert(data).select().single();
      if (error) throw error;
      return row;
    },
    async update(id, data) {
      const { data: row, error } = await supabase.from(table).update(data).eq('id', id).select().single();
      if (error) throw error;
      return row;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  };
}

const userEntity = {
  async list(sort, limit) {
    let query = supabase.from('profiles').select('*');
    query = applySortLimit(query, sort, limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async filter(match = {}, sort, limit) {
    let query = supabase.from('profiles').select('*');
    for (const [key, value] of Object.entries(match)) query = query.eq(key, value);
    query = applySortLimit(query, sort, limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async get(id) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw authError('User not found', 404);
    return data;
  },
  async update(id, data) {
    const { data: row, error } = await supabase.from('profiles').update(data).eq('id', id).select().single();
    if (error) throw error;
    return row;
  },
};

async function fetchProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
}

function toSafePath(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname + parsed.search;
  } catch {
    return '/';
  }
}

export const base44 = {
  auth: {
    async me() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw authError('Not authenticated');
      const profile = await fetchProfile(user.id);
      return {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || '',
        role: profile?.role || 'user',
      };
    },

    async loginViaEmailPassword(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw authError(error.message, error.status || 401);
    },

    loginWithProvider(provider, returnTo) {
      supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + toSafePath(returnTo || '/') },
      });
    },

    async register({ email, password }) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + '/login' },
      });
      if (error) throw authError(error.message, error.status || 400);
      return { sent: true };
    },

    setToken() {
      // No-op: supabase-js manages and persists its own session.
    },

    async resetPasswordRequest(email) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      return { sent: true };
    },

    async resetPassword({ newPassword }) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw authError(error.message, 400);
    },

    async logout(redirectTo) {
      await supabase.auth.signOut();
      if (typeof redirectTo === 'string' && redirectTo) {
        window.location.href = toSafePath(redirectTo);
      }
    },

    redirectToLogin(returnUrl) {
      const path = toSafePath(returnUrl || '/');
      window.location.href = '/login?returnTo=' + encodeURIComponent(path);
    },

    async isAuthenticated() {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    },
  },

  entities: {
    Space: makeEntity('spaces'),
    Booking: makeEntity('bookings'),
    Favorite: makeEntity('favorites'),
    Review: makeEntity('reviews'),
    Message: makeEntity('messages'),
    User: userEntity,
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        const path = `${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from('space-images').upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from('space-images').getPublicUrl(path);
        return { file_url: data.publicUrl };
      },
    },
  },
};
