// The publishable key is safe to use in browser code. Never put a service-role
// key in this file or any other file served to visitors.
(() => {
  const config = window.COSMATECH_SUPABASE_CONFIG;

  if (!config?.url || !config?.publishableKey) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel.');
  }

  if (!window.supabase?.createClient) {
    throw new Error('Supabase SDK did not load. Check your connection and reload.');
  }

  window.supabaseClient = window.supabase.createClient(config.url, config.publishableKey);

  // Resolve redirects relative to the current site path. This keeps links
  // inside /CosmaTech-Solutions/ when hosted as a GitHub project page.
  window.getSupabaseRedirectUrl = (relativePath) =>
    new URL(relativePath, window.location.href).toString();
})();
