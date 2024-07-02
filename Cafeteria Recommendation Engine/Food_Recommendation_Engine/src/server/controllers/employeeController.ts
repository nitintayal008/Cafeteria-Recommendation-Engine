
import { Socket } from 'socket.io';
import { checkFoodItemExistence, viewMenu } from '../services/adminService';
import { checkFeedbackResponses, getRolloutItems, giveFeedback, nextDayMenu, saveResponseForNextDay, saveSolution, viewDiscardedItems, viewNotification, voteFood } from '../services/employeeService';

export function handleEmployeeActions(socket: Socket) {
  socket.on('viewMenu', viewMenu);
  socket.on('giveFeedback', giveFeedback);
  socket.on('checkFoodItemExistence', (itemId, callback) => {
    checkFoodItemExistence(itemId)
      .then((exists: boolean) => callback(exists))
      .catch(() => callback(false)); // Handle errors, return false for simplicity
  });
  socket.on('nextDayMenu', nextDayMenu);
  socket.on('saveResponseForNextDay', saveResponseForNextDay);
  socket.on('viewNotification', viewNotification);
  socket.on('getRolloutItems', getRolloutItems);
  socket.on('voteFood', voteFood);
  socket.on('viewDiscardedItems',viewDiscardedItems);
  socket.on('saveSolution',saveSolution);
  socket.on('checkFeedbackResponses',checkFeedbackResponses);
}
