import { menuRepository } from '../repositories/menuRepository';
import {  notificationDB } from '../repositories/notificationRepository';
import { getFoodItemForNextDay as recommendationEngineGetFoodItemForNextDay } from '../utils/recommendationEngine';
import { calculateSentiments } from './recommendationService';
 
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

export async function getRecommendation(callback: Function) {
  try {
    await calculateSentiments();
    const menuItems = await menuRepository.getRecommendations();
    callback({ success: true, menuItems });
  } catch (err) {
    console.error('Error getting recommendation:', err);
    callback({ success: false });
  }
}

export async function getMenu(callback: Function) {
  try{
    await calculateSentiments();
    const menuItems = await menuRepository.getMenu();
    callback({ success: true, menuItems });
  }catch(err){
    console.error('Error getting menu:', err);
    callback({ success: false });
  }
}

export async function getTopRecommendations(callback: Function) {
  const mealTimes = ["breakfast", "lunch", "dinner"];
  const items: string[] = [];

  try {
    for (const mealTime of mealTimes) {
      const recommendedItems = await menuRepository.getRecommendedItems(mealTime);
      console.log('recommendedItems', recommendedItems);
      const message = `Top recommended items for ${mealTime}: ${recommendedItems.join(', ')}`;
      items.push(message);
    }
    console.log('Top Recommendations:', items);
    callback ({sucess: true, items});
  } catch (err) {
    console.error('Error getting top recommendations:', err);
    throw new Error('Error getting top recommendations');
  }
}

export async function rolloutFoodItem(mealTime: string, items: string[]) {
  try {
    const message = await menuRepository.rolloutMenuItems(mealTime, items);
    console.log('message', message);
    notificationDB.createNotification('employee', `Chef has rolled out ${items} for tomorrow's ${mealTime}.`, 1);
    // callback({ success: true });
  } catch (err) {
    console.error('Error rolling out food item:', err);
    // callback({ success: false });
  }
}

export async function checkResponses(callback: Function) {
  const mealTimes = ['breakfast', 'lunch', 'dinner'];
    let messages: string[] = [];
        for (const mealTime of mealTimes) {
            const message = await menuRepository.checkResponses(mealTime);
            messages.push(message);
        }
        callback({ success: true, messages });  
}

export async function selectTodayMeal(callback: Function) {
  const today = new Date().toISOString().slice(0, 10);
  let messages: string[] = [];
        const mealTimes = ['breakfast', 'lunch', 'dinner'];
        for (const mealTime of mealTimes) {
            const responses = await menuRepository.selectFoodToPrepare(today, mealTime);
            responses.forEach((response: any) => {
                const message = `Item: ${response.name}, Votes: ${response.vote_count}`;
                messages.push(message);
            });
        }
        callback({ success: true, messages });
}

export async function saveSelectedMeal(meals: { mealForBreakfast: string; mealForLunch: string; mealForDinner: string; }, callback: Function) {
  try {
    await menuRepository.saveSelectedMeal( meals);
    callback({ success: true, message: 'Selected meals saved successfully.' });
  } catch (err) {
    console.error('Error saving selected meal:', err);
    callback({ success: false, message: 'Error saving selected meal.' });
  }
}
