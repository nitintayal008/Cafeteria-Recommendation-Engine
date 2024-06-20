import { menuRepository } from '../repositories/menuRepository';

interface RecommendedItem {
  id: number;
  name: string;
  score: number;
}

export async function getFoodItemForNextDay(menuType: string, returnItemListSize: number): Promise<RecommendedItem[]> {
    console.log("menuType", menuType);
    console.log("returnItemListSize", returnItemListSize);
  const menuItems: any = await menuRepository.viewMenu();
  const recommendedItems = menuItems.map((item: any) => ({
    ...item,
    score: Math.random(),
  }));

  recommendedItems.sort((a: { score: number; }, b: { score: number; }) => b.score - a.score);

  return recommendedItems.slice(0, returnItemListSize);
}
