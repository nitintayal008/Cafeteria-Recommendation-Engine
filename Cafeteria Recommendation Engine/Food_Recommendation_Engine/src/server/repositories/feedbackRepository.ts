import { RowDataPacket } from "mysql2";
import connection from "../utils/database";
import { Feedback, FeedbackPayload } from "../utils/types";

class FeedbackRepository {
  async giveFeedback({ itemId, comment, rating }: FeedbackPayload) {
    const feedbackDate = new Date();
    await connection.query('INSERT INTO feedback (menu_item_id, comment, rating, feedback_date) VALUES (?, ?, ?, ?)', [itemId, comment, rating, feedbackDate]);
  }

  async getAllFeedback(): Promise<Feedback[]> {
      const [rows] = await connection.query('SELECT * FROM feedback');
      return rows as Feedback[];
  }

  async checkFeedbackExists(itemname: string, employeeId: number ): Promise<boolean> {
    const [menu_item_id] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name = ?',
      [itemname]
    );
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Feedbacks_Response WHERE menu_item_id = ? AND employeeId = ?',
      [menu_item_id[0].id, employeeId]
    );
    return rows.length > 0;
  }

  async saveDetailedFeedback(menuItem:any , employeeId:any, question:any, feedback: any ): Promise<void> {
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

  async checkFeedbackResponses(empId: number): Promise<boolean> {
    const [responses] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM Feedback_Response WHERE employeeId = ?',
        [empId]
    );
    return responses.length > 0;
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

}


export const feedbackRepository = new FeedbackRepository();
