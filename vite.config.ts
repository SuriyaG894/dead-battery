import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Social scrapers (WhatsApp, X, Discord) need absolute og:image URLs.
 * On Vercel, VERCEL_PROJECT_PRODUCTION_URL is set at build time; locally the relative path is kept.
 */
function absoluteOgUrls(): Plugin {
  const host = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return {
    name: 'absolute-og-urls',
    transformIndexHtml(html) {
      if (!host) return html;
      const origin = host.startsWith('http') ? host : `https://${host}`;
      return html
        .replace(/content="\/og-image\.jpg"/g, `content="${origin}/og-image.jpg"`)
        .replace('<meta property="og:type"', `<meta property="og:url" content="${origin}/" />\n    <meta property="og:type"`);
    },
  };
}

export default defineConfig({
  plugins: [react(), absoluteOgUrls()],
});
