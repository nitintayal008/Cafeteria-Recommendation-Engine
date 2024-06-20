import { Socket } from 'socket.io';
import { addMenuItem, updateMenuItem, deleteMenuItem, viewMenu, checkFoodItemExistence } from '../services/adminService';

export function handleAdminActions(socket: Socket) {
  socket.on('addMenuItem', (data, callback) => addMenuItem(data, callback));
  socket.on('updateMenuItem', (data, callback) => updateMenuItem(data, callback));
  socket.on('deleteMenuItem', (data, callback) => deleteMenuItem(data, callback));
  socket.on('viewMenu', (callback) => viewMenu(callback));
  socket.on('checkFoodItemExistence', (itemId, callback) => {
    checkFoodItemExistence(itemId)
      .then((exists: boolean) => callback(exists))
      .catch(() => callback(false)); // Handle errors, return false for simplicity
  });
}