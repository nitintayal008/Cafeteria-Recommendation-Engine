import readline from 'readline';
import { handleAdminChoice } from '../client/adminActions';
import { handleChefChoice } from '../client/chefActions';
import { handleEmployeeChoice } from '../client/employeeActions';

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export function promptUser(role: 'admin' | 'chef' | 'employee') {
  console.log('\nChoose an operation:');
  if (role === 'admin') {
    console.log('1. Add Menu Item');
    console.log('2. Update Menu Item');
    console.log('3. Delete Menu Item');
    console.log('4. View Menu');
    console.log('5. Generate monthly feedback report');
    console.log('6. Exit');
  } else if (role === 'chef') {
    console.log('1. Recommend Menu for Next Day');
    console.log('2. View Monthly Feedback Report');
    console.log('3. View Feedback');
    console.log('4. Exit');
  } else if (role === 'employee') {
    console.log('1. View Menu');
    console.log('2. Give Feedback');
    console.log('3. See menu for next day');
    console.log('4. View Notification ')
    console.log('5. Exit');
  }
  
  rl.question('Enter your choice: ', (choice) => {
    switch (role) {
      case 'admin':
        handleAdminChoice(choice);
        break;
      case 'chef':
        handleChefChoice(choice);
        break;
      case 'employee':
        handleEmployeeChoice(choice);
        break;
      default:
        console.log('Invalid role');
        promptUser(role);
        break;
    }
  });
}