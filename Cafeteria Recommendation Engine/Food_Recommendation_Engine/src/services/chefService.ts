import { menuRepository } from '../repositories/menuRepository';
import { getFoodItemForNextDay as recommendationEngineGetFoodItemForNextDay } from '../utils/recommendationEngine';

export async function recommendMenu(itemIds: number[], callback: Function) {
  try {
    const recommendedItems = await menuRepository.recommendMenu(itemIds);
    callback({ success: true, recommendedItems });
  } catch (err) {
    console.error('Error recommending menu:', err);
    callback({ success: false });
  }
}

export async function viewMonthlyFeedback(callback: Function) {
  try {
    const feedbackReport = await menuRepository.viewMonthlyFeedback();
    callback({ success: true, feedbackReport });
  } catch (err) {
    console.error('Error fetching monthly feedback report:', err);
    callback({ success: false });
  }
}

export async function getFoodItemForNextDay(menuType: string, returnItemListSize: number) {
  try {
    const recommendedItems = await recommendationEngineGetFoodItemForNextDay(menuType, returnItemListSize);
    return recommendedItems;
  } catch (err) {
    console.error('Error getting food item for next day:', err);
    throw err;
  }
}

export async function selectNextDayMenu(itemIds: number[]) {
  try {
    await menuRepository.setNextDayMenu(itemIds);
    const nextDayMenuItems = await menuRepository.getNextDayMenuItems();
    console.log('nextDayMenuItems', nextDayMenuItems);
    return { success: true, nextDayMenuItems };
  } catch (err) {
    console.error('Error selecting next day menu items:', err);
    return { success: false, message: 'Error selecting next day menu items.' };
  }
}
