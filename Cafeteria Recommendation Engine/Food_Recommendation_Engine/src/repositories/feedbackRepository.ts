import connection from "../utils/database";
import { FeedbackPayload } from "../utils/types";



class FeedbackRepository {
  async giveFeedback({ itemId, comment, rating }: FeedbackPayload) {
    const feedbackDate = new Date();
    await connection.query('INSERT INTO feedback (menu_item_id, comment, rating, feedback_date) VALUES (?, ?, ?, ?)', [itemId, comment, rating, feedbackDate]);
  }
}

export const feedbackRepository = new FeedbackRepository();
