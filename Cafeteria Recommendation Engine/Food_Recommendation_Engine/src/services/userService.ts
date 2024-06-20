import { userRepository } from "../repositories/userRepository";
import { LoginPayload } from "../utils/types";

export async function login({ employeeId, name }: LoginPayload, callback: Function) {
  try {
    const user = await userRepository.login(employeeId, name);
    if (user) {
      callback({ success: true, user });
    } else {
      callback({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    callback({ success: false });
  }
}
