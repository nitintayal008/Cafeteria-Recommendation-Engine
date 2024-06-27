import { io } from 'socket.io-client';
import { promptUser, rl } from '../utils/promptUtils';


export const socket = io('http://localhost:3000');

function login() {
  rl.question('Enter your employeeId: ', (employeeId) => {
    rl.question('Enter your name: ', (name) => {
      socket.emit('login', { employeeId, name }, (response: any) => {
        if (response.success) {
          console.log('Login successful');
          promptUser(response.user.role);
        } else {
          console.log('Login failed:', response.message);
          login();
        }
      });
    });
  });
}

socket.on('nextDayMenu', (nextDayMenuItems) => {
  console.table('Next day menu items:', nextDayMenuItems);
});

socket.on('connect', () => {
  console.log('Connected to the server');
  login();
});

socket.on('disconnect', () => {
  console.log('Disconnected from the server');
});
 
socket.on('nextDayMenu', (nextDayMenuItems) => {
  console.log('Next day menu items:', nextDayMenuItems);
});