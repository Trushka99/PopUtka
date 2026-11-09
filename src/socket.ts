import { io, Socket } from "socket.io-client";

// Один общий сокет на всё приложение. Подключаемся вручную (socket.connect()),
// когда он реально нужен — иначе до входа в аккаунт сервер отклонит
// подключение без cookie, и сокет больше не переподключится сам.
export const socket: Socket = io(
  import.meta.env.VITE_API_URL || "https://api.pop-utka.uz",
  {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: false,
  },
);
