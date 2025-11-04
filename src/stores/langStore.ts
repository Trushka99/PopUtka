import { ref, computed } from "vue";
import { defineStore } from "pinia";
import dictionary from "../utils/dictionary.json";
import termins from "../utils/termins.json";
import { getMe } from "@/api";
import { logout } from "@/api";
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
    user: any;
  } => ({
    currentLang: localStorage.getItem("lang") || "ru",
    cities: dictionary,
    termins: termins,
    user: {},
  }),
  getters: {
    cKeyByValue: (state) => (value: string) => {
      const entries = Object.entries(state.cities[state.currentLang] || {});
      const found = entries.find(([_, v]) => v === value);
      return found ? found[0] : value;
    },

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
    setUser(data: any) {
      this.user = data;
    },
    async logOut() {
      const res = await logout();
      return res;
    },
    async initUser() {
      try {
        const res = await getMe();
        this.setUser(res.data.data.user);
      } catch (err) {
        console.error(err);
        this.logOut();
      }
    },
  },
});
