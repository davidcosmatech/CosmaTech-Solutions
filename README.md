# CosmaTech Solutions

Cosmatech Solutions builds practical technology solutions to help businesses work smarter, grow faster, and solve real-world challenges.

## Deploying with Vercel

This is a static HTML site. Vercel runs `npm run build` to create the `dist` folder and writes the Supabase browser configuration from the project's environment variables.

Add these two variables in Vercel under **Project Settings → Environment Variables**, for Production and Preview:

- `SUPABASE_URL`: the Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY`: the Supabase publishable key (starts with `sb_publishable_`)

Do not add a Supabase secret or service-role key. The publishable key is intended for browser code and must be protected by the project's Row Level Security policies.

The checked-in `js/supabase-config.js` contains the public configuration used by GitHub Pages. Vercel replaces it in the generated `dist` output with the environment variable values.
