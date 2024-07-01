import connection from "../utils/database";

export class NotificationDB {
    constructor() {}

     async  createNotification(userRole: string, message: string, userId: number): Promise<void> {
        try {
          await connection.query(
            'INSERT INTO Notification (user_role, message, user_id) VALUES (?, ?, ?)',
            [userRole, message, userId]
          );
          console.log('Notification created successfully.');
        } catch (error) {
          console.error(`Failed to create notification: ${error}`);
          throw new Error('Error creating notification.');
        }
      }

    async getLatestNotifications(userRole: string, limit: number = 10): Promise<any[]> {
        try {
            const [notifications] = await connection.query<any[]>(
                `SELECT * FROM Notification 
                 WHERE user_role = ? 
                 ORDER BY date_created DESC 
                 LIMIT ?`,
                [userRole, limit]
            );
            return notifications;
        } catch (error) {
            console.error(`Failed to retrieve notifications: ${error}`);
            throw new Error('Error retrieving notifications.');
        }
    }
}

export const notificationDB = new NotificationDB();