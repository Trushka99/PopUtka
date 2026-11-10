<script setup lang="ts">
import { ref } from "vue";
import { useLangStore } from "@/stores/langStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { usePwaInstall } from "@/composables/usePwaInstall";

// Кнопка «Установить приложение» (PWA).
// Сама прячется, если браузер не умеет ставить сайт или приложение уже установлено.
withDefaults(
  defineProps<{
    /** icon — круглая кнопка-иконка (шапка на ПК), button — кнопка с текстом (мобильное меню) */
    variant?: "icon" | "button";
  }>(),
  { variant: "button" },
);

const langStore = useLangStore();
const snackbar = useSnackbarStore();
const { available, canPrompt, promptInstall } = usePwaInstall();

const iosDialog = ref(false);

const install = async () => {
  if (!canPrompt.value) {
    // iPhone: установить можно только вручную — показываем инструкцию
    iosDialog.value = true;
    return;
  }
  try {
    if (await promptInstall()) snackbar.success(langStore.t("appInstalled"));
  } catch (err) {
    console.error(err);
  }
};
</script>

<template>
  <template v-if="available">
    <v-tooltip
      v-if="variant === 'icon'"
      :text="langStore.t('installApp')"
      location="bottom"
    >
      <template #activator="{ props }">
        <button
          type="button"
          class="install-icon"
          v-bind="props"
          :aria-label="langStore.t('installApp')"
          @click="install"
        >
          <v-icon size="22">mdi-cellphone-arrow-down</v-icon>
        </button>
      </template>
    </v-tooltip>

    <v-btn
      v-else
      block
      class="install-btn"
      color="white"
      variant="flat"
      rounded="lg"
      prepend-icon="mdi-cellphone-arrow-down"
      @click="install"
    >
      {{ langStore.t("installApp") }}
    </v-btn>

    <v-dialog v-model="iosDialog" max-width="420">
      <v-card rounded="xl" class="ios-hint">
        <div class="ios-hint__head">
          <img class="ios-hint__logo" src="/apple-touch-icon-180x180.png" alt="" />
          <div class="ios-hint__title">{{ langStore.t("installIosTitle") }}</div>
        </div>

        <ol class="ios-hint__steps">
          <li>
            <span class="ios-hint__num">1</span>
            <v-icon class="ios-hint__icon">mdi-apple-safari</v-icon>
            <span>{{ langStore.t("installIosStep1") }}</span>
          </li>
          <li>
            <span class="ios-hint__num">2</span>
            <v-icon class="ios-hint__icon">mdi-export-variant</v-icon>
            <span>{{ langStore.t("installIosStep2") }}</span>
          </li>
          <li>
            <span class="ios-hint__num">3</span>
            <v-icon class="ios-hint__icon">mdi-plus-box-outline</v-icon>
            <span>{{ langStore.t("installIosStep3") }}</span>
          </li>
        </ol>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="iosDialog = false">
            {{ langStore.t("close") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
</template>

<style scoped>
/* В стиле колокольчика уведомлений в шапке */
.install-icon {
  width: 42px;
  height: 42px;
  border: 1px solid #d6e3f1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e9f1fa;
  color: #2c4a6e;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.install-icon:hover {
  background: #dde9f6;
  border-color: #bdd3ec;
  box-shadow: 0 4px 12px rgba(30, 100, 180, 0.14);
  color: #0b4fa8;
}

.install-btn {
  text-transform: none;
  font-size: 16px;
  font-weight: 600;
  color: rgb(26, 115, 232) !important;
}

.ios-hint {
  padding: 8px 8px 4px;
}

.ios-hint__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 4px;
}

.ios-hint__logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.ios-hint__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

.ios-hint__steps {
  list-style: none;
  margin: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ios-hint__steps li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  line-height: 1.35;
}

.ios-hint__num {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e9f1fa;
  color: #0b4fa8;
  font-size: 13px;
  font-weight: 700;
}

.ios-hint__icon {
  flex: none;
  color: rgb(0, 128, 255);
}
</style>
