import { RowDataPacket } from 'mysql2';
import connection from '../utils/database';
import { MenuItem, RatingComment, SentimentData } from '../utils/types';

 class RecommendationDB {
    async getRecentComments(threeMonthsAgo: string): Promise<RatingComment[]> {
        try {
            const [rows] = await connection.query<RatingComment[]>(
                `SELECT menu_item_id, rating, comment 
                FROM Feedback 
                WHERE feedback_date >= ?`, [threeMonthsAgo]);
            return rows;
        } catch (error) {
            console.error(`Failed to retrieve recent comments: ${error}`);
            throw new Error('Error retrieving recent comments.');
        }
    }

    async getExistingSentiment(menuItemId: number): Promise<SentimentData[]> {
        try {
            const [existingSentiment] = await connection.query<SentimentData[]>('SELECT * FROM Sentiment WHERE menu_item_id = ?', [menuItemId]);
            return existingSentiment;
        } catch (error) {
            console.error(`Failed to retrieve existing sentiments: ${error}`);
            throw new Error('Error retrieving existing sentiments.');
        }
    }

    async updateSentiments(menuItemId: number, sentiment: string, averageRating: number, score: number) {
        try {
            await connection.query(
                'UPDATE Sentiment SET sentiment = ?, average_rating = ?, sentiment_score = ?, date_calculated = CURDATE() WHERE menu_item_id = ?',
                [sentiment, averageRating.toFixed(2), score, menuItemId]
            );
        } catch (error) {
            console.error(`Failed to update sentiments: ${error}`);
            throw new Error('Error updating sentiments.');
        }
    }

    async insertSentiments(menuItemId: number, sentiment: string, averageRating: number, score: number) {
        console.log(menuItemId, sentiment, averageRating, score);
        try {
            await connection.query(
                'INSERT INTO Sentiment (menu_item_id, sentiment, average_rating, sentiment_score, date_calculated) VALUES (?, ?, ?, ?, CURDATE())',
                [menuItemId, sentiment, averageRating.toFixed(2), score]
            );
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

      async getRecommendations(): Promise<MenuItem[]> {
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

      async recommendMenu(itemIds: number[]) {
        const [rows] = await connection.query(
          "SELECT * FROM menu_item WHERE id IN (?)",
          [itemIds]
        );
        return rows;
      }
}

export const recommendationDB = new RecommendationDB();
