import { Socket } from "socket.io";
import { login } from "../services/userService";

export function handleUserActions(socket: Socket) {
  socket.on("login", login);
}
