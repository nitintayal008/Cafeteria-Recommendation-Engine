import { Socket } from 'socket.io';
import { recommendMenu, viewMonthlyFeedback, viewFeedback, selectNextDayMenu, storeEmployeeChoice, finalizeMenu, getRecommendation } from '../services/chefService';
import { getFoodItemForNextDay } from '../utils/recommendationEngine';
 
export function handleChefActions(socket: Socket) {
  socket.on('recommendMenu', recommendMenu);
  socket.on('viewMonthlyFeedback', viewMonthlyFeedback);
  socket.on('getFoodItemForNextDay', async ({ menuType, returnItemListSize }, callback) => {
    const recommendedItems = await getFoodItemForNextDay(menuType, returnItemListSize);
    callback({ success: true, recommendedItems });
  });
  socket.on('selectNextDayMenu', async (itemIds: number[], callback: Function) => {
    const result = await selectNextDayMenu(itemIds);
    if (result.success) {
      socket.broadcast.emit('nextDayMenu', result.nextDayMenuItems);
    }
    callback(result);
  });

  // Handle employee selections
  socket.on('employeeSelectNextDayMenu', async (selectedItems: number[], callback: Function) => {
    try {
      await storeEmployeeChoice(socket.id, selectedItems);
      callback({ success: true, message: 'Your choice has been recorded.' });
    } catch (err) {
      console.error('Error storing employee choice:', err);
      callback({ success: false, message: 'Error storing your choice. Please try again.' });
    }
  });

  // Finalize the menu based on all employee choices (this can be called at a scheduled time)
  socket.on('finalizeMenu', async (callback: Function) => {
    try {
      const finalMenu = await finalizeMenu();
      callback({ success: true, finalMenu });
    } catch (err) {
      console.error('Error finalizing menu:', err);
      callback({ success: false, message: 'Error finalizing menu. Please try again.' });
    }
  });

  socket.on('getRecommendation', getRecommendation);

}