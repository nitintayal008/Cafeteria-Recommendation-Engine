import { promptUser, rl } from '../utils/promptUtils';
import { socket } from './client';

export function handleChefChoice(choice: string) {
  switch (choice) {
    case '1':
      rl.question('Enter menu type: ', (menuType) => {
        rl.question('Enter the number of items to return: ', (size) => {
          socket.emit('getFoodItemForNextDay', { menuType, returnItemListSize: parseInt(size) }, (response: any) => {
            console.log('Recommended Items:', response.recommendedItems);
            rl.question('Enter item IDs to select for next day (comma-separated): ', (selectedIds) => {
              const itemIds = selectedIds.split(',').map(id => parseInt(id.trim()));
              console.log('Selected item IDs: nitin', itemIds);
              socket.emit('selectNextDayMenu', itemIds, (res: any) => {
                console.log(res.message);
                promptUser('chef');
              });
            });
          });
        });
      });
      break;
    case '2':
      socket.emit('viewMonthlyFeedback', (response: any) => {
        console.log(response);
        promptUser('chef');
      });
      break;
    case '3':
      rl.close();
      socket.close();
      console.log('Goodbye!');
      break;
    default:
      console.log('Invalid choice, please try again.');
      promptUser('chef');
      break;
  }
}
