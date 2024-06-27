import { feedbackRepository } from '../repositories/feedbackRepository';
import { menuRepository } from '../repositories/menuRepository';
import { FeedbackPayload } from '../utils/types';


export async function viewMenu(callback: Function) {
  try {
    const menuItems = await menuRepository.viewMenu();
    callback({ success: true, menuItems });
  } catch (err) {
    console.error('Error viewing menu:', err);
    callback({ success: false });
  }
}

export async function giveFeedback({ itemId, comment, rating }: FeedbackPayload, callback: Function) {
  try {
    await feedbackRepository.giveFeedback({ itemId, comment, rating });
    callback({ success: true });
  } catch (err) {
    console.error('Error giving feedback:', err);
    callback({ success: false });
  }
}

export async function nextDayMenu(callback: Function) {
  try {
    const nextDayMenuItems = await menuRepository.getNextDayMenuItems();
    callback({ success: true, nextDayMenuItems });
  } catch (err) {
    console.error('Error getting next day menu:', err);
    callback({ success: false });
  }
}

export async function saveResponseForNextDay(nextDayMenuItems: number[], callback: Function) {
  try {
    await menuRepository.setNextDayMenu(nextDayMenuItems);
    callback({ success: true });
  } catch (err) {
    console.error('Error saving next day menu:', err);
    callback({ success: false });
  }
}
