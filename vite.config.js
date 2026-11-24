import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function extractInlineHashes(html, tagName) {
  const regex = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const hashes = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const attrs = match[1] || '';
    const content = match[2] || '';
    if (tagName === 'script' && /\bsrc\s*=/i.test(attrs)) continue;
    if (content.length > 0) {
      const digest = crypto.createHash('sha256').update(content, 'utf8').digest('base64');
      hashes.push(`'sha256-${digest}'`);
    }
  }
  return hashes;
}

function buildSecurityHeaders(scriptHashes, styleHashes) {
  const scriptSrc = ["'self'", ...scriptHashes, 'https://static.cloudflareinsights.com'].join(' ');
  const styleSrc = ["'self'", ...styleHashes].join(' ');

  return {
    'Content-Security-Policy': [
      "default-src 'none'",
      `script-src ${scriptSrc}`,
      `style-src ${styleSrc}`,
      "img-src 'self' data: https://img.shields.io https://data.jsdelivr.com",
      "font-src 'self' https://gcore.jsdelivr.net https://raw.githack.com https://rawcdn.githack.com",
      "connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com https://gcore.jsdelivr.net https://raw.githack.com https://rawcdn.githack.com https://img.shields.io https://data.jsdelivr.com",
      "worker-src 'self'",
      "manifest-src 'self'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      'upgrade-insecure-requests'
    ].join('; '),
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}

function formatCloudflareHeaders(headers) {
  const lines = ['/*'];
  for (const [key, value] of Object.entries(headers)) {
    lines.push(`  ${key}: ${value}`);
  }
  lines.push('  Cache-Control: public, max-age=86400');
  lines.push('');
  lines.push('/sw.js');
  lines.push('  ! Cache-Control');
  lines.push('  Cache-Control: no-cache');
  lines.push('');
  return lines.join('\n');
}

function observatoryHeadersPlugin() {
  const rootStaticFiles = new Map([
    ['/favicon.ico', 'image/x-icon'],
    ['/seatingchart.png', 'image/png'],
    ['/sw.js', 'application/javascript; charset=utf-8']
  ]);

  return {
    name: 'observatory-csp-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '').split('?')[0];
        const mime = rootStaticFiles.get(urlPath);
        if (!mime) return next();
        const filePath = path.join(__dirname, urlPath.slice(1));
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', mime);
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const builtHtmlPath = path.join(__dirname, 'index.html');
        if (fs.existsSync(builtHtmlPath)) {
          const html = fs.readFileSync(builtHtmlPath, 'utf8');
          const headers = buildSecurityHeaders(
            extractInlineHashes(html, 'script'),
            extractInlineHashes(html, 'style')
          );
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
          }
        }
        next();
      });
    },
    closeBundle() {
      const builtHtmlPath = path.join(__dirname, 'index.html');
      if (!fs.existsSync(builtHtmlPath)) return;
      const html = fs.readFileSync(builtHtmlPath, 'utf8');
      const scriptHashes = extractInlineHashes(html, 'script');
      const styleHashes = extractInlineHashes(html, 'style');
      const headers = buildSecurityHeaders(scriptHashes, styleHashes);
      fs.writeFileSync(path.join(__dirname, '_headers'), formatCloudflareHeaders(headers), 'utf8');
    }
  };
}

export default defineConfig({
  root: 'src',
  publicDir: false,
  plugins: [vue(), viteSingleFile(), observatoryHeadersPlugin()],
  build: {
    outDir: '..',
    emptyOutDir: false
  }
});
