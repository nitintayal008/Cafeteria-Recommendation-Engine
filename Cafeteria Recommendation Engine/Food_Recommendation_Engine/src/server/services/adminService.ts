import { menuRepository } from '../repositories/menuRepository';
import { MenuItemPayload } from '../utils/types';

export async function addMenuItem({ name, price, mealType, availability }: MenuItemPayload, profileData: any) {
  try {
    const menuItemId = await menuRepository.addMenuItem({ name, price, mealType, availability }, profileData);
    return { success: true, menuItemId };
  } catch (err) {
    console.error('Error adding menu item:', err);
    return { success: false };
  }
}

export async function updateMenuItem({ id, name, price, mealType, availability }: MenuItemPayload) {
  try {
    await menuRepository.updateMenuItem({ id, name, price, mealType, availability });
    return { success: true };
  } catch (err) {
    console.error('Error updating menu item:', err);
    return { success: false };
  }
}

export async function deleteMenuItem(id: number) {
  try {
    const item = await menuRepository.findMenuItemById(id);
    if (item) {
      await menuRepository.deleteMenuItem(id, false);
      return { success: true };
    } else {
      return { success: false, message: 'Item not found' };
    }
  } catch (err) {
    console.error('Error deleting menu item:', err);
    return { success: false };
  }
}

export async function viewMenu() {
  try {
    const menuItems = await menuRepository.viewMenu();
    return { success: true, menuItems };
  } catch (err) {
    console.error('Error viewing menu:', err);
    return { success: false };
  }
}

export async function checkFoodItemExistence(id: number): Promise<boolean> {
  try {
    const existingItem = await menuRepository.findMenuItemById(id);
    return !!existingItem;
  } catch (err) {
    console.error('Error checking menu item existence:', err);
    return false;
  }
}
