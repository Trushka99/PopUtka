import { defineStore } from "pinia";

export const useSnackbarStore = defineStore("snackbar", {
  state: (): {
    show: boolean;
    message: string;
    color: string;
  } => ({
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

    success(message: string) {
      this.notify(message, "green-darken-2");
    },

    error(message: string) {
      this.notify(message, "red-darken-2");
    },

    warning(message: string) {
      this.notify(message, "orange-darken-2");
    },

    info(message: string) {
      this.notify(message, "blue-darken-2");
    },

    close() {
      this.show = false;
    },
  },
});
