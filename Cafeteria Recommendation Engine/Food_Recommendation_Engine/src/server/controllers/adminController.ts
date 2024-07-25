import { Socket } from 'socket.io';
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  viewMenu,
  checkFoodItemExistence,
} from '../services/adminService';

export function handleAdminActions(socket: Socket) {
  socket.on('addMenuItem', (data, profileData, callback) => {
    addMenuItem(data, profileData)
      .then((response) => callback({success: true}))
      .catch(() => callback({ success: false }));
  });

  socket.on('updateMenuItem', (data, callback) => {
    updateMenuItem(data)
      .then((response) => callback(response))
      .catch(() => callback({ success: false }));
  });

  socket.on('deleteMenuItem', (id, callback) => {
    deleteMenuItem(id)
      .then((response) => callback(response))
      .catch(() => callback({ success: false }));
  });

  socket.on('viewMenu', (callback) => {
    viewMenu()
      .then((response) => callback(response))
      .catch(() => callback({ success: false }));
  });

  socket.on('checkFoodItemExistence', (itemId, callback) => {
    checkFoodItemExistence(itemId)
      .then((exists: boolean) => callback(exists))
      .catch(() => callback(false));
  });
}
