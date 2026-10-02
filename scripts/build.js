const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputDirectory = path.join(projectRoot, 'dist');
const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY environment variable.');
  process.exit(1);
}

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

const excludedEntries = new Set(['.git', '.vercel', 'node_modules', 'dist', 'scripts', 'supabase']);
for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
  if (excludedEntries.has(entry.name)) continue;
  fs.cpSync(
    path.join(projectRoot, entry.name),
    path.join(outputDirectory, entry.name),
    { recursive: true }
  );
}

const generatedConfig = `window.COSMATECH_SUPABASE_CONFIG = ${JSON.stringify({
  url: supabaseUrl,
  publishableKey: supabasePublishableKey
})};\n`;
fs.writeFileSync(path.join(outputDirectory, 'js', 'supabase-config.js'), generatedConfig);

console.log('Static site built in dist with the configured Supabase URL and publishable key.');
