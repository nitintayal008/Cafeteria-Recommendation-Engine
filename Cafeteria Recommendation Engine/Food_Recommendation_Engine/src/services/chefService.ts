import { menuRepository } from '../repositories/menuRepository';
import { getFoodItemForNextDay as recommendationEngineGetFoodItemForNextDay } from '../utils/recommendationEngine';
 
const employeeChoices = new Map<string, number[]>();

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
 
export async function viewFeedback(itemId: number, callback: Function) {
  try {
    const feedback = await menuRepository.viewFeedback(itemId);
    callback({ success: true, feedback });
  } catch (err) {
    console.error('Error fetching feedback:', err);
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

export async function storeEmployeeChoice(employeeId: string, selectedItems: number[]) {
  employeeChoices.set(employeeId, selectedItems);
}

export async function finalizeMenu() {
  const allChoices = Array.from(employeeChoices.values()).flat();
  const itemCount: { [key: number]: number } = {};

  allChoices.forEach(itemId => {
    itemCount[itemId] = (itemCount[itemId] || 0) + 1;
  });

  const finalMenuItems = Object.entries(itemCount)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5) // Assuming you want to select top 5 items
    .map(([itemId]) => parseInt(itemId, 10));

  await menuRepository.selectNextDayMenu(finalMenuItems);

  // Optionally clear choices after finalizing
  employeeChoices.clear();

  return finalMenuItems;
}
