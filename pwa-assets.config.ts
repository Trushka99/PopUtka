import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

// Иконки приложения (PWA) генерируются из public/logo.svg:
//   npm run generate-pwa-assets
// Результат кладётся в public/ рядом с исходником:
//   pwa-64x64.png, pwa-192x192.png, pwa-512x512.png — обычные иконки (прозрачный фон),
//   maskable-icon-512x512.png — для Android (белый фон, логотип с отступами),
//   apple-touch-icon-180x180.png — для iPhone (белый фон),
//   favicon.ico — значок во вкладке браузера.
export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    ...minimal2023Preset,
    // iOS не обрезает иконку кругом, поэтому логотип можно сделать крупнее
    apple: { ...minimal2023Preset.apple, padding: 0.15 },
  },
  images: ["public/logo.svg"],
});
