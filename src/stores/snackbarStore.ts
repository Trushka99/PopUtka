import { defineStore } from "pinia";

export const useSnackbarStore = defineStore("snackbar", {
  state: (): { show: boolean; message: string; color: string } => ({
    show: false,
    message: "",
    color: "green-darken-2",
  }),
  actions: {
    notify(message: string, color = "green-darken-2") {
      this.message = message;
      this.color = color;
      this.show = true;
    },
  },
});
