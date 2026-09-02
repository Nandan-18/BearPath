import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, type Plugin } from "vitest/config";

const root = import.meta.dirname;

const site = {
  name: "BearPath",
  shortName: "BearPath",
  title: "BearPath — Campus Map",
  description:
    "BearPath finds indoor pedway routes across the University of Alberta North Campus.",
  themeColor: "#120e0c",
  backgroundColor: "#120e0c",
  url: "https://mybearpath.vercel.app",
  locale: "en-CA",
} as const;

function siteMetaPlugin(): Plugin {
  return {
    name: "bearpath:site-meta",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: { charset: "UTF-8" },
          injectTo: "head-prepend",
        },
        {
          tag: "meta",
          attrs: {
            name: "viewport",
            content: "width=device-width, initial-scale=1, viewport-fit=cover",
          },
          injectTo: "head-prepend",
        },
        { tag: "title", children: site.title },
          {
            tag: "meta",
            attrs: { name: "description", content: site.description },
          },
          {
            tag: "meta",
            attrs: { name: "theme-color", content: site.themeColor },
          },
          {
            tag: "link",
            attrs: { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
          },
          {
            tag: "link",
            attrs: {
              rel: "icon",
              href: "/favicon.svg",
              type: "image/svg+xml",
              sizes: "any",
            },
          },
          {
            tag: "link",
            attrs: {
              rel: "apple-touch-icon",
              href: "/apple-touch-icon-180x180.png",
              sizes: "180x180",
            },
          },
          {
            tag: "link",
            attrs: { rel: "canonical", href: site.url },
          },
          {
            tag: "meta",
            attrs: { name: "application-name", content: site.shortName },
          },
          {
            tag: "meta",
            attrs: { name: "color-scheme", content: "dark" },
          },
          {
            tag: "meta",
            attrs: { name: "mobile-web-app-capable", content: "yes" },
          },
          {
            tag: "meta",
            attrs: { name: "apple-mobile-web-app-title", content: site.shortName },
          },
          {
            tag: "meta",
            attrs: { name: "apple-mobile-web-app-capable", content: "yes" },
          },
          {
            tag: "meta",
            attrs: {
              name: "apple-mobile-web-app-status-bar-style",
              content: "black-translucent",
            },
          },
          {
            tag: "meta",
            attrs: { property: "og:type", content: "website" },
          },
          {
            tag: "meta",
            attrs: { property: "og:site_name", content: site.name },
          },
          {
            tag: "meta",
            attrs: { property: "og:title", content: site.title },
          },
          {
            tag: "meta",
            attrs: { property: "og:description", content: site.description },
          },
          {
            tag: "meta",
            attrs: { property: "og:url", content: site.url },
          },
          {
            tag: "meta",
            attrs: { property: "og:locale", content: "en_CA" },
          },
          {
            tag: "meta",
            attrs: {
              property: "og:image",
              content: `${site.url}/pwa-512x512.png`,
            },
          },
          {
            tag: "meta",
            attrs: { name: "twitter:card", content: "summary" },
          },
          {
            tag: "meta",
            attrs: { name: "twitter:title", content: site.title },
          },
          {
            tag: "meta",
            attrs: { name: "twitter:description", content: site.description },
          },
          {
            tag: "meta",
            attrs: {
              name: "twitter:image",
              content: `${site.url}/pwa-512x512.png`,
            },
          },
        ];
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    siteMetaPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "apple-touch-icon-180x180.png",
        "maskable-icon-512x512.png",
      ],
      manifest: {
        id: site.url,
        name: site.name,
        short_name: site.shortName,
        description: site.description,
        theme_color: site.themeColor,
        background_color: site.backgroundColor,
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        lang: site.locale,
        categories: ["navigation", "education", "maps"],
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(root, "./src"),
      "@data": path.resolve(root, "../data"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(root, "..")],
    },
  },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
  },
});
