(function () {
  'use strict';
  let cached;
  function client() {
    if (cached) return cached;
    const cfg = window.ACLAB_TEAM_CONFIG || {};
    const url = String(cfg.url || '').trim();
    const key = String(cfg.anonKey || '').trim();
    if (!url || !key) throw new Error('Supabase is not configured. Set the public URL and publishable key in assets/aclab-team-config.js.');
    if (/sb_secret_|service_role/i.test(key)) throw new Error('Do not use a secret/service-role key in browser code.');
    if (!window.supabase?.createClient) throw new Error('Supabase JavaScript library is not available.');
    cached = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    return cached;
  }
  window.ACLabTeamDB = { client };
})();
