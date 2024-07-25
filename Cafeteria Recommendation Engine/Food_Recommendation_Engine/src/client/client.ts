import { io } from 'socket.io-client';
import { askQuestion, promptUser } from '../server/utils/promptUtils';
import { isEmployeeIdValid } from '../server/services/chefService';

export const socket = io('http://localhost:3000');
export let loggedInUser: { employeeId: string, name: string } | null = null;

async function login() {
  try {
    let employeeId = await askQuestion('Enter your employeeId: ');
    
    while (!(await isEmployeeIdValid(employeeId))) {
      employeeId = await askQuestion('Invalid employeeId. Enter again: ');
    }
    
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
