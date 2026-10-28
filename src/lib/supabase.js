import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = () => Boolean(supabase);

const localWorks = () => JSON.parse(localStorage.getItem('sable_works') || '[]');

export async function getSessionUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session?.user || null;
}

export const displayName = (user) =>
  user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || 'account';

export async function loadWorks() {
  const user = await getSessionUser();
  if (!user) return localWorks().slice().reverse();
  const { data, error } = await supabase
    .from('works')
    .select('id, title, html, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    html: row.html,
    savedAt: new Date(row.created_at).getTime(),
  }));
}

export async function saveWork(title, html) {
  const user = await getSessionUser();
  if (!user) {
    const existing = localWorks();
    existing.push({ title, html, savedAt: Date.now() });
    localStorage.setItem('sable_works', JSON.stringify(existing));
    return { cloud: false };
  }
  const { error } = await supabase.from('works').insert({ user_id: user.id, title, html });
  if (error) throw new Error(error.message);
  return { cloud: true };
}

export async function deleteWork(work) {
  const user = await getSessionUser();
  if (!user || !work.id) {
    const updated = localWorks().filter((w) => w.savedAt !== work.savedAt);
    localStorage.setItem('sable_works', JSON.stringify(updated));
    return { cloud: false };
  }
  const { error } = await supabase.from('works').delete().eq('id', work.id);
  if (error) throw new Error(error.message);
  return { cloud: true };
}
