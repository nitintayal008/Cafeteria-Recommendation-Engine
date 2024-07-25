import { menuRepository } from '../repositories/menuRepository';
import { RecommendedItem } from './types';

export async function getFoodItemForNextDay(menuType: string, returnItemListSize: number): Promise<RecommendedItem[]> {
    console.log("menuType", menuType);
    console.log("returnItemListSize", returnItemListSize);

    const menuItems: any = await menuRepository.viewMenu();
    console.log("menuItems_nitin", menuItems);
    const normalizedMenuType = menuType.charAt(0).toUpperCase() + menuType.slice(1).toLowerCase();    console.log("normalizedMenuType000", normalizedMenuType);
    const filteredItems = menuItems.filter((item: any) => item.mealType === normalizedMenuType);
    console.log("filteredItems_nitin", filteredItems);

    const recommendedItems = filteredItems.map((item: any) => ({
        ...item,
        score: parseFloat((Math.random() * 100).toFixed(2)),
    }));
    console.log("recommendedItems_nitin", recommendedItems);

    recommendedItems.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    console.log("recommendedItems_nitin2", recommendedItems);

    return recommendedItems.slice(0, returnItemListSize);
}

