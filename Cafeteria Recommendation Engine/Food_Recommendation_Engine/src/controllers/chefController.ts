import { Socket } from 'socket.io';
import { recommendMenu, viewMonthlyFeedback, getFoodItemForNextDay, selectNextDayMenu } from '../services/chefService';

export function handleChefActions(socket: Socket) {
  socket.on('recommendMenu', recommendMenu);
  socket.on('viewMonthlyFeedback', viewMonthlyFeedback);
  socket.on('getFoodItemForNextDay', async ({ menuType, returnItemListSize }, callback) => {
    const recommendedItems = await getFoodItemForNextDay(menuType, returnItemListSize);
    callback({ success: true, recommendedItems });
  });
  socket.on('selectNextDayMenu', async (itemIds: number[], callback: Function) => {
    console.log('itemIds', itemIds);
    console.log("i am here");
    const result = await selectNextDayMenu(itemIds);
    console.log('result', result);
    if (result.success) {
      socket.broadcast.emit('nextDayMenu', result.nextDayMenuItems);
    }
    callback(result);
  });
}
