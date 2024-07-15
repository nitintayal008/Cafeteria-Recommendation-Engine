import connection from "../utils/database";
import { User } from "../utils/types";

class UserRepository {
  async login(employeeId: string, name: string): Promise<User | null> {
    const [rows] = await connection.query<User[]>('SELECT * FROM user WHERE employeeId = ? AND name = ?', [employeeId, name]);
    return rows.length > 0 ? rows[0] : null;
  }

  async logLogout(employee_id:any,logType: string ): Promise<void> {
    const date = new Date();
    try {
        await connection.query('INSERT INTO Login_Log (employee_id, log_type, date) VALUES (?, ?, ?)', [employee_id, logType, date]);
    } catch (error) {
        console.error(`Failed to log login: ${error}`);
        throw new Error('Error logging login.');
    }
}
}

export const userRepository = new UserRepository();
