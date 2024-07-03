import { RowDataPacket } from "mysql2";
import connection from "../utils/database";
import { MenuItem, MenuItemPayload } from "../utils/types";
import { notificationDB } from "./notificationRepository";

class MenuRepository {
  async findMenuItemByName(name: string): Promise<MenuItem | null> {
    const [rows] = await connection.query<MenuItem[]>(
      "SELECT * FROM menu_item WHERE name = ?",
      [name]
    );
    return rows.length > 0 ? rows[0] : null;
  }
  async addMenuItem({ name, price, mealType, availability }: MenuItemPayload) {
    console.log(name, price, mealType, availability);
    const existingItem = await this.findMenuItemByName(name);
    if (existingItem) {
      throw new Error(`Menu item '${name}' already exists.`);
    }
    const [results] = await connection.query(
      "INSERT INTO menu_item (name, price,mealType, availability) VALUES (?, ?, ?,?)",
      [name, price, mealType, availability]
    );
    return (results as any).insertId;
  }

  async updateMenuItem({
    id,
    name,
    price,
    mealType,
    availability,
  }: MenuItemPayload) {
    const existingItem = await this.findMenuItemByName(name);
    if (existingItem) {
      throw new Error(`Menu item '${name}' already exists.`);
    }
    await connection.query(
      "UPDATE menu_item SET name = ?, price = ?,mealType=?, availability = ? WHERE id = ?",
      [name, price, mealType, availability, id]
    );
  }

  async findMenuItemById(id: number): Promise<MenuItem | null> {
    const [rows] = await connection.query<MenuItem[]>(
      "SELECT * FROM menu_item WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async deleteMenuItem(id: number, availability: boolean) {
    await connection.query(
      "UPDATE menu_item SET availability = ? WHERE id = ?",
      [availability, id]
    );
  }

  async deleteMenuItemByName(name: string, availability: boolean):Promise<string> {

    const [availabilityStatus] = await connection.query<RowDataPacket[]>(
      "SELECT availability from  menu_item WHERE name = ?",
      [name]
    );
    console.log("availabilityStatus", availabilityStatus[0]);
    if(availabilityStatus[0].availability === 1){
    await connection.query("SET SQL_SAFE_UPDATES = 0");
    await connection.query(
      "UPDATE menu_item SET availability = ? WHERE name = ?",
      [availability, name]
    );
    await connection.query("SET SQL_SAFE_UPDATES = 1");
    return "Deleted";
  }else{
    return "Already Deleted"
  }
}

  async viewMenu(): Promise<MenuItem[]> {
    const [rows] = await connection.query<MenuItem[]>(
      "SELECT id, name, price,mealType, availability FROM menu_item"
    );
    return rows;
  }

  async recommendMenu(itemIds: number[]) {
    const [rows] = await connection.query(
      "SELECT * FROM menu_item WHERE id IN (?)",
      [itemIds]
    );
    return rows;
  }

  async viewMonthlyFeedback() {
    const [rows] = await connection.query(`
      SELECT menu_item.name, AVG(feedback.rating) as average_rating, COUNT(feedback.id) as feedback_count
      FROM feedback
      JOIN menu_item ON feedback.menu_item_id = menu_item.id
      WHERE feedback_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      GROUP BY menu_item.name
    `);
    return rows;
  }

  async viewFeedback(itemId: number) {
    const [rows] = await connection.query(
      `
      SELECT feedback.comment, feedback.rating, feedback.feedback_date
      FROM feedback
      WHERE feedback.menu_item_id = ?
    `,
      [itemId]
    );
    return rows;
  }

  async setNextDayMenu(itemIds: number[]) {
    await connection.query("UPDATE menu_item SET next_day_menu = FALSE");
    await connection.query(
      "UPDATE menu_item SET next_day_menu = TRUE WHERE id IN (?)",
      [itemIds]
    );
  }

  async getNextDayMenuItems() {
    const [rows] = await connection.query(
      "SELECT * FROM menu_item WHERE next_day_menu = TRUE"
    );
    return rows;
  }

  async selectNextDayMenu(itemIds: number[]) {
    const sql = "UPDATE menu_items SET next_day_menu = TRUE WHERE id IN (?)";
    await connection.query(sql, [itemIds]);
  }

  async viewNotification() {
    try {
      const [rows] = await connection.query(
        'SELECT * FROM notification WHERE user_role = "employee" ORDER BY notification_date DESC LIMIT 10'
      );
      return rows;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  async getRolledOutItems(mealType: string) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      console.log("todcay:01", today);
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT Menu_Item.name
            FROM Rolledout_Item
            JOIN Menu_Item ON Rolledout_Item.menu_item_id = Menu_Item.id
            WHERE Rolledout_Item.date = ? AND Rolledout_Item.mealType = ?`,
        [today, mealType]
      );
      console.log("rows:01", rows);
      return rows.map((row) => row.name);
    } catch (err) {
      console.error("Error fetching rolled out items:", err);
      throw err;
    }
  }

  async selectMenuItem( menuItemName: string, mealTime: string, username: string): Promise<string> {
    const formattedmenuItemName = `%${menuItemName}%`;
    console.log("vb,.",menuItemName, mealTime, username );
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().slice(0, 10);

    const [empId] = await connection.query<RowDataPacket[]>('SELECT employeeId FROM User WHERE name = ?', [username]);
    console.log("empId:01", empId);
    if (empId.length === 0) {
      return `User ${username} not found.`;
    }

    const [existingSelection] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM Employee_Selection WHERE emp_id = ? AND date = ? AND mealType = ?',
        [empId[0].employeeId, date, mealTime]
    );
      console.log("existingSelection:01", existingSelection);
     if (existingSelection.length > 0) {
      console.log("i am inside");
        return `You have already selected the ${mealTime} item for tomorrow.`;
    }

    const [menuItem] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM menu_item WHERE name Like ? AND mealType = ?',
        [formattedmenuItemName, mealTime]
    );
    console.log("menuItem:01", menuItem);

    if (menuItem.length === 0) {
        return `Menu item ${menuItemName} does not exist for ${mealTime}.`;
    }

    await connection.query(
        'INSERT INTO Employee_Selection (emp_id, menu_item_id, mealType, date) VALUES (?, ?, ?, ?)',
        [empId[0].employeeId, menuItem[0].id, mealTime, date]
    );

    return `Menu item for ${mealTime} selected successfully.`;
}

async getRecommendations(): Promise<MenuItem[]> {
  console.log('i am inside getRecommendations');
  try {
      const query = `
      SELECT m.*, s.sentiment, s.average_rating, s.sentiment_score 
      FROM menu_item m 
      LEFT JOIN Sentiment s ON m.id = s.menu_item_id 
      ORDER BY s.average_rating DESC 
      LIMIT 10`;
      const [menuItems] = await connection.query<MenuItem[]>(query);
      return menuItems;
  } catch (error) {
      console.error(`Failed to insert sentiments: ${error}`);
      throw new Error('Error inserting sentiments.');
  }
}

async getMenu(): Promise<MenuItem[]> {
  try {
      const query = `
      SELECT m.*, s.sentiment, s.average_rating, s.sentiment_score 
      FROM menu_item m 
      LEFT JOIN Sentiment s ON m.id = s.menu_item_id`;
      const [menuItems] = await connection.query<MenuItem[]>(query);
      return menuItems;
  } catch (error) {
      console.error(`Failed to insert sentiments: ${error}`);
      throw new Error('Error inserting sentiments.');
  }
}

async getRecommendedItems(mealTime: string): Promise<string[]> {
  const [recommendedItems] = await connection.query<RowDataPacket[]>(
      `SELECT menu_item.name
      FROM menu_item
      JOIN Sentiment ON menu_item.id = Sentiment.menu_item_id
      WHERE menu_item.mealType = ?
      ORDER BY Sentiment.sentiment_score DESC, Sentiment.average_rating DESC
      LIMIT 5`,
      [mealTime]
  );
  console.log("recommendedItems:01", recommendedItems);

  return recommendedItems.map(item => item.name);
}

async rolloutMenuItems(mealTime: string, itemNames: string[]): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);

  const [existingRollout] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Rolledout_Item WHERE date = ? AND mealType = ?',
      [today, mealTime]
  );

  if (existingRollout.length > 0) {
      return 'Menu items have already been rolled out for today. Please wait until tomorrow.';
  }
  console.log("nitin_itemname", itemNames)
  const formattedItems = itemNames.map(item => `%${item}%`);
  for (const itemName of formattedItems) {
      const [item] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM menu_item WHERE name Like ? AND mealType = ?',
          [itemName, mealTime]
      );
      console.log("nitin_item:01", item);
      if (item.length === 0) {
          return `Menu item ${itemName} does not exist for ${mealTime}.`;
      }

      await connection.query(
          'INSERT INTO Rolledout_Item (menu_item_id, mealType, date) VALUES (?, ?, ?)',
          [item[0].id, mealTime, today]
      );
  }

  return `Menu items for ${mealTime} rolled out successfully.`;
}

async checkResponses(mealTime: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  console.log("today:01", today, mealTime);
  const [responses] = await connection.query<RowDataPacket[]>(
      `SELECT menu_item.name, COUNT(Employee_Selection.menu_item_id) as vote_count
      FROM Employee_Selection
      JOIN menu_item ON Employee_Selection.menu_item_id = menu_item.id
      WHERE Employee_Selection.date = ? AND Employee_Selection.mealType = ?
      GROUP BY Employee_Selection.menu_item_id`,
      [today, mealTime]
  );
  console.log("nitni_responses",responses);
  let responseString = `--- Responses for ${mealTime} ---\n`;
  responses.forEach((response: any) => {
      responseString += `Item: ${response.name}, Votes: ${response.vote_count}\n`;
  });

  return responseString;
}

async selectFoodToPrepare(today: string, mealTime: string): Promise<RowDataPacket[]> {
  const [responses] = await connection.query<RowDataPacket[]>(
      `SELECT menu_item.name, COUNT(Employee_Selection.menu_item_id) as vote_count
      FROM Employee_Selection
      JOIN menu_item ON Employee_Selection.menu_item_id = menu_item.id
      WHERE Employee_Selection.date = ? AND Employee_Selection.mealType = ?
      GROUP BY Employee_Selection.menu_item_id
      ORDER BY vote_count DESC`,
      [today, mealTime]
  );

  return responses;
}

async saveSelectedMeal(data: { mealForBreakfast: string, mealForLunch: string, mealForDinner: string }): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);

  const [breakfastMeal] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name = ?',
      [data.mealForBreakfast]
  );
  const [lunchMeal] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name = ?',
      [data.mealForLunch]
  );
  const [dinnerMeal] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name = ?',
      [data.mealForDinner]
  );

  await connection.query(
      'INSERT INTO Selected_Meal (menu_item_id, mealType, date) VALUES (?, \'breakfast\', ?), (?, \'lunch\', ?), (?, \'dinner\', ?)',
      [breakfastMeal[0].id, today, lunchMeal[0].id, today, dinnerMeal[0].id, today]
  );

  notificationDB.createNotification(
      'employee', 
      `Chef will be making ${data.mealForBreakfast} for breakfast, ${data.mealForLunch} for lunch, and ${data.mealForDinner} for dinner today.`,
      1
  );

  return 'Meals for today saved successfully.';
}

async viewDiscardedItems(): Promise<string[]> {
  const [discardedItems] = await connection.query<RowDataPacket[]>(
      'SELECT message FROM notification WHERE user_id = 100'
  );
  console.log("discardedItems", discardedItems);
  return discardedItems.map(item => item.message);
}

async saveSolution( question: string, response: string, empId: number): Promise<String> {
  await connection.query('INSERT INTO Feedback_Response ( question, response, employeeId) VALUES (?, ?, ?)', [ question, response, empId]);
  return "Solution saved successfully.";
}

async checkFeedbackResponses(empId: number): Promise<boolean> {
  const [responses] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Feedback_Response WHERE employeeId = ?',
      [empId]
  );
  return responses.length > 0;
}

async updateProfile(profileData: any, empId: number): Promise<string> {
  const { dietaryPreference, spiceLevel, cuisinePreference, sweetTooth } = profileData;
  const query = `
    INSERT INTO employee_profile (
      employee_id, dietary_preference, spice_level, cuisine_preference, sweet_tooth
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      dietary_preference = VALUES(dietary_preference), 
      spice_level = VALUES(spice_level), 
      cuisine_preference = VALUES(cuisine_preference), 
      sweet_tooth = VALUES(sweet_tooth)
  `;
  try {
    await connection.query(query, [empId, dietaryPreference, spiceLevel, cuisinePreference, sweetTooth]);
    return "Profile updated successfully.";
  } catch (error) {
    throw new Error("Failed to update profile.");
  }
}
}
export const menuRepository = new MenuRepository();
