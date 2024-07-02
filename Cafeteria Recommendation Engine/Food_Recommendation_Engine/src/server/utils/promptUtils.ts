import readline from 'readline';
import { handleAdminChoice } from '../../client/adminActions';
import { handleChefChoice } from '../../client/chefActions';
import { handleEmployeeChoice } from '../../client/employeeActions';

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
    console.log('1. View Discard Menu Item List');
    console.log('2. View Monthly Feedback Report');
    console.log('3. View Feedback');
    console.log('4. Check recommend food items');
    console.log('5. See the Menu');
    console.log('6. Rollout Food for tomorrow');
    console.log("7. Check responses for today's meals");
    console.log("8. Select today's meals");
    console.log('9. Exit');
  } else if (role === 'employee') {
    console.log('1. Update Profile');
    console.log('2. View Menu');
    console.log('3. Give Feedback');
    console.log('4. Select Food For Tomorrow');
    console.log('5. View Notification'  );
    console.log("6. View Notification For Discarded Item And Give Feedback")
    console.log('7. Exit');
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

export function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}
