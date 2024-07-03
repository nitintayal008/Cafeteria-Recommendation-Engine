import connection from "../utils/database";
import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket {
  id: number;
  employeeId: string;
  name: string;
  role: 'admin' | 'chef' | 'employee';
}

class UserRepository {
  async login(employeeId: string, name: string): Promise<User | null> {
    const [rows] = await connection.query<User[]>('SELECT * FROM user WHERE employeeId = ? AND name = ?', [employeeId, name]);
    return rows.length > 0 ? rows[0] : null;
  }
  
}

export const userRepository = new UserRepository();
