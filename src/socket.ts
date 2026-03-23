import { io, Socket } from "socket.io-client";

export const socket: Socket = io(
  import.meta.env.VITE_API_URL || "https://api.pop-utka.uz",
  {
    withCredentials: true,
    transports: ["websocket"],
  }
);
