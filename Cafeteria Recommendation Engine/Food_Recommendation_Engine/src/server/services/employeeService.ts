import { feedbackRepository } from '../repositories/feedbackRepository';
import { menuRepository } from '../repositories/menuRepository';
import { userRepository } from '../repositories/userRepository';
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

export async function getRolloutItems(user: any, callback: Function) {
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  let messages: string[] = [];

  try {
    for (const mealType of mealTypes) {
      const rolledOutItems = await menuRepository.getRolledOutItems(mealType, user);
      console.log("Rolled out items for", mealType, ":", rolledOutItems);

      if (rolledOutItems.length > 0) {
        const message = `Rolled out items for ${mealType} are: ${rolledOutItems.join(', ')}`;
        messages.push(message);
      }
    }

    if (messages.length === 0) {
      messages.push("Chef has not rolled out any items yet.");
    }

    callback({ status: 'printMessage', message: messages.join('\n') });
  } catch (err) {
    console.error('Error getting rollout items:', err);
    callback({ status: 'error', message: 'Error getting rollout items' });
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

export async function viewNotification(callback: Function) {
  try {
    const notification = await menuRepository.viewNotification();
    callback({ success: true, notification });
  } catch (err) {
    console.error('Error viewing notification:', err);
    callback({ success: false });
  }
}

export async function voteFood(item: string, mealType: string, username: string, callback: Function) {
  try {
    const exists = await menuRepository.selectMenuItem(item, mealType, username);
    callback(exists);
  } catch (err) {
    console.error('Error voting for food:', err);
    callback(false);
  }
}

export async function viewDiscardedItems(callback: Function) {
  try {
    const discardedItems = await menuRepository.getFeedbackItems();
    callback({ success: true, discardedItems });
  } catch (err) {
    console.error('Error viewing discarded items:', err);
    callback({ success: false });
  }
}

export async function saveSolution(question: string, answer: string, userid: number, callback: Function) {
  try {
    const exists = await menuRepository.saveSolution(question, answer, userid);
    callback({ success: true,exists });
  } catch (err) {
    console.error('Error saving solution:', err);
    callback(false);
  }
}

export async function checkFeedbackResponses(userid: number, callback: Function) {
  try {
    const exists = await menuRepository.checkFeedbackResponses(userid);
    console.log('exists', exists);
    callback(exists);
  } catch (err) {
    console.error('Error checking responses:', err);
    callback(false);
  }
}

export async function updateProfile(profileData:any,employeeId:number,  callback: Function) {
  try {
    const profile = await menuRepository.updateProfile(profileData,employeeId);
    console.log('profile', profile);
    callback({ success: true, message : profile});
  } catch (err) {
    console.error('Error updating profile:', err);
    callback({ success: false, message : "Failed to update profile!! You Have entered wrong data. Please try again."});
  }
}

export async function LogLogout(employeeId: number, logType:string, callback: Function) {
  try {
    const message = await userRepository.logLogout(employeeId, logType);
    callback({ success: true, message });
  } catch (err) {
    console.error('Error logging out:', err);
    callback({ success: false, message: 'Failed to logout!!'});
  }
}

export async function saveDetailedFeedback(menuItem:any ,employeeId:any, question:any, feedback:any, callback: Function){
  const data = await menuRepository.saveDetailedFeedback(menuItem,employeeId, question, feedback);
  callback(data);
}

export async function checkFeedbackExists(itemname:string, employeeId:any, callback: Function){
  const data = await menuRepository.checkFeedbackExists(itemname, employeeId);
  callback(data);
}

