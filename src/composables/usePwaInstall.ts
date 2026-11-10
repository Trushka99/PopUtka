import { computed, ref } from "vue";

/**
 * Установка сайта на телефон как приложения (PWA).
 *
 * Android / Chrome / Edge: браузер присылает событие `beforeinstallprompt`.
 * Мы его сохраняем и по нажатию на свою кнопку показываем системное окно «Установить».
 *
 * iPhone / iPad: Safari не даёт сайтам запускать установку. Остаётся только
 * подсказать пользователю: «Поделиться» → «На экран „Домой“».
 */

// Событие есть только в Chromium-браузерах, поэтому его нет в стандартных типах TS
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function isIosDevice(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): boolean {
  // iPadOS притворяется маком, отличаем его по сенсорному экрану
  return (
    /iphone|ipad|ipod/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}

function isRunningStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Общее состояние для всех кнопок на странице
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const isStandalone = ref(false);
const isIos = ref(false);
let initialized = false;

/**
 * Вызывается один раз при старте приложения (main.ts): событие
 * `beforeinstallprompt` может прийти раньше, чем отрисуется кнопка.
 */
export function initPwaInstall(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  isStandalone.value = isRunningStandalone();
  isIos.value = isIosDevice(
    navigator.userAgent,
    navigator.platform,
    navigator.maxTouchPoints,
  );

  window.addEventListener("beforeinstallprompt", (event) => {
    // Не показываем стандартную плашку браузера — у нас своя кнопка
    event.preventDefault();
    deferredPrompt.value = event as BeforeInstallPromptEvent;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt.value = null;
  });

  window
    .matchMedia?.("(display-mode: standalone)")
    .addEventListener?.("change", (event) => {
      isStandalone.value = event.matches;
    });
}

export function usePwaInstall() {
  /** Браузер готов показать системное окно установки (Android, Chrome на ПК) */
  const canPrompt = computed(() => deferredPrompt.value !== null);
  /** iPhone/iPad: можно только показать инструкцию */
  const needsIosHint = computed(() => isIos.value && !isStandalone.value);
  /** Показывать ли кнопку вообще: в уже установленном приложении она не нужна */
  const available = computed(
    () => !isStandalone.value && (canPrompt.value || needsIosHint.value),
  );

  /** Показывает системное окно установки. Возвращает true, если пользователь согласился. */
  async function promptInstall(): Promise<boolean> {
    const event = deferredPrompt.value;
    if (!event) return false;
    // prompt() можно вызвать только один раз для каждого события
    deferredPrompt.value = null;
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome === "accepted";
  }

  return { available, canPrompt, needsIosHint, promptInstall };
}
