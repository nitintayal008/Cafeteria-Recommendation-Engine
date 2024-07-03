import { io } from 'socket.io-client';
import { askQuestion, promptUser, rl } from '../server/utils/promptUtils';

export const socket = io('http://localhost:3000');
export let loggedInUser: { employeeId: string, name: string } | null = null;

async function login() {
  try {
    const employeeId = await askQuestion('Enter your employeeId: ');
    const name = await askQuestion('Enter your name: ');

    socket.emit('login', { employeeId, name }, (response: any) => {
      if (response.success) {
        console.log('Login successful');
        loggedInUser = { employeeId, name };
        promptUser(response.user.role);
      } else {
        console.log('Login failed:', response.message);
        login();
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
  }
}

socket.on('connect', () => {
  console.log('Connected to the server');
  login();
});

socket.on('disconnect', () => {
  console.log('Disconnected from the server');
});
