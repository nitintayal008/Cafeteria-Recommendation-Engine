import { RowDataPacket } from "mysql2";
import connection from "../utils/database";
import { MenuItem, MenuItemPayload } from "../utils/types";

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
    await connection.query('UPDATE menu_item SET next_day_menu = FALSE');
    await connection.query('UPDATE menu_item SET next_day_menu = TRUE WHERE id IN (?)', [itemIds]);
  }
 
  async getNextDayMenuItems() {
    const [rows] = await connection.query('SELECT * FROM menu_item WHERE next_day_menu = TRUE');
    return rows;
  }

  async selectNextDayMenu(itemIds: number[]) {
    const sql = 'UPDATE menu_items SET next_day_menu = TRUE WHERE id IN (?)';
    await connection.query(sql, [itemIds]);
  }

  async viewNotification() {
    try {
      const [rows] = await connection.query('SELECT * FROM notification WHERE user_role = "employee" ORDER BY notification_date DESC LIMIT 10');
      return rows;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

   async getRolledOutItems(mealType: string) {
    try {
        const today = new Date().toISOString().slice(0, 10);
        console.log('todcay:01', today);
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT Menu_Item.name
            FROM Rolledout_Item
            JOIN Menu_Item ON Rolledout_Item.menu_item_id = Menu_Item.id
            WHERE Rolledout_Item.date = ? AND Rolledout_Item.mealType = ?`,
            [today, mealType]
        );
        console.log('rows:01', rows);
        return rows.map(row => row.name);
    } catch (err) {
        console.error('Error fetching rolled out items:', err);
        throw err;
    }
}
  
}

export const menuRepository = new MenuRepository();
