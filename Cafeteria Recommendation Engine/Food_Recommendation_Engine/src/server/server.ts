import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { handleAdminActions } from '../controllers/adminController';
import { handleUserActions } from '../controllers/userController';
import { handleChefActions } from '../controllers/chefController';
import { handleEmployeeActions } from '../controllers/employeeController';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  handleUserActions(socket);
  handleAdminActions(socket);
  handleChefActions(socket);
  handleEmployeeActions(socket);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
