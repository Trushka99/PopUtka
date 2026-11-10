import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    vue(),
    // PWA: сайт можно установить на телефон как приложение.
    // Плагин при сборке создаёт manifest.webmanifest и service worker (sw.js)
    // и сам подключает их в index.html.
    VitePWA({
      // Новая версия сайта подхватывается автоматически после деплоя
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png", "logo.svg"],
      manifest: {
        id: "/",
        name: "Pop.utka",
        short_name: "Pop.utka",
        description: "Поиск попутчиков и поездок между городами",
        lang: "ru",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#eeeeee",
        theme_color: "#a6d2f7",
        // Иконки генерируются из public/logo.svg: npm run generate-pwa-assets
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Код, стили и шрифты сохраняются сразу — приложение открывается мгновенно.
        // Тяжёлые картинки из public/images сюда не входят (см. runtimeCaching).
        globPatterns: ["**/*.{js,css,html,woff2}"],
        cleanupOutdatedCaches: true,
        // vue-router в режиме history: любой адрес внутри сайта открывает index.html
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            // Картинки берутся из кеша, а в фоне обновляются с сервера
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && url.pathname.startsWith("/images/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  base: "/",

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
