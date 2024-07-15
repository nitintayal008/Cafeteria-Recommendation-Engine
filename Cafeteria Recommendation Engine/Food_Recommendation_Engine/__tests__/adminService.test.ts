// __tests__/adminService.test.ts

import { addMenuItem, updateMenuItem, deleteMenuItem, viewMenu, checkFoodItemExistence } from '../src/server/services/adminService';
import { menuRepository } from '../src/server/repositories/menuRepository';
import { MenuItemPayload } from '../src/server/utils/types';

jest.mock('../src/server/repositories/menuRepository', () => ({
  menuRepository: {
    addMenuItem: jest.fn(),
    updateMenuItem: jest.fn(),
    deleteMenuItem: jest.fn(),
    findMenuItemById: jest.fn(),
    viewMenu: jest.fn(),
  },
}));

describe('Admin Service', () => {
  it('should update an existing menu item', async () => {
    const updatedMenuItem: MenuItemPayload = { id: 1, name: 'Pizza', price: 10.99, mealType: 'Lunch', availability: true };
    (menuRepository.updateMenuItem as jest.Mock).mockResolvedValue(undefined);

    const result = await updateMenuItem(updatedMenuItem);

    expect(result).toEqual({ success: true });
  });

  it('should handle errors when updating a menu item', async () => {
    (menuRepository.updateMenuItem as jest.Mock).mockRejectedValue(new Error('Test Error'));

    const result = await updateMenuItem({ id: 1, name: 'Pizza', price: 10.99, mealType: 'Lunch', availability: true });

    expect(result).toEqual({ success: false });
  });

  it('should delete a menu item', async () => {
    (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(true);
    (menuRepository.deleteMenuItem as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteMenuItem(1);

    expect(result).toEqual({ success: true });
  });

  it('should handle errors when deleting a menu item', async () => {
    (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(true);
    (menuRepository.deleteMenuItem as jest.Mock).mockRejectedValue(new Error('Test Error'));

    const result = await deleteMenuItem(1);

    expect(result).toEqual({ success: false });
  });

  it('should return "Item not found" when trying to delete a non-existing menu item', async () => {
    (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(false);

    const result = await deleteMenuItem(1);

    expect(result).toEqual({ success: false, message: 'Item not found' });
  });

  it('should view the menu', async () => {
    const menuItems = [{ id: 1, name: 'Pizza', price: 9.99 }];
    (menuRepository.viewMenu as jest.Mock).mockResolvedValue(menuItems);

    const result = await viewMenu();

    expect(result).toEqual({ success: true, menuItems });
  });

  it('should handle errors when viewing the menu', async () => {
    (menuRepository.viewMenu as jest.Mock).mockRejectedValue(new Error('Test Error'));

    const result = await viewMenu();

    expect(result).toEqual({ success: false });
  });

  it('should check if a menu item exists', async () => {
    (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(true);

    const exists = await checkFoodItemExistence(1);

    expect(exists).toBe(true);
  });

  it('should handle errors when checking menu item existence', async () => {
    (menuRepository.findMenuItemById as jest.Mock).mockRejectedValue(new Error('Test Error'));

    const exists = await checkFoodItemExistence(1);

    expect(exists).toBe(false);
  });
});
