// The publishable key is safe to use in browser code. Never put a service-role
// key in this file or any other file served to visitors.
(() => {
  const projectUrl = 'https://kzfwfdfibmhyqhxavjlr.supabase.co';
  const publishableKey = 'sb_publishable_QzKXt3FbsSfuM1s5n_AwZg_J3sdzgGa';

  if (!window.supabase?.createClient) {
    throw new Error('Supabase SDK did not load. Check your connection and reload.');
  }

  window.supabaseClient = window.supabase.createClient(projectUrl, publishableKey);

  // Resolve redirects relative to the current site path. This keeps links
  // inside /CosmaTech-Solutions/ when hosted as a GitHub project page.
  window.getSupabaseRedirectUrl = (relativePath) =>
    new URL(relativePath, window.location.href).toString();
})();
