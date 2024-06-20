
import { Socket } from 'socket.io';
import { checkFoodItemExistence, viewMenu } from '../services/adminService';
import { giveFeedback } from '../services/employeeService';

export function handleEmployeeActions(socket: Socket) {
  socket.on('viewMenu', viewMenu);
  socket.on('giveFeedback', giveFeedback);
  socket.on('checkFoodItemExistence', (itemId, callback) => {
    checkFoodItemExistence(itemId)
      .then((exists: boolean) => callback(exists))
      .catch(() => callback(false)); // Handle errors, return false for simplicity
  });
}