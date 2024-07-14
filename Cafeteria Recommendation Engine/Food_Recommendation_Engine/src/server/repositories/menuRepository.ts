import { RowDataPacket } from "mysql2";
import connection from "../utils/database";
import { DiscardMenuItem, MenuItem, MenuItemPayload } from "../utils/types";
import { notificationDB } from "./notificationRepository";

class MenuRepository {
  async findMenuItemByName(name: string): Promise<MenuItem | null> {
    const [rows] = await connection.query<MenuItem[]>(
      "SELECT * FROM menu_item WHERE name = ?",
      [name]
    );
    return rows.length > 0 ? rows[0] : null;
  }
  async addMenuItem({ name, price, mealType, availability }: MenuItemPayload, profileData:any) {
    console.log(name, price, mealType, availability);
    const existingItem = await this.findMenuItemByName(name);
    if (existingItem) {
      throw new Error(`Menu item '${name}' already exists.`);
    }
    const [results] = await connection.query(
      "INSERT INTO menu_item (name, price,mealType, availability) VALUES (?, ?, ?,?)",
      [name, price, mealType, availability]
    );
    const [menu_item_id] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name = ?',
      [name]
  );
  if (menu_item_id.length > 0) {
    await connection.query('INSERT INTO Menu_Item_Attribute (menu_item_id, food_type, spice_level, cuisine, sweet_tooth) VALUES (?, ?, ?, ?, ?)', [menu_item_id[0].id, profileData.foodType, profileData.spiceLevel, profileData.cuisine, profileData.sweetTooth])
}
    return (results as any).insertId;
  }

  async updateMenuItem({
    id,
    name,
    price,
    mealType,
    availability,
    profileData,
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

  async getRolledOutItems(mealType: string, user: any) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [userAttributes] = await connection.query<RowDataPacket[]>('SELECT food_type, spice_level, cuisine, sweet_tooth FROM employee_profile WHERE employee_id = ?', [user.employeeId]);

      console.log("todcay:01", today);
      const [rows] = await connection.query<RowDataPacket[]>(
        // `SELECT Menu_Item.name
        //     FROM Rolledout_Item
        //     JOIN Menu_Item ON Rolledout_Item.menu_item_id = Menu_Item.id
        //     WHERE Rolledout_Item.date = ? AND Rolledout_Item.mealType = ?`,
        // [today, mealType]
        `SELECT m.name
            FROM Rolledout_Item ri
            INNER JOIN Menu_Item m ON ri.menu_item_id = m.id
            INNER JOIN Menu_Item_Attribute mia ON m.id = mia.menu_item_id
            WHERE ri.date = ? AND ri.mealType = ?
            ORDER BY (CASE WHEN mia.food_type = ? THEN 0 ELSE 1 END),
            (CASE WHEN mia.spice_level = ? THEN 0 ELSE 1 END),
          (CASE WHEN mia.cuisine = ? THEN 0 ELSE 1 END),
            (CASE WHEN mia.sweet_tooth = ? THEN 0 ELSE 1 END) DESC`,
            [today, mealType, userAttributes[0].food_type, userAttributes[0].spice_level, userAttributes[0].cuisine, userAttributes[0].sweet_tooth]
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

async checkIfallreadyRolledOut():Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);

  const [existingRollout] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Rolledout_Item WHERE date = ?',
      [today]
  );

  if (existingRollout.length > 0) {
      return true;
  }

  return false;
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
  const formattedItems = itemNames.map(item => `%${item.trim()}%`);
  for (const itemName of formattedItems) {
      const [item] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM menu_item WHERE name Like ? AND mealType = ?',
          [itemName, mealTime]
      );
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

// In your server file (e.g., employeeService.ts or similar)
async checkResponses(mealTime: string): Promise<string[]> {
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

  let responseMessages: string[] = [];
  
  responseMessages.push(`\x1b[32m--- Responses for ${mealTime} ---\x1b[0m`);

  if (responses.length > 0) {
    responses.forEach((response: any) => {
      const itemMessage = `\nItem: \x1b[36m${response.name}\x1b[0m\nVotes: \x1b[33m${response.vote_count}\x1b[0m\n`;
      responseMessages.push(itemMessage);
    });
  } else {
    const noVotesMessage = `\nNo votes recorded for ${mealTime} today.\n`;
    responseMessages.push(noVotesMessage);
  }

  responseMessages.push(`\n\x1b[35m-----------------------------\x1b[0m\n`);

  return responseMessages;
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
  console.log("nnnn_data", data);
  const [breakfastMeal] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name = ?',
      [data.mealForBreakfast]
  );

  console.log("nnnn_breakfastMeal", breakfastMeal);
  const [lunchMeal] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name = ?',
      [data.mealForLunch]
  );

  console.log("nnnn_lunchMeal", lunchMeal)
  const [dinnerMeal] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name = ?',
      [data.mealForDinner]
  );

  console.log("nnnn_dinnerMeal", dinnerMeal);
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

async getFeedbackItems(): Promise<RowDataPacket[]> {
  try{
      const [rows] = await connection.query<RowDataPacket[]>(`
      SELECT REPLACE(usage_type, 'getDetailedFeedback-', '') as item_name
      FROM Monthly_Usage_Log
      WHERE usage_type LIKE 'getDetailedFeedback-%'`);
      return rows;
  } catch (error) {
      console.error(`Failed to get menu items for feedback: ${error}`);
      throw new Error('Error fetching menu items for feedback.');
  }
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
  const { foodType, spiceLevel, cuisine, sweetTooth } = profileData;
  const query = `
    INSERT INTO employee_profile (
      employee_id, food_type, spice_level, cuisine, sweet_tooth
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      food_type = VALUES(food_type), 
      spice_level = VALUES(spice_level), 
      cuisine = VALUES(cuisine), 
      sweet_tooth = VALUES(sweet_tooth)
  `;
  try {
    await connection.query(query, [empId, foodType, spiceLevel, cuisine, sweetTooth]);
    return "Profile updated successfully.";
  } catch (error) {
    throw new Error("Failed to update profile.");
  }
}

async fetchDiscardMenuItems(): Promise<DiscardMenuItem[]> {
  try{
      const [rows] = await connection.query<DiscardMenuItem[]>(`
      SELECT m.id, m.name, s.average_rating, s.sentiment_score
      FROM menu_item m
      JOIN Sentiment s ON m.id = s.menu_item_id
      WHERE s.average_rating <= 2
      OR s.sentiment_score <= 20`);
      return rows;
  } catch (error) {
      console.error(`Failed to fetch discard menu items: ${error}`);
      throw new Error('Error fetching discard menu items.');
  }
}

async fetchDetailedFeedback(menu_item_name: any): Promise<RowDataPacket[]> {
  let name:any = "menu _item name not correct";
  try{
      const [menu_item_id] = await connection.query<RowDataPacket[]>('SELECT id as menu_item_id FROM menu_item WHERE name = ?', [menu_item_name]);
      console.log("menu_item_id", menu_item_id.length);
      const [rows] = await connection.query<RowDataPacket[]>('SELECT employeeId, question, response, response_date FROM Feedbacks_Response WHERE menu_item_id = ?', menu_item_id[0].menu_item_id);
      return rows;
  } catch (error) {
      console.error(`Failed to get detailed feedback: ${error}`);
      throw new Error('Error fetching detailed feedback.');
  }
}

async canUseFeature(usageType: string): Promise<boolean> {
  try {
      const [rows] = await connection.query<RowDataPacket[]>('SELECT last_used FROM Monthly_Usage_Log WHERE usage_type = ?', [usageType]);
      if (rows.length > 0) {
          const lastUsed = new Date(rows[0].last_used);
          const today = new Date();
          return lastUsed.getMonth() !== today.getMonth() || lastUsed.getFullYear() !== today.getFullYear();
      }
      return true;
  } catch (error) {
      console.error(`Failed to check feature usage: ${error}`);
      return false;
  }
}

async saveDetailedFeedback(menuItem:any , employeeId:any, question:any, feedback: any ): Promise<void> {
  console.log("nitin_data", question, feedback, menuItem);
  try {
      const [menuItemId] = await connection.query<RowDataPacket[]>('SELECT id FROM menu_item WHERE name = ?', menuItem);
      console.log("emp_id", employeeId, menuItemId[0].id);
      await connection.query(`
          INSERT INTO Feedbacks_Response (menu_item_id, employeeId, question, response) 
          VALUES 
              (?, ?, ?, ?), 
              (?, ?, ?, ?), 
              (?, ?, ?, ?)
      `, [
        menuItemId[0].id, employeeId, question[0], feedback[0], 
        menuItemId[0].id, employeeId, question[1], feedback[1], 
        menuItemId[0].id, employeeId, question[2], feedback[2]
      ]);
  } catch (error) {
      console.error(`Failed save detailed feedback: ${error}`);
  }
}

async logMonthlyUsage(usageType: string): Promise<void> {
  try {
      await connection.query('INSERT INTO Monthly_Usage_Log (usage_type, last_used) VALUES (?, CURDATE()) ON DUPLICATE KEY UPDATE last_used = CURDATE()', [usageType]);
  } catch (error) {
      console.error(`Failed to log monthly usage: ${error}`);
  }
}

async checkMenuItem(item: string): Promise<Array<string>> {
  const trimmedItem = item.trim().toLowerCase();
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT * FROM menu_item WHERE LOWER(TRIM(name)) = ?',
    [trimmedItem]
  );
  return rows.map((row) => row.name);
}

async checkEmployeeId(employeeId: number): Promise<boolean> {
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT * FROM User WHERE employeeId = ?',
    [employeeId]
  );
  return rows.length > 0;
}

// Assuming a method in menuRepository to check if meals are selected for today
async areMealsSelectedForToday(): Promise<boolean> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const mealTypes = ["breakfast", "lunch", "dinner"];
    
    // Query to check if meals are selected for today's date and any meal type
    const query = `
      SELECT COUNT(*) as count
      FROM selected_meal
      WHERE date = ? AND mealType IN (?)
    `;
    
    const [rows] = await connection.query<RowDataPacket[]>(query, [today, mealTypes]);
    const count = rows[0].count;

    return count > 0;
  } catch (error) {
    console.error("Error checking selected meals for today:", error);
    throw error; // Propagate the error to handle it in selectTodayMeal function
  }
}

async checkFeedbackExists(itemname: string, employeeId: number ): Promise<boolean> {
  const [menu_item_id] = await connection.query<RowDataPacket[]>(
    'SELECT id FROM menu_item WHERE name = ?',
    [itemname]
  );
  console.log("nitin_menu_item_id", menu_item_id[0].id);
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT * FROM Feedbacks_Response WHERE menu_item_id = ? AND employeeId = ?',
    [menu_item_id[0].id, employeeId]
  );
  console.log("nitin_rows", rows);
  return rows.length > 0;
}
}
export const menuRepository = new MenuRepository();
