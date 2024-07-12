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
    if(message === 'Menu items have already been rolled out for today. Please wait until tomorrow.'){
      return message;
    }else{
      notificationDB.createNotification('employee', `Chef has rolled out ${items} for tomorrow's ${mealTime}.`, 1);
    }
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
            messages.push(...message);
        }
        callback({ success: true, messages });  
}

export async function selectTodayMeal(callback: Function) {
  const today = new Date().toISOString().slice(0, 10);
  let meals: any = {};

  const mealTimes = ['breakfast', 'lunch', 'dinner'];
  for (const mealTime of mealTimes) {
    const responses = await menuRepository.selectFoodToPrepare(today, mealTime);
    meals[mealTime] = responses.map((response: any) => ({
      name: response.name,
      vote_count: response.vote_count
    }));
  }

  callback({ success: true, meals });
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

export async function createAndViewDiscardList(menuItems: any, callback: Function){
  const badRatingFood = menuItems.find((item: { average_rating: string | null; }) => item.average_rating !== null && parseFloat(item.average_rating) <=  2.0);
    console.log("nitin--dd",badRatingFood.name);
    if(badRatingFood){
      callback({success: true, DiscardedItem : badRatingFood.name})
    }
    else{
      callback({success: false, DiscardedItem: "no discarded item right now"})
    }
}

export async function deleteMenuItemByName(name: string, callback: Function) {
  const canUse = await menuRepository.canUseFeature('discardMenuItem');
  if(canUse){
    try {
      const response = await menuRepository.deleteMenuItemByName(name, false);
      if(response=="Deleted"){
        callback({ success: true, message :"Sucessfully deleted from menu" });
      }else{
        callback({ success: true, message :"You allready deleted this from menu!! Now Come after 1 Month" });
      }
  } catch (err) {
    console.error('Error updating menu item availability:', err);
    callback({ success: false });
  }
  }else{
  callback({ success: false, message: "This feature is available only once a month. Come back next month to use this feature again." });
  }
}
export async function saveFeedbackQuestion(data: any, callback: Function) {
  // Save feedback question to the database or in-memory store
  const message = `Feedback for ${data.discardedItem}: ${data.question} - ${data.response}`;
  console.log(message);
  notificationDB.createNotification('employee', message, 1);
  callback({ success: true, message: "Feedback question saved." });
}

export async function sendFeedbackQuestion(data: any, callback: Function) {
  // Send feedback question to the employee
  const message = `${data.question}`;
  console.log(message);
  notificationDB.createNotification('employee', message, 100);
  callback({ success: true, message: "Feedback question sent." });
}

export async function getDiscardMenuItems(callback: Function) {
  const discardMenuItems = await menuRepository.fetchDiscardMenuItems();
  console.log("discardedItems", discardMenuItems);
  callback({ success: true, discardMenuItems });
} 

export async function fetchDetailedFeedback(menu_item_name: any, callback: Function) {
  console.log("nitin_menu_item_name", menu_item_name);
  const feedback = await menuRepository.fetchDetailedFeedback(menu_item_name);
  console.log("nitin_feedback", feedback);
  callback({ success: true, feedback });
}

export async function checkMonthlyUsage(discardedItem: any, callback: Function) {
  const canUse = await menuRepository.canUseFeature(`getDetailedFeedback-${discardedItem}`);
  callback({canUse});
}