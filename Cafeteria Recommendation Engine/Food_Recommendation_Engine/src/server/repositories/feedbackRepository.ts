import connection from "../utils/database";
import { FeedbackPayload } from "../utils/types";

interface Feedback {
  id: number;
  menu_item_id: number;
  comment: string;
  rating: number;
  feedback_date: Date;
}

class FeedbackRepository {
  async giveFeedback({ itemId, comment, rating }: FeedbackPayload) {
    const feedbackDate = new Date();
    await connection.query('INSERT INTO feedback (menu_item_id, comment, rating, feedback_date) VALUES (?, ?, ?, ?)', [itemId, comment, rating, feedbackDate]);
  }

  async getAllFeedback(): Promise<Feedback[]> {
      const [rows] = await connection.query('SELECT * FROM feedback');
      return rows as Feedback[];
  }
}

export const feedbackRepository = new FeedbackRepository();
