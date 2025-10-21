import { ref, computed } from "vue";
import { defineStore } from "pinia";
import dictionary from "../utils/dictionary.json";
import termins from "../utils/termins.json";
interface LangDictionary {
  [langCode: string]: {
    [key: string]: string;
  };
}
export const useLangStore = defineStore("lang", {
  state: (): {
    currentLang: string;
    cities: LangDictionary;
    termins: LangDictionary;
  } => ({
    currentLang: localStorage.getItem("lang") || "ru",
    cities: dictionary,
    termins: termins,
  }),
  getters: {
    с: (state) => (key: string) =>
      state.cities[state.currentLang]?.[key] || key,
    t: (state) => (key: string) =>
      state.termins[state.currentLang]?.[key] || key,
  },
  actions: {
    setLang(lang: string) {
      this.currentLang = lang;
      localStorage.setItem("lang", lang);
    },
  },
});
