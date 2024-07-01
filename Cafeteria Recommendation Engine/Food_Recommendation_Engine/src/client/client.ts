// client.ts
import { io } from 'socket.io-client';
import { promptUser, rl } from '../server/utils/promptUtils';

export const socket = io('http://localhost:3000');
export let loggedInUser: { employeeId: string, name: string } | null = null;
function login() {
  rl.question('Enter your employeeId: ', (employeeId) => {
    rl.question('Enter your name: ', (name) => {
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
    });
  });
}  

socket.on('connect', () => {
  console.log('Connected to the server');
  login();
});

socket.on('disconnect', () => {
  console.log('Disconnected from the server');
});
